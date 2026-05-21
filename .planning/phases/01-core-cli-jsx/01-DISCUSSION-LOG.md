# Phase 1: Core CLI + HTML→JSX/TSX Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-21
**Phase:** 01-core-cli-jsx
**Areas discussed:** CLI Structure & DX, HTML Parsing, Attribute Mapping, Pipeline Architecture, File Naming & Output, Error Handling

---

## CLI Structure & DX

| Option | Description | Selected |
| ------ | ----------- | -------- |
| Single command `h2ui <file>` | Simple, no subcommands | |
| Subcommand mode `h2ui convert <file>` | Extensible with more commands | ✓ |
| You decide | Agent's discretion | |

**User's choice:** Subcommand mode
**Notes:** User chose subcommand mode for future extensibility

| Option | Description | Selected |
| ------ | ----------- | -------- |
| `./output/` | Recommended, clear | |
| `./components/` | More semantic | |
| `./dist/` | Frontend habit | |
| **Other: `./h2ui_output/`** | Unique, won't conflict | ✓ |

**User's choice:** `./h2ui_output/` (custom)
**Notes:** User suggested `h2ui_output` — unique name that won't conflict with existing project directories

| Option | Description | Selected |
| ------ | ----------- | -------- |
| Yes, `h2ui init` | Recommended, generates .h2uirc | ✓ |
| No, pure CLI params only | Minimal | |
| You decide | Agent's discretion | |

**User's choice:** Yes, `h2ui init` command

| Option | Description | Selected |
| ------ | ----------- | -------- |
| Interactive with prompts | Guided, beginner-friendly | ✓ |
| Silent mode | CI-friendly, only errors speak | |
| Tiered (simple default + -v) | Recommended | |

**User's choice:** Interactive with prompts

## HTML Parsing

| Option | Description | Selected |
| ------ | ----------- | -------- |
| Lenient mode | Best-effort, skip problems, warn | ✓ (default) |
| Strict mode | Valid HTML5 or error exit | (via --strict flag) |

**User's choice:** Default lenient + `--strict` flag

| Option | Description | Selected |
| ------ | ----------- | -------- |
| Pure HTML only | Standard HTML5 only | ✓ |
| Try to be compatible | Keep unknown syntax as-is | |

**User's choice:** Pure HTML — referenced sample HTML file at `/Users/suntc/project/CDF/codex-onboarding.html`
**Notes:** User said "我的目的不是全部兼容，而是为了方便转换较为标准的 html". Showed a well-structured modern HTML5 page. No template syntax support needed.

| Option | Description | Selected |
| ------ | ----------- | -------- |
| Standard HTML attributes | class→className, style→object | |
| Complete attribute mapping | Full React mapping + SVG | ✓ |
| You decide | | |

**User's choice:** Complete attribute mapping

## Attribute Mapping

| Option | Description | Selected |
| ------ | ----------- | -------- |
| Custom mapping table | Full control, testable, extensible | ✓ |
| Third-party library | Convenient but less flexible | |
| Hybrid | Core custom + library fallback | |

**User's choice:** Custom mapping table (after recommendation)

| Option | Description | Selected |
| ------ | ----------- | -------- |
| Keep as-is + warning | Preserve unknown attrs | ✓ (Phase 1) |
| Skip silently | Ignore unknown attrs | |
| Error exit | Must know all attrs | |

**User's choice:** Keep as-is + warning, noting Phase 4 LLM can handle these
**Notes:** User suggested LLM can handle unknown attrs in Phase 4 — good integration point

| Option | Description | Selected |
| ------ | ----------- | -------- |
| Complete mapping | All standard HTML + SVG from day one | ✓ |
| Incremental | 80% first, add later | |
| You decide | | |

**User's choice:** Complete mapping from day one

## Pipeline Architecture

| Option | Description | Selected |
| ------ | ----------- | -------- |
| Sequential pipeline | Simple, clear, step-by-step | ✓ |
| Plugin/event-driven | Dynamic step registration | |

**User's choice:** Sequential pipeline (after detailed explanation with code examples)
**Notes:** User asked for explanation with examples. Decided on sequential but with pluggable step interfaces.

| Option | Description | Selected |
| ------ | ----------- | -------- |
| Immutable Context | Each step returns new object | ✓ |
| Mutable Context | In-place modification | |

**User's choice:** Immutable Context (after detailed explanation)

## File Naming & Output

| Option | Description | Selected |
| ------ | ----------- | -------- |
| Single file | Phase 1 only | ✓ |
| Multi-file | Wait for Phase 2 component splitting | |

**User's choice:** Single file for Phase 1

| Option | Description | Selected |
| ------ | ----------- | -------- |
| Based on input filename | input.html → Input.tsx | ✓ |
| Fixed name | Always Page.tsx | |
| Configurable | Default based on input | |

**User's choice:** Based on input filename

| Option | Description | Selected |
| ------ | ----------- | -------- |
| PascalCase conversion | chat-panel.html → ChatPanel.tsx | ✓ |
| Keep original | chat-panel.html → chat-panel.tsx | |

**User's choice:** PascalCase conversion

**Deferred idea:** Preview server — `h2ui preview` to serve generated components locally

## Error Handling

| Option | Description | Selected |
| ------ | ----------- | -------- |
| Collect all | Report all errors at once | |
| Fail fast | Stop on first error | |
| **Layered (error/warning)** | Warnings don't block, errors do | ✓ |

**User's choice:** Layered error/warning system

| Option | Description | Selected |
| ------ | ----------- | -------- |
| Partial output | Write successfully converted files even with errors | ✓ |
| All or nothing | No output if any error | |
| You decide | | |

**User's choice:** Partial output

## Agent's Discretion

- Exact Prettier formatting config
- Error message wording and format
- Progress spinner implementation details
- Terminal color scheme

## Deferred Ideas

- **Preview server**: `h2ui preview` — start local server to preview generated components
- **Plugin system**: Formalized plugin hooks (foundation laid via PipelineStep interface)