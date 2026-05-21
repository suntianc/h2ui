---
phase: "04-llm-integration"
plan: "01"
subsystem: llm-integration
tags: [llm, openai, anthropic, tiktoken, zod, splitter]

# Dependency graph
requires:
  - phase: "03-configuration-polish"
    provides: "Cosmiconfig loading, error suggestions, ora spinners, init scaffold"
provides:
  - "SPL-06 heuristic rules: hasDistinctPattern() for non-semantic div splitting"
  - "LLMConfig interface with provider, model, mode, baseURL, apiKey"
  - "DEFAULT_LLM_CONFIG with provider=openai, model=gpt-4o-mini, mode=auto"
  - "createOpenAIClient() and createAnthropicClient() provider factories"
  - "estimateTokens() with tiktoken and proper WASM memory management"
  - "displayCostWarning() with Chinese warning format per D-04"
  - "ComponentReviewSchema, BoundaryChangeSchema, NamingSuggestionSchema"
affects: [llm-integration, 04-02, 04-03]

# Tech tracking
tech-stack:
  added: [openai@6.38.0, @anthropic-ai/sdk@0.97.1, zod@3.25.76, tiktoken@1.0.22]
  patterns: [LLM provider factory pattern, tiktoken WASM memory management, Zod schema validation]

key-files:
  created:
    - "src/llm/structured/tokens.ts - estimateTokens() with tiktoken"
    - "src/llm/estimate.ts - estimateCost(), displayCostWarning()"
    - "src/llm/structured/review.ts - Zod schemas for LLM structured output"
    - "src/llm/providers/openai.ts - createOpenAIClient() factory"
    - "src/llm/providers/anthropic.ts - createAnthropicClient() factory"
  modified:
    - "src/engine/splitter/semantic.ts - added hasDistinctPattern()"
    - "src/engine/splitter/index.ts - integrated hasDistinctPattern() into buildComponentTree"
    - "src/types/config.ts - added LLMConfig interface"
    - "src/config/defaults.ts - added DEFAULT_LLM_CONFIG"

key-decisions:
  - "Direct SDK usage per D-01 (openai, @anthropic-ai/sdk)"
  - "baseURL support in OpenAI client per D-02 (for Ollama compatibility)"
  - "tiktoken cl100k_base encoding via gpt-4o-mini model"
  - "Chinese warning format: ~{N} tokens (~$估算: ${cost}) -- calling {model}"

patterns-established:
  - "Provider factory: createOpenAIClient(config) / createAnthropicClient(config)"
  - "WASM memory safety: always call enc.free() in finally block"
  - "Zod schema validation for LLM structured output"

requirements-completed: [SPL-06, LLM-02, LLM-04]

# Metrics
duration: ~15min
completed: 2026-05-21
---

# Phase 04 Plan 01: LLM Integration Foundation Summary

**SPL-06 heuristic rules and LLM config types/providers installed with tiktoken token estimation and Zod schemas**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-05-21T13:30:00Z
- **Completed:** 2026-05-21T21:51:25Z
- **Tasks:** 4
- **Files modified:** 12

## Accomplishments
- SPL-06 heuristic: hasDistinctPattern() detects non-semantic divs with ID or 2+ classes as split points
- LLM config foundation: LLMConfig interface, DEFAULT_LLM_CONFIG, provider factories for OpenAI/Anthropic
- LLM packages installed: openai, @anthropic-ai/sdk, zod (3.x), tiktoken
- Token estimation with proper WASM memory management (enc.free() in finally)
- Zod schemas for component review, boundary changes, and naming suggestions

## Task Commits

Each task was committed atomically:

1. **Task 1: SPL-06 heuristic rules** - `0b8193d` (feat)
2. **Task 2: LLM config types and defaults** - `9341e5e` (feat)
3. **Task 3: Verify and install npm packages** - `64eb22e` (chore)
4. **Task 4: Token estimation and Zod schemas** - `70fe286` (feat)

## Files Created/Modified

- `src/engine/splitter/semantic.ts` - Added hasDistinctPattern() for non-semantic div detection
- `src/engine/splitter/index.ts` - Integrated hasDistinctPattern() into buildComponentTree
- `src/types/config.ts` - Added LLMConfig interface with provider, model, mode, baseURL, apiKey
- `src/config/defaults.ts` - Added DEFAULT_LLM_CONFIG with openai/gpt-4o-mini/auto
- `src/llm/providers/openai.ts` - createOpenAIClient() factory with baseURL support
- `src/llm/providers/anthropic.ts` - createAnthropicClient() factory
- `src/llm/structured/tokens.ts` - estimateTokens() using tiktoken with enc.free() cleanup
- `src/llm/estimate.ts` - estimateCost(), displayCostWarning() with Chinese format
- `src/llm/structured/review.ts` - ComponentReviewSchema, BoundaryChangeSchema, NamingSuggestionSchema
- `package.json` - Added openai, @anthropic-ai/sdk, zod, tiktoken dependencies
- `package-lock.json` - Package lock updated

## Decisions Made

- Direct SDK usage (openai, @anthropic-ai/sdk) per D-01 for better control
- baseURL support in OpenAI client for Ollama compatibility per D-02
- tiktoken encoding via gpt-4o-mini model (cl100k_base encoding)
- Chinese warning format "~{N} tokens (~$估算: ${cost})" per D-04
- zod pinned to ^3.23.8 (NOT v4) to avoid breaking changes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed tiktoken encoding_for_model type error**
- **Found during:** Task 4 (Token estimation implementation)
- **Issue:** `encoding_for_model('cl100k_base')` failed TypeScript type check - expected TiktokenModel, not encoding name
- **Fix:** Changed to `encoding_for_model('gpt-4o-mini')` which uses cl100k_base encoding
- **Files modified:** src/llm/structured/tokens.ts
- **Verification:** Build succeeds with no errors
- **Committed in:** 70fe286 (Task 4 commit)

---

**Total deviations:** 1 auto-fixed (blocking)
**Impact on plan:** Fixed TypeScript compilation error. No scope creep.

## Issues Encountered
None - plan executed as specified with one auto-fix for TypeScript type error.

## User Setup Required

**API keys required for LLM usage:**
- `OPENAI_API_KEY` - From https://openai.ai/api-keys
- `ANTHROPIC_API_KEY` - From https://console.anthropic.com/settings/api-keys

## Next Phase Readiness
- LLM integration foundation complete
- Provider factories ready for Task 04-02 (LLM client integration)
- Token estimation ready for cost warnings in Task 04-02
- Zod schemas ready for structured output validation

---
*Phase: 04-llm-integration*
*Plan: 01*
*Completed: 2026-05-21*
