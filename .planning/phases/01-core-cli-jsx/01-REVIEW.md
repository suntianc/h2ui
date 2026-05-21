---
phase: 01-core-cli-jsx
reviewed: 2026-05-21T00:00:00Z
depth: standard
files_reviewed: 30
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
  critical: 3
  warning: 6
  info: 4
  total: 13
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-05-21
**Depth:** standard
**Files Reviewed:** 30
**Status:** issues_found

## Summary

Reviewed all source files for logic errors, security vulnerabilities, and code quality issues. Found multiple critical bugs in the component generation and CSS extraction logic. The splitter/convert pipeline produces placeholder content instead of actual rendered HTML, and CSS shorthand condensation produces incorrect CSS output.

## Critical Issues

### CR-01: Component generation produces placeholder content, not actual JSX

**File:** `src/pipeline/steps/convert.ts:201-215`
**Issue:** The `generateComponentCode` function does not generate real JSX from the element content. It:
1. Retrieves `__cheerioContext` from element (line 201) but immediately discards it
2. Passes `null as any` to `generateJsxFromNode` (line 205-210)
3. Uses hardcoded placeholder `<div>${node.name} content</div>` instead of actual content (line 215)

The entire element subtree is ignored; output components will have `<div>ComponentName content</div>` as their body regardless of actual HTML structure.

**Fix:**
```typescript
// Line 201-211: Use the actual Cheerio context properly
const $ = ctx.$;
if (!$) {
  throw new Error('Missing Cheerio context for component generation');
}

// Line 205-210: Actually call generateJsxFromNode with proper context
const jsxContent = generateJsxFromNode($, node.element, warnings);

// Line 215: Remove the placeholder
const innerContent = jsxContent;
```

### CR-02: Root component skips non-component children content

**File:** `src/pipeline/steps/convert.ts:239-292`
**Issue:** `generateRootComponent` only renders child component references (line 280-282):
```typescript
for (const child of root.children) {
  lines.push(`      <${child.name} />`);
}
```

But non-semantic children (like plain text, `<div>` wrappers, etc.) that were merged into the parent are **never rendered**. The content they contained is lost.

For example, if the original HTML was:
```html
<body>
  <header>Title</header>
  <div>Some intro text</div>
  <main>Content</main>
</body>
```

The `div` wrapper's "Some intro text" content is lost because `div` is not semantic so it gets merged into parent, but `generateRootComponent` only outputs `<Header />` and `<Main />` tags.

**Fix:**
```typescript
// In generateRootComponent, also render the root's text content
// by processing the root element's non-component children
const rootEl = ctx.componentTree.element;
const $ = ctx.$;

// Get direct text content and non-component elements
const rootChildren = $(rootEl).contents().toArray();
for (const child of rootChildren) {
  if (child.type === 'text') {
    const text = (child as Text).data?.trim();
    if (text) {
      lines.push(`      ${text}`);
    }
  } else if (child.type === 'tag') {
    const tagName = (child as Element).tagName.toLowerCase();
    // Only render if NOT a child component
    const isChildComponent = root.children.some(c => c.name.toLowerCase() === tagName);
    if (!isChildComponent) {
      const content = generateJsxFromNode($, child, warnings);
      if (content) {
        lines.push(`      ${content}`);
      }
    }
  }
}
```

### CR-03: condenseProperties produces invalid CSS shorthand values

**File:** `src/engine/css/optimize.ts:58-86`
**Issue:** When building shorthand values (line 69-72), the fallback chain produces incorrect CSS:

For `padding-top: 10px; padding-bottom: 20px` (no left/right):
- valTop = '10px'
- valRight = '' || '10px' = '10px'
- valBottom = '20px' || '10px' = '20px'
- valLeft = '' || '10px' || '' = '10px'

Then `buildShorthand('10px', '10px', '20px', '10px')` returns `'10px 10px 20px'`.

But CSS shorthand for 2 values should be `padding: 10px 20px` (vertical horizontal), NOT `10px 10px 20px`. The function incorrectly produces a 3-value shorthand when only 2 distinct values exist.

**Fix:**
```typescript
function buildShorthand(top: string, right: string, bottom: string, left: string): string {
  if (top === right && right === bottom && bottom === left) {
    return top;
  }
  if (top === bottom && right === left) {
    return `${top} ${right}`;
  }
  if (right === left) {
    return `${top} ${right} ${bottom}`;
  }
  return `${top} ${right} ${bottom} ${left}`;
}
```

## Warnings

### WR-01: Shared CSS deduplication silently overwrites conflicting property values

**File:** `src/engine/css/module.ts:63-81`
**Issue:** When two different CSS property values both appear in 2+ components (e.g., `color:red` in components A and B, AND `color:blue` in components C and D), BOTH pass the frequency check but `sharedDeclarations[prop] = value` silently overwrites. Only one value survives.

**Fix:** Track all shared values per property and detect conflicts properly before extracting to shared CSS.

### WR-02: SignatureConfig type imported but not exported from pipeline.ts

**File:** `src/engine/splitter/signature.ts:3`
**Issue:** `import type { SignatureConfig }` is present but `SignatureConfig` is not exported from `src/types/pipeline.ts`. This unused import should be removed.

**Fix:** Remove line 3 which imports non-existent `SignatureConfig` from pipeline.ts.

### WR-03: CONTAINER_TAGS defined but never used

**File:** `src/engine/splitter/semantic.ts:15-17`
**Issue:** `CONTAINER_TAGS` is defined but never used in the codebase. Either implement the intended functionality or remove dead code.

**Fix:** Either implement container tag handling in `buildComponentTree` or remove if truly unused.

### WR-04: Duplicate exclusion list hardcoded in two places

**File:** `src/engine/splitter/signature.ts:105-107` and `semantic.ts:65`
**Issue:** The same exclusion list `['container', 'wrapper', 'inner', 'content']` is hardcoded in both files. If the exclusion list changes in one place, it won't change in the other.

**Fix:** Export the exclusion set from `semantic.ts` and use it in `signature.ts`.

### WR-05: PipelineContext.$ typed as `any` loses type safety

**File:** `src/types/pipeline.ts:11`
**Issue:** `$?: any;` - The CheerioAPI type is replaced with `any`, defeating TypeScript's type checking throughout the pipeline.

**Fix:** Import CheerioAPI type and use it: `$?: CheerioAPI;`

### WR-06: init.ts lacks error handling for file write

**File:** `src/cli/commands/init.ts:18`
**Issue:** `fs.writeFileSync` can throw on permission errors or disk full. The error propagates as unhandled exception rather than user-friendly message.

**Fix:** Wrap in try-catch and show user-friendly error message.

## Info

### IN-01: Unused convertOptions property

**File:** `src/cli/commands/convert.ts:10-15`
**Issue:** `opts` sets `cssMode: 'module'` but `ConvertOptions` interface doesn't include `cssMode`. TypeScript would catch this if interfaces were complete.

### IN-02: Test files are stubs with no actual assertions

**File:** `test/cli/cli.test.ts`, `test/engine/transform.test.ts`, `test/pipeline/pipeline.test.ts`, `test/pipeline/split-css.test.ts`
**Issue:** All tests contain only `expect(true).toBe(true)` with no actual test logic. Only `test/engine/splitter.test.ts` has real test assertions.

### IN-03: Duplicate flattenTree implementation

**File:** `src/engine/splitter/index.ts:77-83` and `src/pipeline/steps/convert.ts:158-160`
**Issue:** Both files contain identical `flattenTree` function. Extract to shared utility.

### IN-04: cleanProperties preserves intentional values correctly

**File:** `src/engine/css/optimize.ts:96-100`
**Issue:** The comment and implementation are slightly misaligned - comment mentions preserving 'auto', '0', 'normal' but code only checks for empty string. Actually correct behavior but confusing comment.

---

_Reviewed: 2026-05-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
