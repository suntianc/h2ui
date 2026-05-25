/**
 * EXECUTE node for the autonomous agent.
 *
 * Executes the conversion plan using the run_pipeline tool.
 *
 * @module agent/graph/nodes/execute
 */

import type { AgentState } from '../state.js';
import { createAnthropicClient } from '../../../llm/providers/anthropic.js';
import { readFileTool, writeFileTool, runPipelineTool } from '../../tools/file.js';

/**
 * System prompt for the EXECUTE node.
 */
const EXECUTE_SYSTEM_PROMPT = `You are an HTML-to-component conversion executor. Follow the plan and use the available tools to convert the HTML file.

Available tools:
- read_file: Read a file from the filesystem
- write_file: Write content to a file
- run_pipeline: Run the HTML-to-component conversion pipeline

Execute the plan by:
1. Reading the input HTML file
2. Running the conversion pipeline
3. Handling any errors that occur`;

/**
 * EXECUTE node function.
 * Runs the conversion pipeline using the plan.
 */
export async function executeNode(state: AgentState): Promise<Partial<AgentState>> {
  const { input_path, output_path, plan } = state;

  if (!input_path || !output_path) {
    return {
      execution_result: 'Error: Missing input or output path',
      current_phase: 'VERIFY',
    };
  }

  console.log(`\n--- AGENT EXECUTE ---`);
  console.log(`Input: ${input_path}`);
  console.log(`Output: ${output_path}`);
  console.log(`Plan: ${plan?.slice(0, 100)}...`);
  console.log(`-------------------\n`);

  try {
    // Run the pipeline
    const result = await runPipelineTool({ inputPath: input_path, outputPath: output_path });

    console.log(`\n--- EXECUTE COMPLETE ---`);
    console.log(result);
    console.log(`-----------------------\n`);

    return {
      execution_result: result,
      current_phase: 'VERIFY' as const,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`\n--- EXECUTE ERROR ---`);
    console.error(errorMsg);
    console.error(`--------------------\n`);

    return {
      execution_result: `Error: ${errorMsg}`,
      current_phase: 'VERIFY' as const,
    };
  }
}
