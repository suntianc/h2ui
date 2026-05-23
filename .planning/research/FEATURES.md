# Feature Research - h2ui v1.1 New Features

**Domain:** HTML-to-Framework Component Conversion CLI Tool
**Researched:** 2026-05-23
**Confidence:** MEDIUM-HIGH (established patterns, some gaps in agent architecture specifics)

## Feature Landscape - v1.1 New Features

### Feature 1: Batch Conversion with Glob Patterns

**Input:** `h2u "src/**/*.html"` → converts all matching HTML files

#### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Glob pattern input | Standard CLI convention | LOW | `"**/*.html"`, `"src/**/*.html"` |
| Multiple file output | Basic batch expectation | LOW | Per-file output preserving structure |
| Error isolation | One bad file shouldn't kill batch | LOW | Continue on error, report at end |
| Progress indication | Long batches need feedback | LOW | "Converting 3/15 files..." |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Parallel processing** | Speed up large batches | MEDIUM | vs sequential (default) |
| **Smart output structure** | Maintain source directory layout | MEDIUM | `src/a.html` → `output/src/a/` |
| **Incremental mode** | Skip already-converted files | MEDIUM | `--force` to override |
| **Glob negation patterns** | Exclude specific files | LOW | `"**/*.html"`, `!"**/node_modules/**"` |

#### Anti-Features

| Anti-Feature | Why Avoid | Alternative |
|--------------|-----------|-------------|
| Recursive watch mode in batch | Belongs in watch feature, not batch | Separate `--watch` flag later |
| Automatic file merging | Complexity explosion | User merges if needed |
| Parallel + LLM without queue | API rate limiting, cost spikes | Sequential LLM or configurable concurrency |

#### Implementation Approach

```typescript
// Sequential (safe default)
for (const file of files) {
  await convertFile(file);
}

// Parallel (opt-in, controlled concurrency)
const concurrency = 4;
for (const batch of chunk(files, concurrency)) {
  await Promise.all(batch.map(convertFile));
}
```

**Library:** `fast-glob` (mrmlnc/fast-glob) - async, fast, GitHub-style patterns
**Config option:** `--parallel` / `--concurrency N` / `--no-parallel`

#### Dependencies

```
Batch Glob Processing
    └──requires──> fast-glob library
    └──requires──> Existing single-file conversion logic
    └──enhances──> Error aggregation/reporting
    └──optional──> Parallel execution (controlled concurrency)
```

---

### Feature 2: Vue 3 + TypeScript Output

**Input:** HTML file → **Output:** `Component.vue` (Single File Component)

#### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| `.vue` file extension | Vue 3 convention | LOW | Standard SFC format |
| `<template>` block | Required SFC block | LOW | HTML content wrapped |
| `<script setup lang="ts">` | Vue 3 + TypeScript | MEDIUM | Modern Composition API |
| `<style scoped>` | Vue CSS isolation | LOW | CSS Modules equivalent |
| Basic attribute mapping | HTML → Vue syntax | MEDIUM | class→:class, style binding |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Reactive prop types** | TypeScript interfaces for props | MEDIUM | vs `defineProps` without types |
| **v-model support** | Form element binding | MEDIUM | Detect input/textarea/select |
| **Vue event handling** | @click instead of onClick | MEDIUM | `onclick` → `@click` |
| **Slot detection** | Named slots for child content | HIGH | When child elements detected |
| **Conditional/render logic** | v-if, v-for transformation | HIGH | Semantic HTML → Vue directives |
| **Component ref extraction** | Child components from HTML | MEDIUM | Nested structure → imported components |

#### Anti-Features

| Anti-Feature | Why Avoid | Alternative |
|--------------|-----------|-------------|
| Options API (`export default { ... }`) | Less common, verbose | `<script setup>` (default) |
| Render functions | Harder to read/maintain | Template blocks |
| Scoped style extraction | Complex CSS mapping | Basic `<style scoped>` first |
| Vue Router integration | Out of scope | Manual router setup |
| Pinia/store generation | Too opinionated | User adds stores manually |

#### Vue 3 SFC Structure

```vue
<template>
  <div class="container">
    <header class="header">
      <nav class="nav">
        <a href="/">Home</a>
      </nav>
    </header>
    <main class="main">
      <section class="hero">
        <h1>Welcome</h1>
      </section>
    </main>
    <footer class="footer">
      <p>Footer</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  title?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Default Title'
})

const count = ref(0)
</script>

<style scoped>
.container {
  min-height: 100vh;
}
.header {
  background: #333;
}
.nav a {
  color: white;
  text-decoration: none;
}
</style>
```

#### HTML → Vue Attribute Mapping

| HTML | Vue 3 | Notes |
|------|-------|-------|
| `class="x"` | `class="x"` | Unchanged |
| `onclick` | `@click` | Event binding |
| `onchange` | `@change` | Event binding |
| `for="id"` | `for="id"` | Label attribute |
| `style="color:red"` | `:style="{ color: 'red' }"` | Dynamic binding |
| `value="x"` | `modelValue` or `value` | Depends on context |
| `disabled` | `:disabled="true"` | Boolean attribute |

#### Dependencies

```
Vue 3 Output
    └──requires──> Existing HTML parsing (Cheerio)
    └──requires──> Template generation engine
    └──requires──> SFC file writer (.vue extension)
    └──modifies──> CSS extraction (→ scoped style blocks)
    └──optional──> Vue-specific component detection
```

**Config options:**
- `--framework vue3` (default: react)
- `--vue-style` (scoped | modules | plain)

---

### Feature 3: Full Autonomous Agent with Self-Repair

**Concept:** LLM-powered agent that plans conversion, calls tools, verifies output, and self-corrects

#### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Single conversion loop** | One-shot LLM call | MEDIUM | Input → LLM → Output |
| **Error detection** | LLM can identify issues | LOW | "This looks wrong" |
| **Retry on failure** | Basic self-healing | LOW | Try again with feedback |

#### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Multi-step planning** | Agent thinks before acting | HIGH | Decompose task into steps |
| **Tool calling** | Use tools (read file, run command) | HIGH | LLM function calling |
| **Verification loop** | Check output before finishing | MEDIUM | LLM validates own output |
| **Self-repair cycle** | Fix issues found in verification | HIGH | Planning → Execute → Verify → Fix |
| **State persistence** | Track conversation across steps | MEDIUM | Memory of previous attempts |
| **Human-in-loop (optional)** | Approve before dangerous actions | MEDIUM | `--approve` flag |

#### Anti-Features

| Anti-Feature | Why Avoid | Alternative |
|--------------|-----------|-------------|
| Unlimited retries | Infinite loops, cost explosion | Max 3 retries, configurable |
| Auto-modify source HTML | Destructive, unexpected | Only generate output |
| Full autonomous without guardrails | Risk of wrong code | Verification + approval |
| Complex multi-file refactoring | Scope creep | Single-file conversion focus |
| Persistent agent mode (daemon) | Complexity, resource cost | Stateless single conversion |

#### Agent Loop Architecture

```
┌─────────────────────────────────────────┐
│  INPUT: HTML file + task description    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  PLANNER: LLM decides approach          │
│  "This HTML has X sections. I should:   │
│   1. Parse structure                    │
│   2. Extract components                 │
│   3. Convert to Vue/React               │
│   4. Verify output"                     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  EXECUTOR: Run conversion tool          │
│  - Call conversion function             │
│  - Pass structured context             │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  VERIFIER: Check output quality         │
│  - LLM reviews generated code           │
│  - Syntax check                        │
│  - Fidelity check (renders same?)       │
└─────────────────┬───────────────────────┘
                  │
         ┌───────┴───────┐
         │ Pass?         │
         └───────┬───────┘
          Yes    │ No
    ┌────────────┘    │
    ▼                ▼
┌─────────┐    ┌─────────────────┐
│ OUTPUT  │    │ REPAIR: LLM     │
│ Success │    │ fix issues      │
└─────────┘    │ + retry         │
               └────────┬────────┘
                        │
                   Max retries?
                   ┌────┴────┐
                   │Exceeded │
                   └────┬────┘
                        │
                   ┌────┴────┐
                   │ Report  │
                   │ failure │
                   └────────┘
```

#### Tool Calling Patterns

**Pattern A: Single-turn (v1.0 current)**
```
User → "Convert this HTML"
LLM → Returns conversion result
```
No tools, no iteration.

**Pattern B: Multi-turn with tools (recommended for v1.1)**
```
User → "Convert this HTML with self-repair"
LLM → [Tool: convert_html] → Returns initial result
LLM → [Tool: verify_output] → Returns issues found
LLM → [Tool: fix_issues] → Returns fixed result
LLM → [Tool: final_check] → Confirms success
```

**Pattern C: Full agent loop (v2 consideration)**
```
LLM has access to:
- convert_html tool
- verify_syntax tool
- verify_fidelity tool
- read_file tool
- write_file tool
- ask_user tool (optional approval)

LLM decides sequence dynamically.
```

#### LLM Provider Tool Calling Support

| Provider | Tool Calling | Notes |
|----------|--------------|-------|
| OpenAI (GPT-4) | Native function calling | Full support |
| Anthropic | Native tool use | Claude 3+ |
| Ollama | Limited/capabilities varies | May not support |
| Local models | Generally NO | Require vLLM or similar |

**Implementation:** Use OpenAI/Anthropic SDK tool calling APIs, fallback to single-turn without tools for Ollama.

#### Dependencies

```
Autonomous Agent
    └──requires──> Existing conversion logic (tools)
    └──requires──> LLM provider with function calling
    └──requires──> Verification logic
    └──optional──> Retry/repair logic
    └──optional──> Approval gate
```

**Config options:**
- `--agent` (enable agent mode)
- `--agent-max-retries N` (default: 3)
- `--agent-approve` (require human approval)

---

## Feature Comparison Matrix

| Feature | Batch Glob | Vue 3 Output | Autonomous Agent |
|---------|-----------|-------------|------------------|
| **Complexity** | LOW-MEDIUM | MEDIUM-HIGH | HIGH |
| **Dependencies** | Existing conversion | Existing conversion | Conversion + verification |
| **Risk** | File I/O errors | SFC format issues | LLM cost, infinite loops |
| **Scope** | Processing orchestration | Code generation | Code generation + self-repair |
| **User Value** | Batch efficiency | Vue 3 support | Output quality |

---

## Recommended Phase Structure

### Phase 1: Batch Processing (simplest new feature)
- Glob pattern input support
- Sequential file processing (default)
- Error isolation
- Optional: parallel with concurrency control

### Phase 2: Vue 3 Output (medium complexity)
- `.vue` SFC file generation
- Basic attribute mapping
- `<script setup lang="ts">` structure
- `<style scoped>` support
- Config flag: `--framework vue3`

### Phase 3: Autonomous Agent (highest complexity)
- Single-turn with verification (no tools)
- Retry loop on failure
- Tool calling support (OpenAI/Anthropic)
- Optional: human approval gate
- Max retries to prevent infinite loops

---

## Gaps to Address Later

1. **Agent memory:** How to persist state across retries? (In-memory for v1.1)
2. **Vue 3 composition:** Detect reusable logic into composables? (v2)
3. **Batch + Agent:** Should agent mode apply per-file or overall? (v2)
4. **Agent evaluation:** How to measure "better" output? (Need metrics)

---

## Sources

- [Vue 3 Single File Component Spec](https://vuejs.org/api/sfc-spec.html) - SFC structure
- [fast-glob - GitHub](https://github.com/mrmlnc/fast-glob) - Glob patterns
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling) - Tool calling
- [Anthropic Tool Use](https://docs.anthropic.com/claude/docs/tool-use) - Claude tool use
- [LangChain Agents](https://python.langchain.com/docs/concepts/agents/) - Agent patterns
- [ReAct Pattern](https://react-lm.github.io/) - Reasoning + Acting agent loop

---
*Feature research for: h2ui v1.1 - New Features*
*Researched: 2026-05-23*
