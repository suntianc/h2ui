---
phase: 03-configuration-polish
plan: 01
subsystem: config
tags: cosmiconfig, config-loading, CLI-merge

requires: []
provides:
  - cosmiconfig-based config loading with searchPlaces chain
  - CLI flags > config file > defaults merge priority
affects: []

tech-stack:
  added: [cosmiconfig]
  patterns: [CLI-config-file-merge-priority]

key-files:
  created: [src/config/loader.ts]
  modified: [src/types/config.ts, src/types/pipeline.ts, src/config/defaults.ts, src/cli/index.ts, src/cli/commands/convert.ts]

key-decisions:
  - "Use cosmiconfig with searchPlaces: package.json → .h2uirc → .h2uirc.json → .config/h2uirc → .config/h2uirc.json"
  - "CLI options use no .default() so undefined can be detected for correct merge priority"
  - "Undefined from config file vs CLI is distinguished via !== undefined check"

requirements-completed: [CFG-01, CFG-02]

duration: 10min
completed: 2026-05-21
---

# Phase 3 Plan 1: Config File Loading with cosmiconfig Summary

**Cosmiconfig-based config loading with properly layered merge priority (CLI flags > config file > defaults)**

## Performance

- **Duration:** 10 min
- **Started:** 2026-05-21T09:51:00Z
- **Completed:** 2026-05-21T10:01:00Z
- **Tasks:** 5
- **Files modified:** 8

## Accomplishments
- Extended H2uiConfig with split/cssMode fields
- Extended ConvertOptions with required split/cssMode fields
- Extended DEFAULT_OPTIONS with split: true, cssMode: 'module'
- Created src/config/loader.ts using cosmiconfig with full searchPlaces chain
- Modified CLI entry to call loadConfig() and pass configFile to convertCommand
- Removed .default() from commander options for correct undefined-detectable merge
- Implemented CLI flags > config file > defaults merge priority in convertCommand

## Task Commits

1. **Tasks 1.1-1.5: Config types, defaults, loader, CLI, merge** - `8afef2d` (feat)

## Files Created/Modified
- `src/types/config.ts` - Added split?: boolean, cssMode?: 'module'
- `src/types/pipeline.ts` - Added split: boolean, cssMode: 'module' (required)
- `src/config/defaults.ts` - Added split: true, cssMode: 'module'
- `src/config/loader.ts` (new) - cosmiconfig-based config loading
- `src/cli/index.ts` - loadConfig() call, pass configFile to convertCommand
- `src/cli/commands/convert.ts` - CLI > config > defaults merge logic

## Decisions Made
- Cosmiconfig searchPlaces includes package.json (h2ui key), .h2uirc, .h2uirc.json, .config/h2uirc, .config/h2uirc.json
- JSON-only loading (defaultLoaders['.json'] for noExt files)
- Missing config is not an error - falls through to empty object, defaults apply

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Cosmiconfig's default loader for extensionless files needed explicit config; fixed by specifying `loaders: { noExt: defaultLoaders['.json'] }`

## Next Phase Readiness
- Config loading foundation complete
- Init scaffold (Plan 02) and Spinner (Plan 03) can use config values

---
*Phase: 03-configuration-polish*
*Completed: 2026-05-21*