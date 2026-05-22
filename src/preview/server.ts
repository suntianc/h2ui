import { build as viteBuild, preview as vitePreview } from 'vite';
import react from '@vitejs/plugin-react';
import { WebSocketServer, type WebSocket } from 'ws';
import * as path from 'path';
import * as fs from 'fs';

export interface PreviewServerOptions {
  port?: number;
  host?: string;
  previewDir?: string;
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

function resolveRootComponentName(outputDir: string): string {
  const treePath = path.join(outputDir, '.h2ui-component-tree.json');
  if (fs.existsSync(treePath)) {
    const tree = JSON.parse(fs.readFileSync(treePath, 'utf8')) as PreviewTreeNode;
    if (tree?.name) return tree.name;
  }

  const tsxFiles = fs
    .readdirSync(outputDir)
    .filter((f) => f.endsWith('.tsx') || f.endsWith('.jsx'))
    .sort();
  if (tsxFiles.length === 0) {
    throw new Error(`No .tsx/.jsx files found in output directory: ${outputDir}`);
  }
  return path.basename(tsxFiles[0], path.extname(tsxFiles[0]));
}

function syncOutputFiles(outputDir: string, componentsDir: string): void {
  ensureDir(componentsDir);
  const files = fs.readdirSync(outputDir);
  for (const file of files) {
    if (
      file.endsWith('.tsx') ||
      file.endsWith('.jsx') ||
      file.endsWith('.css') ||
      file.endsWith('.module.css')
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

function writePreviewApp(appRoot: string, rootComponentName: string, headLinks: string[] = []): void {
  const indexHtml = `<!doctype html>
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

  const mainTsx = `import React from 'react';
import { createRoot } from 'react-dom/client';
import RootComponent from './components/${rootComponentName}';

const root = createRoot(document.getElementById('root')!);
root.render(<RootComponent />);
`;

  const srcDir = path.join(appRoot, 'src');
  ensureDir(srcDir);
  fs.writeFileSync(path.join(appRoot, 'index.html'), indexHtml, 'utf8');
  fs.writeFileSync(path.join(srcDir, 'main.tsx'), mainTsx, 'utf8');
}

async function buildPreviewApp(appRoot: string): Promise<void> {
  await viteBuild({
    root: appRoot,
    plugins: [react()],
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
  const { port = 5173, host = 'localhost', previewDir = process.cwd() } = options;
  const runtimeRoot = path.join(path.resolve(previewDir), '.h2ui_preview_dist');
  const componentsDir = path.join(runtimeRoot, 'src/components');

  ensureDir(runtimeRoot);
  syncOutputFiles(outputDir, componentsDir);
  const rootComponentName = resolveRootComponentName(outputDir);
  const headLinks = readHeadLinks(outputDir);
  writePreviewApp(runtimeRoot, rootComponentName, headLinks);
  await buildPreviewApp(runtimeRoot);

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
    if (ext !== '.tsx' && ext !== '.ts' && ext !== '.jsx' && ext !== '.js' && ext !== '.css') return;

    try {
      syncOutputFiles(outputDir, componentsDir);
      const nextRoot = resolveRootComponentName(outputDir);
      const headLinks = readHeadLinks(outputDir);
      writePreviewApp(runtimeRoot, nextRoot, headLinks);
      await buildPreviewApp(runtimeRoot);
    } catch (err: any) {
      console.warn(`[preview] Rebuild failed: ${err.message}`);
      return;
    }

    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: 'reload', file: filename }));
      }
    });
  });

  watcher.on('error', (err: Error) => {
    console.warn(`[preview] Watcher error: ${err.message}`);
  });

  console.log(`[preview] Preview server running at http://localhost:${port}`);
  console.log(`[preview] Runtime dir: ${runtimeRoot}`);

  return { server, wss };
}
