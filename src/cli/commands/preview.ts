import { Command } from 'commander';
import * as path from 'path';
import { startPreviewServer } from '../../preview/server.js';

export const previewCommand = new Command('preview')
  .description('Start browser preview server with live reload')
  .option('-o, --out <dir>', 'Output directory to watch', './h2ui_output')
  .option('-p, --port <port>', 'Preview server port', '5173')
  .action(async (options) => {
    const outputDir = path.resolve(options.out);
    const port = parseInt(options.port, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      console.error(`[preview] Invalid port: ${options.port}. Must be a number between 1 and 65535.`);
      process.exit(1);
    }

    console.log(`[preview] Starting preview server...`);
    console.log(`[preview] Watching: ${outputDir}`);
    console.log(`[preview] Port: ${port}`);

    try {
      const { server, wss } = await startPreviewServer(outputDir, { port });

      console.log(`[preview] Preview server running at http://localhost:${port}`);
      console.log(`[preview] Open browser to view component tree`);
      console.log(`[preview] Press Ctrl+C to stop`);

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n[preview] Shutting down...');
        wss.close();
        server.close();
        process.exit(0);
      });
    } catch (err: any) {
      console.error(`[preview] Failed to start: ${err.message}`);
      process.exit(1);
    }
  });
