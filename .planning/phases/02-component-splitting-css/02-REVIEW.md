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
  info: 2
  total: 5
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-05-21
**Depth:** standard
**Files Reviewed:** 36
**Status:** issues_found

## Summary

本次审查覆盖了 phase-2-component-splitting-css 阶段实现的所有源文件。代码整体结构清晰，pipeline 架构设计合理，但存在 1 个关键缺陷和 2 个逻辑错误需要修复。

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

---

## Warnings

### WR-01: CSS 属性提取逻辑与 JSX 生成不匹配 — 子元素样式丢失

**File:** `src/pipeline/steps/convert.ts:304-328` (extractCssProperties) 和 `src/pipeline/steps/convert.ts:161-218` (generateComponentCode)

**Issue:**
`extractCssProperties` 函数递归收集所有子元素的 inline style 到当前节点的 `cssProperties`：
```typescript
// Line 322-325
$(el).children().each((_, child) => {
  const childProps = extractCssProperties($, child as Element);
  Object.assign(result, childProps);
});
```

但 `generateComponentCode` 只为当前节点生成 className，从未为子元素生成 className：
```typescript
// Line 202-204
const classNameAttr = hasCss
  ? ` className={styles.${node.name[0].toLowerCase() + node.name.slice(1)}}`
  : '';
```

结果：子元素的 inline style 被提取到父组件的 CSS Module 中，但子元素本身没有 className 来引用这些样式。CSS 规则没有对应的 HTML 元素，成为死代码。

**Example:**
输入 HTML:
```html
<header>
  <span style="padding-top: 15px">text</span>
</header>
```

提取流程：
1. `extractCssProperties(header)` 递归收集 span 的 `padding-top: 15px` 到 header 的 cssProperties
2. `generateComponentCode` 为 header 生成 `className={styles.header}`
3. span 元素渲染时没有 className

输出：CSS Module 包含 `.header { padding-top: 15px; }`，但 span 没有引用它。

**Fix:**
两个选择：
1. 如果子元素需要独立 CSS Module，在生成 JSX 时为子元素也添加 className 引用
2. 如果子元素样式应该通过 CSS 继承生效，则不从子元素提取样式（只提取直接应用于当前元素的 style 属性）

建议采用方案 1：重构 `generateComponentCode`，在渲染子元素时检查子元素是否有 cssProperties，如有则添加 className。

---

### WR-02: CSS shorthand 构建时使用了错误的 fallback 值

**File:** `src/engine/css/optimize.ts:86-88`
**Issue:** 在 `condenseProperties` 函数中，`valRight` 和 `valLeft` 的 fallback 链错误地使用了 `result[bottom]`：

```typescript
const valRight = result[right] || result[bottom] || '';
const valLeft = result[left] || result[right] || result[bottom] || '';
```

正确的 CSS shorthand 语义是 opposite-side fallback（对侧 fallback）：
- `padding-right` 缺失时应 fallback 到 `padding-left`，不是 `padding-bottom`
- `margin-right` 缺失时应 fallback 到 `margin-left`，不是 `margin-bottom`

**示例:** 如果同时设置了 `padding-top: 10px` 和 `padding-left: 20px`，当前代码会产生错误的 shorthand。

**Fix:**
```typescript
const valRight = result[right] || result[left] || '';
const valLeft = result[left] || result[right] || '';
```

---

## Info

### IN-01: 非空断言操作符在安全路径上使用

**File:** `src/engine/splitter/index.ts:68`

**Issue:**
```typescript
repeatCount: isRepeated ? pattern!.count : undefined,
```

使用 `pattern!.count` 非空断言。虽然在当前逻辑中 `isRepeated` 为 true 时 `pattern` 必定存在，但使用非空断言是代码异味（code smell）。

**Fix:**
使用条件访问：
```typescript
repeatCount: pattern?.count,
```

---

### IN-02: 误导性注释 — extract.ts 中的描述与实现不符

**File:** `src/engine/css/extract.ts:25-27`

**Issue:**
注释声明：
```typescript
/**
 * Simple CSS string parser.
 * Parses "color: red; font-size: 16px" → { "font-size": "16px" }
 * Filters out inheritable properties.
 */
```

但 `parseStyleStringSimple` 函数的实现**并不会**过滤 inheritable properties。实际的过滤逻辑在 `extractStylesFromElement` 函数中。

**Fix:**
更新注释以准确描述函数行为，或将过滤逻辑移至该函数内。

---

## 审查通过的部分

以下代码质量良好，未发现问题：

- **pipeline/index.ts**: Pipeline 顺序执行架构清晰，错误处理合理
- **splitter/signature.ts**: `computeSignature` 正确使用 `MAX_BREADTH = 10` 限制以防止指数爆炸
- **css/module.ts**: `extractSharedStyles` 的冲突检测和共享样式提取逻辑正确
- **transform/attributes.ts**: `mapAttribute` 布尔属性处理逻辑与测试用例一致
- **transform/style.ts**: `parseInlineStyle` 正确处理 vendor prefix
- **util/suggest.ts**: Levenshtein 距离实现正确，建议逻辑合理

---

_Reviewed: 2026-05-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
