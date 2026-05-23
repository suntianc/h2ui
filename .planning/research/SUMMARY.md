# Project Research Summary: h2ui v1.1

**Project:** h2ui-cli
**Domain:** HTML-to-Component CLI Tool
**Researched:** 2026-05-23
**Overall confidence:** MEDIUM-HIGH

## Executive Summary

h2ui v1.1 introduces three new feature areas: batch glob processing for multi-file conversion, Vue 3 Single File Component (SFC) output, and a full autonomous agent with self-planning, tool-calling, verification, and self-repair capabilities. The existing pipeline architecture accommodates these via step insertion and conditional branching, with batch requiring only CLI-layer changes, Vue output requiring a new generator component, and the agent requiring a new orchestration layer that wraps the Pipeline.

Research recommends a build order of Batch → Vue → Agent, progressing from simplest to most complex with increasing dependencies. Critical risks include parallelization overhead causing resource exhaustion (bounded concurrency required), Vue template transformation limitations (HTML inline JS cannot auto-convert to Vue directives), and agent infinite loops consuming tokens indefinitely (mandatory iteration limits with strategy rotation).

## Key Findings

**Stack:** `fast-glob` ^3.3.3 for glob patterns, `@vue/compiler-sfc` ^3.5.34 for Vue SFC compilation, upgrade `@anthropic-ai/sdk` to ^0.98.0 for tool calling

**Architecture:** Batch: CLI-level looping over Pipeline.run() with no pipeline changes. Vue: Conditional branch in convertStep/generateStep based on `options.framework`. Agent: AgentOrchestrator wrapping Pipeline with plan→execute→verify→fix loop.

**Critical pitfall:** Parallelization overhead — bounded concurrency (p-limit 2-4), chunked processing, exponential backoff. Agent infinite loops — hard iteration limits (max 3), action history for strategy rotation. Vue template limitations — directive conversion layer needed, complex JS moved to script.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Batch Glob Processing
**Rationale:** Simplest feature, CLI-layer only, validates file enumeration before complex features
**Delivers:** `h2u "src/**/*.html"` batch conversion with error isolation
**Addresses:** Batch-01 through Batch-07 from FEATURES.md
**Avoids:** Pitfall 1 (parallelization exhaustion) by defaulting to sequential processing

### Phase 2: Vue 3 SFC Output
**Rationale:** Self-contained output format change, no pipeline modifications needed
**Delivers:** `.vue` single-file components with template/script/style blocks
**Addresses:** Vue-01 through Vue-07 from FEATURES.md
**Avoids:** Pitfall 4 (template vs script boundary) via directive translation layer

### Phase 3: Autonomous Agent
**Rationale:** Most complex, requires stable Pipeline execution first
**Delivers:** Self-repairing agent with tool calling and verification loops
**Addresses:** Agent-01 through Agent-10 from FEATURES.md
**Avoids:** Pitfalls 7-10 (infinite loops, token budget, incorrect self-correction, trust without verification)

**Phase ordering rationale:** Batch is CLI-only with no pipeline dependency. Vue is an output format variant that doesn't change pipeline behavior. Agent wraps the Pipeline and requires it to be stable first.

**Research flags for phases:**
- **Phase 3 (Agent):** Likely needs deeper research — tool calling SDK differences, verification completeness criteria
- **Phase 1 (Batch), Phase 2 (Vue):** Standard patterns, unlikely to need research-phase

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Established libraries, versions verified |
| Features | MEDIUM-HIGH | Established patterns, some agent nuances TBD |
| Architecture | MEDIUM | Patterns standard; implementation details need phase-specific research |
| Pitfalls | MEDIUM-HIGH | Vue 3 SFC spec from official docs; batch/agent from ecosystem patterns |

## Gaps to Address

- **Agent verification completeness:** How to measure "correct" output — need fidelity metrics
- **Vue reactivity extraction:** Conservative defaults with TODO markers vs aggressive auto-detection
- **Batch + Agent interaction:** Should agent repair apply per-file or across entire batch?

## Sources

### Primary (HIGH confidence)
- `@vue/compiler-sfc` official documentation — Vue 3 SFC structure
- `fast-glob` npm package — glob pattern implementation

### Secondary (MEDIUM confidence)
- Anthropic Claude agent patterns documentation
- Community best practices for autonomous LLM agents

---
*Research completed: 2026-05-23*
*Ready for roadmap: yes*
