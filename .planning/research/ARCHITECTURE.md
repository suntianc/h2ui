# Architecture Research: h2ui v1.1 Feature Integration

**Project:** h2ui
**Researched:** 2026-05-23
**Domain:** CLI HTML-to-component converter
**Confidence:** MEDIUM (based on existing codebase analysis + Vue 3 SFC docs)

## Executive Summary

This document analyzes integration points for three v1.1 features: batch glob processing, Vue 3 SFC output, and autonomous agent repair. The existing Pipeline architecture (Step pattern) supports extension via step insertion and replacement. Key integration points are: (1) CLI layer for batch file enumeration, (2) generate step for output format switching, (3) new AgentOrchestrator wrapping Pipeline with tool-calling and verification loops.

## Current Architecture Overview

```
CLI Layer (convert.ts)
  └── Pipeline (pipeline/index.ts)
        └── Steps: parseStep → [splitStep] → convertStep → [cssStep] → [llmFidelityStep] → generateStep

PipelineContext carries state: html, $, componentTree, components[], cssFiles[], llmResult
```

**Key components:**
- `Pipeline` — orchestrates steps, manages context
- `PipelineStep` — interface with `run(ctx): Promise<ctx>`
- `PipelineContext` — shared state across steps
- `convertStep` — generates TSX/JSX from component tree
- `generateStep` — writes files (components, CSS modules)

---

## Feature 1: Batch Glob Processing

### Integration Points

| Layer | Component | Change Type | Description |
|-------|-----------|-------------|-------------|
| CLI | `convert.ts` | Modify | Replace single-file check with glob expansion |
| Pipeline | `Pipeline` | Extend | Support batch context or per-file pipeline runs |
| Config | `ConvertOptions` | Extend | Add `files: string[]` or process in batch mode |
| New | `FileQueue` | New | Manages file enumeration, deduplication, progress |
| New | `WorkerPool` | New | Optional parallel execution for large batches |

### Data Flow: Batch Mode

```
User: h2u "src/**/*.html"

CLI Layer:
  FileQueue.expand("src/**/*.html") → string[]
  FileQueue.validate(paths) → validPaths[]

  For each file in validPaths:
    Pipeline.run({ html, filePath, ...options })

  FileQueue.collect(results[]) → BatchResult[]
  FileQueue.report(summary)
```

### Alternative: Batch Context (Pipeline-level)

```
BatchPipelineContext extends PipelineContext {
  files: string[];
  currentIndex: number;
  batchResults: BatchResult[];
}

BatchPipeline.run(ctx) {
  for (const file of ctx.files) {
    ctx.currentIndex = i;
    ctx = Pipeline.run({ ...ctx, filePath: file });
    ctx.batchResults.push({ file, outputPath, errors, warnings });
  }
  return ctx;
}
```

### Recommended Approach

**Option A (Simpler): CLI-level batching** — Run Pipeline multiple times from CLI
- Pros: Minimal pipeline changes, reuse existing step logic
- Cons: No shared state between files, no atomic batch operations

**Option B (Cleaner): BatchPipeline wrapper** — New class wrapping Pipeline
- Pros: Batch context for cross-file optimizations, cleaner CLI
- Cons: More code, potential complexity

**Recommendation:** Option A initially. Modify `convert.ts` to expand glob and loop, accumulate results. This avoids pipeline complexity and defers WorkerPool to v1.2 if needed.

### New Components

| Component | Purpose | Placement |
|-----------|---------|-----------|
| `FileQueue` | Glob expansion, validation, path resolution | `src/cli/batch/` |
| `BatchResult` | Type for aggregated results | `src/types/batch.ts` |

### Build Order

1. `src/types/batch.ts` — Define BatchResult type
2. `src/cli/batch/FileQueue.ts` — Glob expansion + validation
3. `convert.ts` modification — Batch mode detection and loop
4. `output.ts` modification — Batch result reporting

---

## Feature 2: Vue 3 SFC Output

### Integration Points

| Layer | Component | Change Type | Description |
|-------|-----------|-------------|-------------|
| Config | `ConvertOptions` | Extend | Add `framework: 'react' \| 'vue'` |
| Types | `ComponentOutput` | Modify | Add optional `vueSFC?: VueSFCOutput` |
| Convert | `convert.ts` | Extend | Generate Vue SFC alongside/between TSX |
| Generate | `generate.ts` | Extend | Write `.vue` files instead of/in addition to `.tsx` |
| New | `VueSFCGenerator` | New | Vue SFC template compilation |
| New | `TemplateCompiler` | New | JSX → Vue template transformation |

### Vue 3 SFC Structure (from Vue docs)

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Default Title'
})

const count = ref(0)
</script>

<template>
  <div class="component">
    <h1>{{ props.title }}</h1>
    <button @click="count++">Count: {{ count }}</button>
  </div>
</template>

<style scoped>
.component {
  text-align: center;
}
</style>
```

### Key Differences: React TSX → Vue SFC

| Aspect | React (current) | Vue 3 SFC (new) |
|--------|-----------------|-----------------|
| Props | `props: Props` interface | `defineProps<Props>()` + `withDefaults` |
| State | `useState` / `useRef` | `ref()` from Vue |
| Events | `onClick={}` | `@click=""` |
| Styles | CSS Modules `.module.css` | `<style scoped>` in SFC |
| Exports | `export default Component` | `<script setup>` auto-exports |
| Child components | `<Child />` | `<Child />` (same) |
| CSS handling | Extracted to `.module.css` | Inline `<style scoped>` or extracted |

### Data Flow: Vue Mode

```
PipelineContext {
  ...
  options: { ...options, framework: 'vue' }
}

convertStep (modified):
  if (options.framework === 'vue') {
    generateVueSFC($, node, components) → VueSFCOutput
  } else {
    generateTsx(node, ...) → TSX string
  }

generateStep (modified):
  if (options.framework === 'vue') {
    writeVueSFC(outputPath, vueSFC) → .vue file
  } else {
    writeTsx(outputPath, code) → .tsx file
  }
```

### JSX → Vue Template Transformations Required

| JSX Pattern | Vue Pattern |
|-------------|-------------|
| `className="foo"` | `class="foo"` |
| `onClick={handler}` | `@click="handler"` |
| `onChange={handler}` | `@change="handler"` |
| `style={{ color: 'red' }}` | `style="color: red"` (inline object) |
| `{condition && <Element />}` | `<Element v-if="condition" />` |
| `{items.map(x => <Item key={x.id} />)}` | `<Item v-for="x in items" :key="x.id" />` |
| `{value}` | `{{ value }}` |
| `{/* comment */}` | `<!-- comment -->` |

### New Components

| Component | Purpose | Placement |
|-----------|---------|-----------|
| `VueSFCGenerator` | Generate Vue SFC content from ComponentNode | `src/engine/transform/vue.ts` |
| `TemplateCompiler` | JSX AST → Vue template transformation | `src/engine/transform/vue-template.ts` |
| `VueTypes` | TypeScript types for Vue SFC output | `src/types/vue.ts` |

### Build Order

1. `src/types/vue.ts` — Define `VueSFCOutput` type
2. `src/engine/transform/vue-template.ts` — JSX → Vue template transformer
3. `src/engine/transform/vue.ts` — VueSFCGenerator combining template + script + style
4. `convert.ts` modification — Conditionally generate Vue SFC
5. `generate.ts` modification — Write `.vue` files
6. `ConvertOptions` extension — Add `framework` option

---

## Feature 3: Autonomous Agent

### Integration Points

| Layer | Component | Change Type | Description |
|-------|-----------|-------------|-------------|
| Pipeline | `Pipeline` | Wrap | AgentOrchestrator wraps Pipeline execution |
| Types | `PipelineContext` | Extend | Add `agentState`, `plan`, `tools` |
| LLM | `llm-fidelity.ts` | Extend | Add tool-calling support, verification |
| New | `AgentOrchestrator` | New | Main agent loop: plan → execute → verify → fix |
| New | `ToolRegistry` | New | Available tools for agent (file ops, LLM, etc.) |
| New | `VerificationLoop` | New | Verify output, decide fix or accept |
| New | `AgentPlan` | New | Type for agent's self-generated plan |

### Agent Architecture Pattern

```
AgentOrchestrator {
  tools: ToolRegistry
  llm: LLMProvider

  async run(html, options): Promise<AgentResult> {
    // Phase 1: Plan
    const plan = await this.createPlan(html, options)
    this.logPlan(plan)

    // Phase 2: Execute
    let ctx = await this.executePlan(plan)

    // Phase 3: Verify
    const verified = await this.verificationLoop.verify(ctx)

    // Phase 4: Fix (if needed)
    if (!verified.success && plan.maxIterations > 0) {
      for (let i = 0; i < plan.maxIterations; i++) {
        const fixes = await this.generateFixes(ctx, verified.issues)
        ctx = await this.executeFixes(fixes)
        const reVerified = await this.verificationLoop.verify(ctx)
        if (reVerified.success) break
      }
    }

    return this.finalize(ctx)
  }
}
```

### Tool Registry Pattern

```typescript
class ToolRegistry {
  private tools: Map<string, Tool> = new Map()

  register(name: string, tool: Tool) {
    this.tools.set(name, tool)
  }

  execute(name: string, args: any): Promise<any>

  list(): Tool[]  // For LLM context
}

interface Tool {
  name: string
  description: string
  parameters: z.ZodSchema
  execute(args: any): Promise<ToolResult>
}

// Initial tools for h2ui agent:
// - read_file(path): string
// - write_file(path, content): void
// - run_pipeline(html, options): PipelineContext
// - run_llm(prompt, schema): structured result
// - verify_output(ctx): VerificationResult
```

### Verification Loop Pattern

```typescript
class VerificationLoop {
  constructor(private llm: LLMProvider) {}

  async verify(ctx: PipelineContext): Promise<VerificationResult> {
    const checks = [
      this.checkFidelity(ctx),      // Does output match input HTML?
      this.checkSyntax(ctx),         // Valid TSX/Vue syntax?
      this.checkSemantics(ctx),      // Meaningful component structure?
      this.checkAccessibility(ctx),  // Basic a11y checks?
    ]

    const results = await Promise.all(checks)
    return {
      success: results.every(r => r.passed),
      issues: results.flatMap(r => r.issues)
    }
  }
}
```

### Integration with Existing LLM Steps

The existing `llm-fidelity.ts` performs review + modification. The AgentOrchestrator wraps this with tool-calling:

```
Current: Pipeline → [llmFidelityStep] → modifies component tree
Agent:    Pipeline → [llmFidelityStep + tool calling] → can request fixes via tools
```

**Key change:** `llm-fidelity.ts` must support tool calls (function calling) rather than just structured output. This requires:
1. LLM provider tool-calling capability (OpenAI function calling, Anthropic tool use)
2. ToolRegistry passed to LLM step
3. Response parsing for tool calls vs direct responses

### New Components

| Component | Purpose | Placement |
|-----------|---------|-----------|
| `AgentOrchestrator` | Main agent loop | `src/agent/Orchestrator.ts` |
| `ToolRegistry` | Tool registration and execution | `src/agent/ToolRegistry.ts` |
| `VerificationLoop` | Output verification | `src/agent/VerificationLoop.ts` |
| `AgentPlan` | Self-generated plan type | `src/types/agent.ts` |
| `AgentResult` | Final result type | `src/types/agent.ts` |

### Agent Loop States

```
IDLE → PLANNING → EXECUTING → VERIFYING → FIXING → COMPLETE
                      ↓                      ↓
                   ERROR ←──────────────────┘
```

### Build Order

1. `src/types/agent.ts` — Define AgentPlan, AgentResult, Tool types
2. `src/agent/ToolRegistry.ts` — Tool registry with initial tools
3. `src/agent/VerificationLoop.ts` — Verification logic
4. `src/agent/Orchestrator.ts` — Main orchestrator (initially without fix loop)
5. CLI integration — Add `--agent` flag
6. Fix loop iteration — Complete agent loop with self-repair

---

## Cross-Feature Integration

### Feature Dependencies

```
Batch Glob
    └── No dependencies on Vue or Agent

Vue 3 SFC
    └── No dependencies on Batch or Agent
    └── Can be combined with Batch (batch generates Vue files)

Agent
    └── Can use Batch internally (agent processes multiple files)
    └── Can use Vue output (agent generates Vue components)
```

### Unified Options Structure

```typescript
interface ConvertOptions {
  // Existing
  out: string;
  typescript: boolean;
  strict: boolean;
  split: boolean;
  cssMode: 'module' | 'scoped' | 'inline' | 'global';
  llm?: LLMConfig;

  // v1.1: Framework
  framework?: 'react' | 'vue';  // default: 'react'

  // v1.1: Batch
  files?: string[];  // If set, process multiple files

  // v1.1: Agent
  agent?: {
    enabled: boolean;
    maxIterations?: number;
    verifyFidelity?: boolean;
  };
}
```

---

## Phase-Specific Architecture Notes

### Phase 1: Batch Glob

**Priority:** Medium — enables workflow improvement
**Complexity:** Low — mostly CLI changes, pipeline unchanged

Key insight: Batch can reuse existing Pipeline without modification. The change is in how CLI invokes Pipeline (loop vs single run).

### Phase 2: Vue 3 SFC

**Priority:** Medium — expands target framework
**Complexity:** Medium — requires JSX→Vue transformation, new file generation

Key insight: The convertStep generates different output based on `options.framework`. This is a conditional branch, not a new pipeline. Minimal pipeline changes.

### Phase 3: Autonomous Agent

**Priority:** High — core differentiator
**Complexity:** High — requires new orchestration layer, tool system, verification

Key insight: Agent wraps Pipeline, doesn't replace it. Pipeline remains the execution engine; Agent provides self-repair loop around it.

---

## Recommended Build Order

1. **Batch Glob** — Simplest integration, validates CLI changes first
2. **Vue 3 SFC** — Self-contained output format change, no new execution model
3. **Agent** — Most complex, depends on having stable Pipeline to wrap

### Rationale

- Batch is CLI-layer only — no pipeline changes, low risk
- Vue requires new generator but pipeline flow unchanged
- Agent needs stable Pipeline to wrap — builds on both prior phases

---

## Sources

- Vue 3 SFC structure: [Vue.js SFC Documentation](https://vuejs.org/guide/scaling-up/sfc.html)
- Existing codebase: `src/pipeline/index.ts`, `src/pipeline/steps/convert.ts`, `src/cli/commands/convert.ts`
- Confidence: MEDIUM — based on codebase analysis + Vue docs; no external search needed for architecture patterns (standard Node.js/CLI patterns)
