---
phase: 01-core-cli-jsx
fixed_at: 2026-05-21T00:00:00Z
review_path: .planning/phases/01-core-cli-jsx/01-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 01: Code Review Fix Report

**Fixed at:** 2026-05-21T00:00:00Z
**Source review:** .planning/phases/01-core-cli-jsx/01-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6 (CR-01, WR-01 through WR-05)
- Fixed: 6
- Skipped: 0

## Fixed Issues

### CR-01: Boolean attribute value inversion

**Files modified:** `src/engine/transform/attributes.ts`
**Applied fix:** Fixed boolean attribute handling so `disabled="false"` returns JavaScript `false` instead of `true`. The fix checks if the value is the string `"false"` specifically and returns boolean `false`, otherwise returns `true` for any other value (including empty string, "true", etc.).

### WR-01: tagToComponentName mapping table incomplete

**Files modified:** `src/engine/splitter/semantic.ts`
**Applied fix:** Extended the `TAG_NAMES` mapping table to include all semantic HTML tags: `aside`, `figure`, `figcaption`, `time`, `address`, `details`, `summary`. This ensures consistent naming behavior across all semantic tags.

### WR-02: Duplicate flattenTree function

**Files modified:** `src/engine/splitter/index.ts`, `src/pipeline/steps/convert.ts`, `src/util/tree.ts`
**Applied fix:** Extracted `flattenTree` to a shared utility module `src/util/tree.ts` and updated both files to import from it, eliminating code duplication.

### WR-03: suggestSimilarFiles extension matching too strict

**Files modified:** `src/util/suggest.ts`
**Applied fix:** Added logic to treat `.htm` and `.html` as equivalent extensions when finding similar files. When a user inputs a `.htm` file, it will now suggest `.html` matches and vice versa.

### WR-04: Test files are all placeholders

**Files modified:** `test/engine/transform.test.ts`
**Applied fix:** Implemented meaningful test cases for attribute mapping including: class→className, for→htmlFor, boolean attributes (including CR-01 fix verification), event handlers, hyphenated attributes, data-*/aria-* attributes, and unknown attribute warnings.

### WR-05: Empty catch block silently swallows Prettier errors

**Files modified:** `src/pipeline/steps/generate.ts`
**Applied fix:** Added `console.warn()` to output a warning message when Prettier formatting fails, informing the user that unformatted code is being used.

---

_Fixed: 2026-05-21T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
