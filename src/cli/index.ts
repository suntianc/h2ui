#!/usr/bin/env node
import { Command } from 'commander';
import { showBanner } from './output.js';
import { convertCommand } from './commands/convert.js';
import { initCommand } from './commands/init.js';
import { previewCommand } from './commands/preview.js';
import { loadConfig } from '../config/loader.js';

const program = new Command();

program
  .name('h2ui')
  .description('Convert HTML pages to React components')
  .version('1.0.0');

program
  .command('convert')
  .description('Convert an HTML file to React TSX/JSX')
  .argument('<file>', 'path to HTML file')
  .option('--out <directory>', 'output directory (default: ./h2ui_output/)')
  .option('--type <type>', 'output file type: tsx or jsx (default: tsx)', /^(tsx|jsx)$/, 'tsx')
  .option('--no-split', 'disable component splitting (single-file output)')
  .option('--strict', 'promote all warnings to errors')
  .option('--llm <mode>', 'LLM mode: on or off (default: on)', (value) => value !== 'off' ? 'on' : 'off', 'on')
  .action(async (file: string, options: { out?: string; type?: string; strict?: boolean; split?: boolean; llm?: string }) => {
    showBanner();
    const { config: configFile } = await loadConfig();
    await convertCommand(file, options, configFile);
  });

program
  .command('init')
  .description('Generate a .h2uirc config scaffold')
  .option('--force', 'overwrite existing .h2uirc')
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