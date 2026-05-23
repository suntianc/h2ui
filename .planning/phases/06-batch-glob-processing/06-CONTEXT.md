# Phase 06: batch-glob-processing - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver batch processing capability: `h2u "src/**/*.html"` converts all matching HTML files with glob patterns, sequential by default, bounded concurrency (max 4 configurable via `--concurrency N`), per-file error isolation, and mirrored output directory structure.
</domain>

<decisions>
## Implementation Decisions

### Glob Library
- **D-01:** Use `fast-glob` for glob pattern matching — fastest, supports negation and brace expansion patterns

### Concurrency Model
- **D-02:** Default: sequential processing (no parallelism) to avoid API rate limits
- **D-03:** `--concurrency N` flag allows parallel processing of N files
- **D-04:** Upper bound is configurable, default max concurrent files = 4 (API rate protection)

### Error Handling & Reporting
- **D-05:** Individual file failures are isolated — batch continues processing remaining files
- **D-06:** Failed files are NOT written to output (only fully successful files produce output)
- **D-07:** Summary table at end of batch: filename | error message | retry suggestion
- **D-08:** Non-zero exit code if any file failed (CI/CD integration requirement)

### Output Structure
- **D-09:** Output directory structure mirrors source layout: `src/a/page.html` → `output/src/a/page/`
- **D-10:** Full path depth preserved (no path depth limit)
- **D-11:** Progress bar shows batch completion status (percentage + count)

### CLI API
- **D-12:** New `batch` subcommand or extend `convert` with glob pattern support (planner decides)
- **D-13:** Flag design: `--concurrency <number>` for parallelism control

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Implementation
- `src/cli/commands/convert.ts` — current single-file convert command; batch mode extends this
- `src/pipeline/index.ts` — Pipeline class; supports per-step processing
- `src/types/pipeline.ts` — PipelineContext type; understand how errors flow

### Project Decisions
- `.planning/PROJECT.md` — core value: "one command" conversion
- `.planning/STATE.md` — v1.0 decisions: graceful LLM degradation, no LLM caching
- `.planning/REQUIREMENTS.md` — BATCH-01 through BATCH-07 requirements

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Pipeline` class: can process files sequentially by adding steps
- `showError`, `showSuccess`, `showWarningSummary`: existing output formatting utilities
- `ora` spinner: already used in convert.ts for progress indication

### Established Patterns
- Single-file processing in `convertCommand`: error handling, config merging, pipeline construction
- Config merging: CLI flags > config file > defaults (established pattern to follow)

### Integration Points
- Batch mode should reuse convertCommand's pipeline construction logic
- Error handling in convertCommand should be extended for batch-level aggregation
- Config loader already handles `.h2uirc` — no changes needed for batch config
</code_context>

<specifics>
## Specific Ideas

- User runs: `h2u batch "src/**/*.html" --concurrency 4 --out ./output`
- Progress display: `[=======         ] 3/10 files processed (30%)`
- Failure summary at end:
  ```
  ┌──────────────┬─────────────────────────────┬──────────────┐
  │ File         │ Error                      │ Suggestion   │
  ├──────────────┼─────────────────────────────┼──────────────┤
  │ src/bad.html │ Failed to parse HTML: ...   │ Check file   │
  └──────────────┴─────────────────────────────┴──────────────┘
  ```
</specifics>

<deferred>
## Deferred Ideas

None — all batch scope items addressed in discussion.

</deferred>

---

*Phase: 06-batch-glob-processing*
*Context gathered: 2026-05-23*
