---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Batch + Vue3 + Agent
status: planning
last_updated: "2026-05-23"
last_activity: 2026-05-23
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Roadmap: h2ui v1.1

**Milestone:** v1.1
**Status:** Planning
**Started:** 2026-05-23
**Previous milestone:** v1.0 (Phase 1-05.1)

## Overview

v1.1 delivers three major feature areas:
1. **Batch Glob Processing** — Multi-file conversion with `h2u "src/**/*.html"`
2. **Vue 3 + TypeScript Output** — `.vue` single-file component generation
3. **Full Autonomous Agent** — Self-planning, tool-calling, verification and repair

## Phases

- [x] **Phase 6: Batch Glob Processing** — Process multiple HTML files with glob patterns and error isolation (completed 2026-05-23)
- [ ] **Phase 7: Vue 3 SFC Output** — Generate `.vue` single-file components with template/script/style blocks
- [ ] **Phase 8: Autonomous Agent** — Self-repairing agent with tool calling and verification loops

## Phase Details

### Phase 6: Batch Glob Processing

**Goal:** User can process multiple HTML files in one command with glob patterns and error isolation

**Depends on:** Phase 5.01 (v1.0 completion)

**Requirements:** BATCH-01, BATCH-02, BATCH-03, BATCH-04, BATCH-05, BATCH-06, BATCH-07

**Success Criteria** (what must be TRUE):
1. User can run `h2u "src/**/*.html"` and all matching files are processed
2. Files are processed sequentially by default without overwhelming API rate limits
3. User can specify `--concurrency 4` to process up to 4 files in parallel
4. If one file fails, the batch continues and reports failures at the end with error messages
5. Exit code is non-zero when any file fails, allowing CI/CD integration
6. Output directory structure mirrors source layout (`src/a/page.html` → `output/src/a/page/`)

**Plans:** 1/1 plans complete

Plans:
- [ ] 06-PLAN.md — Wave 1-3: Batch command with glob, concurrency, error isolation, mirroring

---

### Phase 7: Vue 3 SFC Output

**Goal:** User can generate Vue 3 single-file components with TypeScript support

**Depends on:** Phase 6

**Requirements:** VUE-01, VUE-02, VUE-03, VUE-04, VUE-05, VUE-06, VUE-07

**Success Criteria** (what must be TRUE):
1. User can specify `--framework vue3` and get `.vue` files instead of `.tsx`
2. Generated `.vue` files contain proper `<template>`, `<script setup lang="ts">`, and `<style scoped>` blocks
3. HTML attributes are correctly converted to Vue template syntax (`@click` for events, `for` for labels)
4. Inline styles are extracted to `<style scoped>` blocks with CSS Modules naming
5. Component splitting respects semantic boundaries (header, nav, section, footer, etc.)
6. Child components are imported using Vue's `import` statement

**Plans:** TBD

**UI hint:** yes

---

### Phase 8: Autonomous Agent

**Goal:** Agent can autonomously plan, execute, verify, and repair HTML conversions

**Depends on:** Phase 7

**Requirements:** AGENT-01, AGENT-02, AGENT-03, AGENT-04, AGENT-05, AGENT-06, AGENT-07, AGENT-08, AGENT-09, AGENT-10

**Success Criteria** (what must be TRUE):
1. User can enable agent mode with `--agent` flag
2. Agent declares its plan before executing conversion (`PLAN` phase output visible to user)
3. Agent can use tools: `read_file`, `write_file`, `run_pipeline`, `run_llm`, `verify_output`
4. Agent verifies output fidelity against original HTML and reports pass/fail
5. If verification fails, agent attempts repair with a different strategy (up to 3 attempts)
6. Agent tracks action history and avoids repeating failed strategies
7. Agent stops if token budget exceeds limit (e.g., 50k tokens) and reports budget exceeded
8. Agent reports a confidence score (0-100%) for each repaired component

**Plans:** TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 6. Batch Glob Processing | 1/1 | Complete    | 2026-05-23 |
| 7. Vue 3 SFC Output | 0/7 | Not started | - |
| 8. Autonomous Agent | 0/10 | Not started | - |

## Traceability

All v1.1 requirements mapped to phases:

| Requirement | Phase | Status |
|-------------|-------|--------|
| BATCH-01 | Phase 6 | Pending |
| BATCH-02 | Phase 6 | Pending |
| BATCH-03 | Phase 6 | Pending |
| BATCH-04 | Phase 6 | Pending |
| BATCH-05 | Phase 6 | Pending |
| BATCH-06 | Phase 6 | Pending |
| BATCH-07 | Phase 6 | Pending |
| VUE-01 | Phase 7 | Pending |
| VUE-02 | Phase 7 | Pending |
| VUE-03 | Phase 7 | Pending |
| VUE-04 | Phase 7 | Pending |
| VUE-05 | Phase 7 | Pending |
| VUE-06 | Phase 7 | Pending |
| VUE-07 | Phase 7 | Pending |
| AGENT-01 | Phase 8 | Pending |
| AGENT-02 | Phase 8 | Pending |
| AGENT-03 | Phase 8 | Pending |
| AGENT-04 | Phase 8 | Pending |
| AGENT-05 | Phase 8 | Pending |
| AGENT-06 | Phase 8 | Pending |
| AGENT-07 | Phase 8 | Pending |
| AGENT-08 | Phase 8 | Pending |
| AGENT-09 | Phase 8 | Pending |
| AGENT-10 | Phase 8 | Pending |

**Coverage:**
- v1.1 requirements: 24 total (7 + 7 + 10)
- Mapped to phases: 24
- Unmapped: 0 ✓

---

*Last updated: 2026-05-23*
