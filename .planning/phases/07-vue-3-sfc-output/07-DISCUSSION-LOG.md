# Phase 07: Vue 3 SFC Output - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 07-vue-3-sfc-output
**Areas discussed:** Event Binding Syntax, Child Component Imports, Script Setup Style, CSS Scoping Strategy

---

## Event Binding Syntax

| Option | Description | Selected |
|--------|-------------|----------|
| @click = Vue 原生（推荐） | onclick → @click，Vue 3 标准写法 | ✓ |
| :onclick = 动态绑定 | 传 computed 属性时用 :onclick | |
| 蕾姆决定 | 让蕾姆根据 Vue 3 最佳实践选择 | |

**User's choice:** @click = Vue 原生（推荐）
**Notes:** HTML 事件属性统一转换为 `@` 前缀

---

## Special Event Conversion

| Option | Description | Selected |
|--------|-------------|----------|
| @ 统一转换（推荐） | oninput → @input，onblur → @blur | ✓ |
| 保留原名 | oninput → @oninput | |

**User's choice:** @ 统一转换（推荐）
**Notes:** 特殊事件也用 @ 前缀统一转换

---

## Boolean Attribute Handling

| Option | Description | Selected |
|--------|-------------|----------|
| :attr 动态绑定（推荐） | disabled → :disabled="isDisabled" | ✓ |
| 保持原样 | disabled="disabled" | |

**User's choice:** :attr 动态绑定（推荐）
**Notes:** 布尔属性使用动态绑定

---

## Child Component Imports

| Option | Description | Selected |
|--------|-------------|----------|
| import + components 注册（推荐） | import Child; components: { Child } | ✓ |
| 自动局部注册 | 文件名自动推断，不需要手动 import | |
| 蕾姆决定 | 让蕾姆根据 Vue 3 最佳实践选择 | |

**User's choice:** import + components 注册（推荐）
**Notes:** 子组件通过 import + components 局部注册

---

## Props Type Declaration

| Option | Description | Selected |
|--------|-------------|----------|
| defineProps 泛型（推荐） | defineProps<{ title: string }>() 完整 TS 类型推导 | ✓ |
| defineProps + type annotation | 运行时声明，类型宽松 | |
| 蕾姆决定 | 让蕾姆根据 Vue 3 最佳实践选择 | |

**User's choice:** defineProps 泛型（推荐）
**Notes:** Props 使用泛型声明获得完整 TypeScript 支持

---

## Script API Style

| Option | Description | Selected |
|--------|-------------|----------|
| <script setup>（推荐） | Vue 3 Composition API，代码简洁 | ✓ |
| <script> + setup() | Options API 遗留写法，较冗长 | |
| 蕾姆决定 | 让蕾姆根据 Vue 3 最佳实践选择 | |

**User's choice:** <script setup>（推荐）
**Notes:** 使用 Composition API

---

## TypeScript Declaration

| Option | Description | Selected |
|--------|-------------|----------|
| <script setup lang="ts">（推荐） | 完整 TypeScript 支持 | ✓ |
| <script setup> | 纯 JavaScript | |

**User's choice:** <script setup lang="ts">（推荐）
**Notes:** 完整 TypeScript 支持

---

## CSS Scoping Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Vue scoped CSS（推荐） | <style scoped>，Vue 自动隔离 | ✓ |
| CSS Modules | 与 React 输出保持一致 | |
| 蕾姆决定 | 让蕾姆根据 Vue 3 最佳实践选择 | |

**User's choice:** Vue scoped CSS（推荐）
**Notes:** 使用 Vue scoped CSS，符合 Vue 生态标准

---

## Global Styles

| Option | Description | Selected |
|--------|-------------|----------|
| 分离 global CSS 文件（推荐） | 抽取到 global.css | ✓ |
| <style global> | Vue 3 不支持此语法 | |
| inline 到 index.html | 不推荐 | |

**User's choice:** 分离 global CSS 文件（推荐）
**Notes:** 全局样式抽取到独立文件

---

## Claude's Discretion

无 — 所有议题均已由用户明确选择。

## Deferred Ideas

无 — 讨论内容均在 Phase 7 范围内。

---

*Discussion completed: 2026-05-23*
