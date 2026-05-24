import { Command } from 'commander';
import * as path from 'path';
import { startPreviewServer } from '../../preview/server.js';

export const previewCommand = new Command('preview')
  .description('Start browser preview server with live reload (supports Vue and React)')
  .option('-o, --out <dir>', 'Output directory to watch', './h2ui_output')
  .option('-p, --port <port>', 'Preview server port', '5173')
  .option(
    '--framework <framework>',
    'Force specific preview mode (vue3, react, or auto for detection)',
    'auto'
  )
  .addHelpText('after', `
Examples:
  # Start server watching the default output directory on default port (5173)
  $ h2ui preview

  # Watch a custom directory and run on port 8080
  $ h2ui preview --out ./custom_components --port 8080

  # Force Vue preview mode
  $ h2ui preview --framework vue3

  # Force React preview mode
  $ h2ui preview --framework react

  # Auto-detect framework based on file types (default)
  $ h2ui preview --framework auto
`)
  .action(async (options) => {
    const outputDir = path.resolve(options.out);
    const port = parseInt(options.port, 10);
    const framework = options.framework as 'vue3' | 'react' | 'auto';

    if (isNaN(port) || port < 1 || port > 65535) {
      console.error(`[preview] Invalid port: ${options.port}. Must be a number between 1 and 65535.`);
      process.exit(1);
    }

    if (!['vue3', 'react', 'auto'].includes(framework)) {
      console.error(`[preview] Invalid framework: ${options.framework}. Must be vue3, react, or auto.`);
      process.exit(1);
    }

    console.log(`[preview] Starting preview server...`);
    console.log(`[preview] Watching: ${outputDir}`);
    console.log(`[preview] Port: ${port}`);
    console.log(`[preview] Framework mode: ${framework}`);

    try {
      // Map vue3 to vue for the server API
      const serverFramework = framework === 'vue3' ? 'vue' : framework;
      const { server, wss } = await startPreviewServer(outputDir, {
        port,
        previewDir: process.cwd(),
        framework: serverFramework as 'vue' | 'react' | 'auto',
      });

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
