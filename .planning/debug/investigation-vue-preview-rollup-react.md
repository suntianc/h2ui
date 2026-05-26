---
status: diagnosed
trigger: "Vue preview with --framework vue3 flag works without errors"
created: 2026-05-24T00:00:00Z
updated: 2026-05-24T00:00:00Z
---

## Current Focus

hypothesis: "syncOutputFiles copies .tsx files regardless of framework mode - when Vue mode is active, .tsx files containing React imports are still copied to the components directory, and buildPreviewApp uses only the vue() plugin which cannot resolve React imports"
test: "read files to understand the issue"
expecting: "understand how preview server handles Vue mode and why React imports are being resolved"
next_action: "complete - confirm root cause and provide diagnosis"

## Symptoms

expected: "Running `h2u preview --framework vue3 ./vue-output` starts a Vite dev server with @vitejs/plugin-vue, and the preview loads without errors."
actual: "Build failed - Rollup failed to resolve import 'react' from Dashboard.tsx. Vue mode is active but .tsx files with react imports are present in output."
errors: "[vite]: Rollup failed to resolve import 'react' from Dashboard.tsx"
reproduction: "Test 1 in UAT"
started: "Discovered during UAT"
started_by: "07.1-UAT.md"

## Eliminated

## Evidence

- timestamp: 2026-05-24T00:00:00Z
  checked: "package.json dependencies and devDependencies"
  found: "react and react-dom are NOT listed in package.json dependencies"
  implication: "React preview will fail to resolve 'react' imports because packages are missing"

- timestamp: 2026-05-24T00:00:00Z
  checked: "src/preview/server.ts - syncOutputFiles function"
  found: "syncOutputFiles copies ALL .tsx, .jsx, .vue, .css, .module.css, .ts files regardless of framework mode"
  implication: "When Vue mode is active, .tsx files with React imports are still copied to components dir"

- timestamp: 2026-05-24T00:00:00Z
  checked: "src/preview/server.ts - buildPreviewApp function"
  found: "When framework='vue', only vue() plugin is used - it doesn't handle React imports in .tsx files"
  implication: "Vue plugin fails to resolve 'react' import from Dashboard.tsx because: 1) .tsx files are copied even in Vue mode, 2) vue plugin doesn't process React imports"

- timestamp: 2026-05-24T00:00:00Z
  checked: "src/preview/server.ts - resolveRootComponentName function"
  found: "When framework='vue', it filters for .vue files only, so rootComponentName should be a .vue file"
  implication: "Root component detection is correct, but other .tsx files in output dir are imported as dependencies and cause build failures"

## Resolution

root_cause:
fix:
verification:
files_changed: []
