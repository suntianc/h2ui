import type { ComponentNode } from '../types/pipeline.js';
import type { LLMConfig } from '../types/config.js';
import { displayCostWarning } from './estimate.js';
import { ComponentReviewSchema, type ComponentReview } from './structured/review.js';
import { createOpenAIClient } from './providers/openai.js';
import { createAnthropicClient } from './providers/anthropic.js';
import { zodResponseFormat } from 'openai/helpers/zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

/**
 * Translate SDK errors to user-friendly Chinese messages.
 */
function translateLLMError(err: any): string {
  const msg = err.message ?? String(err);

  // Missing API key
  if (msg.includes('apiKey') || msg.includes('API key') || msg.includes('Missing credentials')) {
    return '未配置 API key，请检查 .h2uirc 或环境变量';
  }
  // Network errors
  if (msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED') || msg.includes('fetch') || msg.includes('network')) {
    return '网络连接失败，请检查 API 地址和网络';
  }
  // Authentication errors
  if (msg.includes('401') || msg.includes('403') || msg.includes('Unauthorized') || msg.includes('authentication')) {
    return 'API 认证失败，请检查 API key 是否正确';
  }
  // Rate limit
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('Rate limit')) {
    return '请求频率超限，请稍后重试';
  }
  // Model not found
  if (msg.includes('model') && (msg.includes('not found') || msg.includes('does not exist'))) {
    return `模型不存在或不可用: ${err.model ?? '未知'}`;
  }
  // Default: show truncated original message
  return msg.length > 80 ? msg.substring(0, 80) + '...' : msg;
}

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
  const inputJson = stringifySafe(componentTree);
  return `Rules engine output:\n\`\`\`json\n${inputJson}\n\`\`\``;
}

/**
 * JSON.stringify with circular reference handling.
 * domhandler Element objects have parent pointers that cause serialization to fail.
 */
function stringifySafe(obj: unknown): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return undefined; // Remove circular reference
      }
      seen.add(value);
    }
    // Handle domhandler-specific circular props
    if (key === 'parent' || key === 'next' || key === 'prev') {
      return undefined;
    }
    return value;
  });
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
  if (!Array.isArray(result)) {
    throw new Error(`Unexpected Anthropic response type: ${typeof result}`);
  }
  const textBlock = result.find((b: any) => b.type === 'text');
  if (!textBlock) {
    throw new Error(`No text block in Anthropic response. Content types: ${result.map((b: any) => b.type).join(', ')}`);
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
  // Serialize with circular reference handling
  const inputJson = stringifySafe(componentTree);

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
    const friendlyMessage = translateLLMError(err);
    console.warn(`[llm] error: ${friendlyMessage}, falling back to rules-only`);
    return {
      approved: false,
      boundary_changes: [],
      naming_suggestions: [],
      cleanup_hints: [],
      _fallback: null,
    };
  }
}
