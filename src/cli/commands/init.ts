import fs from 'node:fs';
import path from 'node:path';

export async function initCommand(): Promise<void> {
  const configPath = path.resolve('.h2uirc');

  if (fs.existsSync(configPath)) {
    console.log('.h2uirc already exists. Use --force to overwrite.');
    return;
  }

  const config = JSON.stringify({
    out: './h2ui_output/',
    typescript: true,
    strict: false,
  }, null, 2);

  fs.writeFileSync(configPath, config, 'utf-8');
  console.log(`\x1b[32m✓\x1b[0m Created ${configPath}`);
}