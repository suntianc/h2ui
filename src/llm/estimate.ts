import { estimateTokens } from './structured/tokens.js';

const COST_PER_1M_INPUT: Record<string, number> = {
  'gpt-4o-mini': 0.15,
  'gpt-4o': 2.50,
  'claude-sonnet-4-7': 3.50,
  'claude-haiku-4-5': 0.80,
};

/**
 * Estimate cost for a given token count and model.
 */
export function estimateCost(tokens: number, model: string): number {
  const rate = COST_PER_1M_INPUT[Object.keys(COST_PER_1M_INPUT).find(k => model.startsWith(k)) ?? ''] ?? 0.15;
  return (tokens / 1_000_000) * rate;
}

/**
 * Display cost warning to console per D-04 (display-only) and D-05 (no blocking).
 * Shows: [llm] ~{tokens} tokens (~$估算: {cost}) -- calling {model}
 */
export function displayCostWarning(inputText: string, model: string): void {
  const tokens = estimateTokens(inputText);
  const inputCost = estimateCost(tokens, model);
  const outputEstimate = estimateCost(512, model) * 0.5;  // rough 50% compression estimate
  const total = inputCost + outputEstimate;
  console.warn(`[llm] ~${tokens} tokens (~$est: ${total.toFixed(4)}) -- calling ${model}`);
}
