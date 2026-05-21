---
status: testing
phase: 04-llm-integration
source:
  - .planning/phases/04-llm-integration/04-01-SUMMARY.md
  - .planning/phases/04-llm-integration/04-02-SUMMARY.md
  - .planning/phases/04-llm-integration/04-03-SUMMARY.md
started: 2026-05-21T23:20:00Z
updated: 2026-05-21T23:20:00Z
---

## Current Test

number: 1
name: LLM flag triggers review and shows suggestions
expected: |
  Running `h2ui convert <file> --llm` should:
  1. Display "~N tokens (~$est: $cost) -- calling {model}" before LLM call
  2. Show LLM naming suggestions after conversion
  3. Show cleanup hints if LLM provides any
  4. Fall back gracefully if LLM is unavailable (shows rules-only output)
awaiting: user response

## Tests

### 1. LLM flag triggers review and shows suggestions
expected: |
  Running `h2ui convert <file> --llm` should:
  1. Display "~N tokens (~$est: $cost) -- calling {model}" before LLM call
  2. Show LLM naming suggestions after conversion
  3. Show cleanup hints if LLM provides any
  4. Fall back gracefully if LLM is unavailable (shows rules-only output)
result: pending

### 2. Token estimate and cost warning displays before LLM call
expected: |
  When --llm flag is used, user sees token estimate and cost warning
  in format: "~{N} tokens (~$est: ${cost}) -- calling {model}"
result: pending

### 3. LLM mode configuration (off/auto/always)
expected: |
  --llm-mode off: LLM never runs even if --llm provided
  --llm-mode auto: LLM runs only when warnings exist
  --llm-mode always: LLM always runs when configured
  Running `h2ui convert <file> --llm --llm-mode auto` respects the mode
result: pending

### 4. Graceful degradation on LLM failure
expected: |
  When LLM API fails (no API key, network error, etc.),
  the tool continues with rules-only output and displays a warning
  instead of crashing or stopping the conversion
result: pending

### 5. SPL-06 non-semantic div splitting
expected: |
  HTML with non-semantic divs that have distinct class/ID patterns
  (e.g., <div class="card">, <div id="sidebar">) should be split
  into separate components by the rules engine
result: pending

### 6. Repeated pattern detection warning
expected: |
  When repeated patterns are found (e.g., identical cards appearing 2x),
  the tool warns about them and marks components as reused
result: pending

### 7. LLM provider configuration
expected: |
  --llm-provider openai|anthropic|ollama selects the LLM provider
  Provider is visible in the cost warning output
result: pending

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0

## Gaps

[none yet]
