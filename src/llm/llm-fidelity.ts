import * as ts from 'typescript';
import type { ComponentNode, ComponentOutput } from '../types/pipeline.js';
import type { LLMConfig } from '../types/config.js';
import { displayCostWarning } from './estimate.js';
import { FidelityResultSchema, type FidelityResult } from './structured/fidelity.js';
import { createOpenAIClient } from './providers/openai.js';
import { createAnthropicClient } from './providers/anthropic.js';
import { zodResponseFormat } from 'openai/helpers/zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { stringifySafe, translateLLMError } from './shared.js';

/**
 * Build system prompt for unified fidelity review, modify, and validate.
 */
function buildFidelitySystemPrompt(): string {
  return `You are a component fidelity validator and modifier for an HTML-to-React conversion tool.

TASKS:
1. REVIEW: Validate component boundaries, suggest naming improvements
2. MODIFY: Improve component code quality based on review
3. FIDELITY: Validate that generated components match the original HTML structure

REVIEW SCOPE (D-13 to D-17):
- Confirm or reject component boundaries created by the rules engine
- Suggest better component names when the rules engine used generic names
- Identify dead code, redundant nesting, or unclear class names

MODIFY SCOPE:
- Improve component code quality (naming, structure, readability)
- Fix potential issues identified in prior review
- Add proper TypeScript types where beneficial
- Ensure React best practices are followed

FIDELITY VALIDATION & TRANSLATION RULES (Fidelity-01):
- Compare generated component structure against original HTML
- Check that all HTML elements are preserved (structural 1-to-1 match)
- **CSS & Attribute Mapping**:
  - Accept valid React JSX attribute conversions (e.g., class -> className, for -> htmlFor, onclick -> onClick).
  - Understand that HTML inline style strings are parsed into React style objects.
  - **Do NOT flag CSS Modules as missing styles**: The rules engine converts standard classes into CSS Module imports (e.g., \`className={styles.xxx}\`). This is correct and must be preserved.
  - **Support Shared CSS**: Understand that shared rules are extracted into \`shared.module.css\` and composed via CSS Modules \`composes\` rule. Preserve this architecture.
- **Content Preservation**:
  - Verify text content matches original.
  - **IMPORTANT**: Keep original text languages (e.g. Chinese text) exactly as they are. Do not translate any text content.
- Report any discrepancies in fidelity_notes

OUT OF SCOPE:
- Do not restructure the component hierarchy
- Do not change component boundaries set by rules engine without strong reason
- Do not remove components without explicit reason

OUTPUT FORMAT:
Return ONLY valid JSON matching the provided schema. No markdown, no explanation outside the JSON.`;
}

/**
 * Build user content with original HTML, component tree, and current component codes.
 */
function buildFidelityUserContent(originalHtml: string, componentTree: ComponentNode, components: ComponentOutput[]): string {
  const treeJson = stringifySafe(componentTree);
  const componentsJson = stringifySafe(components);
  return `Original HTML:
\`\`\`html
${originalHtml}
\`\`\`

Component tree:
\`\`\`json
${treeJson}
\`\`\`

Current component codes:
\`\`\`json
${componentsJson}
\`\`\`

Compare the generated components against the original HTML and report fidelity issues.`;
}

/**
 * Call OpenAI API with structured output.
 */
async function callOpenAI(
  config: LLMConfig,
  systemPrompt: string,
  userContent: string,
): Promise<FidelityResult> {
  const client = createOpenAIClient(config);
  const model = config.model ?? 'gpt-4o-mini';

  const completion = await client.chat.completions.parse({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    response_format: zodResponseFormat(FidelityResultSchema, 'fidelity_result'),
    max_tokens: 8192,
    temperature: 0.2,
  });

  const result = completion.choices[0]?.message?.parsed;
  if (!result) {
    throw new Error('No response from OpenAI');
  }
  return result as FidelityResult;
}

/**
 * Call Anthropic API with structured output.
 */
async function callAnthropic(
  config: LLMConfig,
  systemPrompt: string,
  userContent: string,
): Promise<FidelityResult> {
  const client = createAnthropicClient(config);
  const model = config.model ?? 'claude-sonnet-4-7-20250514';

  const message = await client.messages.parse({
    model,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userContent },
    ],
    format: zodOutputFormat(FidelityResultSchema as any),
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
  return JSON.parse(textBlock.text) as FidelityResult;
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
 * Main LLM fidelity service.
 * Combines review, modify, and fidelity validation in a single step.
 */
export async function runLLMFidelity(
  html: string,
  componentTree: ComponentNode,
  components: ComponentOutput[],
  config: LLMConfig,
): Promise<FidelityResult> {
  // Serialize with circular reference handling
  const treeJson = stringifySafe(componentTree);
  const componentsJson = stringifySafe(components);

  // Display token estimate before call
  displayCostWarning(treeJson + componentsJson, config.model ?? 'gpt-4o-mini');

  const systemPrompt = buildFidelitySystemPrompt();
  const userContent = buildFidelityUserContent(html, componentTree, components);

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
    throw new Error(`[llm-fidelity] ${friendlyMessage}`);
  }
}
