---
phase: 01-core-cli-jsx
reviewed: 2026-05-21T00:00:00Z
depth: standard
files_reviewed: 32
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
  - src/config/loader.ts
  - test/cli/cli.test.ts
  - test/engine/transform.test.ts
  - test/engine/splitter.test.ts
  - test/pipeline/pipeline.test.ts
  - test/pipeline/split-css.test.ts
  - tsconfig.json
  - vitest.config.ts
findings:
  critical: 1
  warning: 5
  info: 3
  total: 9
status: fixed
---

# Phase 01: Code Review Report

**Reviewed:** 2026-05-21
**Depth:** standard
**Files Reviewed:** 32
**Status:** issues_found

## Summary

审查了32个文件，发现1个Critical问题需要修复，5个Warning问题建议改进，以及3个Info级别观察。Critical问题位于 `attributes.ts` 中的布尔属性值处理逻辑——当HTML属性值为字符串 `"false"` 时会被错误地转换为JavaScript `true`。其余问题主要涉及代码质量（如重复函数、未使用的代码）和测试覆盖不足。

---

## Critical Issues

### CR-01: Boolean attribute value inversion

**File:** `src/engine/transform/attributes.ts:122-124`
**Issue:** 当HTML属性值为字符串 `"false"` 时，代码将其映射为JavaScript `true`。例如，`disabled="false"` 变成 `disabled={true}`，这与预期完全相反。

**Fix:**
```typescript
if (BOOLEAN_ATTRIBUTES.has(lowerName)) {
  const renamed = HTML_TO_JSX_RENAMES[lowerName];
  // 只有值为"false"字符串时才返回false，否则返回true
  const boolValue = value === 'false' ? false : true;
  return { name: renamed || lowerName, value: boolValue };
}
```

---

## Warnings

### WR-01: tagToComponentName mapping table incomplete

**File:** `src/engine/splitter/semantic.ts:41-50`
**Issue:** `TAG_NAMES` 映射表不完整，缺少 `aside`、`figure`、`figcaption`、`time`、`address`、`details`、`summary` 等语义标签的映射。虽然有fallback逻辑，但 `nav` → `Navigation` 和 `header` → `Header` 这种特殊映射与其他标签的默认行为不一致。

**Fix:** 补全映射表或移除特殊映射统一使用 `tag.charAt(0).toUpperCase() + tag.slice(1)`。

---

### WR-02: Duplicate flattenTree function

**File:** `src/engine/splitter/index.ts:77-83` and `src/pipeline/steps/convert.ts:158-159`
**Issue:** `flattenTree` 函数在两个文件中定义完全相同的逻辑，造成代码重复。

**Fix:** 将函数提取到共享模块（如 `src/util/tree.ts`），或在一个模块中定义后导出。

---

### WR-03: suggestSimilarFiles extension matching too strict

**File:** `src/util/suggest.ts:58`
**Issue:** 只检查扩展名完全匹配。如果用户输入 `file.htm` 而目录中有 `file.html`，不会给出建议。

**Fix:** 使用扩展名相似度匹配，或将 `.htm` 和 `.html` 视为等价。

---

### WR-04: Test files are all placeholders

**File:** `test/cli/cli.test.ts`, `test/engine/transform.test.ts`, `test/pipeline/pipeline.test.ts`, `test/pipeline/split-css.test.ts`
**Issue:** 所有测试用例都只是 `expect(true).toBe(true)`，没有实际验证任何功能。

**Fix:** 实现真实的测试用例，覆盖核心转换逻辑。

---

### WR-05: Empty catch block silently swallows Prettier errors

**File:** `src/pipeline/steps/generate.ts:15-17`
**Issue:** Prettier格式化失败时静默返回未格式化的代码，用户不会收到任何警告。

**Fix:**
```typescript
} catch (err) {
  newCtx.warnings.push(`Prettier formatting failed: ${err.message}. Using unformatted code.`);
  return code;
}
```

---

## Info

### IN-01: Magic number

**File:** `src/engine/css/module.ts:35-36`
**Issue:** 数字 `3`（最少共享声明阈值）是魔法数字。

**Fix:**
```typescript
const MIN_SHARED_DECLARATIONS = 3;
if (Object.keys(sharedDeclarations).length < MIN_SHARED_DECLARATIONS) {
```

---

### IN-02: Unused WarningCollector

**File:** `src/util/logger.ts`
**Issue:** 定义了完整的 `WarningCollector` 接口和工厂函数，但整个代码库中没有使用。

**Fix:** 删除此文件，或在需要时启用。

---

### IN-03: Indirect CSS optimization function imports

**File:** `src/engine/css/module.ts:2`
**Issue:** `condenseProperties` 和 `cleanProperties` 从 `optimize.js` 导入后在 module.ts 中使用，调用路径可以更直接。

**Fix:** 考虑将这些函数直接放在 `module.ts` 中，或在 `optimize.ts` 中直接导出给最终使用者。

---

_Reviewed: 2026-05-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
