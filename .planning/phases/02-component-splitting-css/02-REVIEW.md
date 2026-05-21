---
phase: 02-component-splitting-css
reviewed: 2026-05-21T00:00:00Z
depth: standard
files_reviewed: 36
files_reviewed_list:
  - bin/h2ui.ts
  - package.json
  - src/cli/commands/convert.ts
  - src/cli/commands/init.ts
  - src/cli/index.ts
  - src/cli/output.ts
  - src/config/defaults.ts
  - src/engine/css/extract.ts
  - src/engine/css/index.ts
  - src/engine/css/module.ts
  - src/engine/css/optimize.ts
  - src/engine/css/style-tag.ts
  - src/engine/splitter/index.ts
  - src/engine/splitter/semantic.ts
  - src/engine/splitter/signature.ts
  - src/engine/transform/attributes.ts
  - src/engine/transform/elements.ts
  - src/engine/transform/style.ts
  - src/pipeline/index.ts
  - src/pipeline/steps/convert.ts
  - src/pipeline/steps/generate.ts
  - src/pipeline/steps/parse.ts
  - src/types/config.ts
  - src/types/pipeline.ts
  - src/util/file.ts
  - src/util/logger.ts
  - src/util/suggest.ts
  - src/util/tree.ts
  - test/cli/cli.test.ts
  - test/engine/transform.test.ts
  - test/engine/splitter.test.ts
  - test/pipeline/pipeline.test.ts
  - test/pipeline/split-css.test.ts
  - tsconfig.json
  - vitest.config.ts
findings:
  critical: 1
  warning: 2
  info: 1
  total: 4
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-05-21
**Depth:** standard
**Files Reviewed:** 36
**Status:** issues_found

## Summary

本次审查覆盖了 phase-2-component-splitting-css 阶段实现的所有源文件。代码整体结构清晰，pipeline 架构设计合理，但存在 1 个关键缺陷（会导致 npm 包安装后无法运行）和 2 个逻辑错误（产生不正确的 CSS 输出）。

## Critical Issues

### CR-01: package.json bin/main 配置指向不存在的文件

**File:** `package.json:6-8`
**Issue:** `main` 和 `bin` 字段配置与实际编译输出不匹配：

```json
"main": "dist/index.js",
"bin": {
  "h2ui": "./bin/h2ui.js"
}
```

- `main: "dist/index.js"` — 项目中没有 `src/index.ts`，编译后也不会有 `dist/index.js`
- `bin.h2ui` 指向 `./bin/h2ui.js` — 但源文件是 `bin/h2ui.ts`（TypeScript），不是 `.js`
- tsconfig.json 的 `outDir: "./dist"` 会将 `bin/h2ui.ts` 编译到 `dist/bin/h2ui.js`，但 bin 字段指向 `bin/h2ui.js`（不存在）

**影响:** 用户通过 `npm install -g h2ui` 安装后，运行 `h2ui` 命令会失败，因为找不到 `./bin/h2ui.js` 文件。

**Fix:**
```json
{
  "main": "./dist/src/cli/index.js",
  "bin": {
    "h2ui": "./dist/bin/h2ui.js"
  }
}
```

或者调整 tsconfig.json 的 outDir 和 rootDir 使编译输出到正确位置。

---

## Warnings

### WR-01: CSS shorthand 构建时使用了错误的 fallback 值

**File:** `src/engine/css/optimize.ts:86-88`
**Issue:** 在 `condenseProperties` 函数中，`valRight` 和 `valLeft` 的 fallback 链错误地使用了 `result[bottom]`：

```typescript
const valRight = result[right] || result[bottom] || '';
const valLeft = result[left] || result[right] || result[bottom] || '';
```

正确的 CSS shorthand 语义是 opposite-side fallback（对侧 fallback）：
- `padding-right` 缺失时应 fallback 到 `padding-left`，不是 `padding-bottom`
- `margin-right` 缺失时应 fallback 到 `margin-left`，不是 `margin-bottom`

**示例:** 如果设置了 `padding-top: 10px` 和 `padding-left: 20px`，但 `padding-bottom: 15px` 也被错误地设为默认值...

假设只有：
```css
padding-top: 10px;
padding-left: 20px;
padding-bottom: 15px; /* 错误地使用了 bottom */
```

当前代码产生：`valRight = result['padding-right'] || result['padding-bottom'] || '' = '15px'`
期望产生：`valRight = result['padding-right'] || result['padding-left'] || '' = '20px'`

结果输出 `padding: 10px 15px 15px` 而不是 `padding: 10px 20px 15px`。

**Fix:**
```typescript
const valRight = result[right] || result[left] || '';
const valLeft = result[left] || result[right] || '';
```

---

### WR-02: `extractCssProperties` 缺少 inheritable 属性过滤

**File:** `src/pipeline/steps/convert.ts:303-322`
**Issue:** `extractCssProperties` 函数在提取 CSS 属性时，没有过滤掉可继承的属性（如 `font-size`、`color`、`font-family` 等）。

对比 `src/engine/css/extract.ts` 中的 `extractStylesFromElement` 函数，它使用 `isInheritable()` 正确过滤了可继承属性：

```typescript
// src/engine/css/extract.ts:45-47
if (!isInheritable(prop)) {
  result[prop] = value;
}
```

但 `extractCssProperties` 没有这个过滤逻辑，导致提取的 CSS 模块会包含应该通过 CSS 继承生效的属性。

**影响:** 生成的 CSS 模块包含冗余样式，且与 `extractStylesFromElement` 的行为不一致。

**Fix:**
在 `extractCssProperties` 中添加过滤：

```typescript
import { isInheritable } from '../../engine/css/extract.js';

function extractCssProperties($: CheerioAPI, el: Element): Record<string, string> {
  const result: Record<string, string> = {};
  const styleAttr = $(el).attr('style');
  if (styleAttr) {
    const parsed = parseInlineStyle(styleAttr);
    if (parsed) {
      // 过滤可继承属性
      for (const [prop, value] of Object.entries(parsed)) {
        if (!isInheritable(prop)) {
          result[prop] = value;
        }
      }
    }
  }
  // ... 递归处理 children
}
```

---

## Info

### IN-01: `generateComponentCode` 中对不存在的 child component 的 import

**File:** `src/pipeline/steps/convert.ts:170-175`
**Issue:** 当生成子组件代码时，`generateComponentCode` 会为所有 children 添加 import 语句，但 `allComponents` 数组此时只包含已处理的组件，可能不包含当前正在处理的 child：

```typescript
for (const child of node.children) {
  const childOutput = allComponents.find(c => c.name === child.name);
  if (childOutput) {
    lines.push(`import ${child.name} from './${child.name}';`);
  }
}
```

不过，经分析这个问题不会导致实际运行错误，因为：
1. 子组件的 JSX 内容由 `generateJsxFromNode` 从原始 DOM 结构生成，不会引用 grandchild 组件
2. import 语句虽然可能指向不存在的文件，但生成的 JSX 不会实际使用这些 grandchild 组件

**建议:** 如果希望代码更整洁，可以在生成子组件代码之前先处理 grandchildren，或者记录未解析的 imports 待后续处理。

---

_Reviewed: 2026-05-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
