/**
 * PLAN node for the autonomous agent.
 *
 * Declares the conversion plan and outputs it to the console.
 *
 * @module agent/graph/nodes/plan
 */

import type { AgentState } from '../state.js';

/**
 * System prompt for the PLAN node.
 */
const PLAN_SYSTEM_PROMPT = `You are an HTML-to-component conversion planner. Analyze the input HTML and declare your conversion plan.

Your plan should:
1. Identify semantic HTML sections (header, nav, main, section, footer, etc.)
2. Determine component boundaries based on the structure
3. Specify the framework target (React or Vue 3)
4. Note any complex nested structures that may need special handling

Output your plan as a concise, structured list visible to the user.`;

import { ChatAnthropic } from '@langchain/anthropic';
import { createAnthropicClient } from '../../../llm/providers/anthropic.js';

/**
 * PLAN node function.
 * Analyzes the input HTML and declares the conversion plan.
 */
export async function planNode(state: AgentState): Promise<Partial<AgentState>> {
  const { input_path } = state;

  if (!input_path) {
    return {
      plan: 'Error: No input path provided',
      current_phase: 'DONE',
    };
  }

  // Read the input HTML file
  const fs = await import('fs/promises');
  let htmlContent: string;
  try {
    htmlContent = await fs.readFile(input_path, 'utf-8');
  } catch {
    return {
      plan: `Error: Could not read file ${input_path}`,
      current_phase: 'DONE',
    };
  }

  // Create LLM client
  const config = { provider: 'anthropic' as const, model: 'claude-sonnet-4-6' };
  const client = createAnthropicClient(config);

  // Generate plan
  const model = new ChatAnthropic({
    model: 'claude-sonnet-4-6',
    temperature: 0,
    maxTokens: 4096,
  });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: PLAN_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Analyze this HTML and create a conversion plan:\n\n${htmlContent.slice(0, 10000)}`,
      },
    ],
  });

  const planText = response.content[0].type === 'text' ? response.content[0].text : 'Plan generation failed';

  // Log the plan to console per D-04
  console.log('\n--- AGENT PLAN ---');
  console.log(planText);
  console.log('------------------\n');

  return {
    plan: planText,
    current_phase: 'EXECUTE' as const,
    token_count: state.token_count + (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0),
  };
}
