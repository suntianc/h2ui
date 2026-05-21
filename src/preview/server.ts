import { preview } from 'vite';
import { WebSocketServer, type WebSocket } from 'ws';
import * as path from 'path';
import * as fs from 'fs';

export interface PreviewServerOptions {
  port?: number;
  host?: string;
  previewDir?: string;
}

export async function startPreviewServer(
  outputDir: string,
  options: PreviewServerOptions = {},
): Promise<{ server: any; wss: WebSocketServer }> {
  const { port = 5173, host = 'localhost' } = options;

  // Start Vite preview server serving the preview visualization app
  const vitePreview = await preview({
    root: path.join(__dirname, 'visualization'),
    preview: { port, host },
    server: { proxy: {} },
  });

  // Attach WebSocket server for live reload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wss = new WebSocketServer({ server: vitePreview.httpServer as any });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[preview] Client connected');
    ws.on('close', () => console.log('[preview] Client disconnected'));
    ws.on('error', (err: Error) => console.warn('[preview] WebSocket error:', err.message));
  });

  // Watch output directory for changes using fs.watch (recursive)
  const watchDir = path.resolve(outputDir);
  watchDirectory(watchDir, (filePath: string) => {
    console.log(`[preview] File changed: ${filePath}`);
    // Broadcast reload to all connected clients
    wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === 1 /* WebSocket.OPEN */) {
        client.send(JSON.stringify({ type: 'reload', file: filePath }));
      }
    });
  });

  return { server: vitePreview, wss };
}

interface Watcher {
  close: () => void;
}

/**
 * Recursively watch a directory for file changes using fs.watch.
 * Falls back to non-recursive watch if recursive is not supported.
 */
function watchDirectory(
  dirPath: string,
  onChange: (filePath: string) => void,
): Watcher {
  const watchers: Watcher[] = [];
  const debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  const DEBOUNCE_MS = 100;

  function debouncedHandler(filePath: string) {
    const existing = debounceTimers.get(filePath);
    if (existing) {
      clearTimeout(existing);
    }
    const timer = setTimeout(() => {
      debounceTimers.delete(filePath);
      onChange(filePath);
    }, DEBOUNCE_MS);
    debounceTimers.set(filePath, timer);
  }

  function addDir(dir: string) {
    try {
      const watcher = fs.watch(dir, { recursive: false }, (eventType, filename) => {
        if (!filename) return;
        const fullPath = path.join(dir, filename);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          // New subdirectory - start watching it too
          addDir(fullPath);
        } else if (stats.isFile()) {
          debouncedHandler(fullPath);
        }
      });
      watchers.push(watcher);
    } catch {
      // Permission denied or other error - skip
    }
  }

  // Check if recursive fs.watch is supported
  try {
    const testWatcher = fs.watch(dirPath, { recursive: true }, () => {});
    watchers.push(testWatcher);
    // With recursive support, just watch the top directory
    testWatcher.on('change', (_, filename) => {
      if (filename) {
        const name = typeof filename === 'string' ? filename : filename.toString('utf8');
        const fullPath = path.join(dirPath, name);
        debouncedHandler(fullPath);
      }
    });
  } catch {
    // Recursive not supported - walk directory tree
    addDir(dirPath);

    // Also watch for new subdirectories
    const newDirWatcher = fs.watch(dirPath, (eventType, filename) => {
      if (!filename) return;
      const name = String(filename);
      const fullPath = path.join(dirPath, name);
      try {
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          addDir(fullPath);
        }
      } catch {
        // Ignore
      }
    });
    watchers.push(newDirWatcher);
  }

  return {
    close() {
      for (const w of watchers) {
        w.close();
      }
      debounceTimers.forEach((t) => clearTimeout(t));
      debounceTimers.clear();
    },
  };
}
