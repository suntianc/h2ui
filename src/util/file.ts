import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Convert a filename to PascalCase component name.
 * Examples: chat.html → Chat, user-profile.html → UserProfile, index.html → Index
 */
export function toPascalCase(filename: string): string {
  const name = path.basename(filename, path.extname(filename));
  return name
    .split(/[-_.\s]+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

/**
 * Derive the output filename from the input path.
 * chat.html → Chat.tsx (or Chat.jsx if isTypescript is false)
 */
export function getOutputFilename(inputPath: string, isTypescript: boolean): string {
  const pascalName = toPascalCase(inputPath);
  const ext = isTypescript ? '.tsx' : '.jsx';
  return `${pascalName}${ext}`;
}

/**
 * Read file content as UTF-8 string.
 */
export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

/**
 * Write content to a file, creating parent directories if needed.
 * Returns the absolute path of the written file.
 */
export async function writeFile(outputPath: string, content: string): Promise<string> {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, content, 'utf-8');
  return path.resolve(outputPath);
}

/**
 * Check if a file exists and is accessible.
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}