---
status: testing
phase: 04-llm-integration
source:
  - .planning/phases/04-llm-integration/04-01-SUMMARY.md
  - .planning/phases/04-llm-integration/04-02-SUMMARY.md
  - .planning/phases/04-llm-integration/04-03-SUMMARY.md
started: 2026-05-21T23:20:00Z
updated: 2026-05-21T23:40:00Z
---

## Current Test

number: 5
name: 总结
expected: |
  所有 LLM 相关测试完成
awaiting: user response

## Tests

### 1. LLM 标志触发审查并显示建议
expected: |
  运行 `h2ui convert <file> --llm` 应该：
  1. 在 LLM 调用前显示 "~N tokens (~$est: $cost) -- calling {model}"
  2. 转换后在控制台显示 LLM 命名建议
  3. 如果 LLM 提供了清理提示，也一并显示
  4. 如果 LLM 不可用，优雅降级到纯规则输出
result: pass
note: "LLM 成功触发，生成了命名建议、清理提示和边界变更"

### 2. Token 估算和费用警告在 LLM 调用前显示
expected: |
  使用 --llm 标志时，用户应看到 token 估算和费用警告
  格式: "~{N} tokens (~$est: ${cost}) -- calling {model}"
result: pass
note: "显示了 ~785 tokens (~$est: 0.0002) -- calling deepseek-v4-flash"

### 3. LLM 模式配置 (off/auto/always)
expected: |
  --llm-mode off: 即使提供了 --llm 也从不运行 LLM
  --llm-mode auto: 仅当存在警告时才运行 LLM
  --llm-mode always: 配置后始终运行 LLM
result: issue
reported: "--llm-mode off 被忽略"
severity: major
fix: |
  代码 bug 在 src/cli/commands/convert.ts 第 58 行：
  `mode: options.llm ? 'always' : ...`
  当 --llm 存在时，mode 永远是 'always'，忽略了 --llm-mode 选项
  需要修复逻辑：--llm-mode 应该优先于 --llm 的默认行为

### 4. LLM 失败时优雅降级
expected: |
  当 LLM API 失败时（无 API key、网络错误等），
  工具应继续使用纯规则输出并显示警告
result: issue
reported: "错误信息不优雅，暴露了 SDK 内部错误"
severity: minor
note: "降级机制工作正常，但错误信息应翻译为更友好的中文提示"

### 5. SPL-06 非语义 div 拆分
expected: |
  具有独特 class/ID 模式的非语义 div
  (如 <div class="card">, <div id="sidebar">) 应被规则引擎拆分为独立组件
result: pass
note: "TaskBoardDiv, ToastContainerDiv 等被正确拆分为独立组件"

### 6. 重复模式检测警告
expected: |
  当发现重复模式时（如相同的卡片出现 2 次），
  工具应发出警告并将组件标记为复用
result: pass
note: "检测到 7 种重复模式，TreeItem 8x、TreeItemChild 5x 等"

### 7. LLM provider 配置
expected: |
  --llm-provider openai|anthropic|ollama 选择 LLM provider
  Provider 应在费用警告输出中可见
result: pass
note: "使用了 deepseek-v4-flash，baseURL 来自 .h2uirc 配置"

## Summary

total: 7
passed: 4
issues: 2
pending: 0
skipped: 1

## Gaps

- truth: "--llm-mode off 选项被忽略"
  status: failed
  reason: "当 --llm 标志存在时，mode 强制变成 'always'，忽略 --llm-mode 选项"
  severity: major
  test: 3
  artifacts: []
  missing:
    - "修复 convert.ts 第 58 行的逻辑：--llm-mode 应该优先于 --llm 的默认 'always' 行为"

- truth: "LLM 失败时的错误信息不优雅"
  status: failed
  reason: "错误信息暴露了 SDK 内部细节 (Missing credentials. Please pass an `apiKey`...)"
  severity: minor
  test: 4
  artifacts: []
  missing:
    - "在 catch 中捕获错误并翻译为更友好的中文提示"
