# Phase 07: Vue 3 SFC Output - Research

**Researched:** 2026-05-23
**Domain:** Vue 3 Single-File Component generation
**Confidence:** HIGH

## Summary

Phase 07 extends the existing h2ui pipeline to support Vue 3 SFC output via `--framework vue3` flag. The architecture follows the established React/TSX pattern: AST parsing -> semantic splitting -> Vue template conversion -> SFC file generation. Key differences from React: `class` not `className`, `for` not `htmlFor`, `@click` not `onClick`, `<style scoped>` not CSS Modules, and Vue's `defineProps` generic syntax. The pipeline adds a framework-aware renderer that outputs `.vue` files with three blocks: `<template>`, `<script setup lang="ts">`, and `<style scoped>`.

**Primary recommendation:** Add `framework: 'react' | 'vue3'` to `ConvertOptions`, create a Vue-specific render function in `convert.ts` (or separate file), and update `generate.ts` to write `.vue` files with proper SFC structure instead of `.tsx/.jsx`.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** HTML events → `@` prefix: `onclick` → `@click`, `oninput` → `@input`, `onblur` → `@blur`
- **D-02:** No dynamic `:onclick` binding (static event handlers only unless computed property)
- **D-03:** Boolean attrs use `:binding`: `:disabled`, `:checked`, `:readonly`
- **D-04:** Child components: `import Child from './Child.vue'` + `components: { Child }`
- **D-05:** Props use `defineProps` generic: `defineProps<{ title: string; items?: string[] }>()`
- **D-06:** `<script setup lang="ts">` — Vue 3 Composition API
- **D-07:** Full TypeScript, no JavaScript fallback
- **D-08:** `<style scoped>` — Vue scoped CSS
- **D-09:** Global styles (CSS reset, fonts) → separate `global.css`

### Integration Points (from CONTEXT.md)
- `src/pipeline/steps/generate.ts` — current React TSX/JSX output; Vue needs new renderer
- `src/pipeline/steps/convert.ts` — AST-to-JSX conversion; similar for AST-to-Vue-template
- `src/engine/splitter/index.ts` — semantic boundary detection; reusable for Vue
- `src/engine/css/index.ts` — CSS extraction; output format for `<style scoped>`

### Deferred Ideas
None — all Vue SFC scope items addressed in discussion.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VUE-01 | `--framework vue3` flag outputs `.vue` SFC | Add `framework` to `ConvertOptions`; conditional renderer selection |
| VUE-02 | `.vue` files contain `<template>`, `<script setup lang="ts">`, `<style scoped>` | Vue SFC spec: three-block structure confirmed |
| VUE-03 | HTML attrs → Vue template syntax (`class`, `@click`, `for`) | D-01, D-02, D-03 locked; no `className`/`htmlFor` conversion |
| VUE-04 | `style` attrs → `<style scoped>` with CSS Modules naming | `cssStep` output redirected into SFC `<style scoped>` block |
| VUE-05 | Vue 3 Composition API (`<script setup lang="ts">`) | D-06, D-07: TypeScript-only, no JS fallback |
| VUE-06 | Semantic boundary splitting same as React | `splitStep` reusable; only render format changes |
| VUE-07 | Child components via Vue `import` statement | D-04: `import` + `components: { Child }` pattern |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Vue SFC file generation | `generate.ts` | — | Writes `.vue` files; conditional on `framework` option |
| Vue template rendering | `convert.ts` | — | AST-to-Vue-template conversion; distinct from JSX rendering |
| CSS extraction | `cssStep` | — | Reusable; output format changes from `.module.css` to `<style scoped>` |
| Semantic boundary detection | `splitStep` | — | Fully reusable; no framework-specific logic |
| CLI flag handling | `convert.ts` command | — | `--framework vue3` parsed at CLI layer |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue 3 | 3.x | Framework | [ASSUMED] Target output format |
| TypeScript | 5.x | Type safety in `<script setup lang="ts">` | D-07: full TypeScript, no JS fallback |

### Formatting
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `prettier` | ^3.8.3 | Code formatting | Already in project dependencies |
| `prettier-plugin-vue` | 1.1.6 | `.vue` SFC formatting | [ASSUMED] Official Vue community plugin; last updated 2023 |

**Installation:**
```bash
npm install prettier-plugin-vue@1.1.6
```

**Version verification:** `prettier-plugin-vue` confirmed on npm at v1.1.6 (published 2023-02-12) [ASSUMED: no slopcheck available]

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `prettier-plugin-vue` | Manual SFC string assembly without formatting | Plugin is dated (2023) but handles `.vue` block structure; manual formatting requires replicating plugin logic |
| `<style scoped>` | CSS Modules (`$style` object) | D-08 locks to scoped CSS; simpler for users, no extra template syntax |

## Package Legitimacy Audit

> **Required** per protocol. slopcheck unavailable at research time — all packages tagged `[ASSUMED]`.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| prettier-plugin-vue | npm | ~3 yrs | unknown | github.com/vuejs/prettier-plugin-vue | [ASSUMED] | Flagged — planner must add `checkpoint:human-verify` before install |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none (all tagged `[ASSUMED]` due to slopcheck unavailable)
**Packages requiring human verification:** `prettier-plugin-vue` — planner inserts `checkpoint:human-verify`

## Architecture Patterns

### System Architecture Diagram

```
HTML Input
    │
    ▼
┌─────────────────────┐
│   parseStep         │  Cheerio AST
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│   splitStep         │  Component tree (reusable)
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│   convertStep       │  Framework-aware rendering
│   ├─ renderJsx()    │  React TSX (existing)
│   └─ renderVue()   │  Vue SFC template (new)
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│   cssStep           │  CSS extraction (reusable)
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│   generateStep      │  File output
│   ├─ writeTsx()     │  React .tsx (existing)
│   └─ writeVue()    │  Vue .vue (new)
└─────────────────────┘
    │
    ▼
.vue / .tsx Files
```

### Recommended Project Structure
```
src/
├── pipeline/steps/
│   ├── generate.ts       # Updated: conditional .vue/.tsx output
│   ├── convert.ts        # Updated: Vue render function added
│   └── ...
├── engine/
│   ├── splitter/         # Reusable for Vue
│   └── css/              # Reusable, output format changes
└── vue/                  # NEW: Vue-specific utilities
    └── render.ts         # Vue template rendering
```

### Pattern 1: Vue SFC File Structure
**What:** Three-block Vue single-file component
**When to use:** Every generated `.vue` file
**Example:**
```vue
<script setup lang="ts">
import { ref } from 'vue'
import Child from './Child.vue'

defineProps<{
  title: string
  items?: string[]
}>()

const count = ref(0)
</script>

<template>
  <div class="container">
    <h1>{{ title }}</h1>
    <Child />
  </div>
</template>

<style scoped>
.container {
  padding: 1rem;
}
</style>
```

### Pattern 2: Child Component Registration (D-04)
**What:** Local component registration via `import` + `components` object
**When to use:** When a parent renders child components extracted by `splitStep`
**Example:**
```typescript
import MyButton from './MyButton.vue'
import Card from './Card.vue'

// No explicit components: {} needed with <script setup>
// Components used directly as variables
</script>

<template>
  <Card>
    <MyButton>Click me</MyButton>
  </Card>
</template>
```
Note: With `<script setup>`, components are auto-registered. The `components: { Child }` pattern in D-04 may be legacy Vue 2 syntax; in Vue 3 `<script setup>`, imported components are directly usable.

### Pattern 3: Boolean Attribute Binding (D-03)
**What:** `:disabled`, `:checked`, `:readonly` dynamic boolean binding
**When to use:** HTML boolean attributes converted to Vue binding syntax
**Example:**
```vue
<!-- HTML: <input disabled> -->
<!-- Vue: -->
<input :disabled="isSubmitting" />

<!-- HTML: <input readonly> -->
<!-- Vue: -->
<input :readonly="!isEditing" />
```

### Pattern 4: Event Handler Conversion (D-01)
**What:** `onclick` → `@click`, `oninput` → `@input`
**When to use:** Every HTML event attribute conversion
**Example:**
```vue
<!-- HTML: <button onclick="handleClick()"> -->
<!-- Vue: -->
<button @click="handleClick">Click</button>

<!-- HTML: <input oninput="handleInput()"> -->
<!-- Vue: -->
<input @input="handleInput" />
```

### Anti-Patterns to Avoid
- **Using `className` instead of `class`:** Vue uses `class`, not `className`. The JSX `className` conversion must be skipped for Vue output.
- **Using `htmlFor` instead of `for`:** Vue template uses native `for` attribute.
- **Using `:onclick` for static handlers:** D-02 prohibits dynamic `:onclick` binding unless passing computed property.
- **Using `<script lang="ts">` without `setup`:** D-06 mandates `<script setup lang="ts">`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Vue SFC formatting | Custom string formatting for `.vue` files | `prettier-plugin-vue` | Handles block order, indentation, line breaks correctly |
| Vue template parsing | Custom HTML → Vue template conversion | Leverage existing `convert.ts` AST traversal with different attribute mapping | Reuses established patterns; only attribute names change |
| Scoped CSS hash generation | Custom `data-v-*` attribute injection | Vue build tool handles automatically | Vue scoped CSS relies on build-time PostCSS transform |

**Key insight:** Vue SFC generation is 90% reuse of existing pipeline with attribute-name differences. The `splitStep` and `cssStep` are framework-agnostic. Only `convert.ts` (attribute mapping) and `generate.ts` (file output format) need Vue-specific code.

## Common Pitfalls

### Pitfall 1: className / htmlFor Leakage
**What goes wrong:** Vue files contain `className` or `htmlFor` which are invalid in Vue templates.
**Why it happens:** `convert.ts` originally written for React; attribute mapper outputs JSX names.
**How to avoid:** Add `framework` parameter to `mapAllAttributes()`; skip `className`/`htmlFor` conversion when `framework === 'vue3'`.
**Warning signs:** `className=` or `htmlFor=` in generated `.vue` files.

### Pitfall 2: CSS Module Syntax in Scoped CSS
**What goes wrong:** Generated Vue files use React CSS Module `className={styles.foo}` syntax inside `<style scoped>`.
**Why it happens:** CSS extracted to `.module.css` files in React pipeline; Vue uses `<style scoped>` with direct class names.
**How to avoid:** `cssStep` must return CSS string for `<style scoped>` block, not separate `.module.css` files, when `framework === 'vue3'`.
**Warning signs:** `:global()` misuse, `$style` object references in Vue output.

### Pitfall 3: Missing Child Component Imports
**What goes wrong:** Child components not imported in parent Vue files.
**Why it happens:** `generateRootComponent()` and `generateComponentCode()` originally wrote React `import` statements.
**How to avoid:** Update import generation to produce Vue-style imports (`.vue` extension optional but explicit) and ensure `components: { Child }` pattern (if needed) is emitted.
**Warning signs:** `ReferenceError: Child is not defined` in Vue files.

### Pitfall 4: Prettier Plugin Incompatibility
**What goes wrong:** `prettier-plugin-vue` last updated 2023; may not handle TypeScript in `<script setup lang="ts">` correctly.
**Why it happens:** Plugin designed primarily for Vue 2 / JavaScript `<script>` blocks.
**How to avoid:** Use `prettier.format()` with `parser: 'vue'` for `.vue` files; consider formatting `<script setup>` content separately with TypeScript parser.
**Warning signs:** Format errors, broken SFC structure after Prettier run.

## Code Examples

### Vue Template Rendering (D-01, D-02, D-03)

```typescript
// In convert.ts — Vue-specific attribute mapping
function mapVueAttributes(attrs: Record<string, string>): string[] {
  const result: string[] = [];
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'style') {
      // style stays as inline style object (Vue accepts this)
      result.push(`style="${value}"`);
    } else if (EVENT_ATTRS.has(key)) {
      // onclick -> @click, oninput -> @input, etc.
      const vueEvent = '@' + key.slice(2); // remove 'on' prefix
      result.push(`${vueEvent}="${value}"`);
    } else if (BOOLEAN_ATTRS.has(key)) {
      // disabled, checked, readonly -> :disabled, :checked, :readonly
      result.push(`:${key}="${value}"`);
    } else if (key === 'className') {
      // Skip for Vue — use class directly
    } else if (key === 'htmlFor') {
      // Skip for Vue — use for directly
    } else {
      result.push(`${key}="${value}"`);
    }
  }
  return result;
}

const EVENT_ATTRS = new Set(['onclick', 'oninput', 'onblur', 'onfocus', 'onchange', 'onsubmit']);
const BOOLEAN_ATTRS = new Set(['disabled', 'checked', 'readonly', 'selected', 'multiple']);
```

### Vue SFC Generation (VUE-02)

```typescript
// In generate.ts — Vue SFC file output
function generateVueSFC(
  componentName: string,
  template: string,
  scriptSetup: string,
  css: string
): string {
  const blocks: string[] = [];

  if (scriptSetup) {
    blocks.push(`<script setup lang="ts">\n${scriptSetup}\n</script>`);
  }

  blocks.push(`<template>\n${template}\n</template>`);

  if (css) {
    blocks.push(`<style scoped>\n${css}\n</style>`);
  }

  return blocks.join('\n');
}
```

### Vue Props Declaration (D-05)

```typescript
// In generateComponentCode for Vue — props with generic syntax
const propsInterface = `interface Props {
  title: string;
  items?: string[];
}`;

const propsDeclaration = `const props = defineProps<{
  title: string;
  items?: string[]
}>()`;

// Or with defaults (Vue 3.3+):
// const props = withDefaults(defineProps<{ ... }>(), { ... })
```

### CSS Scoped Output (D-08)

```typescript
// In cssStep — redirect CSS output for Vue
function extractCssForVue(component: ComponentNode): string {
  const lines: string[] = [];
  const className = component.name[0].toLowerCase() + component.name.slice(1);

  const cssProps = component.cssProperties;
  if (Object.keys(cssProps).length === 0) return '';

  lines.push(`.${className} {`);
  for (const [prop, value] of Object.entries(cssProps)) {
    lines.push(`  ${prop}: ${value};`);
  }
  lines.push('}');

  return lines.join('\n');
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS Modules (`.module.css` files) | `<style scoped>` inside `.vue` | D-08 | Single file output; no separate CSS file imports |
| React `className` | Vue `class` | D-01 | No attribute name transformation needed |
| JSX event handlers (`onClick`) | Vue `@click` | D-01 | Different syntax but same concept |
| TypeScript interface Props | `defineProps<{...}>()` generic | D-05 | TypeScript-first approach similar to React |

**Deprecated/outdated:**
- Vue 2 Options API (`data()`, `methods: {}`) — D-06 locks to Composition API `<script setup>`
- CSS Modules with `$style` object — D-08 locks to `<style scoped>` with direct class names

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. Planner and discuss-phase use this to identify decisions needing user confirmation.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `prettier-plugin-vue` works with `<script setup lang="ts">` blocks | Standard Stack | Plugin may format TypeScript incorrectly; may need separate TypeScript formatting |
| A2 | Vue 3 `<script setup>` auto-registers imported components without explicit `components: {}` | Pattern 2 | D-04 may specify legacy syntax; Vue 3 `<script setup>` does not require explicit component registration |
| A3 | Vue scoped CSS uses direct class names, not `$style` object | Don't Hand-Roll | D-08 specifies `<style scoped>` with CSS Modules naming; Vue compiles scoped CSS at build time |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **D-04 `components: { Child }` pattern — necessary in Vue 3 `<script setup>`?**
   - What we know: Vue 3 `<script setup>` auto-exposes imported components to template; no explicit `components: {}` needed.
   - What's unclear: D-04 specifies `import Child + components: { Child }` pattern; this may be Vue 2 legacy syntax.
   - Recommendation: Generate Vue 3 idiomatic code (import-only, no `components: {}` registration). If user requires D-04 pattern, clarify intent.

2. **Prettier formatting for `.vue` files with TypeScript `<script setup>`**
   - What we know: `prettier-plugin-vue` v1.1.6 exists but is dated (2023).
   - What's unclear: Whether it handles `lang="ts"` in `<script setup>` correctly.
   - Recommendation: Test `prettier.format(code, { parser: 'vue' })` early; if issues arise, format script content separately with TypeScript parser.

3. **Global CSS output (`global.css`) with Vue output**
   - What we know: D-09 specifies `global.css` for global styles (CSS reset, fonts).
   - What's unclear: Should `global.css` be imported in every `.vue` file, or managed separately by user?
   - Recommendation: Generate `global.css` alongside `.vue` files; add `import '../global.css'` to root component or document as user responsibility.

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies identified beyond npm packages)

The phase extends existing TypeScript/Node.js pipeline. All required tools (Node.js, npm, TypeScript) are project devDependencies.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (existing project test runner) |
| Config file | `vitest.config.*` |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| VUE-01 | `--framework vue3` flag recognized | unit | `vitest run tests/cli.test.ts -t "framework vue3"` | ?? |
| VUE-02 | `.vue` SFC has three blocks | unit | `vitest run tests/vue.test.ts -t "SFC structure"` | ?? |
| VUE-03 | Event attrs convert to `@click` | unit | `vitest run tests/vue.test.ts -t "event binding"` | ?? |
| VUE-04 | CSS in `<style scoped>` | unit | `vitest run tests/vue.test.ts -t "scoped css"` | ?? |
| VUE-05 | `<script setup lang="ts">` present | unit | `vitest run tests/vue.test.ts -t "script setup"` | ?? |
| VUE-06 | Component splitting works | integration | `vitest run tests/vue.test.ts -t "component split"` | ?? |
| VUE-07 | Child component imports | unit | `vitest run tests/vue.test.ts -t "child imports"` | ?? |

### Wave 0 Gaps
- [ ] `tests/vue.test.ts` — covers VUE-01..VUE-07
- [ ] `tests/fixtures/` — sample HTML for Vue conversion tests
- Framework install: already in project devDependencies

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

## Security Domain

> Security enforcement enabled (no explicit `security_enforcement: false` in config).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | HTML input sanitization handled by cheerio parser; Vue template output is text |
| V4 Access Control | no | CLI tool, no auth/authz |
| V2 Authentication | no | CLI tool, no auth |
| V3 Session Management | no | CLI tool, no sessions |
| V6 Cryptography | no | No crypto operations |

### Known Threat Patterns for Vue SFC Output

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via template injection | Information Disclosure | Cheerio parses HTML; Vue auto-escapes `{{ content }}` in templates |
| Arbitrary file write | Tampering | Output path controlled by CLI `--out` flag; no path traversal in component names |

## Sources

### Primary (HIGH confidence)
- [Vue.js SFC Spec](https://vuejs.org/api/sfc-spec.html) — SFC block structure, `<script setup>` basics
- [Vue.js SFC `<script setup>`](https://vuejs.org/api/sfc-script-setup) — defineProps generic syntax, import handling
- [Vue.js SFC CSS Features](https://vuejs.org/api/sfc-css-features) — scoped CSS, CSS Modules

### Secondary (MEDIUM confidence)
- npm registry (`prettier-plugin-vue` v1.1.6) — confirmed package exists [ASSUMED: slopcheck not available]

### Tertiary (LOW confidence)
- [ASSUMED] `prettier-plugin-vue` compatibility with TypeScript `<script setup>` — needs verification
- [ASSUMED] Vue 3 `<script setup>` auto-registration of imported components — consistent with Vue 3 docs but D-04 specifies explicit `components: {}`

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM — `prettier-plugin-vue` confirmed on npm but dated; Vue SFC syntax verified against official docs
- Architecture: HIGH — extends existing pipeline with framework-conditional rendering
- Pitfalls: HIGH — common JSX-to-Vue migration issues well-documented

**Research date:** 2026-05-23
**Valid until:** 2026-06-22 (30 days for stable Vue 3 syntax; Vue 3.5+ features may evolve)
