#!/usr/bin/env node
import { Command } from 'commander';
import { showBanner } from './output.js';
import { convertCommand } from './commands/convert.js';
import { batchCommand } from './commands/batch.js';
import { initCommand } from './commands/init.js';
import { previewCommand } from './commands/preview.js';
import { loadConfig } from '../config/loader.js';

const program = new Command();

program
  .name('h2ui')
  .description('Convert HTML pages to React components')
  .version('1.0.0')
  .addHelpText('after', `
Examples:
  # Initialize the configuration scaffold
  $ h2ui init

  # Convert an HTML file to React TSX using default options (LLM enabled)
  $ h2ui convert index.html

  # Convert with LLM disabled, outputting to a specific directory
  $ h2ui convert dashboard.html --out ./src/components --llm off

  # Start the live reload preview server
  $ h2ui preview --out ./h2ui_output --port 3000

Config File:
  By default, h2ui looks for a ".h2uirc" file in the current working directory to customize
  output paths, TypeScript options, and LLM configuration (such as base URL and API keys).
`);

program
  .command('convert')
  .description('Convert an HTML file to React TSX/JSX')
  .argument('<file>', 'path to HTML file')
  .option('--out <directory>', 'output directory (default: ./h2ui_output/)')
  .option('--type <type>', 'output file type: tsx or jsx (default: tsx)', /^(tsx|jsx)$/, 'tsx')
  .option('--no-split', 'disable component splitting (single-file output)')
  .option('--strict', 'promote all warnings to errors')
  .option('--llm <mode>', 'LLM mode: on or off (default: on)', (value) => value !== 'off' ? 'on' : 'off', 'on')
  .addHelpText('after', `
Examples:
  $ h2ui convert path/to/index.html
  $ h2ui convert dashboard.html --out ./components --type jsx --no-split
  $ h2ui convert page.html --llm off
`)
  .action(async (file: string, options: { out?: string; type?: string; strict?: boolean; split?: boolean; llm?: string }) => {
    showBanner();
    const { config: configFile } = await loadConfig();
    await convertCommand(file, options, configFile);
  });

program
  .command('batch')
  .description('Convert multiple HTML files with glob patterns')
  .argument('<pattern>', 'Glob pattern for HTML files (quote it!)')
  .option('--out <directory>', 'output directory (default: ./h2ui_output/)')
  .option('--concurrency <number>', 'parallel files (default: 1, max: 4)', (value) => {
    const num = parseInt(value, 10);
    return isNaN(num) ? 1 : num;
  }, 1)
  .option('--no-split', 'disable component splitting')
  .option('--strict', 'promote all warnings to errors')
  .option('--llm <mode>', 'LLM mode: on or off (default: on)')
  .addHelpText('after', `
Examples:
  $ h2u batch "src/**/*.html"
  $ h2u batch "pages/*.html" --out ./components --concurrency 4
  $ h2u batch "*.html" --no-split
`)
  .action(async (pattern: string, options: { out?: string; concurrency?: number; split?: boolean; strict?: boolean; llm?: string }) => {
    showBanner();
    const { config: configFile } = await loadConfig();
    const result = await batchCommand(pattern, options, configFile);
    // Set exit code based on failures
    process.exitCode = result.failures.length > 0 ? 1 : 0;
  });

program
  .command('init')
  .description('Generate a .h2uirc config scaffold')
  .option('--force', 'overwrite existing .h2uirc')
  .addHelpText('after', `
Examples:
  $ h2ui init
  $ h2ui init --force
`)
  .action(async (options: { force?: boolean }) => {
    showBanner();
    await initCommand(options);
  });

program.addCommand(previewCommand);

if (!process.argv.slice(2).length) {
  program.outputHelp();
} else {
  program.parse();
}