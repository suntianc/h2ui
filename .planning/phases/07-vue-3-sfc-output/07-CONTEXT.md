# Phase 07: Vue 3 SFC Output - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver Vue 3 single-file component generation: `--framework vue3` outputs `.vue` files with `<template>`, `<script setup lang="ts">`, and `<style scoped>` blocks. Extends existing pipeline with a new Vue output renderer.
</domain>

<decisions>
## Implementation Decisions

### Event Binding Syntax
- **D-01:** HTML 事件属性统一转换为 `@` 前缀：`onclick` → `@click`，`oninput` → `@input`，`onblur` → `@blur`
- **D-02:** 不使用 `:onclick` 动态绑定语法（除非需要传递 computed 属性作为事件处理器）
- **D-03:** 布尔属性使用动态绑定：`:disabled`、` :checked`、`:readonly` 等显式绑定布尔值

### Child Component Imports
- **D-04:** 子组件通过 `import + components` 局部注册：`import Child from './Child.vue'` + `components: { Child }`
- **D-05:** Props 使用 `defineProps` 泛型声明：`defineProps<{ title: string; items?: string[] }>()`

### Script Setup Style
- **D-06:** 使用 `<script setup lang="ts">` — Vue 3 Composition API，与 React Hooks 风格类似
- **D-07:** 完整 TypeScript 支持，不使用纯 JavaScript 降级

### CSS Scoping Strategy
- **D-08:** 使用 `<style scoped>` — Vue scoped CSS，简洁且自动隔离，符合 Vue 生态标准
- **D-09:** 全局样式（CSS reset、字体定义等）抽取到独立的 `global.css` 文件，不污染组件样式

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Implementation
- `src/pipeline/steps/generate.ts` — current React TSX/JSX output; Vue output needs new renderer in this step
- `src/pipeline/steps/convert.ts` — AST-to-JSX conversion logic; similar approach needed for AST-to-Vue-template
- `src/engine/splitter/index.ts` — semantic boundary detection; reusable for Vue component splitting
- `src/engine/css/index.ts` — CSS extraction; output format needs to support `<style scoped>`

### Project Decisions
- `.planning/PROJECT.md` — core value: one command conversion, CLI-first
- `.planning/STATE.md` — v1.0 decisions: graceful LLM degradation, no LLM caching
- `.planning/REQUIREMENTS.md` — VUE-01 through VUE-07 requirements

### Phase Context
- `.planning/phases/06-batch-glob-processing/06-CONTEXT.md` — batch pipeline decisions, reuse for batch + Vue integration

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Pipeline` class: already structured for multi-step processing; add Vue render step
- `splitStep`: semantic boundary detection reusable for Vue component tree
- `cssStep`: CSS extraction reusable, output format changes to `<style scoped>`

### Established Patterns
- `generateStep` currently writes `.tsx/.jsx` files; Vue output needs similar structure with different extension and block format
- Config merging: CLI flags > config file > defaults — applies to `--framework vue3` flag too

### Integration Points
- `src/cli/commands/convert.ts`: add `--framework vue3` option; when set, use Vue output renderer
- `src/types/pipeline.ts`: add `framework: 'react' | 'vue3'` to `ConvertOptions`
- `generateStep`: conditional output format based on framework type
</code_context>

<specifics>
## Specific Ideas

- `h2u convert page.html --framework vue3` → `page.vue` with proper blocks
- Event attributes convert: `onclick="handle()"` → `@click="handle()"`
- Child component tree mirrors React component tree; Vue file structure matches Vue SFC spec
- CSS extraction result: `<style scoped>` inside `.vue` file, no external `.css` files needed
</specifics>

<deferred>
## Deferred Ideas

None — all Vue SFC scope items addressed in discussion.

---

*Phase: 07-vue-3-sfc-output*
*Context gathered: 2026-05-23*
