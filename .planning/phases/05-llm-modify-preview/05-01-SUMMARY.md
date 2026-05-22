---
phase: "05-llm-modify-preview"
plan: "01"
wave: 1
status: completed
files_created:
  - src/llm/structured/modify.ts
  - src/llm/llm-modify.ts
  - src/pipeline/steps/llm-modify.ts
---

# Wave 1 Summary

## Tasks Completed
- [Task 1] ComponentCodeSchema and runLLMModify service
- [Task 2] Guardrail validation (TypeScript transpile + dangerous patterns)
- [Task 3] llmModifyStep pipeline step

## Verification
- `npx tsc --project tsconfig.json --noEmit` passes for all new files

## Files Created

### src/llm/structured/modify.ts
- `ComponentCodeSchema` - Zod schema with `components[]` array (name, code, rationale)
- `ComponentCode` type exported

### src/llm/llm-modify.ts
- `buildModifySystemPrompt()` - Component modifier role per D-13~D-17 scope
- `buildModifyUserContent()` - Serializes componentTree + components as JSON
- `callOpenAI()` - Uses `client.chat.completions.parse()` with `zodResponseFormat`, max_tokens: 8192, temperature: 0.2
- `callAnthropic()` - Uses `client.messages.parse()` with `zodOutputFormat`, max_tokens: 8192
- `runLLMModify(componentTree, components, config)` - Provider dispatch with graceful degradation
- `validateBeforeWrite(code)` - Guards: TypeScript transpile check + dangerous patterns (eval, new Function, template injection)

### src/pipeline/steps/llm-modify.ts
- `llmModifyStep` - Pipeline step following llm-review pattern
- Skips when `llm.mode === 'off'`
- Validates each modified component before applying
- Graceful degradation on error (D-11/D-12)

## Key Design Decisions
1. Uses same provider factory pattern as llm-review (createOpenAIClient, createAnthropicClient)
2. Uses same error translation pattern (translateLLMError)
3. Uses same stringifySafe pattern for circular reference handling
4. validateBeforeWrite uses ts.transpileModule (not full type check) - catches syntax errors + dangerous patterns
5. Pipeline step name is 'llm-modify' (runs after 'llm-review' in pipeline order)
