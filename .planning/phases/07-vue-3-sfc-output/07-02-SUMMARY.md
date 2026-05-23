---
phase: 07-vue-3-sfc-output
plan: 02
subsystem: renderer
tags: [vue3, sfc, framework, cli]

# Dependency graph
requires:
  - phase: 06-batch-glob-processing
    provides: Pipeline architecture, component splitting, CSS extraction
provides:
  - --framework vue3 flag for Vue 3 SFC output
  - Vue attribute mapping (onclick->@click, class stays class)
  - Vue SFC generation with template/script/style blocks
affects:
  - 07-03 (Vue component refinement)
  - future Vue integration work

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Vue attribute mapping via mapVueAttributes()
    - Vue SFC generation via generateVueSFC()
    - Framework-conditional pipeline routing

key-files:
  created: []
  modified:
    - src/types/pipeline.ts (framework field, vueTemplate fields)
    - src/types/config.ts (framework in H2uiConfig)
    - src/cli/index.ts (--framework CLI option)
    - src/cli/commands/convert.ts (framework option merging)
    - src/pipeline/steps/convert.ts (renderVueTemplate, vue3 detection)
    - src/pipeline/steps/generate.ts (generateVueSFC, vue3 output)

key-decisions:
  - "Vue template uses renderVueTemplate() instead of generateJsxFromNode()"
  - "Vue SFC uses <script setup lang='ts'> with child component imports"
  - "CSS goes in <style scoped> block, not separate .module.css files"
  - "Boolean attrs (disabled, checked) use :binding syntax"
  - "Event attrs (onclick) use @ prefix syntax"

patterns-established:
  - "Framework-conditional rendering: check ctx.options.framework === 'vue3'"
  - "Vue attribute mapping: VUE_EVENT_ATTRS and VUE_BOOLEAN_ATTRS sets"

requirements-completed: [VUE-01, VUE-02, VUE-03, VUE-05]

# Metrics
duration: 15min
completed: 2026-05-24
---

# Phase 07 Plan 02: Vue 3 SFC Renderer Summary

**Vue 3 SFC renderer with --framework vue3 flag: onclick maps to @click, class stays class, .vue files contain template/script setup/style scoped blocks**

## Performance

- **Duration:** 15 min
- **Started:** 2026-05-24T00:19:00Z
- **Completed:** 2026-05-24T00:34:00Z
- **Tasks:** 4
- **Files modified:** 6

## Accomplishments

- Added --framework vue3 CLI flag (accepts react or vue3, default: react)
- Implemented Vue attribute mapping (onclick->@click, disabled->:disabled, class/for preserved)
- Created Vue SFC generation with three-block structure
- Wired framework option through pipeline (convertStep and generateStep)

## Task Commits

Single commit for all tasks:

1. **Task 1-4: Vue 3 SFC renderer** - `2193654` (feat)

**Plan metadata:** N/A (single commit)

## Files Created/Modified

- `src/types/pipeline.ts` - Added framework field to ConvertOptions, vueTemplate to ComponentOutput and PipelineContext
- `src/types/config.ts` - Added framework field to H2uiConfig
- `src/cli/index.ts` - Added --framework option to convert command
- `src/cli/commands/convert.ts` - Added framework to mergedConfig
- `src/pipeline/steps/convert.ts` - Added renderVueTemplate(), mapVueAttributes(), vue3 detection in convertStep
- `src/pipeline/steps/generate.ts` - Added generateVueSFC(), formatVueSFC(), vue3 detection in generateStep

## Decisions Made

- Vue template uses renderVueTemplate() instead of generateJsxFromNode() for attribute mapping
- Vue SFC uses `<script setup lang='ts'>` with child component imports
- CSS extracted to `<style scoped>` block, not separate .module.css files
- Boolean attrs (disabled, checked, readonly) use :binding syntax
- Event attrs (onclick, oninput) use @ prefix syntax
- class stays class (not className), for stays for (not htmlFor)

## Deviations from Plan

None - plan executed exactly as written.

## Verification

Manual testing confirmed:
- `h2ui convert test.html --framework vue3` produces .vue files
- onclick -> @click conversion works
- disabled -> :disabled conversion works
- class stays class, for stays for
- script setup lang="ts" present in output
- style scoped block present when CSS extracted

## Issues Encountered

None.

## Next Phase Readiness

- Vue SFC foundation complete, ready for VUE-03 (component splitting refinement) and VUE-04 (CSS extraction with scoped styles)
- Test stubs exist in test/vue.test.ts but are skipped (implementation tests not yet written)

---
*Phase: 07-vue-3-sfc-output*
*Completed: 2026-05-24*
