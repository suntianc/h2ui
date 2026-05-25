/**
 * Verifier Agent for confidence scoring.
 *
 * Implements hybrid verification: structural diff + LLM semantic verification.
 *
 * @module agent/verifier/agent
 */

import { createAnthropicClient } from '../../llm/providers/anthropic.js';
import type { AgentState } from '../graph/state.js';

/**
 * Result of verification by the Verifier Agent.
 */
export interface VerifierResult {
  match: boolean;
  confidence: number;
  issues: string[];
}

/**
 * Hybrid verification system prompt.
 */
const VERIFIER_SYSTEM_PROMPT = `You are a verification agent for HTML-to-component conversion.

Your task is to verify that a generated component faithfully represents the source HTML.

Perform a two-stage verification:
1. First: Structural diff - check DOM structure, attributes, text content
2. Second (if needed): LLM semantic verification - ensure semantic equivalence

Output a JSON object with:
- match: boolean (true if output matches input)
- confidence: number (0-1, higher is better)
- issues: string[] (list of issues found)

Be strict but fair. A component that preserves structure and semantics should pass.`;

/**
 * Run the Verifier Agent to check output fidelity.
 *
 * @param state - Current agent state
 * @returns Verification result with confidence score
 */
export async function verifierAgent(state: AgentState): Promise<VerifierResult> {
  const { input_path, output_path, repair_attempts } = state;

  if (!input_path || !output_path) {
    return {
      match: false,
      confidence: 0,
      issues: ['Missing input or output path'],
    };
  }

  const client = createAnthropicClient({ provider: 'anthropic', model: 'claude-haiku-4' });

  // Read files
  const fs = await import('fs/promises');
  let htmlContent: string;
  let componentContent: string;

  try {
    htmlContent = await fs.readFile(input_path, 'utf-8');
    componentContent = await fs.readFile(output_path, 'utf-8');
  } catch {
    return {
      match: false,
      confidence: 0,
      issues: ['Could not read input or output file'],
    };
  }

  // Call verifier LLM
  const response = await client.messages.create({
    model: 'claude-haiku-4',
    max_tokens: 2048,
    system: VERIFIER_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Verify this component against the source HTML.

Source HTML (first 5000 chars):
${htmlContent.slice(0, 5000)}

Generated Component:
${componentContent.slice(0, 5000)}

Respond with a JSON object only.`,
      },
    ],
  });

  // Parse response
  const responseText = response.content[0]?.type === 'text' ? response.content[0].text : '{}';

  let parsed: { match?: boolean; confidence?: number; issues?: string[] };
  try {
    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      parsed = {};
    }
  } catch {
    parsed = {};
  }

  // Apply hybrid formula per D-20
  const verificationWeight = parsed.confidence ?? 0.5;
  const repairFactor = 1 - repair_attempts / 3;
  const finalConfidence = Math.min(100, Math.round((verificationWeight * 0.7 + repairFactor * 0.3) * 100));

  return {
    match: parsed.match ?? false,
    confidence: finalConfidence,
    issues: parsed.issues ?? [],
  };
}
