# h2ui

## What This Is

A CLI tool that converts high-fidelity HTML into reusable React components. Input a full HTML page, and h2ui outputs a component tree (separate TSX/JSX files) with extracted CSS. Built for frontend developers who need to quickly turn static HTML prototypes or design exports into clean, modular component code.

## Core Value

Take any HTML page and produce production-ready React components with properly extracted styles — in one command.

## Requirements

### Validated

- [x] HTML file input via CLI argument *(Phase 1)*
- [x] Parse full HTML page AST *(Phase 1)*
- [x] Output React TSX/JSX components (configurable format) *(Phase 1)*

### Active

- [ ] Identify semantic component boundaries (header, nav, section, footer, etc.)
- [ ] Split HTML into component tree with separate output files
- [ ] Extract CSS and generate reusable CSS Modules
- [ ] Component naming and optimization via configurable LLM provider
- [ ] npm package with npx and global install support
- [ ] Config file support (LLM provider/API key, output preferences)

### Out of Scope

- WYSIWYG editor / GUI — CLI only for v1
- Runtime transformation — build-time / offline conversion only
- Two-way sync (HTML → Component → Back to HTML) — one-way conversion
- Framework-agnostic output — React-only for v1 (Vue/Svelte etc. deferred)

## Context

Phase 1 complete (2026-05-21) — CLI + attribute conversion pipeline built and verified. Ready for Phase 2: component splitting + CSS extraction.

Started as a personal project to explore combining AST parsing with LLM augmentation for code generation. The hybrid approach (rules for structure + LLM for naming/semantics) aims for deterministic component splitting with intelligent naming.

## Constraints

- **Tech Stack**: Node.js / TypeScript — natural fit for CLI tooling and AST manipulation
- **Distribution**: npm package — publishable as CLI and library
- **LLM Dependency**: Conversion quality depends on LLM; provider must be configurable and offline-fallback capable

## Key Decisions

| Decision | Rationale | Outcome |
| -------- | --------- | ------- |
| Name: h2ui | Short, framework-agnostic, npm-friendly | - Pending |
| CLI-first | Fits developer workflows, composable with other tools | - Pending |
| Hybrid: Rules + LLM | Rule engine ensures deterministic structure; LLM refines naming/semantics | - Pending |
| CSS Modules | Standard React pattern, no extra runtime deps | - Pending |
| Configurable LLM provider | Users bring their own model (OpenAI, Ollama, etc.) | - Pending |
| Component tree splitting | Semantic HTML tags (header/nav/section/footer) → component hierarchy | - Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-21 after initialization*