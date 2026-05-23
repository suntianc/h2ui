# Requirements: h2ui

**Defined:** 2026-05-21
**Core Value:** Take any HTML page and produce production-ready React components with properly extracted styles — in one command.

## v1 Requirements

### CLI & Input/Output

- [ ] **CLI-01**: User can run `h2ui <file>` with an HTML file path argument
- [ ] **CLI-02**: Output component files are written to disk (default: `./output/`)
- [ ] **CLI-03**: User can specify custom output directory via `--out`
- [ ] **CLI-04**: User can get help text via `--help`
- [ ] **CLI-05**: User can get version via `--version`
- [ ] **CLI-06**: Tool shows clear error message for missing/invalid file paths

### HTML→JSX/TSX Conversion

- [ ] **JSX-01**: `class` attributes are converted to `className`
- [ ] **JSX-02**: `for` attributes are converted to `htmlFor`
- [ ] **JSX-03**: HTML boolean attributes are converted to JSX boolean props (disabled, checked, etc.)
- [ ] **JSX-04**: Inline `style` strings are converted to React style objects (camelCase)
- [ ] **JSX-05**: Void elements (br, hr, img, input, etc.) use self-closing syntax `<br />`
- [ ] **JSX-06**: Elements without children use self-closing syntax
- [ ] **JSX-07**: SVG attributes are converted to JSX camelCase (`stroke-width` → `strokeWidth`)
- [ ] **JSX-08**: All HTML event handlers (`onclick` → `onClick`) are converted
- [ ] **JSX-09**: `tabindex`, `maxlength`, and other hyphenated attrs are camelCased
- [ ] **JSX-10**: Output is TypeScript `.tsx` by default
- [ ] **JSX-11**: User can opt out of TypeScript to get plain `.jsx` via `--no-typescript`

### Component Splitting

- [ ] **SPL-01**: Semantic HTML tags (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`) are detected as component boundaries
- [ ] **SPL-02**: Each semantic section becomes its own component file
- [ ] **SPL-03**: Parent components import child components
- [ ] **SPL-04**: Repeated element patterns (e.g., multiple `<div class="card">`) are extracted as reusable components
- [ ] **SPL-05**: Component tree structure is shown in console output after conversion
- [ ] **SPL-06**: Non-semantic `<div>` containers at the top level are split when they have a distinct class/ID

### CSS Extraction (→ CSS Modules)

- [ ] **CSS-01**: Inline `style` attributes are extracted to CSS Module files (`.module.css`)
- [ ] **CSS-02**: Only explicitly-set CSS properties are included (not all computed values)
- [ ] **CSS-03**: Shared/common styles across components are deduplicated into shared CSS module
- [ ] **CSS-04**: Inheritable styles (color, font-family, etc.) inherit from parent element — not duplicated
- [ ] **CSS-05**: CSS shorthand properties (padding, margin, border) are condensed
- [ ] **CSS-06**: `<style>` tags in HTML are extracted to separate CSS Module files
- [ ] **CSS-07**: Components import their corresponding CSS Module files

### Configuration

- [ ] **CFG-01**: User can configure via `.h2uirc` config file or `h2u` field in `package.json`
- [ ] **CFG-02**: Default output is TSX; configurable via flag or config file

## v2 Requirements

### LLM Integration

- **LLM-01**: Optional LLM pass improves component naming
- **LLM-02**: Configurable LLM provider (OpenAI, Anthropic, Ollama)
- **LLM-03**: LLM suggests code cleanup / optimization improvements
- **LLM-04**: Token estimation and cost warning before LLM calls
- **LLM-05**: Caching of LLM results

### Polish & DX

- **POL-01**: Interactive preview of component tree before writing files
- **POL-02**: Progress spinner during conversion
- **POL-03**: Batch conversion of multiple HTML files
- **POL-04**: Watch mode — auto-convert on file change

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| WYSIWYG / GUI | CLI-only tool; GUI would be separate project |
| Runtime DOM conversion | Build-time / offline conversion only |
| Two-way sync (HTML ↔ React) | One-way conversion; re-run on new HTML |
| Full website scraping | User provides local HTML file |
| Pure-LLM conversion | Hybrid approach: rules for structure, LLM for naming |
| Multi-framework (Vue/Svelte) | React-only for v1; framework support in v2+ |
| Tailwind CSS inference | CSS Modules for v1; Tailwind in v2+ |
| Image/base64 extraction | Leave image refs intact; user manages assets |

## Traceability

| Requirement | Phase | Status |
| ----------- | ----- | ------ |
| CLI-01 | Phase 1 | Pending |
| CLI-02 | Phase 1 | Pending |
| CLI-03 | Phase 1 | Pending |
| CLI-04 | Phase 1 | Pending |
| CLI-05 | Phase 1 | Pending |
| CLI-06 | Phase 1 | Pending |
| JSX-01 | Phase 1 | Pending |
| JSX-02 | Phase 1 | Pending |
| JSX-03 | Phase 1 | Pending |
| JSX-04 | Phase 1 | Pending |
| JSX-05 | Phase 1 | Pending |
| JSX-06 | Phase 1 | Pending |
| JSX-07 | Phase 1 | Pending |
| JSX-08 | Phase 1 | Pending |
| JSX-09 | Phase 1 | Pending |
| JSX-10 | Phase 1 | Pending |
| JSX-11 | Phase 1 | Pending |
| SPL-01 | Phase 2 | Pending |
| SPL-02 | Phase 2 | Pending |
| SPL-03 | Phase 2 | Pending |
| SPL-04 | Phase 2 | Pending |
| SPL-05 | Phase 2 | Pending |
| SPL-06 | Phase 4 | Pending |
| CSS-01 | Phase 2 | Pending |
| CSS-02 | Phase 2 | Pending |
| CSS-03 | Phase 2 | Pending |
| CSS-04 | Phase 2 | Pending |
| CSS-05 | Phase 2 | Pending |
| CSS-06 | Phase 2 | Pending |
| CSS-07 | Phase 2 | Pending |
| CFG-01 | Phase 3 | Pending |
| CFG-02 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0 ✓

---

## v1.1 Traceability

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

## v1.1 Requirements

### Batch Conversion

- [ ] **BATCH-01**: User can run `h2u "src/**/*.html"` with a glob pattern to process multiple files
- [ ] **BATCH-02**: Files are processed sequentially by default to avoid API rate limits
- [ ] **BATCH-03**: User can specify `--concurrency N` to process N files in parallel (bounded, max 4)
- [ ] **BATCH-04**: Individual file failures are isolated — batch continues, failures reported at end
- [ ] **BATCH-05**: Failed files are tracked with error messages and retry instructions
- [ ] **BATCH-06**: Exit code is non-zero if any file failed
- [ ] **BATCH-07**: Output directory structure mirrors source directory layout (`src/a/page.html` → `output/src/a/page/`)

### Vue 3 + TypeScript Output

- [ ] **VUE-01**: User can specify `--framework vue3` to output `.vue` single-file components
- [ ] **VUE-02**: Generated `.vue` files contain `<template>`, `<script setup lang="ts">`, and `<style scoped>` blocks
- [ ] **VUE-03**: HTML attributes are converted to Vue template syntax (`class` → `class`, `onclick` → `@click`, `for` → `for`)
- [ ] **VUE-04**: `style` attributes are extracted to `<style scoped>` blocks with CSS Modules naming
- [ ] **VUE-05**: Vue 3 Composition API (`<script setup lang="ts">`) is used for component logic
- [ ] **VUE-06**: Components are split using the same semantic boundary detection as React output
- [ ] **VUE-07**: Child components are imported using Vue's `import` statement

### Autonomous Agent

- [ ] **AGENT-01**: Agent mode is enabled via `--agent` flag
- [ ] **AGENT-02**: Agent plans its approach before executing conversion (`PLAN` phase)
- [ ] **AGENT-03**: Agent can use tools: `read_file`, `write_file`, `run_pipeline`, `run_llm`, `verify_output`
- [ ] **AGENT-04**: Agent executes the pipeline and verifies output fidelity against original HTML (`EXECUTE` → `VERIFY`)
- [ ] **AGENT-05**: If verification fails, agent attempts repair with a different strategy (`REPAIR` phase)
- [ ] **AGENT-06**: Maximum 3 repair attempts per file to prevent infinite loops
- [ ] **AGENT-07**: Agent tracks action history to avoid repeating failed strategies
- [ ] **AGENT-08**: Token budget is tracked; agent stops if budget exceeds limit (e.g., 50k tokens)
- [ ] **AGENT-09**: Semantic validation ensures fixes address the actual problem, not just silence errors
- [ ] **AGENT-10**: Agent reports confidence score for each repaired component

## Future Requirements (v1.2+)

### Batch & Watch

- [ ] **FUT-01**: Watch mode — auto-convert on file change via `--watch` flag
- [ ] **FUT-02**: Incremental batch — skip already-converted files via `--incremental` flag
- [ ] **FUT-03**: Glob negation patterns — exclude files via `!"**/node_modules/**"`

### Vue 3 Extensions

- [ ] **FUT-04**: Vue Router integration hints in generated components
- [ ] **FUT-05**: Pinia store extraction for stateful components

### Agent Extensions

- [ ] **FUT-06**: Persistent agent memory across multiple files in batch mode
- [ ] **FUT-07**: Custom tool registration via config file
- [ ] **FUT-08**: Agent self-evaluation metrics for repair quality

---

*Requirements defined: 2026-05-21*
*Last updated: 2026-05-23 — v1.1 roadmap created*
