---
phase: 07-vue-3-sfc-output
reviewed: 2026-05-24T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - test/vue.test.ts
  - test/fixtures/vue/index.html
  - src/types/pipeline.ts
  - src/types/config.ts
  - src/cli/index.ts
  - src/cli/commands/convert.ts
  - src/pipeline/steps/convert.ts
  - src/pipeline/steps/generate.ts
findings:
  critical: 2
  warning: 1
  info: 0
  total: 3
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-05-24
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Reviewed Vue 3 SFC output implementation. Three bugs found in `src/pipeline/steps/convert.ts` that would cause incorrect Vue template generation. The most severe issue is that all `className` attributes are silently dropped during conversion, and non-void HTML elements are incorrectly self-closed.

## Critical Issues

### CR-01: className attribute silently dropped in Vue templates

**File:** `src/pipeline/steps/convert.ts:38-39`
**Issue:** When converting JSX/HTML to Vue templates, `className` attributes are skipped but never converted to `class`. This means all class attributes are lost in Vue output.

```typescript
} else if (key === 'className') {
  // Skip for Vue — use class directly
}
```

React's `className="my-class"` should become Vue's `class="my-class"`, but the code skips this entirely without outputting the equivalent `class` attribute.

**Fix:**
```typescript
} else if (key === 'className') {
  attrStrings.push(`class="${value}"`);
}
```

---

### CR-02: Non-void elements incorrectly self-closed in Vue templates

**File:** `src/pipeline/steps/convert.ts:106-109`
**Issue:** The condition `if (isVoid || !hasNonEmptyChildren)` causes non-void elements without children (like `<span></span>` or `<div></div>`) to be rendered as self-closing (`<span />`, `<div />`). Only void elements (area, base, br, col, embed, hr, img, input, link, meta, param, source, track, wbr) may self-close in HTML/Vue templates.

```typescript
if (isVoid || !hasNonEmptyChildren) {
  // Self-closing void elements in Vue templates need proper handling
  // Use self-closing for void elements
  return `<${tagName}${attrStr} />`;
}
```

**Fix:**
```typescript
if (isVoid) {
  return `<${tagName}${attrStr} />`;
}
// Non-void elements without children should still have closing tags
if (!hasNonEmptyChildren) {
  return `<${tagName}${attrStr}></${tagName}>`;
}
```

---

## Warnings

### WR-01: Boolean attribute binding produces invalid Vue syntax

**File:** `src/pipeline/steps/convert.ts:35-37`
**Issue:** Boolean HTML attributes (disabled, checked, readonly, etc.) are converted to Vue bindings using the raw string value. When original HTML has `disabled="disabled"`, output is `:disabled="disabled"` which Vue interprets as binding to a non-existent variable named `disabled`, causing runtime errors.

```typescript
} else if (VUE_BOOLEAN_ATTRS.has(key)) {
  // disabled, checked, readonly -> :disabled, :checked, :readonly
  attrStrings.push(`:${key}="${value}"`);
}
```

For boolean attributes present in HTML, the output should be static (`disabled`) or bound to `true` (`:disabled="true"`), not to the attribute name string.

**Fix:**
```typescript
} else if (VUE_BOOLEAN_ATTRS.has(key)) {
  // For boolean attributes: if value is the same as key (e.g., disabled="disabled"),
  // treat as true; otherwise use the actual value
  if (value === key || value === '') {
    attrStrings.push(`${key}="${key}"`);
  } else {
    attrStrings.push(`:${key}="${value}"`);
  }
}
```

---

_Reviewed: 2026-05-24_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
