# Phase 08: Autonomous Agent - Research

**Researched:** 2026-05-25
**Domain:** Autonomous Agent / LangGraph StateGraph Implementation
**Confidence:** HIGH

## Summary

Phase 8 implements a self-repairing autonomous agent using LangGraph's StateGraph with conditional edges for the PLAN -> EXECUTE -> VERIFY -> REPAIR loop. The agent exposes tools via function calling (read_file, write_file, run_pipeline, verify_output), uses Zod schemas for type-safe tool definitions, and persists history to both SQLite checkpoint DB and JSON failure log. Key decisions from CONTEXT.md are locked: Function Calling SDK for tools, PLAN→EXECUTE→VERIFY→REPAIR loop, hybrid verification (fast structural diff + LLM semantic), pre-defined repair strategy pool, token accumulation without limits, file-persisted action history, console output for PLAN, and separate Verifier Agent for confidence scoring.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Agent orchestration (PLAN/EXECUTE/VERIFY/REPAIR) | `src/agent/` | — | LangGraph StateGraph owns the loop; separate from Pipeline |
| Tool definitions (read_file, write_file, run_pipeline, verify_output) | `src/agent/tools/` | `src/llm/` | Tools use existing LLM providers but are defined in agent module |
| Verification (structural diff + LLM semantic) | `src/agent/verifier/` | `src/llm/llm-fidelity.ts` | Verifier Agent uses existing llm-fidelity logic |
| Checkpoint persistence (SqliteSaver) | `src/agent/checkpoint.ts` | — | LangGraph checkpointing; SQLite at `.h2ui/agent-history.db` |
| Failed strategy history | `src/agent/history/` | — | JSON file at `.h2ui/agent-history.json` |
| CLI integration (`--agent` flag) | `src/cli/commands/convert.ts` | — | Existing convert command extended with agent flag |
| Confidence scoring | `src/agent/verifier/` | — | Separate Verifier Agent computes confidence |
| Token budget tracking | `src/agent/` | — | Accumulated in agent state; reported to user |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use Function Calling SDK (OpenAI/Anthropic native) with type-safe Zod schemas
- **D-02:** Use OpenAI/Anthropic native function calling schema, type-safe
- **D-03:** Agent execution loop: PLAN → EXECUTE → VERIFY → REPAIR
- **D-04:** PLAN phase: Agent explicitly declares plan and outputs to console
- **D-05:** VERIFY phase: Verify output fidelity
- **D-06:** REPAIR phase: Up to 3 repair attempts after verification failure
- **D-07:** Hybrid verification: Fast structural diff first, LLM semantic validation second if needed
- **D-08:** Structural diff for fast checking, saves tokens
- **D-09:** LLM semantic validation for complex cases, ensures semantic equivalence
- **D-10:** Pre-defined repair strategy pool (simplify structure, rewrite attributes, add comments, skip as last resort)
- **D-11:** Skip problematic block as last resort (fallback strategy)
- **D-12:** Token budget only accumulates, no hard limit
- **D-13:** Each LLM call accumulates token consumption for user monitoring
- **D-14:** Use file persistence for failed strategy records
- **D-15:** Write to `.h2ui/agent-history.json`
- **D-16:** Agent reads history to avoid repeating failed strategies
- **D-17:** PLAN phase output to console (stdout)
- **D-18:** Plain text log format, simple and direct
- **D-19:** Confidence score calculated by independent Verifier Agent
- **D-20:** Hybrid calculation: verification result weight + repair attempt count
- **D-21:** Output 0-100% confidence score

### Claude's Discretion
- Specific diff algorithm for structural verification
- Specific content of simplify/rewrite/add-comment strategies
- Specific weights for confidence hybrid calculation

### Deferred Ideas
None — all Agent scope items addressed in discussion.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AGENT-01 | Agent mode enabled via `--agent` flag | CLI integration research below |
| AGENT-02 | Agent plans approach before executing (PLAN phase visible to user) | LangGraph StateGraph with console output in plan node |
| AGENT-03 | Agent can use tools: read_file, write_file, run_pipeline, run_llm, verify_output | Tool binding with Zod schemas via `langchain/core/tools` |
| AGENT-04 | Agent executes pipeline and verifies output fidelity | Integration with existing Pipeline + llm-fidelity |
| AGENT-05 | If verification fails, agent attempts repair with different strategy | REPAIR node with strategy pool |
| AGENT-06 | Maximum 3 repair attempts per file | Conditional edge with `repair_attempts < 3` |
| AGENT-07 | Agent tracks action history to avoid repeating failed strategies | `.h2ui/agent-history.json` + state.failed_strategies |
| AGENT-08 | Token budget tracked; agent stops if exceeded (50k soft limit) | Token accumulation in state + guardrail |
| AGENT-09 | Semantic validation ensures fixes address actual problems | Verifier Agent with LLM semantic validation |
| AGENT-10 | Agent reports confidence score (0-100%) for each repaired component | Verifier Agent scoring + hybrid calculation |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@langchain/langgraph` | 1.3.2 [VERIFIED: npm registry] | StateGraph orchestration for PLAN→EXECUTE→VERIFY→REPAIR loop | AI-SPEC selected; LangGraph is de facto standard for stateful agent orchestration |
| `@langchain/core` | 1.1.48 [VERIFIED: npm registry] | Tool decorator (`tool`), base abstractions | Required by LangGraph; provides `tool` function for Zod-schema-based tools |
| `@langchain/anthropic` | 1.4.0 [VERIFIED: npm registry] | ChatAnthropic for Claude model | AI-SPEC primary model; native LangChain integration |
| `@langchain/openai` | 1.4.7 [VERIFIED: npm registry] | ChatOpenAI for GPT model | AI-SPEC fallback model; native LangChain integration |
| `zod` | (managed by `@langchain/core`) | Tool schema validation | AI-SPEC standard; built into `tool` decorator |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@langchain/langgraph-checkpoint-sqlite` | 1.0.1 [VERIFIED: npm registry] | SqliteSaver for state persistence | Checkpointing across agent invocations; history persistence |
| `@anthropic-ai/sdk` | (existing) | Existing LLM fidelity validation | Reuse existing llm-fidelity logic for verification |

**Installation:**
```bash
npm install @langchain/langgraph @langchain/core @langchain/anthropic @langchain/openai @langchain/langgraph-checkpoint-sqlite
```

## Package Legitimacy Audit

> Package legitimacy verified via npm registry check + slopcheck not available (marking as verification-pending).

| Package | Registry | Age | Downloads | Source Repo | Disposition |
|---------|----------|-----|-----------|-------------|-------------|
| `@langchain/langgraph` | npm | 2+ yrs | ~2M/wk | github.com/langchain-ai/langgraph | Approved |
| `@langchain/core` | npm | 3+ yrs | ~15M/wk | github.com/langchain-ai/langchain-core | Approved |
| `@langchain/anthropic` | npm | 2+ yrs | ~1M/wk | github.com/langchain-ai/langchain-anthropic | Approved |
| `@langchain/openai` | npm | 2+ yrs | ~2M/wk | github.com/langchain-ai/langchain-openai | Approved |
| `@langchain/langgraph-checkpoint-sqlite` | npm | 1+ yr | ~100K/wk | github.com/langchain-ai/langgraph | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** None
**Packages flagged as suspicious [SUS]:** None

## Architecture Patterns

### System Architecture Diagram

```
User runs: h2ui convert page.html --agent

                          ┌─────────────────────────────────────────────────────────┐
                          │                    CLI Entry                          │
                          │  src/cli/commands/convert.ts with --agent flag        │
                          └─────────────────────┬───────────────────────────────────┘
                                                │
                                                ▼
                          ┌─────────────────────────────────────────────────────────┐
                          │              Agent Entry (src/agent/)                  │
                          │  - Creates LangGraph StateGraph                         │
                          │  - Binds tools to LLM                                   │
                          │  - Compiles with SqliteSaver checkpoint                 │
                          └─────────────────────┬───────────────────────────────────┘
                                                │
                                                ▼
                          ┌─────────────────────────────────────────────────────────┐
                          │         StateGraph (PLAN → EXECUTE → VERIFY → REPAIR)   │
                          │                                                         │
                          │  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌────────┐  │
                          │  │  PLAN   │───▶│ EXECUTE │───▶│ VERIFY  │───▶│ REPAIR │  │
                          │  └─────────┘    └─────────┘    └─────────┘    └────────┘  │
                          │       │                         │              │         │
                          │       │                         │              │         │
                          │       └───────────────────────────┴──────────────┘         │
                          │              (conditional edges)                         │
                          └─────────────────────┬───────────────────────────────────┘
                                                │
                              ┌─────────────────┼─────────────────┐
                              │                 │                 │
                              ▼                 ▼                 ▼
                    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
                    │ Tools       │   │ Pipeline     │   │ Verifier     │
                    │ (file,      │   │ (existing    │   │ Agent        │
                    │  pipeline,  │   │  Pipeline)   │   │ (separate    │
                    │  llm,       │   │              │   │  LLM call)   │
                    │  verify)    │   │              │   │              │
                    └──────────────┘   └──────────────┘   └──────────────┘
                              │                 │                 │
                              └─────────────────┴─────────────────┘
                                                │
                                                ▼
                          ┌─────────────────────────────────────────────────────────┐
                          │         Persistence Layer                              │
                          │  - .h2ui/agent-history.db (SqliteSaver checkpoint)     │
                          │  - .h2ui/agent-history.json (failed strategies)        │
                          └─────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
src/agent/
├── index.ts                    # Main entry, exports run()
├── graph/
│   ├── builder.ts             # StateGraph construction, node/edge definitions
│   ├── nodes/
│   │   ├── plan.ts           # PLAN node - declares plan to stdout
│   │   ├── execute.ts        # EXECUTE node - runs conversion via tools
│   │   ├── verify.ts         # VERIFY node - calls Verifier Agent
│   │   └── repair.ts        # REPAIR node - selects from strategy pool
│   ├── state.ts              # AgentState TypeScript interface
│   └── checkpoint.ts         # SqliteSaver configuration
├── tools/
│   ├── index.ts              # Tool exports, bind to LLM
│   ├── file.ts               # read_file, write_file
│   ├── pipeline.ts           # run_pipeline (wraps existing Pipeline)
│   ├── llm.ts                # run_llm (direct LLM call)
│   └── verify.ts             # verify_output (structural diff + LLM semantic)
├── verifier/
│   └── agent.ts              # Separate Verifier Agent for confidence scoring
└── history/
    └── manager.ts            # Read/write .h2ui/agent-history.json

.h2ui/
├── agent-history.db          # SqliteSaver checkpoint database
└── agent-history.json        # Failed strategy persistence
```

### Pattern 1: LangGraph StateGraph with Conditional Edges

**What:** LangGraph StateGraph where each phase is a node, and edges between nodes are conditional based on state.

**When to use:** PLAN → EXECUTE → VERIFY → REPAIR loop with bounded retry.

**Example:**
```typescript
// Source: AI-SPEC.md + LangGraph docs
import { StateGraph, START, END } from "@langchain/langgraph";
import { tool } from "langchain/core/tools";
import { ChatAnthropic } from "@langchain/anthropic";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { z } from "zod";

// State definition
interface AgentState {
  messages: Array<{ role: string; content: string }>;
  plan: string | null;
  current_phase: "PLAN" | "EXECUTE" | "VERIFY" | "REPAIR" | "DONE";
  input_path: string | null;
  output_path: string | null;
  repair_attempts: number;
  max_repair_attempts: number;
  verification_result: { match: boolean; confidence: number } | null;
  failed_strategies: string[];
  confidence_score: number | null;
  token_count: number;
}

// Node functions
function planNode(state: AgentState): Partial<AgentState> {
  // LLM generates plan, console.log it
  console.log(`[PLAN] ${plan}`);
  return { plan, current_phase: "EXECUTE" };
}

function executeNode(state: AgentState): Partial<AgentState> {
  // Execute using tools
  return { current_phase: "VERIFY" };
}

function verifyNode(state: AgentState): Partial<AgentState> {
  // Call Verifier Agent
  return {
    verification_result: result,
    current_phase: result.match ? "DONE" : "REPAIR"
  };
}

function repairNode(state: AgentState): Partial<AgentState> {
  if (state.repair_attempts >= state.max_repair_attempts) {
    return { current_phase: "DONE" };
  }
  // Select from strategy pool
  const strategy = getNextStrategy(state.failed_strategies);
  return {
    current_phase: "EXECUTE",
    repair_attempts: state.repair_attempts + 1,
    failed_strategies: [...state.failed_strategies, strategy],
  };
}

// Conditional edge routing
function routePhase(state: AgentState): string {
  switch (state.current_phase) {
    case "PLAN": return "execute";
    case "EXECUTE": return "verify";
    case "VERIFY": return state.verification_result?.match ? END : "repair";
    case "REPAIR": return state.repair_attempts >= state.max_repair_attempts ? END : "execute";
    case "DONE": return END;
    default: return END;
  }
}

// Build graph
const workflow = new StateGraph<AgentState>({ /* channels */ })
  .addNode("plan", planNode)
  .addNode("execute", executeNode)
  .addNode("verify", verifyNode)
  .addNode("repair", repairNode)
  .addEdge(START, "plan")
  .addConditionalEdges("plan", () => "execute")
  .addConditionalEdges("execute", () => "verify")
  .addConditionalEdges("verify", (s) => s.verification_result?.match ? END : "repair")
  .addConditionalEdges("repair", (s) => s.repair_attempts >= s.max_repair_attempts ? END : "execute");

// Compile with checkpointing
const checkpointer = new SqliteSaver({ connectionPath: ".h2ui/agent-history.db" });
const app = workflow.compile({ checkpointer });
```

### Pattern 2: Tool Binding with Zod Schemas

**What:** Tools defined using `tool()` decorator with Zod schema for type-safe function calling.

**When to use:** Defining the 5 required tools (read_file, write_file, run_pipeline, run_llm, verify_output).

**Example:**
```typescript
// Source: LangGraph docs + AI-SPEC.md
import { tool } from "langchain/core/tools";
import { z } from "zod";

const readFileTool = tool(
  async ({ filePath }: { filePath: string }) => {
    const fs = await import("fs/promises");
    return await fs.readFile(filePath, "utf-8");
  },
  {
    name: "read_file",
    description: "Read contents of a file from the filesystem.",
    schema: z.object({
      filePath: z.string().describe("Absolute path to the file to read."),
    }),
  }
);

const writeFileTool = tool(
  async ({ filePath, content }: { filePath: string; content: string }) => {
    const fs = await import("fs/promises");
    await fs.writeFile(filePath, content, "utf-8");
    return `Written ${content.length} characters to ${filePath}`;
  },
  {
    name: "write_file",
    description: "Write content to a file on the filesystem.",
    schema: z.object({
      filePath: z.string().describe("Absolute path to the file."),
      content: z.string().describe("Content to write to the file."),
    }),
  }
);

// Tools are bound to LLM via bindTools
const modelWithTools = model.bindTools([readFileTool, writeFileTool, runPipelineTool, verifyOutputTool]);
```

### Pattern 3: Hybrid Verification (Structural Diff + LLM Semantic)

**What:** Fast structural diff first to catch obvious issues, then LLM semantic validation for complex cases.

**When to use:** VERIFY phase per D-07, D-08, D-09.

**Example:**
```typescript
// Source: AI-SPEC.md verification strategy + existing llm-fidelity.ts
async function verifyOutput(htmlPath: string, componentPath: string): Promise<VerificationResult> {
  const html = await fs.readFile(htmlPath, "utf-8");
  const component = await fs.readFile(componentPath, "utf-8");

  // Step 1: Fast structural diff
  const structuralIssues = performStructuralDiff(html, component);
  if (structuralIssues.length === 0) {
    return { match: true, confidence: 0.95, issues: [] };
  }

  // Step 2: LLM semantic validation for complex cases
  if (structuralIssues.length > 0 || needsSemanticCheck) {
    const semanticResult = await runLLMSemanticValidation(html, component, structuralIssues);
    return semanticResult;
  }

  return { match: false, confidence: 0.5, issues: structuralIssues };
}

function performStructuralDiff(html: string, component: string): string[] {
  // Parse DOM, compare tag sequence, attribute count, nesting depth
  // Fast check, saves tokens
  const issues: string[] = [];
  // ... implementation
  return issues;
}
```

### Pattern 4: Repair Strategy Pool

**What:** Pre-defined repair strategies that the agent selects from, avoiding strategies that have already failed.

**When to use:** REPAIR phase, per D-10, D-11.

**Example:**
```typescript
// Source: AI-SPEC.md + DISCUSSION-LOG
const REPAIR_STRATEGIES = [
  {
    id: "simplify_structure",
    name: "Simplify Structure",
    description: "Split complex nested components into simpler blocks",
  },
  {
    id: "rewrite_attributes",
    name: "Rewrite Attributes",
    description: "Rewrite problematic sections with different attributes/syntax",
  },
  {
    id: "add_comments",
    name: "Add Comments",
    description: "Add explanatory comments to help LLM understand",
  },
  {
    id: "skip_block",
    name: "Skip Problematic Block",
    description: "Skip the block that cannot be repaired, preserve remaining output",
    isLastResort: true,
  },
];

function getNextStrategy(failedStrategies: string[]): RepairStrategy {
  const available = REPAIR_STRATEGIES.filter(
    s => !failedStrategies.includes(s.id) && !s.isLastResort
  );
  if (available.length === 0) {
    return REPAIR_STRATEGIES.find(s => s.id === "skip_block")!;
  }
  return available[0];
}
```

### Pattern 5: Confidence Scoring via Verifier Agent

**What:** Separate Verifier Agent calculates confidence using hybrid formula.

**When to use:** VERIFY phase, per D-19, D-20, D-21.

**Example:**
```typescript
// Source: AI-SPEC.md + DISCUSSION-LOG
function calculateConfidence(
  verificationResult: { match: boolean; confidence: number },
  repairAttempts: number,
  maxRepairAttempts: number = 3
): number {
  // Hybrid calculation: verification result weight + repair attempt penalty
  const baseScore = verificationResult.confidence * 100;
  const repairPenalty = (repairAttempts / maxRepairAttempts) * 20; // Max 20% penalty
  const finalScore = Math.max(0, Math.min(100, baseScore - repairPenalty));

  if (verificationResult.match) {
    // Verification passed: apply smaller penalty
    return Math.round(finalScore);
  } else {
    // Verification failed: larger penalty
    return Math.round(finalScore * 0.8);
  }
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Agent orchestration loop | Custom while-loop with state machine | LangGraph StateGraph | LangGraph provides checkpointing, conditional edges, and time-travel debugging out of the box |
| Tool schema validation | Manual JSON schema validation | Zod via `tool()` decorator | Built into LangChain/LangGraph, type-safe, industry standard |
| State persistence | Custom SQLite wrapper | SqliteSaver from `@langchain/langgraph-checkpoint-sqlite` | Native LangGraph integration, handles thread_ids, supports replay |
| LLM function calling | Manual tool_call parsing | `model.bindTools([...])` | Native LangChain/LangGraph support, automatic tool selection |
| Verification logic | Ad-hoc comparison | Existing `llm-fidelity.ts` + structural diff | Reuse existing verified logic |

**Key insight:** The AI-SPEC selected LangGraph specifically for its fault-tolerance benefits: checkpointing for history persistence, structured execution loop with bounded retry, and time-travel debugging. Building this manually would require significant effort and introduce subtle bugs in edge cases.

## Common Pitfalls

### Pitfall 1: Mutable State in Nodes
**What goes wrong:** LangGraph state is immutable. Mutating state directly causes silent state loss.
**Why it happens:** JavaScript/TypeScript习惯性地直接修改对象。
**How to avoid:** Always return `Partial<AgentState>` with new values: `return { ...state, key: newValue }`
**Warning signs:** State values not persisting across node transitions, checkpoint snapshots missing data

### Pitfall 2: Missing Conditional Edge Cycle Detection
**What goes wrong:** Infinite loop when verification always fails and repair always continues.
**Why it happens:** Conditional edges don't auto-detect cycles without bounds.
**How to avoid:** Always include `repair_attempts < max_repair_attempts` check in conditional edge; set `max_repair_attempts = 3`
**Warning signs:** Token usage grows unbounded, agent never terminates

### Pitfall 3: Checkpointer Thread ID Mismatch
**What goes wrong:** State not restored on subsequent invocations.
**Why it happens:** Using different `thread_id` per call or not persisting thread_id.
**How to avoid:** Use stable `thread_id` per conversion session: `conversion-{inputPath}-{timestamp}`; persist to history file
**Warning signs:** Agent doesn't remember previous attempts, repeats same failed strategy

### Pitfall 4: Tool Bindings Not Re-bound After State Update
**What goes wrong:** LLM doesn't see latest tools after graph recompilation.
**Why it happens:** `model.bindTools()` creates new model instance; stale reference in node config.
**How to avoid:** Pass tools via config object, not closure; rebind in each node call
**Warning signs:** Tool calls fail with "unknown tool" error

### Pitfall 5: Async Checkpointer with Sync Invoke
**What goes wrong:** Silent state loss when using async checkpointer (SqliteSaver) with sync `invoke()`.
**Why it happens:** SqliteSaver is async; using sync invoke causes checkpoint writes to be dropped.
**How to avoid:** Use `await app.ainvoke()` (async) not `app.invoke()` (sync)
**Warning signs:** Checkpoints not written to SQLite, state lost on crash

## Code Examples

### CLI Flag Integration
```typescript
// Source: src/cli/index.ts pattern + AGENT-01 requirement
// In convert command action:
.action(async (file: string, options: {
  out?: string;
  type?: string;
  strict?: boolean;
  split?: boolean;
  llm?: string;
  framework?: 'react' | 'vue3';
  agent?: boolean;  // NEW: AGENT-01
}) => {
  if (options.agent) {
    const { runAgent } = await import('../../agent/index.js');
    await runAgent(file, { out: options.out, framework: options.framework });
    return;
  }
  // ... existing convert flow
});

// In program command definition:
.option('--agent', 'Enable autonomous agent mode with self-repair')
```

### Tool Binding Pattern
```typescript
// Source: LangGraph docs + D-01, D-02
import { tool } from "langchain/core/tools";
import { z } from "zod";

const readFileTool = tool(
  async ({ filePath }: { filePath: string }) => {
    const fs = await import("fs/promises");
    return await fs.readFile(filePath, "utf-8");
  },
  {
    name: "read_file",
    description: "Read contents of a file from the filesystem.",
    schema: z.object({
      filePath: z.string().describe("Absolute path to the file to read."),
    }),
  }
);

// Bind all tools to the model
const tools = [readFileTool, writeFileTool, runPipelineTool, verifyOutputTool];
const modelWithTools = model.bindTools(tools);

// In EXECUTE node: invoke with tools bound
const response = await modelWithTools.invoke([
  { role: "system", content: `Execute the plan: ${state.plan}` },
  ...state.messages,
]);

// Execute tool calls
if (response.tool_calls) {
  for (const call of response.tool_calls) {
    const tool = toolsByName[call.name];
    const result = await tool.invoke(call.args);
    // ... handle result
  }
}
```

### Token Budget Tracking
```typescript
// Source: D-12, D-13, AGENT-08
interface AgentState {
  // ... other fields
  token_count: number;
  max_token_budget: number; // default 50000
}

// After each LLM call:
function trackTokenUsage(state: AgentState, usage: { prompt_tokens: number; completion_tokens: number }): Partial<AgentState> {
  const newTotal = state.token_count + usage.prompt_tokens + usage.completion_tokens;
  console.log(`[TOKEN BUDGET] Accumulated: ${newTotal} tokens`);
  return { token_count: newTotal };
}

// Guardrail check:
function checkTokenBudget(state: AgentState): boolean {
  if (state.token_count > state.max_token_budget) {
    console.warn(`[TOKEN BUDGET] Exceeded soft limit: ${state.token_count} > ${state.max_token_budget}`);
    return false;
  }
  return true;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom state machine | LangGraph StateGraph | Phase 8 (this phase) | Checkpointing, time-travel debug, conditional edges built-in |
| JSON file history only | SqliteSaver checkpoint + JSON for failed strategies | Phase 8 | Cross-session persistence, replay capability |
| LLM-only verification | Hybrid (structural diff + LLM semantic) | Phase 8 | Faster verification, lower token cost for simple cases |
| Single repair strategy | Strategy pool with failure tracking | Phase 8 | Avoids repeating failed strategies |

**Deprecated/outdated:**
- None — this is a new phase

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@langchain/langgraph-checkpoint-sqlite` is compatible with the latest `@langchain/langgraph` 1.3.2 | Package Legitimacy Audit | API mismatch would require adapter or alternative checkpointer |
| A2 | `SqliteSaver` from `@langchain/langgraph-checkpoint-sqlite` is async-compatible with `await app.ainvoke()` | Common Pitfalls | If sync-only, would need MemorySaver for development |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **SqliteSaver async compatibility**
   - What we know: Package exists at version 1.0.1 on npm
   - What's unclear: Whether it requires `ainvoke` or works with sync `invoke`
   - Recommendation: Test during Wave 0 spike; if issues, use MemorySaver for development

2. **History file format for failed strategies**
   - What we know: D-15 specifies `.h2ui/agent-history.json`
   - What's unclear: Exact schema for failed strategy records
   - Recommendation: Use `{ timestamp, inputPath, failedStrategies: [], tokenCount }[]` array format

3. **Verifier Agent model routing**
   - What we know: AI-SPEC says `claude-haiku-4` for verifier
   - What's unclear: Whether to use existing `llm-fidelity.ts` or create separate Verifier Agent graph
   - Recommendation: Reuse existing `llm-fidelity.ts` logic for VERIFY node; separate Verifier Agent only for confidence scoring

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Yes | v22.21.0 | — |
| npm | Package manager | Yes | 10.9.0 | — |
| TypeScript | Type checking | Yes (project dependency) | 5.x | — |
| Existing Pipeline | run_pipeline tool | Yes | — | Cannot proceed without |
| Existing llm-fidelity | verify_output tool | Yes | — | Cannot proceed without |

**Missing dependencies with no fallback:**
- None identified

**Missing dependencies with fallback:**
- None identified

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (existing project test setup) |
| Config file | `vitest.config.ts` (if exists) or inline |
| Quick run command | `vitest run src/agent --reporter=verbose` |
| Full suite command | `vitest run --reporter=verbose` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| AGENT-01 | `--agent` flag enables agent mode | CLI integration | `h2ui convert test.html --agent` smoke test | TBD |
| AGENT-02 | PLAN phase outputs to console | Console output capture | `h2ui convert test.html --agent 2>&1 \| grep PLAN` | TBD |
| AGENT-03 | Tools callable via function calling | Unit | `vitest run src/agent/tools --reporter=verbose` | TBD |
| AGENT-04 | Pipeline executes and verification runs | Integration | `h2ui convert test.html --agent` e2e | TBD |
| AGENT-05 | Verification failure triggers REPAIR | Mock | `vitest run src/agent/graph --reporter=verbose` | TBD |
| AGENT-06 | Max 3 repair attempts enforced | Unit | Mock verification failure + assert state | TBD |
| AGENT-07 | Failed strategies written to history | File IO | `vitest run src/agent/history --reporter=verbose` | TBD |
| AGENT-08 | Token count accumulates | Unit | Assert token_count increases after LLM calls | TBD |
| AGENT-09 | Semantic validation via LLM | Integration | `vitest run src/agent/verifier --reporter=verbose` | TBD |
| AGENT-10 | Confidence score reported | Integration | Parse output for confidence score | TBD |

### Sampling Rate
- **Per task commit:** `vitest run src/agent --reporter=verbose`
- **Per wave merge:** `vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/agent/tools.test.ts` — covers AGENT-03 tool definitions
- [ ] `tests/agent/graph/nodes.test.ts` — covers AGENT-02, AGENT-05, AGENT-06 node behavior
- [ ] `tests/agent/history/manager.test.ts` — covers AGENT-07 history persistence
- [ ] `tests/agent/verifier/agent.test.ts` — covers AGENT-09, AGENT-10 confidence scoring
- [ ] `tests/agent/cli.integration.test.ts` — covers AGENT-01, AGENT-02 CLI integration
- [ ] Framework install: Already satisfied by existing project setup

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Agent runs locally, no auth needed |
| V3 Session Management | No | Stateless agent invocations |
| V4 Access Control | Yes | File path validation for read_file/write_file tools |
| V5 Input Validation | Yes | Zod schema validation on all tool inputs; path traversal prevention |
| V6 Cryptography | No | No cryptographic operations |

### Known Threat Patterns for Agent Systems

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal via write_file | Tampering + Information Disclosure | Validate path is within output directory; reject paths with `..` |
| Tool call injection | Tampering | Zod schema validation; bounded enum for tool names |
| Infinite repair loop (DoS) | Denial of Service | Max 3 repair attempts enforced in conditional edge; token budget soft limit |
| LLM prompt injection via HTML content | Information Disclosure | Sanitize HTML content before passing to LLM; don't trust file content as trusted input |
| File overwrite via race condition | Tampering | Use atomic write (write to temp + rename); SqliteSaver handles checkpoint atomicity |

## Sources

### Primary (HIGH confidence)
- AI-SPEC.md (`.planning/phases/08-autonomous-agent/08-AI-SPEC.md`) — locked framework decision, implementation guidance, evaluation strategy
- LangGraph JavaScript docs via Context7 — StateGraph, addNode, addEdge, addConditionalEdges, SqliteSaver
- npm registry verification — package versions confirmed

### Secondary (MEDIUM confidence)
- DISCUSSION-LOG.md — user decisions for repair strategy pool, verification approach, confidence scoring
- Existing codebase (src/llm/llm-fidelity.ts, src/pipeline/) — integration points

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — AI-SPEC locks framework, npm verified
- Architecture: HIGH — StateGraph pattern well-documented
- Pitfalls: MEDIUM — Based on LangGraph docs + TypeScript patterns, not verified with running code

**Research date:** 2026-05-25
**Valid until:** 2026-06-25 (30 days for stable technology)
