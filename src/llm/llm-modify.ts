import * as ts from 'typescript';
import type { ComponentNode, ComponentOutput } from '../types/pipeline.js';
import type { LLMConfig } from '../types/config.js';
import { displayCostWarning } from './estimate.js';
import { ComponentCodeSchema, type ComponentCode } from './structured/modify.js';
import { createOpenAIClient } from './providers/openai.js';
import { createAnthropicClient } from './providers/anthropic.js';
import { zodResponseFormat } from 'openai/helpers/zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { stringifySafe, translateLLMError } from './shared.js';

/**
 * Build system prompt for component modification per D-13~D-17 scope.
 * LLM modifies component code while respecting rules engine boundaries.
 */
function buildModifySystemPrompt(): string {
  return `You are a component code modifier for an HTML-to-React conversion tool.

SCOPE (D-13 to D-17):
- Improve component code quality (naming, structure, readability)
- Fix potential issues identified in prior review
- Add proper TypeScript types where beneficial
- Ensure React best practices are followed
- **Style and Attribute Guidelines**:
  - Keep and respect the CSS Modules wiring. Do NOT replace \`className={styles.xxx}\` with hardcoded string classes.
  - Respect shared CSS extraction and the \`composes\` rule logic built by the compiler.
  - Keep valid React element properties (e.g. use className, htmlFor, style objects).
- **Text Preservation**:
  - Keep original text content exactly in its original language (e.g., Chinese characters). Do NOT translate text content.

OUT OF SCOPE (D-17):
- Do not restructure the component hierarchy
- Do not change component boundaries or boundaries set by rules engine
- Do not remove components without explicit reason
- Do not make structural refactoring changes

OUTPUT FORMAT:
Return ONLY valid JSON matching the provided schema. No markdown, no explanation outside the JSON.`;
}

/**
 * Build user content with component tree and current component codes as JSON.
 */
function buildModifyUserContent(componentTree: ComponentNode, components: ComponentOutput[]): string {
  const treeJson = stringifySafe(componentTree);
  const componentsJson = stringifySafe(components);
  return `Component tree:\n\`\`\`json\n${treeJson}\n\`\`\`\n\nCurrent component codes:\n\`\`\`json\n${componentsJson}\n\`\`\``;
}

/**
 * Call OpenAI API with structured output.
 * Uses zodResponseFormat for schema enforcement.
 */
async function callOpenAI(
  config: LLMConfig,
  systemPrompt: string,
  userContent: string,
): Promise<ComponentCode> {
  const client = createOpenAIClient(config);
  const model = config.model ?? 'gpt-4o-mini';

  const completion = await client.chat.completions.parse({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    response_format: zodResponseFormat(ComponentCodeSchema, 'component_modify'),
    max_tokens: 8192,
    temperature: 0.2,
  });

  const result = completion.choices[0]?.message?.parsed;
  if (!result) {
    throw new Error('No response from OpenAI');
  }
  return result as ComponentCode;
}

/**
 * Call Anthropic API with structured output.
 * Uses zodOutputFormat for schema enforcement.
 */
async function callAnthropic(
  config: LLMConfig,
  systemPrompt: string,
  userContent: string,
): Promise<ComponentCode> {
  const client = createAnthropicClient(config);
  const model = config.model ?? 'claude-sonnet-4-7-20250514';

  const message = await client.messages.parse({
    model,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userContent },
    ],
    format: zodOutputFormat(ComponentCodeSchema as any),
    max_tokens: 8192,
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
  return JSON.parse(textBlock.text) as ComponentCode;
}

/**
 * Validate component code before writing to filesystem.
 * Checks TypeScript transpile and dangerous patterns.
 */
export function validateBeforeWrite(code: string): { valid: boolean; error?: string } {
  // Check for dangerous patterns first (fast)
  const dangerousPatterns = [
    { pattern: /\beval\s*\(/, name: 'eval()' },
    { pattern: /\bnew\s+Function\s*\(/, name: 'new Function()' },
    // Note: template literal pattern removed - transpileModule catches actual syntax issues
    // and the regex /\`.*\$\{.*\}\`/ caused false positives on valid template strings
  ];

  for (const { pattern, name } of dangerousPatterns) {
    if (pattern.test(code)) {
      return { valid: false, error: `Dangerous pattern detected: ${name}` };
    }
  }

  // TypeScript transpile check
  try {
    const result = ts.transpileModule(code, {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ESNext,
      },
    });

    // Check for error diagnostics
    const diagnostics = result.diagnostics ?? [];
    if (diagnostics.length > 0) {
      const firstError = diagnostics[0];
      const messageText = ts.flattenDiagnosticMessageText(firstError.messageText, '\n');
      return { valid: false, error: `TypeScript transpile error: ${messageText}` };
    }
  } catch (err: any) {
    return { valid: false, error: `TypeScript transpile exception: ${err.message}` };
  }

  return { valid: true };
}

/**
 * Main LLM modify service.
 * Calls the appropriate provider based on config, with graceful degradation per D-11.
 */
export async function runLLMModify(
  componentTree: ComponentNode,
  components: ComponentOutput[],
  config: LLMConfig,
): Promise<ComponentCode> {
  // Serialize with circular reference handling
  const treeJson = stringifySafe(componentTree);
  const componentsJson = stringifySafe(components);

  // Display token estimate before call
  displayCostWarning(treeJson + componentsJson, config.model ?? 'gpt-4o-mini');

  const systemPrompt = buildModifySystemPrompt();
  const userContent = buildModifyUserContent(componentTree, components);

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
    throw new Error(`[llm-modify] ${friendlyMessage}`);
  }
}
