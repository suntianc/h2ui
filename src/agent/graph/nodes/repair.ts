/**
 * REPAIR node for the autonomous agent.
 *
 * Attempts to repair failed conversions using strategies from the pool.
 *
 * @module agent/graph/nodes/repair
 */

import type { AgentState } from '../state.js';
import { getFailedStrategies } from '../../history/manager.js';

/**
 * Repair strategy pool per D-10.
 */
const REPAIR_STRATEGIES = [
  {
    id: 'simplify_structure',
    name: 'Simplify Structure',
    description: 'Split complex nested components into simpler blocks',
  },
  {
    id: 'rewrite_attributes',
    name: 'Rewrite Attributes',
    description: 'Rewrite problematic parts with different attribute syntax',
  },
  {
    id: 'add_comments',
    name: 'Add Comments',
    description: 'Add explanatory comments to help LLM understand structure',
  },
  {
    id: 'skip_block',
    name: 'Skip Problematic Block',
    description: 'Skip the problematic block as a last resort',
  },
];

/**
 * Select a repair strategy, avoiding previously failed ones.
 */
function selectStrategy(failedStrategies: string[]): typeof REPAIR_STRATEGIES[0] | null {
  const available = REPAIR_STRATEGIES.filter(s => !failedStrategies.includes(s.id));
  if (available.length === 0) {
    return REPAIR_STRATEGIES[REPAIR_STRATEGIES.length - 1]; // Last resort: skip block
  }
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * REPAIR node function.
 * Selects and applies a repair strategy.
 */
export async function repairNode(state: AgentState): Promise<Partial<AgentState>> {
  const { repair_attempts, max_repair_attempts, failed_strategies, thread_id } = state;

  console.log(`\n--- AGENT REPAIR ---`);
  console.log(`Attempt: ${repair_attempts + 1}/${max_repair_attempts}`);
  console.log(`------------------\n`);

  // Check if max attempts reached
  if (repair_attempts >= max_repair_attempts) {
    console.log(`\n--- REPAIR STOPPED ---`);
    console.log(`Maximum repair attempts (${max_repair_attempts}) reached`);
    console.log(`----------------------\n`);

    return {
      current_phase: 'DONE' as const,
    };
  }

  // Get failed strategies from history
  const historyFailed = getFailedStrategies(thread_id);
  const allFailedStrategies = [...new Set([...failed_strategies, ...historyFailed])];

  // Select a strategy
  const strategy = selectStrategy(allFailedStrategies);

  if (!strategy) {
    return {
      current_phase: 'DONE' as const,
    };
  }

  console.log(`\n--- REPAIR STRATEGY ---`);
  console.log(`Strategy: ${strategy.name}`);
  console.log(`Description: ${strategy.description}`);
  console.log(`------------------------\n`);

  // Increment repair attempts and add to failed strategies
  return {
    repair_attempts: repair_attempts + 1,
    failed_strategies: [...allFailedStrategies, strategy.id],
    current_phase: 'EXECUTE' as const,
  };
}
