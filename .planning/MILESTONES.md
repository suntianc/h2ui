# Milestones

## v1.0 MVP — 2026-05-22

**Status:** ✅ SHIPPED
**Phases:** 1-05.1 (6 phases)
**Plans:** 16 total
**Requirements:** 36/39 complete (1 rejected, 2 deferred to v2)

### Accomplishments

1. Complete CLI tool with HTML → TSX/JSX conversion (attribute conversion, SVG handling, void elements)
2. Smart component splitting with semantic tag detection + CSS Modules extraction with shared style deduplication
3. Configuration file support (cosmiconfig), colored terminal output, Levenshtein error suggestions
4. LLM integration with OpenAI/Anthropic/Ollama providers, token estimation, Zod schemas
5. Browser hot-reload preview server (Vite + WebSocket) with component tree visualization
6. Unified LLM Fidelity step (merged review+modify+fidelity), CLI simplified (--type, --llm)

### Key Decisions

- D-06: No LLM caching — fresh call per conversion
- D-10: Graceful degradation when LLM unavailable
- D-11: Fallback behavior preserved

### Known Deferred

- Multi-framework support (Vue/Svelte) — v2
- Tailwind inference — v2
- Batch conversion, watch mode — v1.x

---
