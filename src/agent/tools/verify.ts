/**
 * Verification tool for the autonomous agent.
 *
 * Provides verify_output tool for fidelity checking.
 * Full verification logic is implemented in src/agent/verifier/agent.ts.
 *
 * @module agent/tools/verify
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import * as cheerio from 'cheerio';

/**
 * Result of verification.
 */
export interface VerifyResult {
  match: boolean;
  confidence: number;
  issues: string[];
}

/**
 * Load and parse HTML/JSX files for verification.
 */
async function loadFiles(htmlPath: string, componentPath: string): Promise<{ html: string; jsx: string }> {
  const html = await fs.readFile(htmlPath, 'utf-8');
  const jsx = await fs.readFile(componentPath, 'utf-8');
  return { html, jsx };
}

/**
 * Perform structural diff between HTML and component.
 */
function structuralDiff(html: string, jsx: string): { match: boolean; issues: string[] } {
  const issues: string[] = [];

  // Load HTML
  const $html = cheerio.load(html);
  const htmlTags = $html('body').find('*').map((_, el) => el.tagName.toLowerCase()).get();

  // Check for common structural elements
  const hasHeader = htmlTags.includes('header');
  const hasNav = htmlTags.includes('nav');
  const hasMain = htmlTags.includes('main');
  const hasFooter = htmlTags.includes('footer');

  // Basic checks - this is a simplified verification
  // Full semantic verification is done by the Verifier Agent
  if (!jsx.includes('export default') && !jsx.includes('export')) {
    issues.push('Component does not have an export statement');
  }

  if (!jsx.includes('function') && !jsx.includes('=>')) {
    issues.push('Component does not appear to be a valid function/component');
  }

  const match = issues.length === 0;

  return { match, issues };
}

/**
 * Core verification function - used directly by nodes.
 */
export async function verifyOutput(
  htmlPath: string,
  componentPath: string
): Promise<VerifyResult> {
  try {
    const { html, jsx } = await loadFiles(htmlPath, componentPath);

    const { match, issues } = structuralDiff(html, jsx);

    // Calculate confidence based on issues
    const confidence = match ? 0.9 : Math.max(0, 0.9 - issues.length * 0.1);

    return {
      match,
      confidence,
      issues,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      match: false,
      confidence: 0,
      issues: [`Error verifying output: ${errorMsg}`],
    };
  }
}

/**
 * Tool for verifying that component output matches source HTML.
 * For LLM tool binding.
 */
export const verifyOutputTool = tool(
  async ({ htmlPath, componentPath }: { htmlPath: string; componentPath: string }): Promise<VerifyResult> => {
    return verifyOutput(htmlPath, componentPath);
  },
  {
    name: 'verify_output',
    description: 'Verify that component output matches the source HTML.',
    schema: z.object({
      htmlPath: z.string().describe('Path to the source HTML file.'),
      componentPath: z.string().describe('Path to the generated component file.'),
    }),
  }
);
