# Phase 2: Component Splitting + CSS Extraction - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning
**Source:** Inline discuss (user provided decisions directly)

<domain>
## Phase Boundary

Build component splitting engine and CSS extraction pipeline on top of Phase 1. Input is a parsed Cheerio AST (from Phase 1 pipeline). Output is multiple component files with CSS Modules — no more single-file output.

</domain>

<decisions>
## Implementation Decisions

### Component Splitting Strategy
- **D-01:** Semantic HTML tags (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`) are automatically detected as component boundaries
- **D-02:** No user-required markers (`data-component`) — auto-splitting only
- **D-03:** SPL-06 (non-semantic `<div>` with class/ID splitting) is deferred to Phase 4

### CSS Extraction Mode
- **D-04:** CSS Modules — each component gets a `.module.css` file
- **D-05:** Inline `style="..."` attributes are extracted from JSX to CSS Module files
- **D-06:** `<style>` tags in HTML are extracted to separate CSS Module files
- **D-07:** CSS Module file naming convention: same directory as component, same basename
  - `Header.tsx` → `Header.module.css`
  - `Navigation.tsx` → `Navigation.module.css`

### CSS Content Rules
- **D-08:** Only explicitly-set CSS properties appear in output (no inherited/computed values)
- **D-09:** Inherited properties (color, font-family, font-size, line-height) are NOT duplicated — rely on CSS native inheritance
- **D-10:** CSS shorthand properties (padding, margin, border) are condensed from longhand where possible
- **D-11:** Shared styles across components are deduplicated into a shared CSS Module (`shared.module.css` or similar)

### Repeated Pattern Detection
- **D-12:** Structure-signature matching — compute DOM structure signature (tag name sequence + class patterns), group identical signatures as reusable components
- **D-13:** Default min occurrence threshold: 2
- **D-14:** Default subtree depth limit: 3 levels
- **D-15:** Generic wrapper classes (container, wrapper, inner) are excluded from heuristic detection

### Component Tree Display
- **D-16:** Default output: console tree diagram using `├──` / `└──` characters
- **D-17:** No `--json` flag for Phase 2 (can be added later)
- **D-18:** Tree shows: component name, source HTML tag, and reuse count for duplicated patterns

### Pipeline Integration
- **D-19:** New pipeline steps: `split` (after parse) and `css` (after convert)
- **D-20:** PipelineContext gains new fields: `components`, `cssFiles`
- **D-21:** `convert` step is refactored to work per-component instead of per-file
- **D-22:** `generate` step is refactored to write multiple files (N tsx + N css)

### the agent's Discretion
- Exact CSS property categorizations (inheritable vs non-inheritable)
- CSS shorthand condensation algorithm details
- Specific console tree diagram implementation (library vs manual)
- Test fixture HTML files for splitting scenarios
- Shared CSS module naming (`shared.module.css` vs `common.module.css`)
- Structure-signature serialization format (hash vs string comparison)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Pipeline Architecture
- `src/pipeline/index.ts` — Pipeline runner (will add steps)
- `src/types/pipeline.ts` — PipelineContext type (will extend)
- `src/pipeline/steps/parse.ts` — Existing parse step (preceding split)
- `src/pipeline/steps/convert.ts` — Existing convert step (needs refactor)
- `src/pipeline/steps/generate.ts` — Existing generate step (needs refactor)

### Current CLI Integration
- `src/cli/commands/convert.ts` — CLI command that orchestrates pipeline (will add new steps)
- `src/cli/output.ts` — Output utilities (will add tree display)

### Types & Config
- `src/types/config.ts` — Config types
- `src/config/defaults.ts` — Default config values

### Architecture Reference
- `.planning/research/ARCHITECTURE.md` — Pipeline architecture, project structure
- `.planning/research/FEATURES.md` — Feature dependencies, competitor analysis

</canonical_refs>

<specifics>
## Specific Ideas

### Pipeline Flow After Phase 2

```
[Input HTML]
    ↓
[Step 1: Parse]      — Cheerio.load(html) [EXISTING]
    ↓ AST
[Step 2: Split]      — NEW: Detect semantic boundaries → Component Tree
    ↓ ComponentNodes[]
[Step 3: Convert]    — MODIFIED: Convert each component's AST to JSX (per-component)
    ↓ Components[]
[Step 4: CSS]        — NEW: Extract styles → CSS Modules
    ↓ CSSFiles[]
[Step 5: Generate]   — MODIFIED: Write multiple .tsx + .module.css files
    ↓
[Output Files]
```

### Component Tree Type (Scaffold)
```typescript
interface ComponentNode {
  name: string;         // PascalCase component name
  tag: string;          // Source HTML tag (header, nav, section, etc.)
  element: Element;     // Reference to Cheerio/domhandler element
  children: ComponentNode[];
  isRepeated: boolean;  // True if extracted from repeated pattern
  repeatCount?: number; // How many times this pattern appears
}

interface SplitResult {
  root: ComponentNode;
  components: ComponentNode[]; // Flat list of all components
}
```

### PipelineContext Extension
```typescript
interface PipelineContext {
  // Existing fields
  html: string;
  filePath: string;
  $?: CheerioAPI;
  code?: string;
  outputPath?: string;
  warnings: string[];
  errors: string[];
  options: ConvertOptions;

  // New fields for Phase 2
  componentTree?: SplitResult;
  components?: ComponentOutput[];  // Per-component code
  cssFiles?: CSSOutput[];          // Generated CSS files
}

interface ComponentOutput {
  name: string;
  code: string;
  path: string;
}

interface CSSOutput {
  name: string;
  css: string;
  path: string;
}
```

### CSS Property Classification
```typescript
// Inheritable properties (not extracted — rely on native inheritance)
const INHERITABLE_PROPS = new Set([
  'color', 'font', 'font-family', 'font-size', 'font-style',
  'font-weight', 'font-variant', 'line-height', 'letter-spacing',
  'text-align', 'text-indent', 'text-transform', 'white-space',
  'word-spacing', 'visibility', 'cursor',
]);

// Non-inheritable (always extracted)
const NON_INHERITABLE_PROPS = new Set([
  'background', 'background-color', 'border', 'border-radius',
  'padding', 'margin', 'width', 'height', 'display', 'position',
  'top', 'right', 'bottom', 'left', 'overflow', 'z-index',
  'flex', 'flex-direction', 'align-items', 'justify-content',
  'box-shadow', 'transform', 'transition', 'animation',
]);
```

</specifics>

<deferred>
## Deferred Ideas

- **SPL-06:** Non-semantic `<div>` splitting by class/ID — deferred to Phase 4
- **`--json` flag** for component tree output — not in Phase 2 scope
- **Interactive TUI tree** — beyond v1 scope
- **Tailwind CSS inference** — v2+ feature

---

*Phase: 02-component-splitting-css*
*Context gathered: 2026-05-21 via inline discuss*