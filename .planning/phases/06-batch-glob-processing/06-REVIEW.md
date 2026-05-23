---
phase: 06-batch-glob-processing
reviewed: 2026-05-23T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - src/cli/commands/batch.ts
  - src/cli/index.ts
findings:
  critical: 1
  warning: 2
  info: 1
  total: 4
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-05-23
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Reviewed `src/cli/commands/batch.ts` and `src/cli/index.ts`. Found 1 critical bug where the pipeline context is initialized with empty HTML content, which will cause batch processing to fail. Also found 2 warnings related to missing input validation and 1 info-level issue.

## Critical Issues

### CR-01: Pipeline context initialized with empty HTML causes batch processing to fail

**File:** `src/cli/commands/batch.ts:173-181`
**Issue:** In `runPipelineForBatch`, the pipeline context is initialized with `html: ''` and `code: undefined`:

```typescript
const ctx = await pipeline.run({
  html: '',
  filePath: inputPath,
  $: undefined,
  code: undefined,
  outputPath,
  warnings: [],
  errors: [],
  options: { ...mergedConfig, out: outputDir, llm: llmConfig },
});
```

The first step in the pipeline is `parseStep`, which expects `html` to contain actual HTML content from the input file. With empty `html`, the parse step will have nothing to process, causing the batch conversion to fail silently or produce empty results.

**Fix:**
```typescript
const html = await fs.promises.readFile(inputPath, 'utf-8');

const ctx = await pipeline.run({
  html,
  filePath: inputPath,
  $: undefined,
  code: undefined,
  outputPath,
  warnings: [],
  errors: [],
  options: { ...mergedConfig, out: outputDir, llm: llmConfig },
});
```

---

## Warnings

### WR-01: Missing concurrency value validation

**File:** `src/cli/index.ts:61`
**Issue:** The `--concurrency` option uses `parseInt` without validation:

```typescript
.option('--concurrency <number>', 'parallel files (default: 1, max: 4)', parseInt, 1)
```

If a user passes an invalid value like `--concurrency abc`, `parseInt` returns `NaN`, which is then used in `Math.min(options.concurrency ?? 1, 4)` at line 54 of `batch.ts`. Since `NaN ?? 1` equals `NaN` (nullish coalescing does not affect `NaN`), concurrency becomes `NaN`, breaking the `pLimit` call.

**Fix:**
```typescript
.option('--concurrency <number>', 'parallel files (default: 1, max: 4)', (value) => {
  const num = parseInt(value, 10);
  return isNaN(num) ? 1 : num;
}, 1)
```

### WR-02: Error type too broad

**File:** `src/cli/commands/batch.ts:81`
**Issue:** Using `err: any` loses type safety. Should properly type the error.

**Fix:**
```typescript
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  failures.push({
    file,
    error: message,
    suggestion: 'Check the file format and try again',
  });
}
```

---

## Info

### IN-01: Import type used in batch.ts

**File:** `src/cli/commands/batch.ts:1`
**Issue:** `import fs from 'node:fs'` imports the entire module at runtime, but only `fs.promises` is used (line 137 and 173 in `runPipelineForBatch`). Consider importing only what is used.

**Fix:**
```typescript
import { promises as fs } from 'node:fs';
```

---

_Reviewed: 2026-05-23_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
