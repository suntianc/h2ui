---
phase: 05.1-llm-html-fidelity-validation
reviewed: 2026-05-22T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - src/cli/index.ts
  - src/cli/commands/convert.ts
  - src/llm/structured/fidelity.ts
  - src/llm/llm-fidelity.ts
  - src/pipeline/steps/llm-fidelity.ts
  - src/pipeline/steps/llm-review.ts
  - src/pipeline/steps/llm-modify.ts
  - src/types/pipeline.ts
  - src/types/config.ts
  - src/llm/llm-review.ts
  - src/llm/llm-modify.ts
findings:
  critical: 1
  warning: 4
  info: 1
  total: 6
status: issues_found
---

# Phase 05.1: Code Review Report

**Reviewed:** 2026-05-22
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Phase 05.1 introduces a unified `llmFidelityStep` combining review, modify, and fidelity validation. The implementation is largely sound with proper error handling (D-11 graceful degradation) and security validation via `validateBeforeWrite`. However, there is a significant type mismatch in the CLI-to-pipeline interface for the LLM config, and several inconsistencies between the new unified step and the deprecated steps that remain in the codebase.

---

## Critical Issues

### CR-01: Type Mismatch in CLI LLM Config Flow

**File:** `src/cli/commands/convert.ts:50-59`
**Issue:** The CLI `--llm` flag is typed as `string` (line 25: `options.llm?: string`) but `ConvertOptions.llm` expects `LLMConfig | undefined`. While the code correctly treats `options.llm` as a string at line 51 (`options.llm !== 'off'`), the type annotation creates a latent type error. If someone calls `convertCommand` programmatically with `options.llm` set to an object (matching the `LLMConfig` type), the comparison `options.llm !== 'off'` would always be true, bypassing the intended logic.

**Fix:**
```typescript
// Line 25: Change options type to match ConvertOptions
action(async (file: string, options: { out?: string; type?: string; strict?: boolean; split?: boolean; llm?: string; llmConfig?: LLMConfig }) => {

// Line 50-59: Use llmConfig if provided, otherwise use string flag
let llmConfig: LLMConfig | undefined;
if (options.llmConfig) {
  llmConfig = options.llmConfig;
} else if (options.llm !== 'off') {
  llmConfig = {
    provider: (configFile.llm?.provider ?? DEFAULT_LLM_CONFIG.provider) as LLMConfig['provider'],
    model: configFile.llm?.model ?? DEFAULT_LLM_CONFIG.model,
    mode: configFile.llm?.mode ?? 'auto',
    baseURL: configFile.llm?.baseURL,
    apiKey: configFile.llm?.apiKey,
  };
}
```

---

## Warnings

### WR-01: Overly Broad Template Injection Detection

**File:** `src/llm/llm-fidelity.ts:198` and `src/llm/llm-modify.ts:170`
**Issue:** The regex pattern `` /\`.*\$\{.*\}\`/ `` for detecting template injection is overly broad and will flag legitimate template literals like `` `hello ${name}` `` as "dangerous." While `transpileModule` is the primary safeguard (syntax validation), this pattern can cause valid React components using template literals to be incorrectly skipped.

**Fix:**
```typescript
// Remove template injection regex - transpileModule catches actual syntax issues
const dangerousPatterns = [
  { pattern: /\beval\s*\(/, name: 'eval()' },
  { pattern: /\bnew\s+Function\s*\(/, name: 'new Function()' },
  // Remove template pattern - too many false positives
];
```

### WR-02: Inconsistent Fallback Handling in Deprecated llm-modify Step

**File:** `src/pipeline/steps/llm-modify.ts:46-50`
**Issue:** When `runLLMModify` throws, `llmModifyStep` returns `newCtx` without setting `_fallback: true` or adding a warning. This is inconsistent with `llmFidelityStep` (line 74) and `llmReviewStep` (line 49) which both properly set `_fallback` and append a warning. Users have no indication that LLM modify failed when using the deprecated step.

**Fix:**
```typescript
// Line 46-50: Update error handling
} catch (err: any) {
  // D-11/D-12: graceful degradation
  console.warn(`[llm-modify] error: ${err.message}, falling back to rules-only`);
  return {
    ...newCtx,
    llmResult: { approved: false, _fallback: true } as PipelineContext['llmResult'],
    warnings: [...newCtx.warnings, `LLM modify failed: ${err.message}`],
  };
}
```

### WR-03: 'always' Mode Documented but Not Implemented

**File:** `src/types/config.ts:7` and `src/pipeline/steps/llm-fidelity.ts:17`
**Issue:** The `LLMConfig.mode` type allows `'always'` (line 7 of config.ts), and the CLI defaults to 'on'. However, `llmFidelityStep` and `llmReviewStep` only check for `mode === 'auto'` to skip when no relevant warnings exist. There is no handling for `mode === 'always'`, meaning 'always' behaves identically to 'auto'.

**Fix:**
```typescript
// Line 17-24: Add 'always' mode handling
if (llmConfig.mode === 'auto') {
  const hasRelevantWarnings = ctx.warnings.some(w =>
    w.includes('ambiguous') || w.includes('unknown-attribute')
  );
  if (!hasRelevantWarnings) {
    return newCtx;  // No relevant warnings, skip LLM
  }
}
// 'always' mode: always run LLM regardless of warnings
// No early return needed - proceed to LLM call
```

### WR-04: Duplicate Code Across LLM Services

**File:** `src/llm/llm-fidelity.ts`, `src/llm/llm-review.ts`, `src/llm/llm-modify.ts`
**Issue:** `stringifySafe` (identical implementation in all 3 files) and `translateLLMError` (identical implementation in all 3 files) are duplicated. These should be extracted to a shared utility module.

**Fix:**
Create `src/llm/shared.ts`:
```typescript
export function stringifySafe(obj: unknown): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return undefined;
      seen.add(value);
    }
    if (key === 'parent' || key === 'next' || key === 'prev') {
      return undefined;
    }
    return value;
  });
}

export function translateLLMError(err: any): string {
  const msg = err.message ?? String(err);
  if (msg.includes('apiKey') || msg.includes('API key') || msg.includes('Missing credentials')) {
    return '未配置 API key，请检查 .h2uirc 或环境变量';
  }
  // ... rest of implementation
}
```

---

## Info

### IN-01: Schema Requires fidelity_report but LLM May Not Return It

**File:** `src/llm/structured/fidelity.ts:29-39`
**Issue:** The `FidelityResultSchema` requires `fidelity_report` as a non-optional field. However, since this is a new LLM task, if the LLM returns a response without `fidelity_report`, parsing will fail. The current schema treats this as required, but it should potentially be optional to allow graceful degradation.

**Fix:** Consider making `fidelity_report` optional in the schema:
```typescript
fidelity_report: z.object({
  structure_match: z.boolean(),
  attribute_preservation: z.array(z.object({
    component: z.string(),
    missing_attributes: z.array(z.string()),
  })),
  text_content_match: z.boolean(),
  css_preservation: z.boolean(),
  fidelity_notes: z.array(z.string().max(200)),
}).optional(),  // Make optional for graceful degradation
```

---

## Structural Findings (fallow)

No structural pre-pass findings were provided.

---

_Reviewed: 2026-05-22_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
