# Phase 08: Autonomous Agent - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a self-repairing autonomous agent that can plan, execute, verify, and repair HTML conversions. The agent receives an `--agent` flag, declares its plan before execution, uses tools to interact with the filesystem and LLM, verifies output fidelity, repairs failures, and reports confidence scores.
</domain>

<decisions>
## Implementation Decisions

### Tool Interface (Function Calling)
- **D-01:** 使用 Function Calling SDK 暴露工具（read_file, write_file, run_pipeline, run_llm, verify_output）
- **D-02:** 使用 OpenAI/Anthropic 原生 function calling schema，类型安全

### Execution Loop Structure
- **D-03:** Agent 执行循环：`PLAN → EXECUTE → VERIFY → REPAIR`
- **D-04:** PLAN 阶段：Agent 显式声明其计划并输出到控制台
- **D-05:** VERIFY 阶段：验证输出保真度
- **D-06:** REPAIR 阶段：验证失败后执行修复，最多 3 次尝试

### Verification Strategy
- **D-07:** 采用混合验证方案：
  - 第一步：快速结构化 diff（DOM 结构、属性、文本内容）
  - 第二步（如需要）：LLM 语义验证
- **D-08:** 结构化 diff 用于快速检查，节省 token
- **D-09:** LLM 语义验证用于复杂情况，确保语义等价

### Repair Strategy Pool
- **D-10:** 预定义修复策略池（Agent 不能重复尝试失败过的策略）：
  1. **简化结构** — 将复杂嵌套组件拆分为更简单的块
  2. **重写属性** — 用不同的属性/语法重写问题部分
  3. **添加注释** — 添加解释性注释帮助 LLM 理解
- **D-11:** 跳过问题块作为最后手段（兜底策略）

### Token Budget
- **D-12:** Token 预算只做积累计算，不做硬性限制
- **D-13:** 每次 LLM 调用累计 token 消耗，供用户监控

### Action History
- **D-14:** 使用文件持久化记录失败策略
- **D-15:** 写入 `.h2ui/agent-history.json`
- **D-16:** Agent 读取历史记录，避免重复尝试失败策略

### Plan Display
- **D-17:** PLAN 阶段输出到控制台（stdout）
- **D-18:** 纯文本日志形式，简单直接

### Confidence Scoring
- **D-19:** 置信度分数由独立的 Verifier Agent 计算
- **D-20:** 混合计算：验证结果权重 + 修复尝试次数综合
- **D-21:** 输出 0-100% 的置信度分数

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — h2ui 核心价值：CLI 工具，HTML 转 React/Vue 组件
- `.planning/STATE.md` — v1.0 决策：graceful LLM degradation, no LLM caching
- `.planning/REQUIREMENTS.md` — AGENT-01 到 AGENT-10 需求定义

### Prior Phase Context
- `.planning/phases/07-vue-3-sfc-output/07-CONTEXT.md` — Phase 7 Vue 输出决策
- `.planning/phases/06-batch-glob-processing/06-CONTEXT.md` — Phase 6 批处理决策
- `.planning/phases/07.1-vue-preview-support-add-vue-sfc-preview-server-support/07.1-CONTEXT.md` — Vue preview 决策

### Existing Implementation
- `src/cli/commands/convert.ts` — convert 命令，需要添加 `--agent` flag
- `src/pipeline/steps/generate.ts` — Vue/React 组件生成
- `src/llm/` — LLM 调用封装，Agent 需要使用
- `src/types/pipeline.ts` — 类型定义

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `Pipeline` class: 已有的多步骤处理架构，适合扩展 agent 逻辑
- LLM providers (OpenAI/Anthropic): 已有的 function calling 支持
- Batch 处理架构: 可复用的错误隔离和报告模式

### Established Patterns
- Agent 模式应该与现有的 Pipeline 分离，作为独立模块
- 工具调用使用现有 LLM provider 的 function calling 能力
- 配置优先级: CLI flags > config file > defaults

### Integration Points
- `src/cli/commands/convert.ts`: 添加 `--agent` flag
- 新增 `src/agent/` 目录存放 agent 核心逻辑
- `.h2ui/agent-history.json`: 持久化历史记录

</codebase_context>

<specifics>
## Specific Ideas

- `h2u convert page.html --agent` — 启用 agent 模式
- `h2u "src/**/*.html" --agent` — 批量 agent 模式
- Agent 执行流程日志输出到 stdout，用户可见 PLAN/EXECUTE/VERIFY/REPAIR 各阶段
- 置信度报告: `Confidence: 85%` 在每个文件处理完成后
- Token 积累报告: `Tokens used: 12,450 / session`

</specifics>

<deferred>
## Deferred Ideas

None — all Agent scope items addressed in discussion.

---

*Phase: 08-Autonomous-Agent*
*Context gathered: 2026-05-25*
