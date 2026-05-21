# Phase 3: Configuration + Polish - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Config file support (.h2uirc / package.json h2u field) with proper CLI-flag merging, and CLI DX improvements (progress spinners, enhanced error messages with suggestions, improved output formatting). Pure CLI infrastructure — no new conversion capabilities.

</domain>

<decisions>
## Implementation Decisions

### Config Loading Strategy
- **D-01:** Use `cosmiconfig` for standardized config discovery
  - Search order: `package.json` `"h2ui"` field → `.h2uirc` → `.h2uirc.json` → `.config/h2uirc`
  - Format: JSON only (keeps consistent with `h2ui init` output)
- **D-02:** Priority chain: CLI flags > config file > hardcoded defaults
  - CLI flags always win (standard POSIX behavior)
  - Config file merges on top of defaults
  - Missing config file is not an error — falls through to defaults
- **D-03:** Auto-create `.h2uirc` in CWD on first package.json-based discovery miss
  - Only if user explicitly runs `h2ui init` — no silent config creation

### Configurable Fields
- **D-04:** Extend `H2uiConfig` to include:
  - `out`: string (default: `./h2ui_output/`) — output directory
  - `typescript`: boolean (default: true) — output .tsx vs .jsx
  - `strict`: boolean (default: false) — promote warnings to errors
  - `split`: boolean (default: true) — enable component splitting (maps to `--no-split`)
  - `cssMode`: 'module' (default, only option for v1) — CSS output format
- **D-05:** `h2ui init` generates full config scaffold with all fields + inline comments
  - Example: `"split": true,  // Enable component splitting (use --no-split to disable)`
  - This helps users discover available options

### Spinner & Progress
- **D-06:** Use `ora` for CLI spinner during conversion
  - Spinner runs continuously during the full pipeline execution
  - Start spinner after file validation, before pipeline execution
  - Stop spinner on completion, replace with ✓/✗ status message
  - Supported on pipeline completion (all steps) — not per-step granularity
- **D-07:** Console output after spinner completion:
  ```
  ✓ Wrote 5 files to /output/path

  📦 App
  ├── Header
  ├── Navigation
  ├── Main
  └── Footer

  Warnings (1):
    ⚠ Unknown HTML attribute: unknown-attr
  ```

### Error Messages
- **D-08:** File not found → suggest similar files:
  ```
  ✗ File not found: nonexistent.html
    Did you mean: ./fixtures/simple.html?
  ```
- **D-09:** Invalid argument → hint `--help`:
  ```
  ✗ Missing required argument: <file>
    Run 'h2ui --help' for usage information.
  ```
- **D-10:** All error messages consistently formatted with hint/suggestion on second line
  - Keep existing color scheme (green ✓, red ✗, yellow ⚠)

### Config Format
- **D-11:** JSON only (cosmiconfig default). No YAML/TOML support for v1.
  - `.h2uirc` is JSON (matches existing `h2ui init` output)
  - `package.json` `"h2ui"` field is naturally JSON

### Output Formatting
- **D-12:** Keep existing ANSI color codes (green/red/yellow) — no need for chalk dependency
  - Phase 1 already chose ANSI escapes (D-04 allows spinners for progress)
  - `ora` handles spinner rendering natively
- **D-13:** Enhanced component tree preview: show file count summary before tree

### the agent's Discretion
- Exact spinner text and timing
- Similar file matching algorithm (fuzzy match vs prefix match)
- `h2ui init` config comment wording
- Cosmiconfig explorer configuration details (cache, transform, stopDir)
- Error hint/suggestion wording conventions
- Whether to show spinner per-pipeline-step or whole-pipeline

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Config & CLI Architecture
- `src/cli/commands/init.ts` — Current `h2ui init` implementation (will extend)
- `src/types/config.ts` — Current `H2uiConfig` interface (will extend)
- `src/config/defaults.ts` — Current default options (will extend)
- `src/cli/commands/convert.ts` — Current convert command (will add spinner + suggestions)
- `src/cli/output.ts` — Current output utilities (will add spinner integration)
- `src/cli/index.ts` — CLI entry point and command definitions

### Project Requirements
- `.planning/REQUIREMENTS.md` §CFG-01 — Configuration requirement
- `.planning/ROADMAP.md` §Phase 3 — Phase goal, success criteria, stack additions (chalk, ora, cosmiconfig)
- `.planning/PROJECT.md` — Project vision and constraints

### Prior Phase Context
- `.planning/phases/01-core-cli-jsx/01-CONTEXT.md` — D-01 (subcommand mode), D-03 (init command), D-04 (terminal output), D-19 (error/warning system)
- `.planning/phases/02-component-splitting-css/02-CONTEXT.md` — D-19~D-22 (pipeline steps), D-16~D-18 (tree display)

### Stack Reference
- `.planning/research/STACK.md` — Recommended stack (chalk, ora, cosmiconfig listed)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/cli/output.ts` — Existing showBanner/showSuccess/showError/showWarningSummary functions (ANSI-colored). Will add spinner wrapper.
- `src/cli/commands/init.ts` — Existing `h2ui init` generator. Will extend scaffold with all config fields + comments.
- `src/types/config.ts` — `H2uiConfig` interface. Will add `split` and `cssMode` fields.
- `src/config/defaults.ts` — `DEFAULT_OPTIONS`. Will extend with new defaults.
- `src/util/logger.ts` — Warning collector utility. Already integratable.

### Established Patterns
- CLI follows `src/cli/index.ts` → `commands/` subcommand dispatch pattern
- Config interfaces in `src/types/` following PascalCase naming
- ANSI escape codes used directly (no chalk) — ora will be first third-party output dependency

### Integration Points
- `src/cli/commands/convert.ts` — Pipeline orchestration. Spinner wraps pipeline execution.
- `src/cli/index.ts` — `h2ui init --help` output, `--version` banner. Config field additions.
- Cosmiconfig integration at CLI startup for config loading, passed to convert command.

</code_context>

<specifics>
## Specific Ideas

- "h2ui init should generate a config that documents itself" — full config scaffold with inline comments
- Error suggestions should feel like npm/pnpm: "Did you mean: ./fixtures/simple.html?" not "The file you specified was not found, perhaps you intended..."
- Spinner during conversion, then output summary + component tree below

</specifics>

<deferred>
## Deferred Ideas

- **Prettier config integration**: Letting users specify Prettier config path or options in h2uirc. Minor feature — can be added later without breaking changes.
- **Output template customization**: Customizing the success output format. Not requested.
- **YAML/TOML config support**: cosmiconfig supports it natively but JSON-only is sufficient for v1.
- **Config validation with error reporting**: Runtime config validation with descriptive error messages. If cosmiconfig's built-in validation is sufficient, that's fine; separate validation layer is deferred.

</deferred>

---

*Phase: 03-configuration-polish*
*Context gathered: 2026-05-21*