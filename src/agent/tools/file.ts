/**
 * File tools for the autonomous agent.
 *
 * Provides read_file and write_file tools with Zod schemas.
 *
 * @module agent/tools/file
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Read a file from the filesystem.
 */
export async function readFile(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, 'utf-8');
  return content;
}

/**
 * Write content to a file on the filesystem.
 */
export async function writeFile(filePath: string, content: string): Promise<string> {
  // Ensure parent directory exists
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
  return `Written ${content.length} characters to ${filePath}`;
}

/**
 * Tool for reading a file from the filesystem.
 * For LLM tool binding.
 */
export const readFileTool = tool(
  async ({ filePath }: { filePath: string }) => {
    return readFile(filePath);
  },
  {
    name: 'read_file',
    description: 'Read the contents of a file from the filesystem.',
    schema: z.object({
      filePath: z.string().describe('Absolute path to the file to read.'),
    }),
  }
);

/**
 * Tool for writing content to a file.
 * For LLM tool binding.
 */
export const writeFileTool = tool(
  async ({ filePath, content }: { filePath: string; content: string }) => {
    return writeFile(filePath, content);
  },
  {
    name: 'write_file',
    description: 'Write content to a file on the filesystem.',
    schema: z.object({
      filePath: z.string().describe('Absolute path to the file.'),
      content: z.string().describe('Content to write to the file.'),
    }),
  }
);

/**
 * Ensure a file path is within the output directory (path traversal check).
 */
export function validateOutputPath(filePath: string, outputDir: string): boolean {
  const resolved = path.resolve(filePath);
  const resolvedOutput = path.resolve(outputDir);
  return resolved.startsWith(resolvedOutput);
}
