/**
 * StateGraph builder for the autonomous agent.
 *
 * Constructs a LangGraph StateGraph with PLAN -> EXECUTE -> VERIFY -> REPAIR loop.
 *
 * @module agent/graph/builder
 */

import { StateGraph } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph/checkpointing';
import type { AgentState, AgentInput } from './state.js';
import { planNode } from './nodes/plan.js';
import { executeNode } from './nodes/execute.js';
import { verifyNode } from './nodes/verify.js';
import { repairNode } from './nodes/repair.js';

/**
 * Conditional edge function: determines if repair should occur.
 */
function shouldRepair(state: AgentState): 'repair' | 'end' {
  if (state.verification_result?.match === false && state.repair_attempts < state.max_repair_attempts) {
    return 'repair';
  }
  return 'end';
}

/**
 * Build and compile the StateGraph for the autonomous agent.
 */
function buildGraph() {
  const workflow = new StateGraph<AgentState>({
    channels: {
      messages: {
        value: (x: AgentState['messages'], y: AgentState['messages']) => [...x, ...y],
        default: () => [],
      },
      plan: null,
      current_phase: null,
      input_path: null,
      output_path: null,
      repair_attempts: null,
      max_repair_attempts: null,
      token_budget: null,
      token_count: null,
      thread_id: null,
      verification_result: null,
      failed_strategies: null,
      confidence_score: null,
      execution_result: null,
    },
  })
    .addNode('plan', planNode, {
      ends: ['execute'],
    })
    .addNode('execute', executeNode, {
      ends: ['verify'],
    })
    .addNode('verify', verifyNode, {
      ends: ['repair', '__end__'],
    })
    .addNode('repair', repairNode, {
      ends: ['execute'],
    })
    .addEdge('__start__', 'plan')
    .addConditionalEdges('verify', shouldRepair, {
      repair: 'repair',
      end: '__end__',
    });

  return workflow.compile({
    checkpointer: new MemorySaver(),
  });
}

/**
 * Run the agent with the given input.
 */
export async function runAgent(input: AgentInput): Promise<AgentState> {
  const app = buildGraph();

  const initialState: AgentState = {
    messages: [],
    plan: null,
    current_phase: 'PLAN',
    input_path: input.input_path,
    output_path: input.output_path,
    repair_attempts: 0,
    max_repair_attempts: input.max_repair_attempts,
    token_budget: input.token_budget,
    token_count: 0,
    thread_id: input.thread_id,
    verification_result: null,
    failed_strategies: input.failed_strategies,
    confidence_score: null,
    execution_result: null,
  };

  const result = await app.invoke(initialState, {
    configurable: { thread_id: input.thread_id },
  });

  return result;
}
