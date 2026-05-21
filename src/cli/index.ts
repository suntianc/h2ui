#!/usr/bin/env node
import { Command } from 'commander';
import { showBanner } from './output.js';
import { convertCommand } from './commands/convert.js';
import { initCommand } from './commands/init.js';

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
  .option('--no-typescript', 'output .jsx instead of .tsx')
  .option('--no-split', 'disable component splitting (single-file output)')
  .option('--strict', 'promote all warnings to errors')
  .action(async (file: string, options: { out: string; typescript: boolean; strict: boolean; split: boolean }) => {
    showBanner();
    await convertCommand(file, options);
  });

program
  .command('init')
  .description('Generate a .h2uirc config scaffold')
  .action(async () => {
    showBanner();
    await initCommand();
  });

if (!process.argv.slice(2).length) {
  program.outputHelp();
} else {
  program.parse();
}