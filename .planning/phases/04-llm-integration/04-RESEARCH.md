# Phase 4: LLM Integration - Research

**Researched:** 2026-05-21
**Domain:** LLM SDK integration for HTML-to-React CLI enhancement layer
**Confidence:** MEDIUM-HIGH

## Summary

Phase 4 adds an optional LLM "proofreader" pass on top of the existing rules engine output from Phases 1-3. The rules engine (Phase 2 splitter) handles mechanical component boundary detection and CSS extraction; the LLM validates those boundaries, handles rules-uncategorizable tags, refines component naming, and suggests cleanup. The tool works perfectly without LLM — all LLM failures degrade gracefully to rules-only output. The two primary integration concerns are SPL-06 (extending the rules splitter with heuristic class/ID detection for non-semantic divs) and LLM-01~05 (provider abstraction, token estimation, structured review).

**Primary recommendation:** Use `openai` SDK (v6) with `gpt-4o-mini` as default model, `baseURL` for Ollama, and Zod-structured outputs via `zodResponseFormat`. Insert LLM as a pipeline step after `generateStep`, with display-only token/cost warning before the API call.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| SPL-06 heuristic rules | API/Backend (splitter) | — | Rules engine already owns splitting; SPL-06 extends existing logic |
| LLM API calls | API/Backend | — | All LLM I/O happens in CLI process; no browser/CDN involvement |
| Token/cost estimation | API/Backend (llm/estimate.ts) | — | Pre-call calculation using tiktoken encoding |
| Structured output parsing | API/Backend (llm/structured/review.ts) | — | Zod validation after LLM response |
| LLM config loading | API/Backend (config loading) | — | Extends existing cosmiconfig from Phase 3 |
| Graceful degradation | API/Backend (llm-review.ts) | — | Pipeline step catches errors, returns fallback result |
| Display warnings | CLI/Frontend Server (output.ts) | — | Reuses existing ora spinner + output utilities |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Direct `openai` SDK — no abstraction layer
- D-02: Support custom config via `baseURL` for Ollama and OpenAI-compatible APIs
- D-03: All provider-specific config via `.h2uirc` / CLI flags
- D-04: Display-only warning for token/cost estimation before LLM call
- D-05: No blocking confirmation — always proceed after warning
- D-06: No caching — each conversion triggers a fresh LLM call
- D-07: Rules engine first: heuristic detection of class/ID patterns in non-semantic divs
- D-08: LLM validates rules-split results: confirms/rejects component boundaries
- D-09: LLM handles rules-uncategorizable cases: tags rules can't confidently classify
- D-10: Configurable `llm.mode`: `"off"` | `"auto"` | `"always"`
- D-11: On LLM error: explicit error message + fallback to rules-only output
- D-12: No blocking — graceful degradation
- D-13: Verify rules-split component structure — confirm/reject boundaries
- D-14: Handle rules-uncategorizable tags — boundary decisions rules can't make
- D-15: Naming refinement for rules-split components
- D-16: Cleanup suggestions: dead code, redundant nesting, unclear class names
- D-17: NOT in scope: structural refactoring, pattern abstraction, code rewriting

### Claude's Discretion
- Token estimator implementation details (tiktoken vs. alternative)
- Exact model selection (gpt-4o-mini default, but may need to vary)
- Prompt engineering specifics for the system prompt
- SPL-06 heuristic rule implementation details (what class/ID patterns trigger a split)

### Deferred Ideas (OUT OF SCOPE)
- POL-01: Interactive preview of component tree in browser (belongs in v2 polish)

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LLM-01 | Optional LLM pass improves component naming | D-15; openai SDK + structured output pattern |
| LLM-02 | Configurable LLM provider (OpenAI, Anthropic, Ollama) | D-01/D-02; openai baseURL + @anthropic-ai/sdk |
| LLM-03 | LLM suggests code cleanup / optimization improvements | D-16; ComponentReviewSchema with cleanup_hints |
| LLM-04 | Token estimation and cost warning before LLM calls | D-04/D-05; tiktoken + COST_PER_1M map |
| LLM-05 | CLM-05: Caching of LLM results | D-06 explicitly says NO caching |
| SPL-06 | Non-semantic `<div>` containers at top level split when they have a distinct class/ID | D-07; extends existing splitter with heuristic pattern detection |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `openai` | `^6.38.0` | OpenAI SDK with Chat Completions + structured output | Direct SDK per D-01; supports baseURL for Ollama; v6 has stable `zodResponseFormat` |
| `@anthropic-ai/sdk` | `^0.97.1` | Anthropic SDK with Messages API + structured output | Provider option per LLM-02 |
| `zod` | `^3.23.8` | Schema validation for LLM structured output | Enforced by AI-SPEC Section 2; required for `zodResponseFormat` / `zodOutputFormat` |
| `tiktoken` | `^1.0.22` | BPE token encoder for cost estimation | Industry-standard token counter for OpenAI-compatible models |

**[ASSUMED: All packages — slopcheck unavailable, npm registry verification only]**

**Installation:**
```bash
npm install openai@^6.38.0 @anthropic-ai/sdk@^0.97.1 zod@^3.23.8 tiktoken@^1.0.22
```

**Version verification (npm registry):**
- `openai`: 6.38.0 [VERIFIED: npm registry]
- `@anthropic-ai/sdk`: 0.97.1 [VERIFIED: npm registry]
- `zod`: 4.4.3 on registry (recommend pinning `^3.23.8` per AI-SPEC; note v4.x is breaking change) [VERIFIED: npm registry]
- `tiktoken`: 1.0.22 [VERIFIED: npm registry]

**Note on Zod version:** The AI-SPEC recommends `zod@^3.23.8` but the current registry shows 4.4.3. Zod v4 has breaking changes (esm/polyfill issues, import paths). Recommend pinning `^3.23.8` explicitly in package.json to avoid accidental upgrade. The planner should add a `checkpoint:human-verify` for this.

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `promptfoo` | `latest` | LLM eval tooling (reference dataset validation) | Eval phase only, not runtime dependency |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct SDK (openai) | Vercel AI SDK | Vercel AI SDK adds unnecessary abstraction; only needed for streaming/tool-calling/RSC support not required here |
| Direct SDK (openai) | LangChain | LangChain is overkill — this is a simple single-call SDK, not a multi-step chain or RAG pipeline |
| tiktoken | `gpt-tokenizer` package | tiktoken is the standard (used by LangChain, OpenAI cookbooks); `gpt-tokenizer` is less maintained |
| Zod v3 | Zod v4 | v4 has breaking changes and is very new; v3 is stable and fully compatible with openai SDK v6 |

## Package Legitimacy Audit

> slopcheck was unavailable at research time. All packages below are marked `[ASSUMED]` per the graceful degradation protocol. Planner MUST gate each install behind a `checkpoint:human-verify` task.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| openai | npm | ~3.5 yrs | ~55M/wk | github.com/openai/openai-node | unavailable | ASSUMED — verify before using |
| @anthropic-ai/sdk | npm | ~2 yrs | ~8M/wk | github.com/anthropics/anthropic-sdk-typescript | unavailable | ASSUMED — verify before using |
| zod | npm | ~8 yrs | ~85M/wk | github.com/colinhacks/zod | unavailable | ASSUMED — recommend pin ^3.23.8 (v4 breaking) |
| tiktoken | npm | ~4 yrs | ~5M/wk | github.com/openai/tiktoken | unavailable | ASSUMED — verify before using |

**Packages removed due to slopcheck [SLOP] verdict:** None (slopcheck unavailable)
**Packages flagged as suspicious [SUS]:** None — all packages have substantial download counts and canonical source repos.

*All packages above are tagged `[ASSUMED]` and the planner must gate each install behind a `checkpoint:human-verify` task.*

## Architecture Patterns

### System Architecture Diagram

```
CLI Input (file path, --llm flag)
    │
    ▼
cosmiconfig load (.h2uirc) ──→ LLM config (provider, model, mode, baseURL)
    │
    ▼
Pipeline (Phase 1-3 steps)
    │ parseStep → splitStep (SPL-06 rules) → convertStep → cssStep → generateStep
    │
    ▼
[If llm.mode !== "off" AND (llm.mode === "always" OR rules emit warnings)]
    │
    ▼
LLM Review Step (llm-review.ts)
    │
    ├─→ tiktoken encoding ──→ Display token/cost WARNING (D-04)
    │
    ├─→ Build system prompt (D-13~D-17 scope)
    │
    ├─→ Build user content (rules engine output as JSON)
    │
    ├─→ Call provider (OpenAI/Anthropic/Ollama via baseURL)
    │
    ├─→ Zod safeParse on response
    │       │
    │       ├─→ PASS: Apply naming suggestions, boundary changes, cleanup hints
    │       │
    │       └─→ FAIL: Log raw output + parse error, fallback to rules-only
    │
    ▼
Graceful Degradation (D-11/D-12)
    │ On error: show [llm] error message, continue with rules-only output
    ▼
Generate Step Output (TSX/CSS files)
```

### Recommended Project Structure

```
src/
├── llm/
│   ├── providers/
│   │   ├── openai.ts        # OpenAI client factory + config
│   │   ├── anthropic.ts     # Anthropic client factory + config
│   │   └── ollama.ts        # Ollama via OpenAI-compatible baseURL (openai.ts reuse)
│   ├── structured/
│   │   ├── review.ts        # ComponentReview Zod schema + output types
│   │   └── tokens.ts        # tiktoken token counting utilities
│   ├── estimate.ts          # Cost + token estimation (display-only per D-04)
│   └── llm-review.ts        # Main LLM review pipeline step
├── pipeline/
│   └── steps/
│       └── llm-review.ts    # PipelineStep wrapper for LLM review
├── config/
│   └── defaults.ts          # LLM config defaults (model, mode, provider)
├── types/
│   └── config.ts            # LLM config types (extends H2uiConfig)
└── cli/
    └── commands/
        └── convert.ts       # LLM pass integrated here (addStep after generateStep)
```

### Pattern 1: PipelineStep Integration

**What:** LLM review is a `PipelineStep` inserted after `generateStep`.
**When to use:** For every LLM invocation in the pipeline.
**Example:**
```typescript
// src/pipeline/steps/llm-review.ts
import type { PipelineStep, PipelineContext } from '../../types/pipeline.js';

export const llmReviewStep: PipelineStep = {
  name: 'llm-review',

  async run(ctx: PipelineContext): Promise<PipelineContext> {
    // D-10: Check llm.mode
    if (ctx.options.llm?.mode === 'off') return ctx;
    if (!shouldInvokeLLM(ctx)) return ctx; // mode === 'auto' + no warnings

    try {
      const result = await runLLMReview(ctx.componentTree, ctx.options.llm);
      // Apply suggestions to ctx.componentTree and ctx.components
      return { ...ctx, llmResult: result };
    } catch (err: any) {
      // D-11: graceful degradation
      console.warn(`[llm] error: ${err.message}, falling back to rules-only`);
      return { ...ctx, llmResult: { approved: false, _fallback: true } };
    }
  },
};
```

### Pattern 2: Provider Factory with baseURL

**What:** Single OpenAI client factory handles both OpenAI API and Ollama via `baseURL`.
**When to use:** When constructing the LLM client from config.
**Example:**
```typescript
// src/llm/providers/openai.ts
import OpenAI from 'openai';

export function createOpenAIClient(config: LLMConfig): OpenAI {
  return new OpenAI({
    apiKey: config.apiKey ?? process.env.OPENAI_API_KEY ?? 'ollama',
    baseURL: config.baseURL, // undefined for official OpenAI; set for Ollama
  });
}
```

### Pattern 3: Structured Output with Zod

**What:** `zodResponseFormat` wraps a Zod schema to force JSON output matching the schema.
**When to use:** Every LLM call in this phase.
**Example:**
```typescript
// src/llm/structured/review.ts
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

export const ComponentReviewSchema = z.object({
  approved: z.boolean(),
  boundary_changes: z.array(z.object({
    component_id: z.string(),
    action: z.enum(['confirm', 'reject', 'modify']),
    reason: z.string().max(200),
  })),
  naming_suggestions: z.array(z.object({
    original: z.string(),
    suggested: z.string(),
    rationale: z.string().max(100),
  })),
  cleanup_hints: z.array(z.string().max(150)),
});

// Usage:
const completion = await client.chat.completions.parse({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: buildUserContent(rulesOutput) },
  ],
  response_format: zodResponseFormat(ComponentReviewSchema, 'component_review'),
  max_tokens: 1024,
  temperature: 0.2,
});

const review = completion.choices[0].message.parsed; // typed as ComponentReviewSchema
```

### Pattern 4: Token Estimation + Cost Warning

**What:** Pre-call token counting using tiktoken before any API call.
**When to use:** Before every LLM invocation (display-only per D-04).
**Example:**
```typescript
// src/llm/estimate.ts
import { encoding_for_model } from 'tiktoken';

const COST_PER_1M_INPUT: Record<string, number> = {
  'gpt-4o-mini': 0.15,
  'gpt-4o': 2.50,
  'claude-sonnet-4-7': 3.50,
  'claude-haiku-4-5': 0.80,
};

export function estimateTokens(text: string): number {
  const enc = encoding_for_model('cl100k_base');
  const count = enc.encode(text).length;
  enc.free(); // DANGER: must free encoder to avoid WASM memory leak
  return count;
}

export function displayCostWarning(inputText: string, model: string): void {
  const tokens = estimateTokens(inputText);
  const inputCost = (tokens / 1_000_000) * (COST_PER_1M_INPUT[model] ?? 0.15);
  const outputEstimate = (512 / 1_000_000) * (COST_PER_1M_INPUT[model] ?? 0.15);
  console.warn(
    `[llm] ~${tokens} tokens (~$估算: ${(inputCost + outputEstimate).toFixed(4)}) -- calling ${model}`
  );
}
```

### Anti-Patterns to Avoid

- **Abstraction layer over LLM SDK:** D-01 explicitly says no abstraction. Provider-specific SDKs are used directly. Abstraction adds complexity without benefit for this use case.
- **Blocking confirmation before LLM call:** D-05 says no blocking — display warning only and proceed.
- **Caching LLM responses:** D-06 explicitly says no caching. Each run gets a fresh call; cached responses would be stale.
- **LLM as primary splitter:** D-08 says LLM validates rules-split, not replaces it. Rules do mechanical work; LLM is proofreader only.
- **Structured output without Zod validation:** Raw LLM JSON must always be validated with `safeParse` before use. Never trust the SDK's `parsed` field without validation.
- **Unbounded `max_tokens`:** Must always set `max_tokens` explicitly (1024 is sufficient for review output). Unbounded causes request hangs, especially on Anthropic.

## Common Pitfalls

### Pitfall 1: tiktoken encoder memory leak
**What goes wrong:** `encoding_for_model()` returns an encoder holding WASM resources. If `enc.free()` is not called, long-running CLI processes leak memory.
**Why it happens:** Developers forget the `free()` call since it feels like a no-op in JS.
**How to avoid:** Always use in a `try/finally` or immediately after counting:
```typescript
const enc = encoding_for_model('cl100k_base');
const count = enc.encode(text).length;
enc.free(); // always free
return count;
```
**Warning signs:** Process RSS grows across multiple invocations.

### Pitfall 2: Anthropic `max_tokens` default causes hangs
**What goes wrong:** Anthropic SDK default timeout is derived from `max_tokens`. If omitted, the request may hang indefinitely on large inputs.
**Why it happens:** Anthropic's default `max_tokens` is too large for timeout calculation.
**How to avoid:** Always set `max_tokens: 1024` explicitly. Never leave it undefined.
**Warning signs:** LLM call never returns; spinner spins forever.

### Pitfall 3: `dangerouslyAllowBrowser: true` in Node.js CLI
**What goes wrong:** Developers copy browser-context patterns and set this flag unnecessarily.
**Why it happens:** This flag is only needed for client-side web apps. For CLI/Node.js it is irrelevant and confusing.
**How to avoid:** Don't set it. The openai SDK blocks browser usage by default; for Node.js CLI this is fine.
**Warning signs:** Flag present in Node.js CLI code.

### Pitfall 4: Ollama requires explicit `apiKey` with `baseURL`
**What goes wrong:** When pointing openai SDK at Ollama via `baseURL: 'http://localhost:11434/v1'`, SDK errors with "Missing API key" unless `apiKey` is also provided.
**Why it happens:** SDK requires `apiKey` field; Ollama ignores it but it must be present.
**How to avoid:** Set `apiKey: 'ollama'` (or any string) alongside `baseURL` for Ollama configurations.
**Warning signs:** `[llm] error: Missing API key` when using Ollama.

### Pitfall 5: `response_format` only works with gpt-4o-* models
**What goes wrong:** Using `zodResponseFormat` with `gpt-4-turbo` or other older models returns a `validation_error`.
**Why it happens:** OpenAI structured outputs via `response_format` are only supported on `gpt-4o-*` models.
**How to avoid:** Use `gpt-4o-mini` (recommended default) or `gpt-4o`. For older models, fall back to prompting without structured output.
**Warning signs:** `error code: 422 - validation_error` from OpenAI API.

### Pitfall 6: Zod v4 breaking changes
**What goes wrong:** AI-SPEC recommends `zod@^3.23.8` but npm registry shows 4.4.3. v4 has breaking changes (esm/polyfill issues, different import paths).
**Why it happens:** v4 is recent; training data reflects v3 patterns.
**How to avoid:** Explicitly pin `zod@^3.23.8` in package.json. The planner should add a `checkpoint:human-verify` to flag this version conflict.
**Warning signs:** `Cannot find module 'zod'` or import path errors after `npm install`.

## Code Examples

### System Prompt Builder (D-13~D-17 scope)
```typescript
// Source: AI-SPEC Section 4b
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
```

### LLM Review Pipeline Step with Graceful Degradation (D-11/D-12)
```typescript
// Source: AI-SPEC Section 4
export async function runLLMReview(
  componentTree: ComponentNode,
  config: LLMConfig,
): Promise<LLMReviewResult> {
  const inputJson = JSON.stringify(componentTree);

  // D-04: Display token estimate before call
  const tokenCount = estimateTokens(inputJson);
  const cost = estimateCost(tokenCount, config.model);
  console.warn(`[llm] ~${tokenCount} tokens (~$估算: ${cost.toFixed(4)}) -- calling ${config.provider}/${config.model}`);

  const systemPrompt = buildSystemPrompt();
  const userContent = `Rules engine output:\n\`\`\`json\n${inputJson}\n\`\`\``;

  try {
    const result = await callProvider(config, systemPrompt, userContent);
    return result;
  } catch (error: any) {
    // D-11: graceful degradation
    console.warn(`[llm] error: ${error.message}, falling back to rules-only`);
    return {
      approved: false,
      boundary_changes: [],
      naming_suggestions: [],
      cleanup_hints: [],
      _fallback: true,
    };
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| LLM as primary converter | Rules engine first, LLM as proofreader | Pre-phase 4 decision (D-07~D-09) | Avoids over-reliance on LLM; deterministic rules + targeted LLM enhancement |
| Provider abstraction layer | Direct SDK per provider | Pre-phase 4 decision (D-01) | Simpler code, full control, no abstraction overhead |
| Implicit token counting | tiktoken-based pre-call estimation with display warning | Phase 4 implementation | D-04/D-05: transparent cost control without blocking flow |
| Silent LLM failure | Graceful degradation with explicit fallback | Phase 4 implementation | D-11/D-12: tool always produces output, LLM never blocks user |

**Deprecated/outdated:**
- Provider abstraction libraries (LangChain, Vercel AI SDK): Overkill for single-call structured extraction use case
- `gpt-4-turbo` with `response_format`: Replaced by `gpt-4o-mini` which supports structured outputs and is cheaper

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `zod@^3.23.8` is compatible with `openai@^6.38.0` — AI-SPEC Section 3 says use zod v3, npm shows v4 breaking changes | Standard Stack | v3 may have import path issues or be incompatible with newer SDK. Verify by testing install. |
| A2 | tiktoken `cl100k_base` encoding is appropriate for gpt-4o-mini AND claude models — AI-SPEC uses it for both | Token Estimation | tiktoken `cl100k_base` matches gpt-4o; for Claude, it's an approximation but within 10-15% accuracy |
| A3 | SPL-06 extends the existing `splitStep` with additional heuristic rules in the same file | Architecture | Extending existing splitter vs. creating new step — confirm with actual SPL-06 requirements during implementation |
| A4 | LLM review step inserts after `generateStep` in the pipeline | Architecture | May need to insert before `generateStep` if LLM suggestions affect code generation — verify during implementation |
| A5 | `cosmiconfig` from Phase 3 handles `.h2uirc` loading; LLM config is an additional field on `H2uiConfig` | Config | LLM config types need to be added to `src/types/config.ts` and loaded via existing Phase 3 mechanism |
| A6 | `gpt-4o-mini` is sufficient for component boundary validation | Standard Stack | If validation accuracy is insufficient, may need `gpt-4o` — plan should include escalation path |

## Open Questions

1. **SPL-06 boundary condition: what constitutes "distinct" class/ID for splitting a non-semantic div?**
   - What we know: D-07 says heuristic detection of class/ID patterns; existing splitter has `getMeaningfulClasses` utility
   - What's unclear: Threshold for "distinct enough to split" — single class? multiple classes? ID + class combination?
   - Recommendation: Start conservative (only split if ID present OR 2+ meaningful class tokens); can be relaxed via config

2. **Should `llm.mode: "auto"` trigger on specific warning types or any warning?**
   - What we know: D-10 says "auto" activates when rules emit warnings; Phase 1-2 have warning infrastructure
   - What's unclear: Which warnings should trigger LLM — unknown attrs, ambiguous splits, or all warnings?
   - Recommendation: Auto-trigger on `ambiguous-split` and `unknown-attribute` warnings specifically; other warnings are informational only

3. **Zod v3 vs v4 for this project**
   - What we know: AI-SPEC recommends v3.23.8; npm registry shows v4.4.3
   - What's unclear: Is v4 already installed? Does upgrading break existing Phase 1-3 code?
   - Recommendation: Check existing `package.json`; if zod is already a dep, check which version; if not installed, use v3 as AI-SPEC says

4. **LLM result: how are naming suggestions applied to the component tree?**
   - What we know: `naming_suggestions` array has `{original, suggested, rationale}` entries
   - What's unclear: Apply suggestions in-place (mutate component names) or pass alongside for display?
   - Recommendation: Apply in-place but log each application; if LLM fails validation, discard and use original names

## Environment Availability

> Step 2.6: SKIPPED — no external dependencies beyond npm packages. All dependencies are installed via `npm install` at implementation time.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (already in project from Phase 1) |
| Config file | `vitest.config.ts` (already exists) |
| Quick run command | `npx vitest run test/llm/ --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LLM-01 | Naming suggestions improve rules-generated names | unit | `vitest run test/llm/naming.test.ts` | no |
| LLM-02 | Multiple providers (OpenAI/Anthropic/Ollama) work via config | unit | `vitest run test/llm/providers.test.ts` | no |
| LLM-03 | Cleanup hints are specific and non-destructive | unit | `vitest run test/llm/cleanup.test.ts` | no |
| LLM-04 | Token estimate shown before LLM call | unit | `vitest run test/llm/estimate.test.ts` | no |
| LLM-05 | No caching — each call is fresh | unit | `vitest run test/llm/nocache.test.ts` | no |
| SPL-06 | Non-semantic divs with distinct class/ID are split | unit | `vitest run test/engine/splitter.test.ts` | partial |
| D-10 | llm.mode off/auto/always triggers correctly | unit | `vitest run test/llm/mode.test.ts` | no |
| D-11 | Graceful degradation on LLM error | unit | `vitest run test/llm/degradation.test.ts` | no |
| D-12 | No blocking on LLM call | unit | `vitest run test/llm/degradation.test.ts` | no |

### Sampling Rate
- **Per task commit:** `npx vitest run test/llm/ --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/llm/naming.test.ts` — covers LLM-01
- [ ] `test/llm/providers.test.ts` — covers LLM-02
- [ ] `test/llm/cleanup.test.ts` — covers LLM-03
- [ ] `test/llm/estimate.test.ts` — covers LLM-04
- [ ] `test/llm/nocache.test.ts` — covers LLM-05 (verifies no caching per D-06)
- [ ] `test/llm/mode.test.ts` — covers D-10 (llm.mode behavior)
- [ ] `test/llm/degradation.test.ts` — covers D-11/D-12 (graceful degradation)
- [ ] `test/engine/splitter.test.ts` — SPL-06 rules for non-semantic div splitting
- [ ] `test/llm/fixtures/` — test fixtures with sample component trees for each eval dimension
- [ ] Framework install: `npm install openai @anthropic-ai/sdk zod tiktoken --save-dev` (dev dependency for testing mocks)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth handled by this tool |
| V3 Session Management | no | No sessions in CLI tool |
| V4 Access Control | no | File-based, OS-level permissions |
| V5 Input Validation | yes | Zod schema validation on LLM output; HTML input already validated by cheerio |
| V6 Cryptography | no | No crypto operations |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Prompt injection via malicious HTML class names | Information Disclosure | LLM system prompt scopes output to JSON only; no code execution from user content |
| API key exposure via logs | Information Disclosure | `DEBUG=llm` env var for verbose tracing; API key never logged in default mode |
| Unbounded LLM output crashing parser | Denial of Service | `max_tokens: 1024` enforced; Zod safeParse on response |
| Ollama SSRF via baseURL config | Tampering | baseURL is user-supplied config; treat as user-controlled (no internal network access from tool itself) |

## Sources

### Primary (HIGH confidence)
- AI-SPEC (`04-AI-SPEC.md`) — Framework decision, SDK patterns, structured output examples, eval strategy [VERIFIED: comprehensive AI-SPEC from gsd-ai-researcher]
- npm registry — Package versions for openai, @anthropic-ai/sdk, zod, tiktoken [VERIFIED: npm registry]
- AI-SPEC Section 3 — SDK API patterns (OpenAI `zodResponseFormat`, Anthropic `zodOutputFormat`) [VERIFIED: based on official SDK docs]

### Secondary (MEDIUM confidence)
- AI-SPEC Section 4b — tiktoken token counting, cost estimation, prompt engineering [VERIFIED: consistent with tiktoken official GitHub]
- AI-SPEC Section 5 — Eval dimensions, guardrails, reference dataset [VERIFIED: structured evaluation methodology]

### Tertiary (LOW confidence)
- SPL-06 implementation details — Exact heuristic rules for class/ID-based div splitting not specified in AI-SPEC [ASSUMED: will be refined during implementation]
- LLM naming quality thresholds — What constitutes "generic" name pattern for regression detection [ASSUMED: based on common naming conventions]
- Zod v3/v4 compatibility — Training data may not reflect v4 breaking changes for this specific SDK combination [ASSUMED: needs verification]

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM — AI-SPEC is authoritative but slopcheck unavailable; all packages marked [ASSUMED]
- Architecture: MEDIUM — Pipeline integration pattern clear; exact step order (before/after generateStep) needs verification
- Pitfalls: MEDIUM — Based on AI-SPEC + SDK documentation; some pitfalls (tiktoken free, Ollama apiKey) documented in AI-SPEC Section 3

**Research date:** 2026-05-21
**Valid until:** 2026-06-20 (30 days — LLM SDK space is relatively stable)
