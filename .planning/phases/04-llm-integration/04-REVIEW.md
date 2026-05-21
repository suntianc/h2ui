---
phase: 04-llm-integration
reviewed: 2026-05-21T00:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - src/llm/structured/tokens.ts
  - src/llm/estimate.ts
  - src/llm/structured/review.ts
  - src/llm/providers/openai.ts
  - src/llm/providers/anthropic.ts
  - src/engine/splitter/semantic.ts
  - src/engine/splitter/index.ts
  - src/types/config.ts
  - src/config/defaults.ts
  - src/llm/llm-review.ts
  - src/pipeline/steps/llm-review.ts
  - src/types/pipeline.ts
  - src/cli/commands/convert.ts
findings:
  critical: 1
  warning: 2
  info: 1
  total: 4
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-05-21
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Reviewed all 13 files from the phase 4 implementation (LLM integration). Found 1 critical bug in token cost estimation due to model name mismatches, plus 2 warnings and 1 info item.

## Critical Issues

### CR-01: Model name mismatch causes incorrect cost estimation

**File:** `src/llm/estimate.ts:3-8`
**Issue:** The `COST_PER_1M_INPUT` map uses model name `'claude-sonnet-4-7'` (line 6), but `llm-review.ts` defaults to `'claude-sonnet-4-7-20250514'` (line 80). When `displayCostWarning` calls `estimateCost(tokens, model)`, the model string does not match any key in the cost map, so it falls back to `0.15` (the default rate) for all Claude Sonnet calls. The actual rate should be `$3.50 / 1M tokens`. This results in wildly incorrect cost estimates for users.

**Fix:**
```typescript
const COST_PER_1M_INPUT: Record<string, number> = {
  'gpt-4o-mini': 0.15,
  'gpt-4o': 2.50,
  'claude-sonnet-4-7': 3.50,
  'claude-sonnet-4-7-20250514': 3.50,  // Add full model name with date suffix
  'claude-haiku-4-5': 0.80,
  'claude-haiku-4-5-20250514': 0.80,   // Add full model name for haiku too
};
```

## Warnings

### WR-01: Fallback object in llm-review.ts step is missing `approved` field

**File:** `src/pipeline/steps/llm-review.ts:45`
**Issue:** The fallback `llmResult` object is missing the required `approved` field:
```typescript
llmResult: { approved: false, _fallback: true } as PipelineContext['llmResult'],
```
The `approved` field is missing from this object literal, even though it is required by `PipelineContext['llmResult']`. The cast `as PipelineContext['llmResult']` silences the TypeScript error but creates a runtime type mismatch.

**Fix:**
```typescript
llmResult: {
  approved: false,
  boundary_changes: [],
  naming_suggestions: [],
  cleanup_hints: [],
  _fallback: true,
} as PipelineContext['llmResult'],
```

### WR-02: `_fallback` property leaks into type system

**File:** `src/llm/llm-review.ts:137`, `src/pipeline/steps/llm-review.ts:45`
**Issue:** The `_fallback: boolean` property is used to track implementation state but is not part of the `ComponentReview` type (defined in `src/llm/structured/review.ts:15-20`). This creates a type inconsistency: the actual returned object has an extra property not reflected in the type. Additionally, `src/types/pipeline.ts:30-36` defines `llmResult` without any `_fallback` field, yet the code attempts to assign objects with this property.

The property is checked at `src/cli/commands/convert.ts:153` via `ctx.llmResult._fallback`, so removal would require updating that check.

**Fix:** Add `_fallback` to the `ComponentReview` type definition in `src/llm/structured/review.ts`:
```typescript
export const ComponentReviewSchema = z.object({
  approved: z.boolean(),
  boundary_changes: z.array(BoundaryChangeSchema),
  naming_suggestions: z.array(NamingSuggestionSchema),
  cleanup_hints: z.array(z.string().max(150)),
  _fallback: z.boolean().optional(),  // Track if this is a fallback response
});
```

## Info

### IN-01: Model default inconsistency between providers

**File:** `src/llm/llm-review.ts:50` vs `src/llm/llm-review.ts:80`
**Issue:** OpenAI defaults to `'gpt-4o-mini'` (line 50) while Anthropic defaults to `'claude-sonnet-4-7-20250514'` (line 80). These are different model tiers with significantly different costs and capabilities. This is not necessarily wrong, but could cause confusion when a user switches providers without changing the model. The `estimate.ts` cost table also lacks entries for the full Anthropic model names (with date suffixes).

**Fix:** Consider documenting this behavior, or add a comment in the code explaining why the defaults differ.

---

_Reviewed: 2026-05-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
