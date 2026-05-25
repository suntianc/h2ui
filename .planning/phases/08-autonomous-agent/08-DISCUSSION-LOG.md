# Phase 08: Autonomous Agent - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 08-Autonomous-Agent
**Areas discussed:** Tool Interface + Loop, Verification Strategy, Repair Strategy, Budget + History, Plan Display + Confidence

---

## Tool Interface + Loop

| Option | Description | Selected |
|--------|-------------|----------|
| Function calling SDK | 使用 OpenAI/Anthropic 原生 function calling — schema 原生支持，类型安全，业界成熟方案 | ✓ |
| 自定义 prompt | 在 system prompt 中描述工具 — 简单但可靠性较低 | |
| MCP 协议 | Model Context Protocol — 标准化但增加复杂度 | |

**User's choice:** Function calling SDK
**Notes:** 用户选择成熟的 function calling SDK 方案

---

## Execution Loop Structure

| Option | Description | Selected |
|--------|-------------|----------|
| PLAN→EXECUTE→VERIFY→REPAIR | 显式 PLAN 阶段声明计划，然后执行，验证，失败时修复 | ✓ |
| 混合模式 | Agent 自己决定何时验证，灵活但可能过度迭代 | |
| REPAIR 单独作为阶段 | 验证失败后进入独立 REPAIR 阶段，最多 3 次尝试 | |

**User's choice:** PLAN→EXECUTE→VERIFY→REPAIR
**Notes:** 用户选择了明确的执行循环结构

---

## Verification Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| 混合方案 | 快速结构 diff + LLM 语义验证 | ✓ |
| 结构化 diff | 对比 DOM 结构、属性、文本内容 — 精确但可能产生误报 | |
| LLM 语义验证 | 让 LLM 判断转换后的组件是否语义等价 — 更智能但消耗更多 token | |
| 视觉 diff | 渲染并截图对比 — 最准确但实现复杂且慢 | |

**User's choice:** 混合方案（蕾姆推荐，用户同意）
**Notes:** 蕾姆推荐：先用规则快速检查，存疑时再用 LLM 语义验证。用户同意此方案。

---

## Repair Strategy Pool

| Option | Description | Selected |
|--------|-------------|----------|
| 预定义策略池 | 提供固定策略列表（重写、简化、添加注释等），LLM 每次选一个未失败的 | ✓ |
| LLM 自主选择 | 让 LLM 自己决定用什么策略修复 — 灵活但可能重复尝试无效方案 | |
| 规则 + LLM 混合 | 规则先行尝试常见修复，失败后再让 LLM 想办法 | |

**User's choice:** 预定义策略池
**Notes:** 用户选择了预定义策略池

---

### Strategy Options

| Option | Description | Selected |
|--------|-------------|----------|
| 简化结构 | 将复杂嵌套组件拆分为更简单的块 | ✓ (蕾姆推荐) |
| 重写属性 | 用不同的属性/语法重写问题部分 | ✓ (蕾姆推荐) |
| 添加注释 | 添加解释性注释让 LLM 更好理解 | ✓ (蕾姆推荐) |
| 跳过问题块 | 跳过无法修复的部分，保留其余输出 | (作为最后手段) |

**User's choice:** 同意蕾姆推荐（简化结构、重写属性、添加注释，跳过问题块作为最后手段）

---

## Token Budget

| Option | Description | Selected |
|--------|-------------|----------|
| 累计计数 | 累计统计每次 LLM 调用的 token 消耗，超限停止 | ✓ |
| 单文件预算 | 每个文件独立计算，超过则放弃该文件 | |
| 双限控制 | 同时跟踪单文件和总预算，更精细控制 | |

**User's choice:** 不用限制，只积累计算
**Notes:** Token 预算只做积累计算，不做硬性限制

---

## Action History

| Option | Description | Selected |
|--------|-------------|----------|
| 文件持久化 | 写入 .h2ui/agent-history.json，本地持久化 | ✓ |
| 内存存储 | 当前会话内存中记录，简洁但重启丢失 | |
| 嵌入式 | 作为 context 的一部分传给 LLM，让其自己避免 | |

**User's choice:** 文件持久化
**Notes:** 用户选择了文件持久化方案

---

## Plan Display

| Option | Description | Selected |
|--------|-------------|----------|
| 控制台输出 | 纯文本输出到 stdout，类似日志，简单直接 | ✓ |
| 结构化输出 | 输出带标记的格式化文本，比如 Markdown 表格 | |
| 交互式确认 | 显示计划后等待用户确认再执行 | |

**User's choice:** 控制台输出
**Notes:** 用户选择了简单的控制台输出

---

## Confidence Scoring

| Option | Description | Selected |
|--------|-------------|----------|
| 混合计算 | 验证结果权重 + 修复尝试次数综合计算 | ✓ |
| 验证通过率 | 基于验证阶段的通过/失败比例计算 | |
| LLM 自我评估 | 让 LLM 自己对修复结果打分，更主观但可能准确 | |

**User's choice:** 混合计算，但需要新的 agent 来进行评估
**Notes:** 用户希望使用独立的 Verifier Agent 进行评估

---

## Claude's Discretion

- 验证策略的具体 diff 算法实现由 Claude 决定
- 简化结构、重写属性、添加注释的具体策略内容由 Claude 设计
- 置信度混合计算的具体权重由 Claude 决定

## Deferred Ideas

None — all Agent scope items addressed in discussion.

---

*Phase: 08-Autonomous-Agent*
*Discussion completed: 2026-05-25*
