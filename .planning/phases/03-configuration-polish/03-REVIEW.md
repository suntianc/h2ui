---
phase: 03-configuration-polish
reviewed: 2026-05-21T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - src/util/suggest.ts
  - src/cli/commands/convert.ts
  - src/cli/commands/init.ts
  - src/cli/index.ts
  - src/config/loader.ts
  - src/types/config.ts
  - src/types/pipeline.ts
  - src/config/defaults.ts
findings:
  critical: 0
  warning: 4
  info: 0
  total: 4
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-05-21
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Reviewed 8 source files in the configuration polish phase. No critical security vulnerabilities or data loss risks found. Four warnings were identified: one dead code issue, two error handling gaps, and one type system over-restriction.

## Warnings

### WR-01: Dead code in suggestSimilarFiles extension normalization

**File:** `src/util/suggest.ts:57`
**Issue:** Variable `normalizedExt` is computed but never used. The filter on lines 61-64 uses `ext` directly for comparison, making the normalization logic unreachable dead code.

**Fix:**
```typescript
// Line 57 computes normalizedExt but it's unused.
// The filter at line 61-64 uses:
//   entryExt === ext || entryExt === normalizedExt
// But normalizedExt is computed as:
//   ext === '.htm' ? '.html' : ext === '.html' ? '.htm' : ext
// This is dead code since the filter uses the original 'ext', not 'normalizedExt'.
// Either remove lines 56-57, or fix the filter to actually use normalizedExt.
```

### WR-02: Unhandled file write error in initCommand

**File:** `src/cli/commands/init.ts:21`
**Issue:** `fs.writeFileSync` is called without try-catch or error handling. If the write fails (e.g., EACCES permission denied, ENOSPC disk full, EEXIST directory does not exist), the error propagates as an unhandled exception.

**Fix:**
```typescript
// Add error handling:
try {
  fs.writeFileSync(configPath, config, 'utf-8');
  console.log(`\x1b[32m✓\x1b[0m Created .h2uirc`);
  console.log('  Edit this file to configure h2ui defaults.');
} catch (err) {
  console.error(`\x1b[31m✗\x1b[0m Failed to create .h2uirc: ${err}`);
  process.exit(1);
}
```

### WR-03: Overly restrictive cssMode type

**File:** `src/types/config.ts:6`, `src/config/defaults.ts:8`
**Issue:** `cssMode` is typed as literal `'module'` only. This hardcodes a single valid value, preventing future CSS mode extensions (e.g., `'scoped'`, `'inline'`, `'global'`). The type should be a union of known modes or a generic string if extensible.

**Fix:**
```typescript
// In src/types/config.ts, change:
cssMode?: 'module';

// To:
cssMode?: 'module' | 'scoped' | 'inline' | 'global';
// Or if extensible:
cssMode?: string;
```

### WR-04: Inconsistent configuration merge for cssMode

**File:** `src/cli/commands/convert.ts:37`
**Issue:** All other options follow the pattern `CLI flag > config file > defaults`, but `cssMode` only reads from `configFile.cssMode ?? DEFAULT_OPTIONS.cssMode`. Since the CLI has no `--css-mode` flag, this is internally consistent but creates an asymmetry in the merging logic.

**Fix:**
```typescript
// Line 37 currently:
cssMode: configFile.cssMode ?? DEFAULT_OPTIONS.cssMode,

// This is fine given no CLI flag exists, but if a --css-mode flag is added
// in the future, this line must be updated to follow the same pattern:
// cssMode: options.cssMode ?? configFile.cssMode ?? DEFAULT_OPTIONS.cssMode,
```

---

_Reviewed: 2026-05-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
