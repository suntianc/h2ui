---
phase: 1
slug: core-cli-jsx
status: passed
verified: 2026-05-21
verifier: manual
---

# Phase 1 Verification: Core CLI + HTML→JSX/TSX Pipeline

## Goal Achievement

> Working CLI that converts basic HTML to valid React TSX/JSX and writes files

## Success Criteria Verification

| # | Criteria | Result | Evidence |
|---|----------|--------|----------|
| 1 | `h2ui input.html --out ./components` TSX files written | ✅ | `npx tsx src/cli/index.ts convert test/fixtures/simple.html --out /tmp/test-v5` → `/tmp/test-v5/Simple.tsx` |
| 2 | `class`→`className`, `style`→`{{}}`, `for`→`htmlFor` | ✅ | Output has `className="container"`, `style={{ color: 'red', fontSize: '16px' }}`, `htmlFor="email-input"` |
| 3 | Void elements self-close `<br />` | ✅ | Output has `<br />`, `<hr />`, `<img ... />`, `<input ... />` |
| 4 | SVG attributes camelCased | ✅ | `strokeWidth`, `fillOpacity`, `strokeDasharray`, `viewBox` |
| 5 | `--no-typescript` → `.jsx` | ✅ | Output file `Simple.jsx` without `interface Props {}` |
| 6 | Invalid paths show error | ✅ | `nonexistent.html` → `✗ File not found: nonexistent.html` (exit 1) |
| 7 | Pipeline architecture in place | ✅ | `Pipeline` class with `addStep`/`run`, 3 independent steps (parse, convert, generate) |

## Automated Test Suite

- **25/25 tests passing** (`npm test`)
- **3 test files**: CLI (7), Engine/Transform (14), Pipeline (4)
- **TypeScript**: `tsc --noEmit` compiles cleanly
- **Test fixtures**: 6 HTML fixtures covering all attribute types

## Manual Verifications

| Check | Command | Result |
|-------|---------|--------|
| End-to-end CLI | `npx tsx src/cli/index.ts convert test/fixtures/simple.html --out /tmp/t` | ✅ Writes formatted TSX |
| --no-typescript | `npx tsx src/cli/index.ts convert test/fixtures/simple.html --out /tmp/t --no-typescript` | ✅ Outputs .jsx |
| --strict | (No test fixture with warnings currently) | ⏭️ Edge case |
| --help | `npx tsx src/cli/index.ts --help` | ✅ Shows convert, init commands |
| --version | `npx tsx src/cli/index.ts --version` | ✅ Shows 1.0.0 |
| h2ui init | `npx tsx src/cli/index.ts init` | ✅ Creates .h2uirc |

## Verified Requirements

| ID | Description | Status |
|----|-------------|--------|
| CLI-01 | `h2ui convert <file>` accepts HTML file argument | ✅ |
| CLI-02 | Output written to disk | ✅ |
| CLI-03 | `--out` flag overrides output directory | ✅ |
| CLI-04 | `--help` shows help text | ✅ |
| CLI-05 | `--version` shows version | ✅ |
| CLI-06 | Invalid file paths show error | ✅ |
| CFG-02 | Default output is `.tsx` | ✅ |
| JSX-01 | `class` → `className` | ✅ |
| JSX-02 | `for` → `htmlFor` | ✅ |
| JSX-03 | Boolean attributes | ✅ |
| JSX-04 | `style` string → object | ✅ |
| JSX-05 | Void elements self-close | ✅ |
| JSX-06 | No-child elements self-close | ✅ |
| JSX-07 | SVG camelCase | ✅ |
| JSX-08 | Event handlers (`onclick`→`onClick`) | ✅ |
| JSX-09 | Hyphenated attributes camelCased | ✅ |
| JSX-10 | Default `.tsx` output | ✅ |
| JSX-11 | `--no-typescript` → `.jsx` | ✅ |

**Phase 1: PASSED** — All 18 requirements verified.