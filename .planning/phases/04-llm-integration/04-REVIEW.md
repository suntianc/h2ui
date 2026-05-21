---
phase: 04-llm-integration
reviewed: 2026-05-21T12:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - src/cli/commands/convert.ts
  - src/config/defaults.ts
  - src/engine/splitter/index.ts
  - src/engine/splitter/semantic.ts
  - src/llm/estimate.ts
  - src/llm/llm-review.ts
  - src/llm/providers/anthropic.ts
  - src/llm/providers/openai.ts
  - src/llm/structured/review.ts
  - src/llm/structured/tokens.ts
  - src/pipeline/steps/llm-review.ts
  - src/types/config.ts
  - src/types/pipeline.ts
findings:
  critical: 1
  warning: 6
  info: 2
  total: 9
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-05-21T12:00:00Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Reviewed the LLM integration phase (phase 4) implementation. The phase adds LLM-based component review capabilities using OpenAI/Anthropic with structured output. Found one critical pipeline ordering bug where LLM review results are displayed but never applied to output, plus several type safety and robustness issues.

## Critical Issues

### CR-01: LLM review runs AFTER file generation - results not applied to output

**File:** `src/cli/commands/convert.ts:93-97`
**Issue:** The `llmReviewStep` is added to the pipeline AFTER `generateStep`. This means files are generated and written to disk BEFORE the LLM review runs. The LLM results (boundary_changes, naming_suggestions, cleanup_hints) are only displayed to the console (lines 149-177) but never actually used to modify the generated output.

```typescript
// Current order (lines 76-97):
pipeline.addStep(parseStep);
if (mergedConfig.split !== false) {
  pipeline.addStep(splitStep);
  pipeline.addStep(convertStep);
  pipeline.addStep(cssStep);
} else {
  pipeline.addStep(convertStep);
}
pipeline.addStep(generateStep);  // <-- Generates files here
// llmReviewStep added AFTER generateStep:
if (llmConfig && llmConfig.mode !== 'off') {
  const { llmReviewStep } = await import('../../pipeline/steps/llm-review.js');
  pipeline.addStep(llmReviewStep);  // <-- Too late, files already written
}
```

**Fix:** Move the LLM review step before `generateStep`:
```typescript
if (llmConfig && llmConfig.mode !== 'off') {
  const { llmReviewStep } = await import('../../pipeline/steps/llm-review.js');
  pipeline.addStep(llmReviewStep);
}
pipeline.addStep(generateStep);  // Now runs AFTER LLM review
```

## Warnings

### WR-01: Model name mismatch causes incorrect cost estimates

**File:** `src/llm/estimate.ts:3-8`
**Issue:** The `COST_PER_1M_INPUT` table uses abbreviated model name keys, but the actual default model names from `defaults.ts` are longer variants:

```typescript
// In estimate.ts:
const COST_PER_1M_INPUT: Record<string, number> = {
  'gpt-4o-mini': 0.15,
  'gpt-4o': 2.50,
  'claude-sonnet-4-7': 3.50,    // abbreviated
  'claude-haiku-4-5': 0.80,    // abbreviated
};

// But in defaults.ts:
model: 'claude-sonnet-4-7-20250514',  // full name, not in table
```

When `estimateCost()` is called with 'claude-sonnet-4-7-20250514', the lookup at line 14 (`COST_PER_1M_INPUT[model] ?? 0.15`) falls back to the default rate of $0.15/1M, which is ~23x cheaper than the actual Sonnet 4 rate of $3.50/1M.

**Fix:** Add full model names to the cost table, or use `startsWith()` matching:
```typescript
const rate = COST_PER_1M_INPUT[Object.keys(COST_PER_1M_INPUT).find(k => model.startsWith(k)) ?? ''] ?? 0.15;
```

### WR-02: `ctx.$` typed as `any` loses type safety

**File:** `src/types/pipeline.ts:16`
**Issue:** The `PipelineContext` interface has `$?: any;` which bypasses TypeScript's type checking. The `CheerioAPI` type should be used instead.

**Fix:**
```typescript
import type { CheerioAPI } from 'cheerio';
// ...
$?: CheerioAPI;
```

### WR-03: Anthropic response parsing is fragile

**File:** `src/llm/llm-review.ts:97-101`
**Issue:** The code assumes the Anthropic response has a `content` array and searches for the first text block by type. If the response structure is different or no text block is found, the error message is misleading:

```typescript
const textBlock = result.find((b: any) => b.type === 'text');
if (!textBlock) {
  throw new Error('No text block in Anthropic response');
}
return JSON.parse(textBlock.text) as ComponentReview;
```

**Fix:** Add defensive checks and better error messages:
```typescript
if (!result || !Array.isArray(result)) {
  throw new Error(`Unexpected Anthropic response type: ${typeof result}`);
}
const textBlock = result.find((b: any) => b.type === 'text');
if (!textBlock) {
  throw new Error(`No text block in Anthropic response. Content types: ${result.map((b: any) => b.type).join(', ')}`);
}
```

### WR-04: `_fallback` property not in `ComponentReview` type definition

**File:** `src/llm/llm-review.ts:131-137`
**Issue:** The `ComponentReview` type (from `structured/review.ts`) does not include a `_fallback` property, but it's added at line 137 when creating the fallback object. This creates a type inconsistency:

```typescript
return {
  approved: false,
  boundary_changes: [],
  naming_suggestions: [],
  cleanup_hints: [],
  _fallback: true,  // <-- Not in ComponentReview type
} as ComponentReview & { _fallback: boolean };
```

**Fix:** Either add `_fallback?: boolean` to `ComponentReviewSchema` in `structured/review.ts`, or define a separate `FallbackReviewResult` type.

### WR-05: `zodOutputFormat` cast with `as any` bypasses type safety

**File:** `src/llm/llm-review.ts:88`
**Issue:** The `zodOutputFormat` helper is called with `as any` on the schema, which defeats the purpose of using Zod for type safety:

```typescript
format: zodOutputFormat(ComponentReviewSchema as any),
```

**Fix:** Pass the schema directly without the `as any` cast. If there's a type incompatibility, it should be fixed at the type level rather than suppressed.

### WR-06: Mixed Chinese/English in console output

**File:** `src/llm/estimate.ts:27`
**Issue:** The string contains Chinese characters ("估算") mixed with English in an otherwise English codebase:

```typescript
console.warn(`[llm] ~${tokens} tokens (~$估算: ${total.toFixed(4)}) -- calling ${model}`);
```

**Fix:** Use English only:
```typescript
console.warn(`[llm] ~${tokens} tokens (~$est: ${total.toFixed(4)}) -- calling ${model}`);
```

## Info

### IN-01: Unused variable `flatList`

**File:** `src/engine/splitter/index.ts:114`
**Issue:** `flatList` is assigned from `flattenTree(root)` but never used. The only usage of `flattenTree` result is `showComponentTree(root)` which uses `root` directly:

```typescript
const flatList = flattenTree(root);  // <-- assigned but never used
showComponentTree(root);
```

**Fix:** Either use `flatList` or remove the assignment:
```typescript
showComponentTree(root);
```

### IN-02: Commented code for future CLI flag

**File:** `src/cli/commands/convert.ts:46-48`
**Issue:** There's a comment indicating planned but unimplemented functionality:

```typescript
// Note: If --css-mode CLI flag is added in future, update to:
// cssMode: options.cssMode ?? configFile.cssMode ?? DEFAULT_OPTIONS.cssMode
```

**Fix:** Either implement the `--css-mode` flag or track this as a formal TODO/issue rather than leaving commented code.

---

_Reviewed: 2026-05-21T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
