/**
 * Agent state types for the StateGraph-based autonomous agent.
 *
 * @module agent/graph/state
 */

/**
 * Phase of the agent execution loop.
 */
export type AgentPhase = 'PLAN' | 'EXECUTE' | 'VERIFY' | 'REPAIR' | 'DONE';

/**
 * State maintained throughout the agent's PLAN -> EXECUTE -> VERIFY -> REPAIR loop.
 */
export interface AgentState {
  /** Conversation messages between agent and tools */
  messages: Array<{
    role: 'user' | 'assistant' | 'tool';
    content: string;
  }>;
  /** Declared conversion plan */
  plan: string | null;
  /** Current phase in the execution loop */
  current_phase: AgentPhase;
  /** Input HTML file path */
  input_path: string | null;
  /** Output directory path */
  output_path: string | null;
  /** Number of repair attempts made */
  repair_attempts: number;
  /** Maximum repair attempts allowed */
  max_repair_attempts: number;
  /** Token budget for LLM calls */
  token_budget: number;
  /** Total tokens consumed */
  token_count: number;
  /** Thread ID for history persistence */
  thread_id: string;
  /** Verification result from Verifier Agent */
  verification_result: {
    match: boolean;
    confidence: number;
    issues: string[];
  } | null;
  /** List of failed repair strategies */
  failed_strategies: string[];
  /** Final confidence score (0-100%) */
  confidence_score: number | null;
  /** LLM-generated execution result */
  execution_result: string | null;
}

/**
 * Input for the agent runner.
 */
export interface AgentInput {
  input_path: string;
  output_path: string;
  max_repair_attempts: number;
  token_budget: number;
  thread_id: string;
  failed_strategies: string[];
}
