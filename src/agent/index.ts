/**
 * Agent entry point for autonomous HTML-to-component conversion.
 *
 * @module agent/index
 */

import { runAgent } from './graph/builder.js';
import { readHistory, writeHistory } from './history/manager.js';

/**
 * Result returned by the agent after completing a conversion.
 */
export interface AgentResult {
  /** Path to the output directory */
  outputPath: string;
  /** Confidence score 0-100% */
  confidence: number;
  /** Number of repair attempts made */
  repairAttempts: number;
  /** The declared conversion plan */
  plan: string;
  /** Total tokens consumed */
  tokenCount: number;
}

/**
 * Options for agent execution.
 */
export interface AgentOptions {
  /** Maximum repair attempts (default: 3) */
  maxRepairAttempts?: number;
  /** Token budget soft limit (default: 50000) */
  tokenBudget?: number;
}

/**
 * Run the autonomous agent to convert HTML to components.
 *
 * The agent follows a PLAN -> EXECUTE -> VERIFY -> REPAIR loop,
 * declaring its plan before execution and self-repairing failures.
 *
 * @param inputPath - Path to input HTML file
 * @param outputPath - Path to output directory
 * @param options - Agent options
 * @returns Promise resolving to AgentResult
 */
export async function run(
  inputPath: string,
  outputPath: string,
  options: AgentOptions = {}
): Promise<AgentResult> {
  const maxRepairAttempts = options.maxRepairAttempts ?? 3;
  const tokenBudget = options.tokenBudget ?? 50000;

  // Read history for failed strategies
  const threadId = `conversion-${Date.now()}`;
  const history = readHistory(threadId);

  // Run the agent
  const result = await runAgent({
    input_path: inputPath,
    output_path: outputPath,
    max_repair_attempts: maxRepairAttempts,
    token_budget: tokenBudget,
    thread_id: threadId,
    failed_strategies: history?.failedStrategies ?? [],
  });

  // Persist failed strategies
  writeHistory({
    threadId,
    failedStrategies: result.failed_strategies ?? [],
    tokenCount: result.token_count ?? 0,
    lastUpdated: new Date().toISOString(),
  });

  return {
    outputPath: result.output_path ?? outputPath,
    confidence: result.confidence_score ?? 0,
    repairAttempts: result.repair_attempts ?? 0,
    plan: result.plan ?? '',
    tokenCount: result.token_count ?? 0,
  };
}
