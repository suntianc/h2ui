/**
 * VERIFY node for the autonomous agent.
 *
 * Verifies the conversion output fidelity.
 *
 * @module agent/graph/nodes/verify
 */

import type { AgentState } from '../state.js';
import { verifyOutput } from '../../tools/verify.js';

/**
 * VERIFY node function.
 * Calls verify_output tool to check fidelity.
 */
export async function verifyNode(state: AgentState): Promise<Partial<AgentState>> {
  const { input_path, output_path, repair_attempts } = state;

  if (!input_path || !output_path) {
    return {
      verification_result: {
        match: false,
        confidence: 0,
        issues: ['Missing input or output path'],
      },
      current_phase: 'DONE' as const,
    };
  }

  console.log(`\n--- AGENT VERIFY ---`);
  console.log(`Repair attempts: ${repair_attempts}/${state.max_repair_attempts}`);
  console.log(`------------------\n`);

  try {
    const result = await verifyOutput(input_path, output_path);

    console.log(`\n--- VERIFY RESULT ---`);
    console.log(`Match: ${result.match}`);
    console.log(`Confidence: ${result.confidence}`);
    if (result.issues.length > 0) {
      console.log(`Issues: ${result.issues.join(', ')}`);
    }
    console.log(`---------------------\n`);

    return {
      verification_result: {
        match: result.match,
        confidence: result.confidence,
        issues: result.issues,
      },
      current_phase: result.match ? 'DONE' as const : 'REPAIR' as const,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`\n--- VERIFY ERROR ---`);
    console.error(errorMsg);
    console.error(`-------------------\n`);

    return {
      verification_result: {
        match: false,
        confidence: 0,
        issues: [`Verification error: ${errorMsg}`],
      },
      current_phase: 'REPAIR' as const,
    };
  }
}
