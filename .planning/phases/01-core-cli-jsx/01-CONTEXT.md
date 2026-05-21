# Phase 1: Core CLI + HTML→JSX/TSX Pipeline - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the CLI tool foundation and HTML attribute-to-JSX conversion engine. Single HTML file input, single TSX/JSX file output. Component splitting and CSS extraction are Phase 2+.

</domain>

<decisions>
## Implementation Decisions

### CLI Structure & DX
- **D-01:** Subcommand mode (`h2ui convert <file>`, `h2ui init`, `--help`, `--version`)
- **D-02:** Default output directory is `./h2ui_output/` (relative to CWD), configurable via `--out`
- **D-03:** `h2ui init` command generates `.h2uirc` config scaffold
- **D-04:** Interactive terminal output (spinners, colored messages, progress)

### HTML Parsing
- **D-05:** Default lenient mode — best-effort parse, skip problematic nodes, emit warnings
- **D-06:** `--strict` flag promotes all warnings to errors (fails on any issue)
- **D-07:** Pure standard HTML5 only — no template syntax compatibility
- **D-08:** Complete HTML attribute → JSX attribute mapping (event handlers, SVG, boolean attrs, etc.)

### Attribute Mapping
- **D-09:** Custom mapping table (not a third-party library) — covers all standard HTML + SVG attributes
- **D-10:** Unknown attributes kept as-is with a warning (LLM integration in Phase 4 can handle these)
- **D-11:** Full attribute mapping from day one — not incremental

### Pipeline Architecture
- **D-12:** Sequential pipeline with steps: parse → convert → generate
- **D-13:** PipelineStep interface designed as a pluggable contract (`name`, `run(input, ctx)`)
- **D-14:** Immutable PipelineContext — each step returns a new context object
- **D-15:** Future plugin system will add `insertStep()` / `removeStep()` methods to Pipeline

### File Naming & Output
- **D-16:** Phase 1 outputs single file (component splitting deferred to Phase 2)
- **D-17:** Output filename derived from input filename, converted to PascalCase (`chat.html` → `Chat.tsx`)
- **D-18:** Default output is TypeScript `.tsx`; `--no-typescript` generates `.jsx`

### Error Handling
- **D-19:** Layered error/warning system — warnings don't block output, errors do
- **D-20:** `--strict` promotes all warnings to errors
- **D-21:** On errors, partial successfully-converted output is still written to disk
- **D-22:** Warnings collected and displayed as a summary after conversion completes

### the agent's Discretion
- Exact Prettier formatting config
- Error message wording and format
- Progress spinner implementation details
- Terminal color scheme

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Project vision, core value, constraints
- `.planning/REQUIREMENTS.md` — Full v1 requirements (Phase 1: CLI-01~06, JSX-01~11, CFG-02)
- `.planning/ROADMAP.md` §Phase 1 — Phase goal, success criteria, stack additions
- `.planning/research/STACK.md` — Recommended stack (Cheerio, commander, TypeScript, Prettier)
- `.planning/research/ARCHITECTURE.md` — Pipeline architecture, component structure
- `.planning/research/PITFALLS.md` — Critical pitfalls (attribute conversion, self-closing tags)

### Sample input
- `/Users/suntc/project/CDF/codex-onboarding.html` — Reference HTML that represents the standard of input expected (standard HTML5, semantic class naming, CSS variables, no template syntax)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing code — greenfield project

### Established Patterns
- No established patterns — Phase 1 establishes the foundation

### Integration Points
- Phase 2 (Component Splitting + CSS) builds on the pipeline infrastructure established here
- Phase 3 (Config + Polish) builds on the CLI structure established here

</code_context>

<specifics>
## Specific Ideas

- Reference HTML sample: `/Users/suntc/project/CDF/codex-onboarding.html` — a well-structured modern HTML5 page with CSS custom properties, semantic layout, and proper event handlers. The pipeline should handle this level of quality.
- Preview server (`h2ui preview`) noted for future consideration

</specifics>

<deferred>
## Deferred Ideas

- **Preview server**: `h2ui preview` command that starts a local dev server to preview generated components in the browser. New feature — outside Phase 1 scope.
- **Plugin system**: Fully formalized plugin system with lifecycle hooks. The pluggable PipelineStep interface (D-13) is the foundation, but the full plugin system is deferred to when multi-framework support is planned.

</deferred>

---

*Phase: 01-core-cli-jsx*
*Context gathered: 2026-05-21*