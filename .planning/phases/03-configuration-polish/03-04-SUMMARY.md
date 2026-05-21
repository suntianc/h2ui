---
phase: 03-configuration-polish
plan: 04
subsystem: cli
tags: error-handling, levenshtein, dx

requires:
  - phase: 03-01
    provides: config loading infrastructure
provides:
  - fuzzy file-not-found suggestions via Levenshtein distance
  - enhanced missing-argument hints
affects: []

tech-stack:
  added: []
  patterns: [fuzzy-error-suggestions, user-friendly-cli-errors]

key-files:
  created: [src/util/suggest.ts]
  modified: [src/cli/commands/convert.ts]

key-decisions: []

requirements-completed: []

duration: 5min
completed: 2026-05-21
---

# Phase 3 Plan 4: Enhanced Error Messages with Suggestions Summary

**Levenshtein-based 'Did you mean...' suggestions for file-not-found errors and --help hints for missing arguments**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-21T10:01:00Z
- **Completed:** 2026-05-21T10:06:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created src/util/suggest.ts with levenshtein() and suggestSimilarFiles() functions
- Enhanced file-not-found error to show "Did you mean: ./fixtures/simple.html?" when similar files exist
- Added "Run 'h2ui --help' for usage information" fallback when no similar files
- Enhanced missing argument check with --help hint (already done in Plan 01 merge)

## Task Commits

1. **Task 4.1: Create suggest utility** - `13f38e6` (feat)
2. **Task 4.2: Enhance error messages** - `13f38e6` (feat)

## Files Created/Modified
- `src/util/suggest.ts` (new) - levenshtein() and suggestSimilarFiles()
- `src/cli/commands/convert.ts` - Enhanced file-not-found error with suggestions

## Decisions Made
- Similarity threshold: score < basename.length * 0.6 (prevents wildly unrelated suggestions)
- Top 3 matches returned sorted by distance

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- None

## Next Phase Readiness
- DX polish for error messages complete
- Spinner enhancement (Plan 03) will use these improved errors

---
*Phase: 03-configuration-polish*
*Completed: 2026-05-21*