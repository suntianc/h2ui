import type { ComponentNode } from '../types/pipeline.js';
import type { LLMConfig } from '../types/config.js';
import { displayCostWarning } from './estimate.js';
import { ComponentReviewSchema, type ComponentReview } from './structured/review.js';
import { createOpenAIClient } from './providers/openai.js';
import { createAnthropicClient } from './providers/anthropic.js';
import { zodResponseFormat } from 'openai/helpers/zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

/**
 * Build system prompt per D-13~D-17 scope.
 * LLM is a proofreader that validates rules engine boundaries and suggests improvements.
 */
function buildSystemPrompt(): string {
  return `You are a component proofreader for an HTML-to-React conversion tool.

SCOPE (D-13 to D-17):
- Confirm or reject component boundaries created by the rules engine
- Suggest better component names when the rules engine used generic names
- Identify dead code, redundant nesting, or unclear class names

OUT OF SCOPE (D-17):
- Do not restructure the component hierarchy
- Do not abstract repeated patterns
- Do not rewrite component code
- Do not remove nodes without explicit reason

OUTPUT FORMAT:
Return ONLY valid JSON matching the provided schema. No markdown, no explanation outside the JSON.`;
}

/**
 * Build user content with rules engine output as JSON.
 */
function buildUserContent(componentTree: ComponentNode): string {
  const inputJson = JSON.stringify(componentTree);
  return `Rules engine output:\n\`\`\`json\n${inputJson}\n\`\`\``;
}

/**
 * Call OpenAI API with structured output per D-01.
 * Uses zodResponseFormat for schema enforcement.
 */
async function callOpenAI(
  config: LLMConfig,
  systemPrompt: string,
  userContent: string,
): Promise<ComponentReview> {
  const client = createOpenAIClient(config);
  const model = config.model ?? 'gpt-4o-mini';

  const completion = await client.chat.completions.parse({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    response_format: zodResponseFormat(ComponentReviewSchema, 'component_review'),
    max_tokens: 1024,
    temperature: 0.2,
  });

  const result = completion.choices[0]?.message?.parsed;
  if (!result) {
    throw new Error('No response from OpenAI');
  }
  return result as ComponentReview;
}

/**
 * Call Anthropic API with structured output per D-01.
 * Uses zodOutputFormat for schema enforcement.
 */
async function callAnthropic(
  config: LLMConfig,
  systemPrompt: string,
  userContent: string,
): Promise<ComponentReview> {
  const client = createAnthropicClient(config);
  const model = config.model ?? 'claude-sonnet-4-7-20250514';

  const message = await client.messages.parse({
    model,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userContent },
    ],
    format: zodOutputFormat(ComponentReviewSchema as any),
    max_tokens: 1024,
  });

  const result = (message as any).content;
  if (!result) {
    throw new Error('No response from Anthropic');
  }
  // Anthropic returns content as array; first block should be the parsed JSON
  const textBlock = result.find((b: any) => b.type === 'text');
  if (!textBlock) {
    throw new Error('No text block in Anthropic response');
  }
  return JSON.parse(textBlock.text) as ComponentReview;
}

/**
 * Main LLM review service.
 * Calls the appropriate provider based on config, with graceful degradation per D-11.
 */
export async function runLLMReview(
  componentTree: ComponentNode,
  config: LLMConfig,
): Promise<ComponentReview> {
  const inputJson = JSON.stringify(componentTree);

  // D-04: Display token estimate before call (display-only, no blocking)
  displayCostWarning(inputJson, config.model ?? 'gpt-4o-mini');

  const systemPrompt = buildSystemPrompt();
  const userContent = buildUserContent(componentTree);

  const provider = config.provider ?? 'openai';

  try {
    if (provider === 'anthropic') {
      return await callAnthropic(config, systemPrompt, userContent);
    }
    // Default: openai (also handles 'ollama' via baseURL)
    return await callOpenAI(config, systemPrompt, userContent);
  } catch (err: any) {
    // D-11: graceful degradation - explicit error + fallback
    console.warn(`[llm] error: ${err.message}, falling back to rules-only`);
    return {
      approved: false,
      boundary_changes: [],
      naming_suggestions: [],
      cleanup_hints: [],
      _fallback: true,
    } as ComponentReview & { _fallback: boolean };
  }
}
