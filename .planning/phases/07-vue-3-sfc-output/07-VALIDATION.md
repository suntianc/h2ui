---
phase: 07
slug: vue-3-sfc-output
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-23
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (existing project test runner) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run tests/vue.test.ts`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-W1-T1 | 01 | 1 | VUE-01 | T-07-01 | N/A (CLI flag) | unit | `vitest run tests/vue.test.ts -t "framework vue3"` | ❌ W0 | ⬜ pending |
| 07-W1-T2 | 01 | 1 | VUE-02 | — | N/A (file gen) | unit | `vitest run tests/vue.test.ts -t "SFC structure"` | ❌ W0 | ⬜ pending |
| 07-W1-T3 | 01 | 1 | VUE-03 | T-07-01 | No XSS via template | unit | `vitest run tests/vue.test.ts -t "event binding"` | ❌ W0 | ⬜ pending |
| 07-W1-T4 | 01 | 1 | VUE-04 | — | N/A (CSS output) | unit | `vitest run tests/vue.test.ts -t "scoped css"` | ❌ W0 | ⬜ pending |
| 07-W1-T5 | 01 | 1 | VUE-05 | — | N/A (file gen) | unit | `vitest run tests/vue.test.ts -t "script setup"` | ❌ W0 | ⬜ pending |
| 07-W1-T6 | 01 | 1 | VUE-06 | — | N/A (split logic) | unit | `vitest run tests/vue.test.ts -t "component split"` | ❌ W0 | ⬜ pending |
| 07-W1-T7 | 01 | 1 | VUE-07 | T-07-02 | No arbitrary file write | unit | `vitest run tests/vue.test.ts -t "child imports"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/vue.test.ts` — stubs for VUE-01 through VUE-07
- [ ] `tests/fixtures/vue/` — sample HTML for Vue conversion tests
- [ ] `npm install prettier-plugin-vue@1.1.6` — Vue SFC formatting (human-verify: prettier-plugin-vue compatibility with TypeScript `<script setup>`)
- [ ] Verify `prettier-plugin-vue` handles `lang="ts"` in `<script setup>` correctly

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| D-04 `components: { Child }` pattern | VUE-07 | D-04 may be legacy Vue 2 syntax; Vue 3 `<script setup>` auto-registers components | Generate Vue output, verify child component renders without explicit `components: {}` |
| global.css integration | D-09 | CSS reset/fonts global styles | Verify `global.css` is generated alongside `.vue` files |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** {pending / approved YYYY-MM-DD}
