---
phase: 1
slug: core-cli-jsx
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-21
---

# Phase 1 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                               |
| ---------------------- | --------------------------------------------------- |
| **Framework**          | vitest 3.x                                           |
| **Config file**        | vitest.config.ts (Wave 0 installs)                   |
| **Quick run command**  | `npm run test -- --changed`                          |
| **Full suite command** | `npm test`                                           |
| **Estimated runtime**  | ~15 seconds                                          |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --changed`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID   | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status    |
| --------- | ---- | ---- | ----------- | --------- | ----------------- | ----------- | --------- |
| 1-01-01   | 01   | 1    | CLI-01      | unit      | `npm test -- --grep "CLI"` | ❌ W0 | ⬜ pending |
| 1-01-02   | 01   | 1    | CLI-04      | unit      | `npm test -- --grep "help"` | ❌ W0 | ⬜ pending |
| 1-01-03   | 01   | 1    | CLI-05      | unit      | `npm test -- --grep "version"` | ❌ W0 | ⬜ pending |
| 1-01-04   | 01   | 1    | CLI-06      | unit      | `npm test -- --grep "error"` | ❌ W0 | ⬜ pending |
| 1-02-01   | 02   | 1    | JSX-01      | unit      | `npm test -- --grep "className"` | ❌ W0 | ⬜ pending |
| 1-02-02   | 02   | 1    | JSX-02      | unit      | `npm test -- --grep "htmlFor"` | ❌ W0 | ⬜ pending |
| 1-02-03   | 02   | 1    | JSX-03      | unit      | `npm test -- --grep "boolean"` | ❌ W0 | ⬜ pending |
| 1-02-04   | 02   | 1    | JSX-04      | unit      | `npm test -- --grep "style"` | ❌ W0 | ⬜ pending |
| 1-02-05   | 02   | 1    | JSX-05      | unit      | `npm test -- --grep "void"` | ❌ W0 | ⬜ pending |
| 1-02-06   | 02   | 1    | JSX-06      | unit      | `npm test -- --grep "self-closing"` | ❌ W0 | ⬜ pending |
| 1-02-07   | 02   | 1    | JSX-07      | unit      | `npm test -- --grep "svg"` | ❌ W0 | ⬜ pending |
| 1-02-08   | 02   | 1    | JSX-08      | unit      | `npm test -- --grep "event"` | ❌ W0 | ⬜ pending |
| 1-02-09   | 02   | 1    | JSX-09      | unit      | `npm test -- --grep "hyphen"` | ❌ W0 | ⬜ pending |
| 1-02-10   | 02   | 1    | JSX-10      | unit      | `npm test -- --grep "tsx"` | ❌ W0 | ⬜ pending |
| 1-02-11   | 02   | 1    | JSX-11      | unit      | `npm test -- --grep "no-typescript"` | ❌ W0 | ⬜ pending |
| 1-02-12   | 02   | 1    | CFG-02      | unit      | `npm test -- --grep "default-tsx"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` - vitest setup
- [ ] `test/fixtures/simple.html` - basic HTML fixture for attribute tests
- [ ] `test/fixtures/svg.html` - SVG fixture for camelCase tests
- [ ] `test/fixtures/void-elements.html` - void element fixture
- [ ] `test/fixtures/style-attributes.html` - inline style fixture
- [ ] `test/fixtures/empty.html` - empty HTML edge case
- [ ] `test/engine/transform.test.ts` - attribute mapping tests (stubs)
- [ ] `test/engine/generator.test.ts` - code generation tests (stubs)
- [ ] `test/pipeline/pipeline.test.ts` - pipeline integration tests (stubs)
- [ ] `test/cli/cli.test.ts` - CLI integration tests (stubs)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
| -------- | ----------- | ---------- | ----------------- |
| End-to-end CLI run | CLI-01, CLI-02 | Requires actual file I/O | `node bin/h2ui.js convert test/fixtures/simple.html --out /tmp/test-output` and check `/tmp/test-output/*.tsx` |
| --no-typescript flag | CLI-03, JSX-11 | File extension check | `node bin/h2ui.js convert test/fixtures/simple.html --out /tmp/test-output --no-typescript` and verify `.jsx` extension |
| --strict mode | CLI-06, D-06 | Exit code verification | `node bin/h2ui.js convert test/fixtures/malformed.html --strict` and expect non-zero exit |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending