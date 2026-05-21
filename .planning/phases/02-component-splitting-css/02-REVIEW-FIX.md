---
phase: 02-component-splitting-css
fixed_at: 2026-05-21T00:00:00Z
review_path: .planning/phases/02-component-splitting-css/02-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-05-21T00:00:00Z
**Source review:** .planning/phases/02-component-splitting-css/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3
- Fixed: 3
- Skipped: 0

## Fixed Issues

### CR-01: package.json bin/main 配置指向不存在的文件

**Files modified:** `package.json`
**Status:** fixed

**Applied fix:**
- Changed `main` from `"dist/index.js"` to `"./dist/src/cli/index.js"`
- Changed `bin.h2ui` from `"./bin/h2ui.js"` to `"./dist/bin/h2ui.js"`

---

### WR-01: CSS shorthand fallback 值错误

**Files modified:** `src/engine/css/optimize.ts`
**Status:** fixed

**Applied fix:**
- Line 86: `valRight` fallback changed from `result[bottom]` to `result[left]`
- Line 88: `valLeft` fallback changed from `result[right] || result[bottom]` to `result[right]`

Now follows CSS shorthand opposite-side fallback semantics:
- `padding-right` 缺失时 fallback 到 `padding-left`，不是 `padding-bottom`
- `margin-right` 缺失时 fallback 到 `margin-left`，不是 `margin-bottom`

---

### WR-02: extractCssProperties 缺少 inheritable 属性过滤

**Files modified:** `src/pipeline/steps/convert.ts`
**Status:** fixed

**Applied fix:**
- Added import: `import { isInheritable } from '../../engine/css/extract.js';`
- Added filtering loop in `extractCssProperties` function to exclude inheritable CSS properties (font-size, color, font-family, etc.)

---

_Fixed: 2026-05-21T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
