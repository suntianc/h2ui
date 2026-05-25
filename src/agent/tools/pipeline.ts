/**
 * Pipeline tool for the autonomous agent.
 *
 * Provides run_pipeline tool to execute the HTML-to-component conversion.
 *
 * @module agent/tools/pipeline
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Pipeline } from '../../pipeline/index.js';
import { parseStep } from '../../pipeline/steps/parse.js';
import { convertStep } from '../../pipeline/steps/convert.js';
import { generateStep } from '../../pipeline/steps/generate.js';

/**
 * Core pipeline execution function - used directly by nodes.
 */
export async function runPipeline(inputPath: string, outputPath: string): Promise<string> {
  // Build pipeline
  const pipeline = new Pipeline();
  pipeline.addStep(parseStep);
  pipeline.addStep(convertStep);
  pipeline.addStep(generateStep);

  // Run pipeline
  const ctx = await pipeline.run({
    html: '',
    filePath: inputPath,
    $: undefined,
    code: undefined,
    outputPath: undefined,
    warnings: [],
    errors: [],
    options: {
      out: outputPath,
      typescript: true,
      strict: false,
      split: true,
      cssMode: 'module',
      framework: 'react',
    },
  });

  if (ctx.errors.length > 0) {
    return `Pipeline completed with errors: ${ctx.errors.join(', ')}`;
  }

  return `Pipeline complete: ${inputPath} -> ${outputPath}`;
}

/**
 * Tool for running the HTML-to-component conversion pipeline.
 * For LLM tool binding.
 */
export const runPipelineTool = tool(
  async ({ inputPath, outputPath }: { inputPath: string; outputPath: string }) => {
    return runPipeline(inputPath, outputPath);
  },
  {
    name: 'run_pipeline',
    description: 'Run the HTML-to-component conversion pipeline.',
    schema: z.object({
      inputPath: z.string().describe('Path to input HTML file.'),
      outputPath: z.string().describe('Path to output directory.'),
    }),
  }
);
