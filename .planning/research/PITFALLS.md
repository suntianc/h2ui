# Pitfalls Research: h2ui v1.1 Features

**Domain:** HTML-to-Component CLI Tool - Batch, Vue 3, and Autonomous Agent Features
**Researched:** 2026-05-23
**Confidence:** MEDIUM-HIGH (Vue 3 SFC from official docs, batch/agent from ecosystem patterns)

---

## Critical Pitfalls

### Pitfall 1: Parallelization Overhead Exceeding Serial Processing

**What goes wrong:**
Batch processing with high parallelism crashes, OOMs, or is slower than serial processing due to connection pool exhaustion, file descriptor limits, or CPU saturation.

**Why it happens:**
- Node.js is single-threaded; I/O parallelism is managed by libuv thread pool (default 4 threads)
- Each concurrent conversion uses LLM API connections, file handles, and memory
- Glob patterns can match thousands of files; processing all simultaneously overwhelms system resources
- LLM API rate limits cause cascading failures under parallel load

**How to avoid:**
- Use a **bounded concurrency queue** (e.g., `p-limit` with concurrency of 2-4)
- Implement **exponential backoff** on API rate limit errors with jitter
- Add **memory monitoring** — track heap usage, abort batch if approaching limit
- Process files in **chunks** of 10-20 with explicit pauses between chunks
- Default to `--concurrency 2` and let users override

**Warning signs:**
- "EMFILE: too many open files" error
- LLM API 429 rate limit errors during batch
- Memory usage grows linearly with file count
- Batch slower than processing files individually

**Phase to address:**
Phase 6.1 — Batch conversion must have concurrency limits from the start.

---

### Pitfall 2: Silent Partial Failure in Batch Mode

**What goes wrong:**
Batch processes all files but silently fails on some; user doesn't discover failures until later when components are missing.

**Why it happens:**
- Individual file failures don't stop batch processing (correct behavior)
- But errors are printed to console and scrolled past
- No summary report at end of batch
- Exit code may still be 0 even with failures
- Failed files are not tracked or replayable

**How to avoid:**
- Track failures in a `Map<string, Error>` with file path as key
- At batch end, output **failure summary table**: file, error type, retry count
- **Non-zero exit code** if any file failed
- Write `.h2ui/batch-failures.json` for retry (`h2ui --retry-batch`)
- Log to file AND console — console can be cleared by CI

**Warning signs:**
- Batch completes "successfully" but output count < input count
- User reports missing components with no error message
- CI pipeline passes but files are missing

**Phase to address:**
Phase 6.1 — Batch must have failure tracking built in, not bolted on.

---

### Pitfall 3: File Ordering Assumptions Breaking Deterministic Output

**What goes wrong:**
Component output order varies between runs; component imports reference files that don't exist yet.

**Why it happens:**
- Glob results are not ordered by directory depth by default
- Parallel processing completes in completion order, not file order
- Parent component references child before child is written
- Hash-based filenames (content hash) create non-deterministic output

**How to avoid:**
- Sort glob results by **depth-first** (shallow files first) before processing
- Wait for file write confirmation before processing dependents
- Use **stable, predictable output names** — `ComponentName.index.tsx` not `[hash].tsx`
- In verbose mode, log processing order for reproducibility debugging
- Process all files at same depth level concurrently, but depths sequentially

**Warning signs:**
- Git diff shows random import order changes between runs
- Some component imports fail intermittently
- Output is correct but files are renamed differently each run

**Phase to address:**
Phase 6.1 — Batch must guarantee deterministic output regardless of run order.

---

### Pitfall 4: Vue SFC Template Block Cannot Express Complex Logic

**What goes wrong:**
Converted Vue components have broken templates because HTML event handlers and JavaScript expressions are placed in the wrong location.

**Why it happens:**
Vue SFC `<template>` blocks only support **declarative template syntax** — no arbitrary JavaScript. HTML `onclick="doSomething()"` inline handlers work, but complex nested expressions don't translate directly to Vue directives.

Key mismatches:
- HTML `onclick="items.filter(x=>x.active).map..."` — cannot go directly in Vue template
- HTML `onload="init(data)"` — not a Vue lifecycle concept
- HTML `<div onclick="state.count++">` — must become `v-on:click` or `@click`
- Two-way binding patterns not directly translatable

**How to avoid:**
- Convert inline JavaScript in HTML attributes to Vue directive syntax:
  - `onclick` → `@click`
  - `oninput` → `@input`
  - `onchange` → `@change`
- Move complex JavaScript logic to `<script setup>` block
- For HTML event attributes that aren't valid Vue directives, extract to JavaScript in `<script>`
- Handle `<body onload>` → Vue `onMounted()` in `<script setup>`

**Warning signs:**
- Generated `.vue` files have syntax errors in template section
- Vue compiler errors: "Cannot use v-on with dynamic event name"
- Inline JavaScript expressions not evaluating in template

**Phase to address:**
Phase 6.2 — Vue output requires attribute-to-directive conversion layer.

---

### Pitfall 5: Vue Scoped CSS Collision with External Styles

**What goes wrong:**
Converted Vue components have scoped CSS that doesn't apply correctly to dynamically generated class names or third-party styles.

**Why it happens:**
Vue `<style scoped>` adds `data-v-xxxxx` attributes to elements. If the HTML has:
- Dynamic class names based on state (e.g., `class="item-${active}"`)
- Styles from external libraries (Bootstrap, Tailwind)
- CSS variables that reference global scope

The scoped attribute approach breaks because:
- Scoped styles won't affect dynamically constructed class names without additional transformation
- Global CSS libraries get incorrectly scoped when they should remain global
- Deep selectors (`::v-deep`, `:deep()`) have changed in Vue 3

**How to avoid:**
- Track which CSS rules are **global** (from `<link>`, external CDN) vs **component-local**
- Global styles go in a separate `<style>` block without `scoped`
- Component-local styles use `<style scoped>`
- For dynamic class names, ensure CSS selectors match the generated pattern
- Use Vue 3's `:deep()` for deep targeting instead of deprecated `::v-deep`

**Warning signs:**
- Converted Vue components look unstyled despite having CSS
- Styles from external libraries missing
- "Failed to compile" errors for deprecated `::v-deep` syntax

**Phase to address:**
Phase 6.2 — Vue CSS handling requires origin tracking (global vs local).

---

### Pitfall 6: Vue Reactivity Model Mismatch with HTML State

**What goes wrong:**
Converted Vue components have broken reactivity — state doesn't update, or updates cause infinite loops.

**Why it happens:**
Vue 3 reactivity (Composition API) requires explicit `.value` access for `ref()` and implicit tracking via `reactive()`. HTML templates don't express:

- Which elements are state (need `ref`/`reactive`)
- Which state changes should trigger re-renders
- Dependencies between state variables

Complex HTML patterns like:
```html
<div onclick="this.classList.toggle('active')"> — pure DOM manipulation, not reactive
<input onchange="updateList(this.value)"> — state mutation outside Vue
```

These cannot be auto-converted to reactive state without understanding intent.

**How to avoid:**
- Default to **not** wrapping everything in reactive state — only extract obvious state
- Detect `<input>`, `<select>`, `<textarea>` as state candidates
- For `onclick` that manipulates DOM classes, consider if it warrants reactive state or is purely cosmetic
- Generate `<script setup>` with `ref()` for form inputs, with clear TODO comments for manual refinement
- Emit warning when HTML has stateful patterns that require manual review

**Warning signs:**
- Generated Vue components don't update when user interacts
- "Object is not reactive" errors in Vue DevTools
- Infinite re-render loops from improperly tracked dependencies

**Phase to address:**
Phase 6.2 — Vue reactivity extraction needs conservative defaults with clear TODOs.

---

### Pitfall 7: Autonomous Agent Infinite Loop (Same Action Repeated)

**What goes wrong:**
Agent continuously attempts the same fix approach despite failures, consuming tokens indefinitely without progress.

**Why it happens:**
- Agent has no **action memory** — doesn't remember what it just tried
- No **iteration limit** enforced
- Failure handling just re-prompts with same context
- No concept of "this approach failed, try different strategy"

**How to avoid:**
- Implement **attempt counter per problem**: max 3 retries before escalating
- Track **action history** in context: "Tried A (failed), Tried B (failed), trying C"
- Add **strategy rotation** — if approach X fails, next attempt must use different approach
- Set **hard token budget** (e.g., 50k tokens max per file repair) and abort when exceeded
- Implement **progress signals** — if N consecutive attempts make no progress, abort

**Warning signs:**
- Agent logged same action 5+ times
- Token count keeps growing with no file changes
- "Retrying..." with no change in error message
- Memory/context grows unbounded during single repair

**Phase to address:**
Phase 6.3 — Agent loop termination must be built-in, not optional.

---

### Pitfall 8: Token Budget Cascade (Budget Spent on Wrong Priority)

**What goes wrong:**
Agent burns through token budget on preliminary steps, leaving insufficient tokens for final fix delivery.

**Why it happens:**
- Agents naturally explore and explain before acting
- Each LLM call has overhead (system prompt, conversation history)
- Repair often requires multiple iterations to converge
- Token budget set at conversion level, not per-repair-level
- Final response may be truncated due to context window pressure

**How to avoid:**
- **Pre-repair budget check**: Estimate tokens needed for fix; if insufficient, fail fast
- **Streaming responses**: Don't buffer full response; stream to avoid truncation
- **Checkpoint-based progress**: Save intermediate repair state so partial progress isn't lost
- **Budget allocation tiers**: 40% for diagnosis, 40% for fix, 20% for verification
- **Truncate conversation history** at fixed length rather than unbounded growth

**Warning signs:**
- "Response was truncated" in agent output
- Final fix is incomplete or cuts off mid-sentence
- Agent says "Given remaining tokens, I cannot complete repair"
- Subsequent repairs in same session get worse results (context pollution)

**Phase to address:**
Phase 6.3 — Token budget management must be explicit and enforced.

---

### Pitfall 9: Incorrect Self-Correction (Fixing the Wrong Problem)

**What goes wrong:**
Agent "fixes" generated code to pass validation but introduces new bugs or loses intended functionality.

**Why it happens:**
- Validation passes but tests the wrong thing
- Agent prioritizes making error messages go away over correctness
- Fix is applied without understanding root cause
- Code that "looks correct" to LLM is functionally broken

Example:
```
Generated: <div className="item active">
Validation: className exists ✓
Agent: "Passed validation" — but "active" should have been extracted to state
```

**How to avoid:**
- **Verify against original HTML**, not just generated code structure
- Include **semantic validation** — does component render same visual output?
- Make validation **strict by default** — harder to false-pass
- **Human-in-the-loop** for high-impact changes (API contracts, data flow)
- Track "confidence" per fix — low confidence fixes require review

**Warning signs:**
- Agent claims "fixed" but original error still occurs
- New errors introduced by fix
- Generated code is syntactically valid but semantically different from HTML
- Validation only checks syntax, not correctness

**Phase to address:**
Phase 6.3 — Agent must verify fixes against original intent, not just error messages.

---

### Pitfall 10: Trust Without Verification (Accepting Agent Output Uncritically)

**What goes wrong:**
Generated code passes through the agent and is accepted without human verification, but contains subtle bugs.

**Why it happens:**
- User trusts the tool because "it worked before"
- Agent presents confident output, users assume correctness
- No automated way to verify semantic equivalence between HTML and output
- Time pressure encourages "good enough" mentality

**How to avoid:**
- **Explicit verification step** required before accepting agent changes
- **Diff review mode**: Show user exactly what changed and why
- **Semantic comparison**: Visual diff or DOM comparison between HTML and converted output
- **Confidence scoring**: Agent output includes confidence level; low = require review
- **Idempotency check**: Run conversion again; if different, mark as unstable

**Warning signs:**
- Users reporting "looks right but doesn't work"
- Generated output varies between identical runs
- No way to revert to previous version
- Agent output accepted without any review process

**Phase to address:**
Phase 6.3 — Verification is not optional; build review workflow into agent loop.

---

## Integration Pitfalls

### Pitfall 11: Batch + Vue Output Interaction — File Extension Mismatch

**What goes wrong:**
Batch processing outputs `.jsx`/`.tsx` files even when Vue output is requested.

**Why it happens:**
- Output format flag (`--framework vue`) may not propagate correctly in batch mode
- File extension mapping (`tsx` vs `vue`) happens at wrong layer in pipeline
- Batch uses cached template for file extensions
- CLI args parse differently in batch mode vs single-file mode

**How to avoid:**
- Validate output format before batch processing begins
- Pass format through batch job context, not global state
- Test batch mode with non-default output formats explicitly
- Use `.vue` extension in output path generation for Vue jobs

**Warning signs:**
- Vue project has `.tsx` files mixed in
- Generated import statements reference `.jsx` files that don't exist
- Output files have wrong extensions

**Phase to address:**
Phase 6.2 — Integration test for batch + Vue output required.

---

### Pitfall 12: Agent + Batch Interaction — Repair State Collision

**What goes wrong:**
Autonomous repair in batch mode creates inconsistent state: some files repaired, others not, with no way to track which.

**Why it happens:**
- Agent repair modifies files in-place during batch
- Partial batch failure + partial repair = inconsistent output directory
- No transaction log of what was repaired vs what failed
- Retry batch cannot distinguish repaired from original files

**How to avoid:**
- Agent repair in batch mode writes to **separate output directory**, not in-place
- Track repair metadata: `{ original: "a.html", repaired: "a.repaired.vue", attempts: 3 }`
- Only promote repaired files to final output after verification
- Provide `h2ui batch --skip-repaired` to avoid re-repairing

**Warning signs:**
- Some files in batch output are repaired, others are not
- No record of which files went through agent repair
- Retry produces different results than original run

**Phase to address:**
Phase 6.3 — Agent repair must be transactional in batch context.

---

## Minor Pitfalls

### Pitfall 13: Glob Pattern Edge Cases

**What goes wrong:**
Glob patterns like `**/*.html` match files in `node_modules`, `.git`, or hidden directories, causing unexpected processing.

**How to avoid:**
- Default to excluding: `node_modules`, `.git`, `dist`, `build`, hidden directories
- Provide `--no-exclude-default` flag to process everything
- Show user the matched file list before processing ("Processing 47 files: ...")

**Phase to address:**
Phase 6.1

---

### Pitfall 14: Vue `<script setup>` TypeScript vs JavaScript Confusion

**What goes wrong:**
Generated Vue components with `<script setup lang="ts">` have TypeScript syntax that won't compile without proper setup.

**How to avoid:**
- Default to `<script>` (JavaScript) unless user explicitly requests TypeScript
- For TypeScript output, ensure `tsconfig.json` or `vue-tsc` requirements are documented
- Check that generated TypeScript is valid before outputting

**Phase to address:**
Phase 6.2

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| 6.1 | Batch concurrency | Pool exhaustion, rate limits | Bounded queue, backoff, chunked processing |
| 6.1 | Batch failure handling | Silent failures | Failure tracking, exit codes, retry files |
| 6.1 | Batch ordering | Non-deterministic output | Depth-first sort, stable filenames |
| 6.2 | Vue template conversion | Inline JS in attributes | Directive translation, script extraction |
| 6.2 | Vue CSS scoping | Global vs local confusion | CSS origin tracking, separate scoped blocks |
| 6.2 | Vue reactivity | Over-reactive or under-reactive | Conservative defaults, TODO markers |
| 6.3 | Agent infinite loops | Same action repeated | Attempt counter, strategy rotation, hard limits |
| 6.3 | Agent token budget | Cascade overspend | Pre-check, streaming, checkpoint progress |
| 6.3 | Agent incorrect fixes | Wrong problem fixed | Semantic validation, diff review mode |
| 6.3 | Agent trust | Unverified output | Confidence scoring, mandatory review step |

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Parallelization overhead | MEDIUM | Add concurrency limits, reduce batch size, add throttling |
| Silent partial failure | LOW | Add failure tracking, re-run failed files only |
| File ordering issues | MEDIUM | Re-run with deterministic sort, rename to stable names |
| Vue template errors | MEDIUM | Re-parse HTML, apply directive conversion rules |
| Vue CSS collision | MEDIUM | Re-extract CSS with origin tracking, separate global/local |
| Vue reactivity bugs | HIGH | Manual review of state extraction, add explicit refs |
| Agent infinite loop | LOW | Add/lower iteration limits, reset agent context |
| Token budget cascade | LOW | Truncate context, stream responses, checkpoint more often |
| Incorrect self-correction | HIGH | Revert to original, apply more conservative fix, human review |
| Trust without verification | MEDIUM | Add verification step, enable diff mode, confidence thresholds |

---

## Sources

- [Vue 3 SFC Specification](https://vuejs.org/api/sfc-spec.html) — Official SFC syntax, scoped CSS, module system
- [Vue 3 Template Syntax](https://vuejs.org/guide/introduction.html) — Template vs JSX differences, directives, reactivity
- [fast-glob README](https://github.com/mrmlnc/fast-glob) — Glob patterns, ordering, concurrency considerations
- [Anthropic Claude Code — Agent Loop Patterns](https://docs.anthropic.com/en/docs/claude-code/agent-loop) — Loop termination, tool use, verification
- [Node.js libuv threadpool](https://nodejs.org/api/cli.html#uv_threadpool_size) — Understanding I/O parallelism limits
- [p-limit library](https://github.com/sindresorhus/p-limit) — Bounded concurrency pattern

---

*Pitfalls research for: h2ui v1.1 (Batch, Vue 3, Autonomous Agent)*
*Researched: 2026-05-23*
