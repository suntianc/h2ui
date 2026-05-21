---
phase: "04-llm-integration"
plan: "02"
subsystem: llm-integration
tags: [llm, openai, anthropic, pipeline, zod, graceful-degradation]

# Dependency graph
requires:
  - phase: "04-01"
    provides: "SPL-06 heuristic rules, LLM config types/providers, tiktoken token estimation, Zod schemas"
provides:
  - "runLLMReview() service with provider dispatch (OpenAI/Anthropic/Ollama)"
  - "llmReviewStep pipeline step with D-10 mode checking (off/auto/always)"
  - "Graceful degradation: { approved: false, _fallback: true } on LLM errors per D-11"
affects: [llm-integration, 04-03]

# Tech tracking
tech-stack:
  added: []
  patterns: [LLM provider dispatch, structured output via zodResponseFormat/zodOutputFormat, graceful degradation]

key-files:
  created:
    - "src/llm/llm-review.ts - runLLMReview() with provider dispatch and graceful degradation"
    - "src/pipeline/steps/llm-review.ts - llmReviewStep pipeline wrapper"
  modified:
    - "src/types/pipeline.ts - added llm?: LLMConfig to ConvertOptions, llmResult to PipelineContext"

key-decisions:
  - "Direct SDK usage per D-01 (openai chat.completions.parse, anthropic messages.parse)"
  - "Provider dispatch: openai for 'openai'/'ollama', anthropic for 'anthropic'"
  - "Graceful degradation via try/catch returning _fallback: true per D-11"

patterns-established:
  - "Provider dispatch: callOpenAI() / callAnthropic() based on config.provider"
  - "Structured output: zodResponseFormat for OpenAI, zodOutputFormat for Anthropic"
  - "D-10 mode checking: off=skip, auto=trigger on warnings, always=run when configured"

requirements-completed: [LLM-01, LLM-02, LLM-03, LLM-04]

# Metrics
duration: ~5min
completed: 2026-05-21
---

# Phase 04 Plan 02: LLM Review Service and Pipeline Step Summary

**runLLMReview() service with OpenAI/Anthropic/Ollama dispatch, llmReviewStep pipeline wrapper with D-10 mode checking and D-11 graceful degradation**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-21T22:00:00Z
- **Completed:** 2026-05-21T22:05:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- runLLMReview() service implemented with provider dispatch (OpenAI/Anthropic/Ollama via baseURL)
- buildSystemPrompt() scoped to D-13~D-17 (proofreader role, no structural refactoring)
- callOpenAI() uses zodResponseFormat with gpt-4o-mini, max_tokens: 1024
- callAnthropic() uses zodOutputFormat with claude-sonnet, max_tokens: 1024
- displayCostWarning() called before LLM invocation per D-04
- llmReviewStep pipeline step with D-10 mode checking (off/auto/always)
- Graceful degradation: catches errors, returns { approved: false, _fallback: true } per D-11
- ConvertOptions extended with llm?: LLMConfig (auto-added missing field)
- PipelineContext extended with llmResult field per plan specification

## Task Commits

Each task was committed atomically:

1. **Task 1: runLLMReview service** - `cd04279` (feat)
2. **Task 2: llmReviewStep pipeline wrapper** - `02f5201` (feat)

## Files Created/Modified
- `src/llm/llm-review.ts` - Main LLM review service with provider dispatch
- `src/pipeline/steps/llm-review.ts` - PipelineStep wrapper for LLM review
- `src/types/pipeline.ts` - Added llm to ConvertOptions and llmResult to PipelineContext

## Decisions Made
- Direct SDK usage per D-01 (no abstraction layer)
- Provider dispatch based on config.provider field (openai default)
- Ollama handled via OpenAI client with baseURL per D-02
- Zod type incompatibility between Anthropic SDK's internal Zod and project Zod v3: cast with `as any` to resolve

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] ConvertOptions missing llm field**
- **Found during:** Task 2 (llmReviewStep pipeline implementation)
- **Issue:** Plan code accesses `ctx.options.llm` but ConvertOptions did not include llm field
- **Fix:** Added `llm?: LLMConfig` to ConvertOptions interface
- **Files modified:** src/types/pipeline.ts
- **Verification:** Build succeeds, type error resolved
- **Committed in:** 02f5201 (Task 2 commit)

**2. [Rule 3 - Blocking] Anthropic SDK Zod type incompatibility**
- **Found during:** Task 1 (runLLMReview implementation)
- **Issue:** `zodOutputFormat(ComponentReviewSchema)` failed TypeScript check - SDK's internal Zod v4 type incompatible with project's Zod v3 schema
- **Fix:** Cast schema with `as any` to bypass type incompatibility
- **Files modified:** src/llm/llm-review.ts
- **Verification:** Build succeeds with no errors
- **Committed in:** cd04279 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)
**Impact on plan:** Both auto-fixes necessary for compilation. No scope creep.

## Issues Encountered
None - all issues resolved via auto-fix during execution.

## User Setup Required

**API keys required for LLM usage:**
- `OPENAI_API_KEY` - From https://openai.ai/api-keys
- `ANTHROPIC_API_KEY` - From https://console.anthropic.com/settings/api-keys

## Next Phase Readiness
- LLM review service and pipeline step complete
- Ready for 04-03 (pipeline integration / actual LLM call wiring in convert command)
- llmResult type is in PipelineContext for downstream use

---
*Phase: 04-llm-integration*
*Plan: 02*
*Completed: 2026-05-21*
