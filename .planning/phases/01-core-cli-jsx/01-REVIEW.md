---
phase: 01-core-cli-jsx
reviewed: 2026-05-21T12:00:00Z
depth: standard
files_reviewed: 34
files_reviewed_list:
  - bin/h2ui.ts
  - package.json
  - src/cli/commands/convert.ts
  - src/cli/commands/init.ts
  - src/cli/index.ts
  - src/cli/output.ts
  - src/config/defaults.ts
  - src/engine/css/index.ts
  - src/engine/css/extract.ts
  - src/engine/css/optimize.ts
  - src/engine/css/module.ts
  - src/engine/css/style-tag.ts
  - src/engine/splitter/index.ts
  - src/engine/splitter/semantic.ts
  - src/engine/splitter/signature.ts
  - src/engine/transform/attributes.ts
  - src/engine/transform/elements.ts
  - src/engine/transform/style.ts
  - src/pipeline/index.ts
  - src/pipeline/steps/convert.ts
  - src/pipeline/steps/generate.ts
  - src/pipeline/steps/parse.ts
  - src/types/config.ts
  - src/types/pipeline.ts
  - src/util/file.ts
  - src/util/logger.ts
  - test/cli/cli.test.ts
  - test/engine/transform.test.ts
  - test/engine/splitter.test.ts
  - test/pipeline/pipeline.test.ts
  - test/pipeline/split-css.test.ts
  - tsconfig.json
  - vitest.config.ts
findings:
  critical: 3
  warning: 3
  info: 2
  total: 8
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-05-21
**Depth:** standard
**Files Reviewed:** 34
**Status:** issues_found

## Summary

Reviewed 34 source files including CLI commands, pipeline steps, engine modules (CSS, splitter, transform), type definitions, and test files. Found 3 critical blockers that cause incorrect or incomplete output, plus 3 warnings and 2 info items.

The most severe issue is that per-component JSX generation is completely broken - it outputs only placeholder content `<div>ComponentName content</div>` instead of actual rendered HTML.

---

## Critical Issues

### CR-01: Per-component JSX generation outputs only placeholders

**File:** `src/pipeline/steps/convert.ts:203-213`
**Issue:** The `generateComponentCode` function passes `null as any` as the CheerioAPI parameter to `generateJsxFromNode` and then discards the result, replacing it with a hardcoded placeholder `<div>${node.name} content</div>`. This means all per-component splitting produces meaningless output.

```typescript
const jsxContent = generateJsxFromNode(
  null as any,  // BUG: CheerioAPI is null
  node.element,
  warnings
);

// For now, just generate placeholders - the actual content rendering
// happens via the element tree during conversion
const innerContent = `<div>${node.name} content</div>`;
```

**Fix:**
```typescript
// Use the correct $ from ctx.$
// Note: Need to pass the CheerioAPI from PipelineContext
const jsxContent = generateJsxFromNode(
  $,
  node.element,
  warnings
);
const innerContent = jsxContent;
```

---

### CR-02: Root component ignores actual element content

**File:** `src/pipeline/steps/convert.ts:237-288`
**Issue:** `generateRootComponent` only renders child component tags but discards any actual content from the root element itself. If the root `<body>` has direct text content or non-semantic children, that content is lost.

```typescript
for (const child of root.children) {
  lines.push(`      <${child.name} />`);
}
lines.push('    </div>');
```

**Fix:** Need to also render the root's non-component content using `generateJsxFromNode` for any remaining children that aren't split into sub-components.

---

### CR-03: Incorrect CSS shorthand fallback chain

**File:** `src/engine/css/optimize.ts:70-72`
**Issue:** The fallback chain for building CSS shorthand values is incorrect. `valLeft` falls back to `result[right]` but should fall back to `result[bottom]` per CSS shorthand expansion rules.

```typescript
const valRight = result[right] || result[top] || '';
const valBottom = result[bottom] || result[top] || '';
const valLeft = result[left] || result[right] || result[top] || '';  // WRONG: should be bottom before right
```

**Fix:**
```typescript
const valRight = result[right] || result[top] || '';
const valBottom = result[bottom] || result[top] || '';
const valLeft = result[left] || result[bottom] || result[right] || result[top] || '';
```

---

## Warnings

### WR-01: Shorthand property creation with incompatible values

**File:** `src/engine/css/optimize.ts:68-82`
**Issue:** The code creates a shorthand property whenever ANY of its longhands are present, even if the values are incompatible (e.g., top=10px, bottom=20px, right unset). CSS shorthand expansion would not match this intent.

```typescript
if (hasTop || hasRight || hasBottom || hasLeft) {
  // Creates shorthand even with incompatible/missing values
  const shorthand = buildShorthand(valTop, valRight, valBottom, valLeft);
  result[rule.shorthand] = shorthand;
}
```

**Fix:** Only create shorthand if all four sides are present, or if creating it would not change the effective CSS.

---

### WR-02: Missing React import in generated component files

**File:** `src/pipeline/steps/convert.ts:191-195`
**Issue:** Generated components use `React.ReactNode` in the Props interface but do not import React.

```typescript
if (isTypescript) {
  lines.push('interface Props {');
  lines.push('  children?: React.ReactNode;');
```

**Fix:** Add `import React from 'react';` when TypeScript mode is enabled and children prop is used.

---

### WR-03: Potential runtime error - optional chaining needed

**File:** `src/engine/css/style-tag.ts:27`
**Issue:** `warnings.push()` is called inside `$('style').each()` but `warnings` is passed by value (string array). If the callback throws, warnings may not be properly accumulated.

```typescript
$('style').each((i, el) => {
  // ...
  warnings.push(`Extracted <style> tag ${i + 1} to ${name}.module.css`);
});
```

**Fix:** This is actually safe due to array reference semantics, but the callback should handle errors gracefully to avoid partial results.

---

## Info

### IN-01: Duplicate `flattenTree` implementation

**File:** `src/engine/splitter/index.ts:77-83` and `src/pipeline/steps/convert.ts:158-160`
**Issue:** The same `flattenTree` function is implemented twice in different files.

**Fix:** Extract to a shared utility in `src/util/` and import where needed.

---

### IN-02: Test files contain only placeholder assertions

**Files:** `test/cli/cli.test.ts`, `test/engine/transform.test.ts`, `test/pipeline/pipeline.test.ts`, `test/pipeline/split-css.test.ts`
**Issue:** All test assertions are `expect(true).toBe(true)` - they test nothing.

**Fix:** Implement actual test logic before shipping.

---

_Reviewed: 2026-05-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
