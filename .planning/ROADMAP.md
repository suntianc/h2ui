# Roadmap: h2ui

**Defined:** 2026-05-21
**Phases:** 4
**v1 Requirements:** 32
**Coverage:** 32/32 mapped

## Phase 1: Core CLI + HTML→JSX/TSX Pipeline (completed 2026-05-21)

**Goal:** Working CLI that converts basic HTML to valid React TSX/JSX and writes files

**Rationale:** Foundation — without reliable parsing and attribute conversion, nothing else works. This establishes the pipeline architecture and CLI interface that all later phases build on.

**Requirements:**

- CLI-01, CLI-02, CLI-03, CLI-04, CLI-05, CLI-06
- JSX-01, JSX-02, JSX-03, JSX-04, JSX-05, JSX-06, JSX-07, JSX-08, JSX-09, JSX-10, JSX-11
- CFG-02

**Total requirements: 18**

**Success criteria:**

1. User can run `h2ui input.html --out ./components` and get TSX files written to disk
2. `class` → `className`, `style="..."` → `style={{...}}`, `for` → `htmlFor` all work
3. Void elements render as self-closing `<br />`
4. SVG attributes are properly camelCased
5. `--no-typescript` generates `.jsx` instead of `.tsx`
6. Invalid file paths show meaningful error messages
7. Pipeline architecture is in place — steps are independently testable

**Avoids pitfall:** Broken attribute conversion (Pitfall 4), Self-closing tags (Pitfall 5)

**Stack additions:** Cheerio, commander, TypeScript, Prettier, vitest

---

## Phase 2: Component Splitting + CSS Extraction (completed 2026-05-21)

**Goal:** Split HTML into component tree and extract styles to CSS Modules

**Rationale:** Core differentiators. This is where h2ui separates from existing tools like html-to-react-components (which requires manual `data-component` markers) and Magic Patterns (inline styles only). Auto-splitting + CSS Modules = production-ready output.

**Requirements:**

- SPL-01, SPL-02, SPL-03, SPL-04, SPL-05, SPL-06
- CSS-01, CSS-02, CSS-03, CSS-04, CSS-05, CSS-06, CSS-07

**Total requirements: 13**

**Success criteria:**

1. `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>` each become separate component files
2. Parent components import child components with proper paths
3. Repeated card-like structures are extracted as reusable components
4. Inline `style="..."` is extracted to `.module.css` files
5. Only explicitly-set CSS properties appear in output (no inherited fluff)
6. Shared styles are deduplicated; shorthand properties condensed
7. Component tree is displayed in console after conversion

**Avoids pitfall:** Flat HTML output (Pitfall 3), Naive CSS extraction (Pitfall 2)

**Stack additions:** css-tree

---

## Phase 3: Configuration + Polish (completed 2026-05-21)

**Goal:** Config file support and DX improvements

**Rationale:** Tool needs to be configurable for real-world use. Config file allows teams to standardize settings. Polish makes the tool pleasant to use.

**Requirements:**

- CFG-01

**Plus from v2 backlog (moved to Phase 3):**

- Progress spinners during conversion
- Colorized output
- Component tree preview
- Better error messages with suggestions

**Total requirements: 1 (+ polish work)**

**Success criteria:**

1. User can create `.h2uirc` with custom defaults
2. CLI flags override config file values
3. Conversion shows nice terminal output with progress
4. Error messages include actionable suggestions

**Stack additions:** chalk, ora, cosmiconfig (for config file loading)

---

## Phase 4: LLM Integration

**Goal:** Optional LLM pass for smarter component naming and cleanup suggestions

**Rationale:** Enhancement layer. The tool works perfectly without LLM — this just makes output smarter. Configurable provider ensures no vendor lock-in.

**Requirements:** (v2 requirements)

- LLM-01, LLM-02, LLM-03, LLM-04, LLM-05
- SPL-06 (non-semantic splitting by class/ID)

**Total requirements: 6**

**Plans:** 3 plans

Plans:
**Wave 1**

- [ ] 04-01-PLAN.md — SPL-06 + LLM foundation (config types, provider factories, token utilities, Zod schemas)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 04-02-PLAN.md — LLM review service + pipeline step

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 04-03-PLAN.md — CLI integration (--llm flag, config merge, suggestion display)

**Success criteria:**

1. `--llm` flag invokes optional LLM pass
2. Component names are context-appropriate (not just "Header", "Section")
3. Multiple LLM providers work (OpenAI, Anthropic, Ollama)
4. Token estimation shown before API call
5. Tool works identically without LLM — no regression

**Avoids pitfall:** Over-relying on LLM (Pitfall 1), LLM cost surprises (Pitfall 6)

**Stack additions:** openai, @anthropic-ai/sdk, zod (^3.23.8), tiktoken

---

## Phase Dependency Graph

```
Phase 1 (Core CLI + JSX)
    │
    ▼
Phase 2 (Splitting + CSS) ──depends on── Phase 1 pipeline
    │
    ▼
Phase 3 (Config + Polish) ──depends on── Phase 1 CLI structure
    │
    ▼
Phase 4 (LLM) ──depends on── Phase 1+2 output structure
```

**Note:** Phase 3 can run in parallel with Phase 2 if needed — config file loading is independent of component splitting.

## Out of Scope for v1 Roadmap

| Feature | When | Why |
|---------|------|-----|
| Multi-framework (Vue, Svelte) | v2+ | React-only focus for v1 |
| Batch conversion | v1.x | Single-file conversion first |
| Watch mode | v1.x | Manual re-run for v1 |
| Tailwind inference | v2+ | CSS Modules first |
| LLM caching (LLM-05) | rejected | D-06 decision: no caching — each conversion triggers fresh LLM call |

---
*Roadmap created: 2026-05-21*
**UI hint:** No (CLI tool, no visual UI)
