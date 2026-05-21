---
plan: 02
phase: 01-core-cli-jsx
status: complete
completed: 2026-05-21
commits:
  - 1d253ee feat(02-01): build attribute mapping and style parser
  - 39ae092 feat(02-02): build pipeline steps and utilities
  - aff62df fix(02-03): add standard SVG attributes to silent pass-through
  - 6e80964 fix(02-03): derive component name from input filename
---

# Plan 02 Summary: HTML→JSX/TSX Pipeline

## What was built

- Complete HTML→JSX/TSX conversion pipeline (parse → convert → generate)
- HTML attribute mapping engine (class→className, for→htmlFor, event handlers, boolean attrs, SVG camelCase)
- CSS inline style parser (camelCase keys, vendor prefix support)
- Void element detection and self-closing tag formatting
- Cheerio-based HTML parser with error handling
- Prettier-based code formatting
- File output utilities (PascalCase naming, .tsx/.jsx extension)
- Pipeline integrated into CLI convert command

## Key decisions

- Component name derived from input filename (`simple.html` → `Simple`)
- Pipeline imports in convert command are lazy (dynamic) to keep CLI self-contained
- Standard attributes pass through silently without warnings
- Unknown attributes get a warning but are kept as-is

## Verification results

- ✅ `tsc --noEmit` — compiles cleanly
- ✅ `simple.html` → TSX with className, htmlFor, style={{, onClick, br/, img/
- ✅ `svg.html` → camelCase SVG attributes (strokeWidth, fillOpacity)
- ✅ `--no-typescript` → outputs .jsx (no interface Props)
- ✅ `empty.html` → exits 0 with minimal output
- ✅ `nonexistent.html` → "File not found" error
- ✅ Output contains `export default ${PascalCaseName}`
- ✅ All 25 tests passing