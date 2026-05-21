# Phase 4: LLM Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-21
**Phase:** 04-llm-integration
**Areas discussed:** LLM Provider Interface, Token Strategy, Caching, SPL-06 Integration, LLM Trigger, Failure Strategy, LLM Scope

---

## LLM Provider Interface

| Option | Description | Selected |
|--------|-------------|----------|
| Unified interface + provider class | Define ILlmProvider interface, each provider implements call(prompt): string | |
| Adapter pattern + factory | createProvider('openai'/'anthropic'/'ollama', config) returns unified adapter | |
| LLM abstraction layer (SDK) | Use langchain or similar for unified abstraction | |
| **Direct openai SDK** | User specified: 直接使用 openai 的依赖包，支持自定义配置 | ✓ |

**User's choice:** Direct openai SDK with custom config (baseURL for Ollama compatibility)
**Notes:** User wants lightweight, direct integration — no abstraction layer overhead

---

## Token Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Estimate + confirm before call | Calculate tokens with tiktoken, show cost, user confirms (y/n) | |
| Auto threshold skip | Auto-pass within free tier, prompt only when exceeding threshold | |
| **Warning only** | Always display token/cost estimate, never block execution | ✓ |

**User's choice:** 仅警告不阻止

---

## Caching

| Option | Description | Selected |
|--------|-------------|----------|
| File cache (disk) | Hash-based cache in .h2ui/cache/, persists across sessions | |
| Memory cache (session) | Cache only within current conversion session | |
| **No caching** | 转换相同文件基本不会存在，无需缓存 | ✓ |

**User's choice:** 无缓存 — repeated conversion of same file essentially never happens

---

## SPL-06 Integration

| Option | Description | Selected |
|--------|-------------|----------|
| LLM suggest + rules execute | LLM identifies split patterns, rules engine executes | |
| **Rules first, LLM optimize** | Heuristic rules split automatically, LLM handles naming + validation | ✓ |
| Pure LLM decision | All boundary decisions made by LLM | |

**User's choice:** 规则先行，LLM 优化
**Notes:** User clarified: SPL-06 non-semantic divs are `<div class="card">`, `<div id="sidebar">`, `<div class="product-item">` — divs with meaningful class/ID that aren't semantic HTML5 tags

---

## LLM Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Independent --llm flag | User must explicitly pass --llm to trigger | |
| Auto-detect warnings | Auto-trigger when rules emit warnings | |
| **Configurable modes** | off / auto (on warnings) / always | ✓ |

**User's choice:** 支持可配置：纯规则、有警告时llm介入、始终执行llm

---

## Failure Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Silent degradation | Log warning, continue with rules output | |
| Explicit error exit | Error + exit, prompt user to check config/network | |
| **Explicit error + fallback** | 显式错误，并默认降级到规则输出 | ✓ |

**User's choice:** LLM 失败 → 显式错误 → 降级到规则继续

---

## LLM Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Naming only | LLM only improves component/variable names | |
| Naming + cleanup | Naming + dead code, redundant nesting, unclear classes | |
| **Verify rules-split + handle unidentifiable** | 检查规则拆解出来的页面与组件是否正确，以及处理规则识别不出来的标签 | ✓ |

**User's choice:** LLM 是规则引擎的校对层，验证规则拆分结果 + 处理规则识别不了的标签

---

## Deferred Ideas

- **Browser Preview Server (POL-01):** Interactive component tree preview in browser — belongs in v2

---

*Phase: 04-llm-integration*
*Discussion completed: 2026-05-21*
