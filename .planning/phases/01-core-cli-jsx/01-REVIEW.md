---
phase: 01-core-cli-jsx
reviewed: 2026-05-21T08:30:00Z
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
  - src/engine/css/extract.ts
  - src/engine/css/index.ts
  - src/engine/css/module.ts
  - src/engine/css/optimize.ts
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
  critical: 1
  warning: 4
  info: 2
  total: 7
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-05-21
**Depth:** standard
**Files Reviewed:** 34
**Status:** issues_found

## Summary

Reviewed 34 source files covering CLI commands, pipeline infrastructure, component splitting engine, CSS extraction/conversion, transform modules, type definitions, and tests. Found 1 critical correctness bug in shared CSS deduplication that silently drops styles, 4 warnings about code quality and potential issues, and 2 info items about dead code and incomplete tests.

Core pipeline logic is sound. Per-component JSX generation correctly uses CheerioAPI (the existing review's CR-01 about null being passed was incorrect based on current code at lines 202-207). CSS module class name bindings are consistent between generation and usage.

---

## Critical Issues

### CR-01: Shared CSS deduplication silently overwrites conflicting property values

**File:** `src/engine/css/module.ts:63-71`

```typescript
for (const [key, comps] of declFrequency) {
  if (comps.length >= 2) {
    const colonIdx = key.indexOf(':');
    const prop = key.slice(0, colonIdx);
    const value = key.slice(colonIdx + 1);
    sharedDeclarations[prop] = value;  // <-- OVERWRITES if same prop with different value
    sharedKeys.add(key);
  }
}
```

**Issue:** When two different CSS property values both appear in 2+ components (e.g., `color:red` in components A and B, AND `color:blue` in components C and D), BOTH pass the frequency check (`comps.length >= 2`), but `sharedDeclarations[prop] = value` silently overwrites. Only one value survives.

**Scenario:**
- Components A, B both have `color: red` (frequency 2)
- Components C, D both have `color: blue` (frequency 2)
- Both added to `sharedDeclarations` — `color` key gets `blue` (last writer wins)
- `color:red` is silently dropped from shared CSS but still in individual component CSS

**Fix:** Track all shared values per property:
```typescript
// Instead of sharedDeclarations: Record<string, string>
// Use: Array<{ prop: string; value: string; keys: string[] }>
// Or use a Map: Map<string, { value: string; keys: string[] }>
```

---

## Warnings

### WR-01: cleanProperties filters out intentional CSS values

**File:** `src/engine/css/optimize.ts:96`

```typescript
if (trimmed && trimmed !== 'initial' && trimmed !== 'inherit') {
  result[key] = trimmed;
}
```

**Issue:** Common CSS values like `'auto'` (for margins, `height: auto`), `'0'` (zero values), and `'normal'` (for `line-height: normal`, `font-weight: normal`) are filtered out if they appear in inline styles. These are often intentional values, not "unset" values.

**Fix:** Only filter truly empty strings:
```typescript
if (trimmed && trimmed !== '') {
  result[key] = trimmed;
}
```

---

### WR-02: Duplicate React imports in every generated component

**File:** `src/pipeline/steps/convert.ts:192-199`

```typescript
if (isTypescript) {
  lines.push('import React from \'react\';');
  lines.push('');
  lines.push('interface Props {');
  lines.push('  children?: React.ReactNode;');
  lines.push('}');
```

**Also affected:** `src/pipeline/steps/convert.ts:252-258` (generateRootComponent)

**Issue:** Every child component redundantly imports React. With React 17+ new JSX transform, this import is unnecessary. Bundlers deduplicate it, but it indicates the code doesn't account for modern React.

**Fix:** Remove React imports and rely on JSX transform, or add a comment explaining why it's needed for `React.ReactNode` type.

---

### WR-03: Dead code — unused helper functions in module.ts

**File:** `src/engine/css/module.ts:103-114`

```typescript
export function getCSSModuleImport(componentName: string, hasStyles: boolean): string {
  if (!hasStyles) return '';
  return `import styles from './${componentName}.module.css';\n`;
}

export function getClassNameBinding(componentName: string, hasStyles: boolean): string {
  if (!hasStyles) return '';
  const className = componentToClassName(componentName);
  return `className={styles.${className}}`;
}
```

**Issue:** These exported functions are never imported or called anywhere. Their logic is duplicated inline in `convert.ts`.

**Fix:** Either use these functions in `convert.ts` or remove them.

---

### WR-04: Test files contain only placeholder assertions

**Files:** `test/cli/cli.test.ts`, `test/engine/transform.test.ts`, `test/pipeline/pipeline.test.ts`, `test/pipeline/split-css.test.ts`

**Issue:** All test assertions are `expect(true).toBe(true)` — they validate nothing. Only `test/engine/splitter.test.ts` has real test logic.

**Fix:** Implement actual test assertions for each test case before shipping.

---

## Info

### IN-01: Duplicate flattenTree implementation

**File:** `src/engine/splitter/index.ts:77-83` and `src/pipeline/steps/convert.ts:158-160`

Both files contain identical `flattenTree` function. Extract to `src/util/` for DRY principle.

---

### IN-02: Comments indicate incomplete features

**File:** `test/pipeline/split-css.test.ts:5-6`
```typescript
it('detects semantic component boundaries', () => {
  // TODO: Add test after Plan 02
```

**Issue:** TODO comments indicate incomplete test coverage tied to future plans.

---

_Reviewed: 2026-05-21T08:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
