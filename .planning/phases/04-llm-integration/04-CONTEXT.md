# Phase 4: LLM Integration - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Optional LLM enhancement layer on top of Phase 1-3 output. Two concerns:
1. **SPL-06:** Non-semantic `<div>` splitting by class/ID (deferred from Phase 2)
2. **LLM pass:** Validate/enhance rules-based output, handle rules-cannot-identify cases

The tool works perfectly without LLM — no regression if LLM is absent or fails.

</domain>

<decisions>
## Implementation Decisions

### LLM Provider Interface
- **D-01:** Direct `openai` SDK — no abstraction layer
- **D-02:** Support custom config via `baseURL` (enables Ollama and other OpenAI-compatible APIs)
- **D-03:** All provider-specific config passed through `.h2uirc` / CLI flags

### Token & Cost
- **D-04:** Display-only warning: show token estimate and cost estimate before LLM call
- **D-05:** No blocking confirmation — always proceed after warning

### Caching
- **D-06:** No caching — each conversion triggers a fresh LLM call

### SPL-06 Integration (Rules-First)
- **D-07:** Rules engine first: heuristic detection of class/ID patterns in non-semantic divs
- **D-08:** LLM validates rules-split results: confirms/rejects component boundaries
- **D-09:** LLM handles rules-cannot-identify cases: tags the rules can't confidently classify

### LLM Trigger Mode
- **D-10:** Configurable via `llm.mode`: `"off"` | `"auto"` | `"always"`
  - `"off"`: pure rules, no LLM
  - `"auto"`: LLM activates when rules emit warnings (unknown attrs, ambiguous splits)
  - `"always"`: LLM always runs when configured

### LLM Failure Strategy
- **D-11:** On LLM error: explicit error message shown + fallback to rules-only output
- **D-12:** No blocking — graceful degradation

### LLM Scope (What LLM Provides)
- **D-13:** Verify rules-split component structure — confirm/reject boundaries
- **D-14:** Handle rules-uncategorizable tags — make boundary decisions rules can't
- **D-15:** Naming refinement for rules-split components
- **D-16:** Cleanup suggestions: dead code, redundant nesting, unclear class names
- **D-17:** NOT in scope: structural refactoring, pattern abstraction, code rewriting

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Project vision, core value, constraints
- `.planning/REQUIREMENTS.md` — v1 + v2 requirements; LLM-01~05, SPL-06 in scope
- `.planning/ROADMAP.md` §Phase 4 — Phase goal, success criteria, stack additions (openai, @anthropic-ai/sdk)

### Prior Phase Context
- `.planning/phases/01-core-cli-jsx/01-CONTEXT.md` — D-10 (unknown attrs deferred to LLM), D-12~D-15 (pipeline architecture), D-19~D-22 (error/warning system)
- `.planning/phases/02-component-splitting-css/02-CONTEXT.md` — D-01~D-03 (semantic split), D-19~D-22 (pipeline integration), SPL-06 deferred
- `.planning/phases/03-configuration-polish/03-CONTEXT.md` — D-01~D-03 (cosmiconfig config loading), D-06~D-10 (spinner/error DX)

### Code Integration Points
- `src/cli/commands/convert.ts` — Where LLM pass integrates into pipeline
- `src/config/defaults.ts` — Where LLM config defaults are defined
- `src/types/config.ts` — Where LLM config types are defined
- `src/engine/splitter/index.ts` — Phase 2 splitter; SPL-06 rules live here

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/engine/splitter/index.ts` — Existing splitter; SPL-06 rules extend this
- `src/pipeline/index.ts` — Pipeline runner; LLM pass is a new pipeline step
- `src/cli/output.ts` — Existing output utilities; reuse for LLM warnings/suggestions

### Established Patterns
- CLI: `src/cli/index.ts` → `commands/` subcommand dispatch
- Config: `cosmiconfig` loading, `.h2uirc` JSON format
- Pipeline: Step-based `PipelineStep` interface from Phase 1

### Integration Points
- LLM pass inserts after convert/generate in pipeline
- SPL-06 extends existing splitter with additional heuristic rules
- LLM config via existing config loading (`.h2uirc` fields)

</code_context>

<specifics>
## Specific Ideas

- "LLM is the proofreader for rules engine output" — rules do the mechanical work, LLM validates and handles edge cases
- Config for LLM should feel like other config: `llm: { provider: 'openai', mode: 'auto', model: 'gpt-4' }`
- baseURL trick for Ollama: `"baseURL": "http://localhost:11434/v1"` lets users self-host

</specifics>

<deferred>
## Deferred Ideas

### Browser Preview Server
- **POL-01:** Interactive preview of component tree in browser
- **Why deferred:** Outside Phase 4 scope; belongs in v2 polish

</deferred>

---

*Phase: 04-llm-integration*
*Context gathered: 2026-05-21*
