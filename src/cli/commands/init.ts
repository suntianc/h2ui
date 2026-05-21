import fs from 'node:fs';
import path from 'node:path';

export async function initCommand(options: { force?: boolean } = {}): Promise<void> {
  const configPath = path.resolve('.h2uirc');

  if (fs.existsSync(configPath) && !options.force) {
    console.log('.h2uirc already exists. Use --force to overwrite.');
    return;
  }

  const config = JSON.stringify({
    _comment: 'h2ui configuration file. Documentation: https://github.com/...',
    out: './h2ui_output/',
    typescript: true,
    strict: false,
    split: true,
    cssMode: 'module',
  }, null, 2);

  try {
    fs.writeFileSync(configPath, config, 'utf-8');
    console.log(`\x1b[32m✓\x1b[0m Created .h2uirc`);
    console.log('  Edit this file to configure h2ui defaults.');
  } catch (err) {
    console.error(`\x1b[31m✗\x1b[0m Failed to create .h2uirc: ${err}`);
    process.exit(1);
  }
}