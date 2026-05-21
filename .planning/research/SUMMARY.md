# Project Research Summary

**Project:** h2ui
**Domain:** HTML-to-React Component Conversion CLI Tool
**Researched:** 2026-05-21
**Confidence:** HIGH

## Executive Summary

h2ui is a CLI tool that converts high-fidelity HTML into production-ready React components. Research reveals this is a well-understood problem with existing tools, but none combine automatic component splitting, CSS Module extraction, and optional LLM enhancement in a CLI-first package.

The recommended approach is **hybrid**: a rule-based pipeline (Cheerio AST parsing with comprehensive HTML→JSX attribute mapping) handles 100% of structural conversion deterministically. An optional LLM pass (configurable provider: OpenAI/Anthropic/Ollama) enhances component naming and suggests optimizations. CSS extraction must be done carefully — the biggest risk is generating bloated output by including too many computed styles (a documented pitfall from Magic Patterns).

Key risks: (1) over-relying on LLM for structural work (unreliable), (2) generating massive components without proper semantic splitting (defeats the purpose of React), (3) CSS extraction that produces unreadable inline styles instead of proper CSS Modules.

### Recommended Stack

**Core technologies:**
- Node.js 22 + TypeScript 5 — standard for CLI tooling
- Cheerio — HTML AST parsing (27.6k stars, jQuery-like API)
- commander — CLI framework
- Prettier — generated code formatting
- css-tree — CSS parsing for CSS Module extraction

### Expected Features

**Must have (table stakes):**
- CLI file input with output to disk
- HTML→JSX attribute conversion (class→className, style objects, etc.)
- TSX/JSX output option
- Semantic component splitting

**Should have (competitive):**
- Automatic component splitting (vs. manual `data-component` markers)
- CSS extraction to CSS Modules
- Hybrid rules + LLM approach

**Defer (v2+):**
- Multi-framework support (Vue, Svelte, Solid)
- Batch conversion, watch mode

### Architecture Approach

Pipeline architecture with these sequential steps: Parse → Split → Transform → CSS → (optional LLM) → Generate. Each step produces a PipelineContext consumable by the next step. Engines are independently testable.

**Major components:**
1. Parser Engine (Cheerio AST)
2. Splitter Engine (semantic HTML boundary detection)
3. Transform Engine (HTML→JSX attribute mapping)
4. CSS Engine (inline→CSS Module extraction)
5. LLM Provider (optional, configurable)
6. Generator Engine (TSX/JSX file output)

### Critical Pitfalls

1. **Over-relying on LLM** — structure must be rule-based; LLM only for naming
2. **Naive CSS extraction** — must filter to explicitly-set properties only (Magic Patterns had 200+ props per element)
3. **Flat HTML output** — must split into component tree, not one giant file
4. **Broken attribute conversion** — need complete HTML→JSX mapping, not just class→className
5. **LLM cost surprises** — must be optional, with token estimation and fallback

## Implications for Roadmap

### Phase 1: Core CLI + HTML→JSX Conversion
**Rationale:** Foundation — parse HTML, convert attributes, output basic JSX
**Delivers:** Working CLI that converts simple HTML to React
**Addresses:** CLI input, attribute conversion, file output
**Avoids:** Overcomplication in v1

### Phase 2: Component Splitting + CSS Extraction
**Rationale:** Core differentiators — semantic splitting and CSS Modules
**Delivers:** Component tree output with CSS Modules
**Addresses:** Auto component splitting, CSS extraction
**Uses:** Cheerio AST, css-tree
**Avoids:** Flat output (Pitfall 3), naive CSS (Pitfall 2)

### Phase 3: LLM Integration + Polish
**Rationale:** Enhancement layer on top of working core
**Delivers:** Smarter component naming, optional AI optimization
**Addresses:** LLM provider interface, component naming
**Avoids:** LLM dependency (Pitfall 1), cost surprises (Pitfall 5)

### Phase 4: Extensibility + Multi-framework Prep
**Rationale:** Plugin system and framework architecture
**Delivers:** Extensible output backends
**Addresses:** Framework-agnostic architecture

### Phase Ordering Rationale
- Phase 1 establishes the backbone — without reliable attribute conversion, nothing else works
- Phase 2 is the primary value proposition — this is where h2ui differentiates from existing tools
- Phase 3 enhances without depending on LLM for core functionality
- Phase 4 opens the door for Vue/Svelte/Solid support

### Research Flags
- **Phase 2:** CSS extraction needs careful design — research getComputedStyle alternatives for non-browser contexts
- **Phase 3:** LLM prompt engineering for component naming needs experimentation

## Confidence Assessment

| Area | Confidence | Notes |
| ---- | ---------- | ----- |
| Stack | HIGH | Well-established libraries with large communities |
| Features | HIGH | Clear mapping from existing tools and documented pain points |
| Architecture | HIGH | Pipeline pattern proven in similar projects |
| Pitfalls | HIGH | Documented by Magic Patterns and Anima in production use |

**Overall confidence:** HIGH

### Gaps to Address

- CSS extraction in CLI (non-browser) context: without a browser environment, `getComputedStyle` isn't available in jsdom. Strategy: extract from inline `style` attributes and `<style>` tags using css-tree. jsdom can provide computed styles if needed for full-page CSS.
- Attribute mapping completeness: needs a full audit of React-specific DOM differences.

## Sources

### Primary (HIGH confidence)
- [Cheerio (27.6k stars)](https://github.com/cheeriojs/cheerio) — HTML AST parser
- [html-to-react-components (2.2k stars)](https://github.com/roman01la/html-to-react-components) — Existing CLI with `data-component` approach
- [Magic Patterns blog](https://www.magicpatterns.com/blog/any-website-to-react-component) — CSS extraction optimization techniques
- [Anima LLM code generation](https://www.animaapp.com/blog/product-updates/enhancing-reactjs-code-generation-with-llms/) — Hybrid rule+LLM architecture

### Secondary (MEDIUM confidence)
- [react-from-html](https://github.com/measuredco/react-from-html) — Runtime DOM hydration (different use case)
- [css-tree](https://github.com/csstree/csstree) — CSS AST parser

---
*Research completed: 2026-05-21*
*Ready for roadmap: yes*