import { build as viteBuild, preview as vitePreview } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { WebSocketServer, type WebSocket } from 'ws';
import * as path from 'path';
import * as fs from 'fs';

export type Framework = 'vue' | 'react' | 'mixed';
export type FrameworkMode = 'vue' | 'react' | 'auto';

export interface PreviewServerOptions {
  port?: number;
  host?: string;
  previewDir?: string;
  framework?: FrameworkMode;
}

interface PreviewTreeNode {
  name: string;
  children: PreviewTreeNode[];
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function detectFramework(outputDir: string): Framework {
  const files = fs.readdirSync(outputDir);
  let hasVue = false;
  let hasReact = false;

  for (const file of files) {
    if (file.endsWith('.vue')) {
      hasVue = true;
    }
    if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      hasReact = true;
    }
  }

  if (hasVue && hasReact) {
    return 'mixed';
  }
  if (hasVue) {
    return 'vue';
  }
  return 'react';
}

function resolveRootComponentName(outputDir: string, framework: Framework): string {
  const treePath = path.join(outputDir, '.h2ui-component-tree.json');
  if (fs.existsSync(treePath)) {
    const tree = JSON.parse(fs.readFileSync(treePath, 'utf8')) as PreviewTreeNode;
    if (tree?.name) return tree.name;
  }

  let files: string[];
  if (framework === 'vue') {
    files = fs.readdirSync(outputDir).filter((f) => f.endsWith('.vue')).sort();
  } else {
    files = fs.readdirSync(outputDir).filter((f) => f.endsWith('.tsx') || f.endsWith('.jsx')).sort();
  }

  if (files.length === 0) {
    if (framework === 'vue') {
      throw new Error(`No .vue files found in output directory: ${outputDir}`);
    }
    throw new Error(`No .tsx/.jsx files found in output directory: ${outputDir}`);
  }
  return path.basename(files[0], path.extname(files[0]));
}

function syncOutputFiles(outputDir: string, componentsDir: string): void {
  ensureDir(componentsDir);
  const files = fs.readdirSync(outputDir);
  for (const file of files) {
    if (
      file.endsWith('.tsx') ||
      file.endsWith('.jsx') ||
      file.endsWith('.css') ||
      file.endsWith('.module.css') ||
      file.endsWith('.vue') ||
      file.endsWith('.ts')
    ) {
      fs.copyFileSync(path.join(outputDir, file), path.join(componentsDir, file));
    }
  }
}

function readHeadLinks(outputDir: string): string[] {
  const treePath = path.join(outputDir, '.h2ui-component-tree.json');
  if (fs.existsSync(treePath)) {
    try {
      const tree = JSON.parse(fs.readFileSync(treePath, 'utf8'));
      if (tree && Array.isArray(tree.headLinks)) {
        return tree.headLinks;
      }
    } catch (_) {}
  }
  return [];
}

function writePreviewApp(
  appRoot: string,
  rootComponentName: string,
  headLinks: string[] = [],
  framework: Framework = 'react'
): void {
  let indexHtml: string;
  let mainContent: string;

  if (framework === 'vue') {
    indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>h2ui Vue Preview</title>
    ${headLinks.join('\n    ')}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`;
    mainContent = `import { createApp } from 'vue';
import RootComponent from './components/${rootComponentName}';

createApp(RootComponent).mount('#root');
`;
  } else {
    indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>h2ui Preview</title>
    ${headLinks.join('\n    ')}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
    <script>
      (function () {
        var proto = location.protocol === 'https:' ? 'wss' : 'ws';
        var ws = new WebSocket(proto + '://' + location.host + '/__h2ui_preview_ws');
        ws.onmessage = function (event) {
          try {
            var data = JSON.parse(event.data);
            if (data && data.type === 'reload') location.reload();
          } catch (_) {}
        };
      })();
    </script>
  </body>
</html>
`;
    mainContent = `import React from 'react';
import { createRoot } from 'react-dom/client';
import RootComponent from './components/${rootComponentName}';

const root = createRoot(document.getElementById('root')!);
root.render(<RootComponent />);
`;
  }

  const srcDir = path.join(appRoot, 'src');
  ensureDir(srcDir);
  fs.writeFileSync(path.join(appRoot, 'index.html'), indexHtml, 'utf8');

  if (framework === 'vue') {
    fs.writeFileSync(path.join(srcDir, 'main.ts'), mainContent, 'utf8');
  } else {
    fs.writeFileSync(path.join(srcDir, 'main.tsx'), mainContent, 'utf8');
  }
}

async function buildPreviewApp(appRoot: string, framework: Framework = 'react'): Promise<void> {
  await viteBuild({
    root: appRoot,
    plugins: framework === 'vue' ? [vue()] : [react()],
    logLevel: 'warn',
    build: {
      outDir: path.join(appRoot, 'dist'),
      emptyOutDir: true,
    },
  });
}

export async function startPreviewServer(
  outputDir: string,
  options: PreviewServerOptions = {},
): Promise<{ server: any; wss: WebSocketServer }> {
  const { port = 5173, host = 'localhost', previewDir = process.cwd(), framework: frameworkMode = 'auto' } = options;
  const runtimeRoot = path.join(path.resolve(previewDir), '.h2ui_preview_dist');
  const componentsDir = path.join(runtimeRoot, 'src/components');

  let detectedFramework: Framework;
  if (frameworkMode === 'auto') {
    detectedFramework = detectFramework(outputDir);
    if (detectedFramework === 'mixed') {
      console.log('[preview] Warning: Mixed Vue and React files detected. Please use separate output directories.');
      detectedFramework = 'react';
    }
  } else {
    detectedFramework = frameworkMode as Framework;
  }

  console.log(`[preview] Framework: ${frameworkMode === 'auto' ? `auto (detected ${detectedFramework})` : frameworkMode}`);

  ensureDir(runtimeRoot);
  syncOutputFiles(outputDir, componentsDir);
  const rootComponentName = resolveRootComponentName(outputDir, detectedFramework);
  const headLinks = readHeadLinks(outputDir);
  writePreviewApp(runtimeRoot, rootComponentName, headLinks, detectedFramework);
  await buildPreviewApp(runtimeRoot, detectedFramework);

  const server = await vitePreview({
    root: runtimeRoot,
    preview: { port, host },
    build: {
      outDir: path.join(runtimeRoot, 'dist'),
    },
    logLevel: 'warn',
  });

  const wss = new WebSocketServer({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    server: server.httpServer as any,
    path: '/__h2ui_preview_ws',
  });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[preview] Client connected');
    ws.on('close', () => console.log('[preview] Client disconnected'));
    ws.on('error', (err: Error) => console.warn('[preview] WebSocket error:', err.message));
  });

  const watcher = fs.watch(outputDir, { recursive: true }, async (_eventType, filename) => {
    if (!filename) return;
    const ext = path.extname(filename);
    if (
      ext !== '.tsx' &&
      ext !== '.ts' &&
      ext !== '.jsx' &&
      ext !== '.js' &&
      ext !== '.css' &&
      ext !== '.vue'
    )
      return;

    try {
      syncOutputFiles(outputDir, componentsDir);
      const nextRoot = resolveRootComponentName(outputDir, detectedFramework);
      const headLinks = readHeadLinks(outputDir);
      writePreviewApp(runtimeRoot, nextRoot, headLinks, detectedFramework);
      await buildPreviewApp(runtimeRoot, detectedFramework);
    } catch (err: any) {
      console.warn(`[preview] Rebuild failed: ${err.message}`);
      return;
    }

    // Only send WebSocket reload for React mode - Vue uses Vite HMR
    if (detectedFramework === 'react') {
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'reload', file: filename }));
        }
      });
    }
  });

  watcher.on('error', (err: Error) => {
    console.warn(`[preview] Watcher error: ${err.message}`);
  });

  console.log(`[preview] Preview server running at http://localhost:${port}`);
  console.log(`[preview] Runtime dir: ${runtimeRoot}`);

  return { server, wss };
}
