# Phase 4: LLM Integration - Pattern Map

**Mapped:** 2026-05-21
**Files analyzed:** 22 (13 new, 9 modified)
**Analogs found:** 13 / 22

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/llm/providers/openai.ts` | provider factory | request-response | `src/config/loader.ts` | partial |
| `src/llm/providers/anthropic.ts` | provider factory | request-response | `src/llm/providers/openai.ts` | role-match |
| `src/llm/providers/ollama.ts` | provider factory | request-response | `src/llm/providers/openai.ts` | role-match |
| `src/llm/structured/review.ts` | types/schema | transform | `src/types/pipeline.ts` | role-match |
| `src/llm/structured/tokens.ts` | utility | transform | `src/util/tree.ts` | partial |
| `src/llm/estimate.ts` | service | batch | `src/engine/css/extract.ts` | partial |
| `src/llm/llm-review.ts` | service | request-response | `src/engine/splitter/index.ts` | role-match |
| `src/pipeline/steps/llm-review.ts` | controller | request-response | `src/pipeline/steps/convert.ts` | exact |
| `src/config/defaults.ts` (update) | config | file-I/O | `src/config/defaults.ts` | exact |
| `src/types/config.ts` (update) | types | transform | `src/types/config.ts` | exact |
| `src/cli/commands/convert.ts` (update) | controller | request-response | `src/cli/commands/convert.ts` | exact |
| `src/engine/splitter/index.ts` (update) | service | transform | `src/engine/splitter/index.ts` | exact |
| `src/engine/splitter/semantic.ts` (update) | service | transform | `src/engine/splitter/semantic.ts` | exact |
| `test/llm/*.test.ts` | test | batch | `test/engine/transform.test.ts` | role-match |

## Pattern Assignments

### `src/pipeline/steps/llm-review.ts` (pipeline step, request-response)

**Analog:** `src/pipeline/steps/convert.ts` (lines 324-393)

**PipelineStep interface pattern** (from `src/types/pipeline.ts` lines 26-29):
```typescript
export interface PipelineStep {
  name: string;
  run(ctx: PipelineContext): Promise<PipelineContext>;
}
```

**Pipeline step structure** (lines 324-328 of convert.ts):
```typescript
export const convertStep: PipelineStep = {
  name: 'convert',

  async run(ctx: PipelineContext): Promise<PipelineContext> {
    const newCtx = { ...ctx, warnings: [...ctx.warnings], errors: [...ctx.errors] };
    // ...
    return { ...newCtx, /* additional fields */ };
  },
};
```

**Apply to:** `src/pipeline/steps/llm-review.ts` — follow the same `PipelineStep` interface and pattern for `run()` method.

---

### `src/llm/providers/openai.ts` (provider factory, request-response)

**Analog:** `src/config/loader.ts` (lines 1-33)

**Factory pattern with config** (lines 9-20 of loader.ts):
```typescript
const explorer = cosmiconfig('h2ui', {
  searchPlaces: [
    'package.json',
    '.h2uirc',
    '.h2uirc.json',
    '.config/h2uirc',
    '.config/h2uirc.json',
  ],
  loaders: {
    noExt: defaultLoaders['.json'],
  },
});
```

**Factory function pattern:**
```typescript
export function createOpenAIClient(config: LLMConfig): OpenAI {
  return new OpenAI({
    apiKey: config.apiKey ?? process.env.OPENAI_API_KEY ?? 'ollama',
    baseURL: config.baseURL,
  });
}
```

**Apply to:** All provider factories in `src/llm/providers/`. Use D-01 (direct SDK, no abstraction) and D-02 (baseURL for Ollama).

---

### `src/llm/llm-review.ts` (service, request-response)

**Analog:** `src/engine/splitter/index.ts` (lines 75-131)

**Service with PipelineStep integration** (lines 75-81 of splitter/index.ts):
```typescript
export const splitStep: PipelineStep = {
  name: 'split',

  async run(ctx: PipelineContext): Promise<PipelineContext> {
    const newCtx = { ...ctx, warnings: [...ctx.warnings], errors: [...ctx.errors] };
    if (!ctx.$) {
      newCtx.errors.push('Cannot split: no parsed AST available');
      return newCtx;
    }
    try {
      // ... main logic
    } catch (err: any) {
      newCtx.errors.push(`Split error: ${err.message}`);
      return newCtx;
    }
  },
};
```

**Graceful degradation pattern** (D-11, D-12):
```typescript
try {
  const result = await runLLMReview(ctx.componentTree, ctx.options.llm);
  return { ...ctx, llmResult: result };
} catch (err: any) {
  console.warn(`[llm] error: ${err.message}, falling back to rules-only`);
  return { ...ctx, llmResult: { approved: false, _fallback: true } };
}
```

**Apply to:** `src/llm/llm-review.ts` — service layer that handles LLM API calls with graceful degradation.

---

### `src/llm/structured/review.ts` (types/schema, transform)

**Analog:** `src/types/pipeline.ts` (lines 1-54)

**Type definition pattern** (lines 1-7 of pipeline.ts):
```typescript
export interface ConvertOptions {
  out: string;
  typescript: boolean;
  strict: boolean;
  split: boolean;
  cssMode: 'module';
}
```

**ComponentNode pattern** (lines 32-40 of pipeline.ts):
```typescript
export interface ComponentNode {
  name: string;
  tag: string;
  element: import('domhandler').Element;
  children: ComponentNode[];
  isRepeated: boolean;
  repeatCount?: number;
  cssProperties: Record<string, string>;
}
```

**Zod schema pattern** (from AI-SPEC Section 4b):
```typescript
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

export const BoundaryChangeSchema = z.object({
  component_id: z.string(),
  action: z.enum(['confirm', 'reject', 'modify']),
  reason: z.string().max(200),
});

export const NamingSuggestionSchema = z.object({
  original: z.string(),
  suggested: z.string(),
  rationale: z.string().max(100),
});

export const ComponentReviewSchema = z.object({
  approved: z.boolean(),
  boundary_changes: z.array(BoundaryChangeSchema),
  naming_suggestions: z.array(NamingSuggestionSchema),
  cleanup_hints: z.array(z.string().max(150)),
});
```

**Apply to:** `src/llm/structured/review.ts` — define all Zod schemas for LLM structured output.

---

### `src/llm/estimate.ts` (service, batch/token calculation)

**Analog:** `src/engine/css/extract.ts`

**Service function pattern:**
```typescript
export function estimateTokens(text: string): number {
  const enc = encoding_for_model('cl100k_base');
  const count = enc.encode(text).length;
  enc.free(); // CRITICAL: must free encoder to avoid WASM memory leak
  return count;
}

export function displayCostWarning(inputText: string, model: string): void {
  const tokens = estimateTokens(inputText);
  const cost = estimateCost(tokens, model);
  console.warn(`[llm] ~${tokens} tokens (~$估算: ${cost.toFixed(4)}) -- calling ${model}`);
}
```

**Apply to:** `src/llm/estimate.ts` — D-04 display-only warning, D-05 no blocking.

---

### `src/config/defaults.ts` (update existing, config)

**Analog:** `src/config/defaults.ts` (existing)

**Default config pattern** (lines 1-8):
```typescript
import type { ConvertOptions } from '../types/pipeline.js';

export const DEFAULT_OPTIONS: ConvertOptions = {
  out: './h2ui_output/',
  typescript: true,
  strict: false,
  split: true,
  cssMode: 'module',
};
```

**Add LLM defaults:**
```typescript
export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  mode: 'auto', // D-10: 'off' | 'auto' | 'always'
  baseURL: undefined,
  apiKey: undefined,
};
```

**Apply to:** Update `src/config/defaults.ts` — add `DEFAULT_LLM_CONFIG` following existing pattern.

---

### `src/types/config.ts` (update existing, types)

**Analog:** `src/types/config.ts` (existing)

**Existing pattern** (lines 1-8):
```typescript
export interface H2uiConfig {
  out?: string;
  typescript?: boolean;
  strict?: boolean;
  split?: boolean;
  cssMode?: 'module';
}
```

**Add LLM types:**
```typescript
export interface LLMConfig {
  provider?: 'openai' | 'anthropic' | 'ollama';
  model?: string;
  mode?: 'off' | 'auto' | 'always';
  baseURL?: string;
  apiKey?: string;
}

export interface H2uiConfig {
  // ... existing fields
  llm?: LLMConfig;
}
```

**Apply to:** Update `src/types/config.ts` — add `LLMConfig` interface and `llm` field to `H2uiConfig`.

---

### `src/cli/commands/convert.ts` (update existing, controller)

**Analog:** `src/cli/commands/convert.ts` (existing)

**Pipeline building pattern** (lines 53-67):
```typescript
const pipeline = new Pipeline();
pipeline.addStep(parseStep);

if (mergedConfig.split !== false) {
  const { splitStep } = await import('../../engine/splitter/index.js');
  const { cssStep } = await import('../../engine/css/index.js');
  pipeline.addStep(splitStep);
  pipeline.addStep(convertStep);
  pipeline.addStep(cssStep);
} else {
  pipeline.addStep(convertStep);
}

pipeline.addStep(generateStep);
```

**Config merge pattern** (lines 32-38):
```typescript
const mergedConfig: ConvertOptions = {
  out: options.out ?? configFile.out ?? DEFAULT_OPTIONS.out,
  typescript: options.typescript !== undefined ? options.typescript : (configFile.typescript ?? DEFAULT_OPTIONS.typescript),
  // ...
};
```

**Apply to:** Update `src/cli/commands/convert.ts` — add LLM step after `generateStep` per D-10 `llm.mode` configuration.

---

### `src/engine/splitter/index.ts` (update existing, service)

**Analog:** `src/engine/splitter/index.ts` (existing)

**Existing pattern** (lines 75-131):
```typescript
export const splitStep: PipelineStep = {
  name: 'split',

  async run(ctx: PipelineContext): Promise<PipelineContext> {
    const newCtx = { ...ctx, warnings: [...ctx.warnings], errors: [...ctx.errors] };
    if (!ctx.$) {
      newCtx.errors.push('Cannot split: no parsed AST available');
      return newCtx;
    }
    try {
      // ... SPL-06 extension: heuristic class/ID detection for non-semantic divs
    } catch (err: any) {
      newCtx.errors.push(`Split error: ${err.message}`);
      return newCtx;
    }
  },
};
```

**Apply to:** SPL-06 extends `buildComponentTree()` function with additional heuristic rules for non-semantic divs that have distinct class/ID patterns.

---

### `src/engine/splitter/semantic.ts` (update existing, service)

**Analog:** `src/engine/splitter/semantic.ts` (existing)

**Existing utility functions** (lines 1-77):
```typescript
const SEMANTIC_TAGS = new Set([...]);
const CONTAINER_TAGS = new Set([...]);

export function tagToComponentName(tag: string, classes: string[]): string { ... }
export function isSemanticTag(el: Element): boolean { ... }
export function getMeaningfulClasses($: CheerioAPI, el: Element): string[] { ... }
```

**SPL-06 additions** (D-07):
```typescript
// New utility: check if a div has "distinct" class/ID patterns
export function hasDistinctPattern($: CheerioAPI, el: Element): boolean {
  const id = $(el).attr('id');
  const classes = getMeaningfulClasses($, el);
  // Split if: ID present OR 2+ meaningful class tokens
  return !!id || classes.length >= 2;
}
```

**Apply to:** Update `src/engine/splitter/semantic.ts` — add SPL-06 heuristic functions.

---

## Shared Patterns

### PipelineStep Interface
**Source:** `src/types/pipeline.ts` (lines 26-29)
**Apply to:** All new pipeline steps
```typescript
export interface PipelineStep {
  name: string;
  run(ctx: PipelineContext): Promise<PipelineContext>;
}
```

### Error Handling (Graceful Degradation)
**Source:** `src/engine/splitter/index.ts` (lines 81-83, 127-130)
**Apply to:** All service layers and pipeline steps
```typescript
if (!ctx.$) {
  newCtx.errors.push('Cannot split: no parsed AST available');
  return newCtx;
}
// ...
} catch (err: any) {
  newCtx.errors.push(`Split error: ${err.message}`);
  return newCtx;
}
```

### Config Merge (CLI > config file > defaults)
**Source:** `src/cli/commands/convert.ts` (lines 32-38)
**Apply to:** All config loading
```typescript
out: options.out ?? configFile.out ?? DEFAULT_OPTIONS.out,
```

### tiktoken Memory Management
**Source:** AI-SPEC Section 3, Pitfall 1
**Apply to:** All token counting code
```typescript
const enc = encoding_for_model('cl100k_base');
const count = enc.encode(text).length;
enc.free(); // MUST free to avoid WASM memory leak
```

### Zod Structured Output Pattern
**Source:** AI-SPEC Section 3
**Apply to:** All LLM calls
```typescript
import { zodResponseFormat } from 'openai/helpers/zod';

const completion = await client.chat.completions.parse({
  model: 'gpt-4o-mini',
  messages: [...],
  response_format: zodResponseFormat(ComponentReviewSchema, 'component_review'),
  max_tokens: 1024,
  temperature: 0.2,
});
```

### Ollama apiKey Pattern
**Source:** AI-SPEC Section 3, Pitfall 4
**Apply to:** Ollama provider factory
```typescript
// Ollama requires explicit apiKey with baseURL
new OpenAI({ baseURL: 'http://localhost:11434/v1', apiKey: 'ollama' });
```

## No Analog Found

Files with no close match in the codebase (use RESEARCH.md patterns):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/llm/structured/tokens.ts` | utility | transform | Token encoding is new domain; closest analog `src/util/tree.ts` only partially matches |

## Metadata

**Analog search scope:** `src/pipeline/steps/`, `src/engine/splitter/`, `src/config/`, `src/types/`, `src/cli/commands/`, `src/util/`, `test/`
**Files scanned:** 24 TypeScript files
**Pattern extraction date:** 2026-05-21
