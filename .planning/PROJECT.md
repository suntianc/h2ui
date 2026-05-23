# h2ui

## What This Is

A CLI tool that converts high-fidelity HTML into reusable React components. Input a full HTML page, and h2ui outputs a component tree (separate TSX/JSX files) with extracted CSS. Built for frontend developers who need to quickly turn static HTML prototypes or design exports into clean, modular component code.

## Core Value

Take any HTML page and produce production-ready React components with properly extracted styles — in one command.

## Current State (v1.0 SHIPPED)

**Status:** v1.0 MVP complete — 2026-05-22
**Tech Stack:** Node.js, TypeScript, Cheerio, css-tree, OpenAI/Anthropic SDK, Vite, WebSocket
**Lines of Code:** ~7000+ TypeScript across 355 files

### Validated Requirements (v1.0)

- [x] HTML file input via CLI argument
- [x] Parse full HTML page AST
- [x] Output React TSX/JSX components (configurable format)
- [x] Smart component boundary detection (header, nav, section, footer, etc.)
- [x] Split HTML into component tree with separate output files
- [x] Extract CSS and generate reusable CSS Modules
- [x] Component naming and optimization via configurable LLM provider
- [x] Config file support (`.h2uirc`, LLM provider/API key, output preferences)
- [x] Browser preview server with live reload
- [x] LLM HTML fidelity validation

## Current Milestone: v1.1

**Goal:** Extend h2ui with batch processing, Vue 3 support, and autonomous agent repair

**Target features:**
- Batch conversion with glob pattern — `h2u "src/**/*.html"`
- Vue 3 + TypeScript output — generate `.vue` single file components
- Full autonomous Agent — self-planning, tool-calling, verification and fixing loop

## Active (Next Milestone)

- [ ] Batch conversion with glob pattern — `h2u "src/**/*.html"`
- [ ] Vue 3 + TypeScript output — generate `.vue` single file components
- [ ] Full autonomous Agent — self-planning, tool-calling, verification and fixing loop

## Out of Scope

| Feature | When | Why |
|---------|------|-----|
| WYSIWYG / GUI | — | CLI-only tool |
| Runtime DOM conversion | — | Build-time / offline conversion only |
| Two-way sync (HTML ↔ React) | — | One-way conversion |
| Multi-framework (Svelte, Solid) | v2+ | Vue 3 added in v1.1 |
| Tailwind CSS inference | v2+ | CSS Modules first |

## Context

v1.0 shipped in 1 day (2026-05-21 → 2026-05-22) with 16 plans across 6 phases. v1.1 planning started 2026-05-23.

## Key Decisions

| Decision | Rationale | Status |
| -------- | --------- | ------ |
| Name: h2ui | Short, framework-agnostic, npm-friendly | ✅ |
| CLI-first | Fits developer workflows, composable with other tools | ✅ |
| Hybrid: Rules + LLM | Rule engine ensures deterministic structure; LLM refines naming/semantics | ✅ |
| CSS Modules | Standard React pattern, no extra runtime deps | ✅ |
| Configurable LLM provider | Users bring their own model (OpenAI, Anthropic, Ollama) | ✅ |
| Component tree splitting | Semantic HTML tags → component hierarchy | ✅ |
| No LLM caching | D-06: fresh call per conversion | ✅ |
| Graceful LLM degradation | D-10: tool works without LLM | ✅ |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-23 — v1.1 milestone started*
