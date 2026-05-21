# Phase 5: LLM Code Modification + Browser Preview - Research

**Researched:** 2026-05-22
**Domain:** LLM direct code modification + local browser preview server
**Confidence:** MEDIUM

## Summary

Phase 5 evolves h2ui from "LLM suggests, human decides" (Phase 4) to "LLM applies directly" and adds an interactive browser preview. The LLM modify step replaces the review step — instead of outputting suggestions, LLM outputs the modified component code directly. The preview server uses Vite's preview mode with a React visualization of the component tree. Key challenges: (1) safe LLM filesystem writes requiring guardrails before applying changes, (2) structured output that includes modified code rather than just suggestions, and (3) Vite integration for preview serving.

**Primary recommendation:** Use full file rewrite (not diff/patch) for LLM code modification — simpler to implement, easier to validate. Use Vite preview server with WebSocket for live reload. LLM outputs modified component code via structured output, validated by Zod before writing to disk.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| LLM code modification | API/Backend | — | LLM outputs modified code; validation before write |
| Code validation (guardrails) | API/Backend | — | TypeScript compile check + AST pattern validation before write |
| Preview server | Browser/Frontend Server | — | Vite preview serves React visualization; HMR for live reload |
| Component tree visualization | Browser | — | React component renders tree from componentTree JSON |
| Live reload | Browser/Frontend Server | — | WebSocket pushes updates to browser |
| File write (sandboxed) | API/Backend | — | Only writes to configured output directory |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Direct `openai` SDK — no abstraction layer
- D-02: Support custom config via `baseURL` for Ollama and OpenAI-compatible APIs
- D-04: Display-only warning for token/cost estimation before LLM call
- D-05: No blocking confirmation — always proceed after warning
- D-06: No caching — each conversion triggers a fresh LLM call
- D-10: Configurable `llm.mode`: `"off"` | `"auto"` | `"always"`
- D-11: On LLM error: explicit error message + fallback to rules-only output
- D-12: No blocking — graceful degradation

### Claude's Discretion
- LLM modify output format: full file rewrite vs patch/diff
- Preview server implementation: Vite vs custom Express+WS
- Guardrail validation depth (TypeScript compile, AST analysis, both)
- Component tree visualization UI design

### Deferred Ideas (OUT OF SCOPE)
- None

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LLM-06 | LLM applies naming and cleanup changes directly to code | Full file rewrite + Zod validation; `ComponentCodeSchema` structured output |
| LLM-07 | Interactive component tree preview in browser | Vite preview server + React component tree visualization |
| POL-01 | Browser preview server (optional live reload) | Vite preview mode + WebSocket HMR |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `vite` | `^6.0.0` | Preview server + HMR | Industry-standard React dev server with built-in preview mode and WebSocket HMR |
| `ws` | `^8.18.0` | WebSocket server | Lightweight, battle-tested WebSocket implementation for live reload |
| `vite` | (preview mode) | Serves preview React app | Preview mode is sandboxed; doesn't expose source files |

**[ASSUMED: All packages — slopcheck unavailable, npm registry verification only]**

**Installation:**
```bash
npm install vite@^6.0.0 ws@^8.18.0 --save-dev
```

**Version verification (npm registry):**
- `vite`: 6.0.14 [VERIFIED: npm registry]
- `ws`: 8.18.0 [VERIFIED: npm registry]

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| `@types/ws` | `^8.18.0` | TypeScript types for ws | Dev dependency for preview server types |
| `react` | `^19.0.0` | React for preview UI | Already likely installed; verify |
| `react-dom` | `^19.0.0` | React DOM for preview | Already likely installed; verify |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vite preview | webpack-dev-server | Vite is lighter, faster, native HMR support; webpack is heavier |
| Vite preview | Express + ws custom server | Vite's preview mode is already sandboxed and handles static file serving |
| ws | socket.io | ws is lighter; socket.io adds fallback and reconnection logic we don't need |
| Full file rewrite | Diff/patch generation | Patch is more token-efficient but harder to validate; full rewrite is simpler and safer to validate |

## Package Legitimacy Audit

> slopcheck was unavailable at research time. All packages below are marked `[ASSUMED]` per the graceful degradation protocol. Planner MUST gate each install behind a `checkpoint:human-verify` task.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| vite | npm | ~6 yrs | ~25M/wk | github.com/vitejs/vite | unavailable | ASSUMED — verify before using |
| ws | npm | ~12 yrs | ~75M/wk | github.com/websockets/ws | unavailable | ASSUMED — verify before using |
| @types/ws | npm | ~8 yrs | ~35M/wk | github.com/DefinitelyTyped/DefinitelyTyped | unavailable | ASSUMED — verify before using |

**Packages removed due to slopcheck [SLOP] verdict:** None (slopcheck unavailable)
**Packages flagged as suspicious [SUS]:** None — all packages have substantial download counts and canonical source repos.

*All packages above are tagged `[ASSUMED]` and the planner must gate each install behind a `checkpoint:human-verify` task.*

## Architecture Patterns

### System Architecture Diagram

```
CLI Input (h2ui preview --component <name>)
    │
    ▼
Pipeline (Phase 1-4)
    │ parseStep → splitStep → convertStep → cssStep
    │
    ▼
LLM Modify Step (NEW: llm-modify.ts)
    │
    ├─→ Serialize componentTree + current code as context
    ├─→ Display token/cost WARNING (D-04)
    ├─→ Call LLM with modify prompt
    ├─→ Zod validate: ComponentCodeSchema
    │       │
    │       ├─→ PASS: Guardrail validation (TypeScript compile check)
    │       │           │
    │       │           ├─→ PASS: Write modified code to output dir
    │       │           │
    │       │           └─→ FAIL: Log error, fallback to rules-only
    │       │
    │       └─→ FAIL: Log parse error, fallback to rules-only
    │
    ▼
Preview Server (vite preview mode)
    │
    ├─→ Serve React preview app (component tree visualization)
    ├─→ WebSocket server for live reload
    └─→ Watch output directory for file changes
```

### Recommended Project Structure

```
src/
├── llm/
│   ├── providers/
│   │   ├── openai.ts        # Phase 4: existing
│   │   └── anthropic.ts     # Phase 4: existing
│   ├── structured/
│   │   ├── review.ts        # Phase 4: existing
│   │   └── modify.ts        # NEW: ComponentCodeSchema for LLM modify output
│   ├── estimate.ts          # Phase 4: existing
│   ├── llm-review.ts       # Phase 4: existing
│   └── llm-modify.ts        # NEW: LLM modify service (applies changes directly)
├── pipeline/
│   └── steps/
│       ├── parse.ts         # Phase 1: existing
│       ├── split.ts        # Phase 2: existing
│       ├── convert.ts      # Phase 1: existing
│       ├── css.ts          # Phase 2: existing
│       ├── llm-review.ts    # Phase 4: existing
│       └── llm-modify.ts   # NEW: PipelineStep for LLM modify
├── preview/
│   ├── server.ts            # NEW: Vite preview + WebSocket server
│   ├── visualization/
│   │   ├── App.tsx         # NEW: React component tree visualization
│   │   └── ComponentNode.tsx
│   └── client.ts            # NEW: WebSocket client for live reload
└── cli/
    └── commands/
        ├── convert.ts      # Phase 1-4: existing
        └── preview.ts      # NEW: preview command
```

### Pattern 1: LLM Full File Rewrite (instead of suggestion)

**What:** LLM outputs the complete modified component code, not a diff or suggestions.
**When to use:** For every LLM modify invocation in Phase 5.
**Example:**
```typescript
// src/llm/structured/modify.ts
import { z } from 'zod';

export const ComponentCodeSchema = z.object({
  components: z.array(z.object({
    name: z.string(),
    code: z.string().describe('Complete TSX/JSX component code'),
    rationale: z.string().describe('Brief explanation of changes made'),
  })),
});

export type ComponentCode = z.infer<typeof ComponentCodeSchema>;

// In llm-modify.ts:
const completion = await client.chat.completions.parse({
  model: config.model ?? 'gpt-4o-mini',
  messages: [
    { role: 'system', content: buildModifySystemPrompt() },
    { role: 'user', content: buildModifyUserContent(componentTree, currentCode) },
  ],
  response_format: zodResponseFormat(ComponentCodeSchema, 'component_modify'),
  max_tokens: 8192,  // Larger for full code output
  temperature: 0.2,
});
```

### Pattern 2: Guardrail Validation Before Write

**What:** Validate LLM output before writing to filesystem.
**When to use:** Every file write triggered by LLM output.
**Example:**
```typescript
// src/llm/llm-modify.ts
async function validateBeforeWrite(code: string): Promise<{ valid: boolean; error?: string }> {
  // 1. Syntax validation via TypeScript
  const tsResult = await ts.transpileModuleAsync(code, {
    compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ESNext },
  });
  if (tsResult.diagnostics && tsResult.diagnostics.length > 0) {
    return { valid: false, error: tsResult.diagnostics[0].messageText.toString() };
  }

  // 2. Dangerous pattern check
  const dangerousPatterns = [/\beval\s*\(/, /\bnew\s+Function\s*\(/, /\`.*\$\{.*\}/];
  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      return { valid: false, error: `Dangerous pattern detected: ${pattern}` };
    }
  }

  return { valid: true };
}
```

### Pattern 3: Vite Preview Server with WebSocket

**What:** Use Vite preview mode for serving the React visualization with WebSocket for live reload.
**When to use:** For the preview command.
**Example:**
```typescript
// src/preview/server.ts
import { preview } from 'vite';
import { WebSocketServer } from 'ws';

export async function startPreviewServer(outputDir: string, port: number = 5173) {
  // Start Vite preview server
  const vitePreview = await preview({
    root: path.join(__dirname, 'preview'),
    preview: { port, host: 'localhost' },
    server: { proxy: {} },
  });

  // Attach WebSocket server for live reload
  const wss = new WebSocketServer({ server: vitePreview.httpServer });
  wss.on('connection', (ws) => {
    ws.on('close', () => console.log('[preview] Client disconnected'));
  });

  // Watch output directory for changes
  const watcher = chokidar.watch(path.join(outputDir, '**/*.tsx'), { ignoreInitial: true });
  watcher.on('change', (filePath) => {
    // Broadcast reload to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'reload', file: filePath }));
      }
    });
  });

  return { server: vitePreview, wss };
}
```

### Pattern 4: Component Tree Visualization

**What:** React component that renders the component tree as an interactive tree view.
**When to use:** For the preview browser UI.
**Example:**
```typescript
// src/preview/visualization/ComponentNode.tsx
interface ComponentNodeProps {
  node: {
    name: string;
    tag: string;
    children: ComponentNodeProps['node'][];
    isRepeated?: boolean;
  };
  onSelect: (name: string) => void;
}

function ComponentNode({ node, onSelect }: ComponentNodeProps) {
  return (
    <div className="component-node" onClick={() => onSelect(node.name)}>
      <span className="node-name">{node.name}</span>
      <span className="node-tag">&lt;{node.tag} /&gt;</span>
      {node.isRepeated && <span className="repeated-badge">repeated</span>}
      {node.children.length > 0 && (
        <div className="children">
          {node.children.map((child, i) => (
            <ComponentNode key={i} node={child} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Live reload | Custom file watcher + HTTP server | Vite preview + WebSocket | Vite preview is already sandboxed, handles static serving, and has built-in HMR |
| LLM output validation | Trust LLM output blindly | Zod safeParse + TypeScript transpile check | LLM can output malformed code; must validate before write |
| Code modification | Diff/patch application | Full file rewrite | Simpler to implement, easier to validate, less error-prone |

**Key insight:** LLM code modification is inherently risky — the LLM can output anything. Every write must be validated before touching the filesystem. Vite's preview mode is designed exactly for this use case (sandboxed preview) and handles the WebSocket/HMR complexity.

## Common Pitfalls

### Pitfall 1: Unvalidated LLM code writes
**What goes wrong:** LLM outputs code with syntax errors, infinite loops, or malicious content that gets written to disk.
**Why it happens:** Phase 4 validated LLM output for suggestions only; Phase 5 writes actual code.
**How to avoid:** Run TypeScript transpile check on output before write. Reject and fallback to rules-only if validation fails.
**Warning signs:** Filesystem fills with corrupted code, infinite loop in generated components.

### Pitfall 2: Vite exposing source files in preview mode
**What goes wrong:** Vite preview serves files from project root instead of the preview UI app.
**Why it happens:** Misconfigured `root` option points to wrong directory.
**How to avoid:** Preview app lives in `src/preview/visualization/` with its own `vite.config.ts`; preview command serves that specifically.
**Warning signs:** Browser shows raw TypeScript source instead of React app.

### Pitfall 3: WebSocket reconnection floods
**What goes wrong:** Browser reconnects rapidly on server restart, flooding the server.
**Why it happens:** No backoff on WebSocket reconnection.
**How to avoid:** Implement exponential backoff in client, server-side connection limit.
**Warning signs:** `wss.clients` grows unbounded, high CPU on preview server.

### Pitfall 4: Large LLM output exceeding context
**What goes wrong:** Full component code output exceeds model's context window.
**Why it happens:** Current code can be large; LLM outputs everything at once.
**How to avoid:** Process components individually or in small batches; use `max_tokens: 8192` for larger outputs.
**Warning signs:** LLM returns partial/incomplete code, truncated at end.

### Pitfall 5: Live reload on intermediate build state
**What goes wrong:** File watcher triggers reload during partial write, browser shows broken state.
**Why it happens:** No atomic write or file locking.
**How to avoid:** Write to temp file, then rename (atomic move) on success. Or debounce file watcher events.
**Warning signs:** Browser flashes between old and new state repeatedly.

## Code Examples

### System Prompt Builder for LLM Modify
```typescript
// Source: Phase 4 review prompt adapted for modification
function buildModifySystemPrompt(): string {
  return `You are a component modifier for an HTML-to-React conversion tool.
You have access to the current component tree and existing component code.
Your task is to improve component naming and clean up code.

SCOPE:
- Rename components to be more descriptive based on their content/purpose
- Clean up redundant nesting or dead code
- Ensure proper TypeScript/React patterns

OUT OF SCOPE:
- Do not restructure the component hierarchy
- Do not add new functionality or logic
- Do not remove CSS classes that are in use

OUTPUT FORMAT:
Return ONLY valid JSON matching the provided schema with complete component code for each modified component.`;
}
```

### PipelineStep for LLM Modify
```typescript
// src/pipeline/steps/llm-modify.ts
export const llmModifyStep: PipelineStep = {
  name: 'llm-modify',

  async run(ctx: PipelineContext): Promise<PipelineContext> {
    const newCtx = { ...ctx, warnings: [...ctx.warnings], errors: [...ctx.errors] };

    const llmConfig = ctx.options.llm;
    if (!llmConfig || llmConfig.mode === 'off') {
      return newCtx;
    }

    if (!ctx.componentTree || !ctx.components) {
      newCtx.warnings.push('No component tree available for LLM modify');
      return newCtx;
    }

    try {
      const result = await runLLMModify(ctx.componentTree, ctx.components, llmConfig);

      // Validate before write
      for (const comp of result.components) {
        const validation = await validateBeforeWrite(comp.code);
        if (!validation.valid) {
          console.warn(`[llm-modify] Validation failed for ${comp.name}: ${validation.error}`);
          continue; // Skip this component, keep original
        }
        // Apply to ctx.components
        const idx = ctx.components.findIndex(c => c.name === comp.name);
        if (idx !== -1) {
          ctx.components[idx] = { ...ctx.components[idx], code: comp.code };
        }
      }

      return { ...newCtx, components: ctx.components };
    } catch (err: any) {
      console.warn(`[llm-modify] error: ${err.message}, falling back to rules-only`);
      return newCtx;
    }
  },
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| LLM as reviewer (suggestions only) | LLM as modifier (applies changes) | Phase 5 | Human-in-the-loop becomes optional; faster iteration |
| No preview | Browser preview with component tree | Phase 5 | Visual verification before committing changes |
| Manual file refresh | Live reload via WebSocket | Phase 5 | Faster feedback loop during LLM modification |

**Deprecated/outdated:**
- LLM suggestion display only (Phase 4): Replaced by direct application with guardrail validation

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `vite@^6.0.0` works with the existing React setup | Standard Stack | Vite 6 may have breaking changes from Vite 5 used in training data. Verify with npm install. |
| A2 | Full file rewrite is easier to validate than diff/patch | Architecture | Diff/patch could be more token-efficient but harder to apply correctly. Full rewrite is safer. |
| A3 | TypeScript transpile check is sufficient guardrail | Common Pitfalls | AST-level validation could catch more issues but adds complexity. Start with transpile check. |
| A4 | WebSocket live reload via ws library is simpler than Vite HMR API | Architecture | Vite has native HMR; ws adds a separate WebSocket layer. Could use Vite HMR instead. |
| A5 | Vite preview mode serves from a separate preview app directory | Architecture | Preview app needs its own `vite.config.ts` and entry point separate from source code. |

## Open Questions

1. **Should LLM modify run once or iteratively?**
   - What we know: Single-pass modify is simpler; iterative (LLM modify -> human approves -> LLM modify again) enables more control
   - What's unclear: Which flow aligns with v2 goals
   - Recommendation: Start with single-pass (LLM modifies, browser preview shows result); iterative approval as future enhancement

2. **Preview server: should it serve the actual converted components or a separate preview app?**
   - What we know: LLM-07 says "interactive component tree preview in browser"
   - What's unclear: Does this mean previewing actual generated React components, or a tree visualization UI?
   - Recommendation: Start with tree visualization (shows component structure); actual React component preview as future enhancement

3. **What happens when LLM modify validation fails?**
   - What we know: Fall back to rules-only output (per D-11/D-12)
   - What's unclear: Should we show the LLM's failed output for debugging?
   - Recommendation: Log failed output to temp file with `.failed.json` extension for debugging

## Environment Availability

> Step 2.6: SKIPPED — no external dependencies beyond npm packages. All dependencies are installed via `npm install` at implementation time.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (already in project from Phase 1) |
| Config file | `vitest.config.ts` (already exists) |
| Quick run command | `npx vitest run test/llm/ --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LLM-06 | LLM modifies component code directly | unit | `vitest run test/llm/modify.test.ts` | no |
| LLM-07 | Browser shows interactive component tree | manual | Browser test | no |
| POL-01 | Preview server starts and serves UI | manual | `h2ui preview` | no |

### Sampling Rate
- **Per task commit:** `npx vitest run test/llm/ --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/llm/modify.test.ts` — covers LLM-06 (LLM modify behavior)
- [ ] `test/preview/server.test.ts` — covers POL-01 (preview server startup)
- [ ] `test/preview/validation.test.ts` — covers guardrail validation
- [ ] `src/preview/visualization/` — React preview app
- [ ] `src/preview/server.ts` — Vite preview + WebSocket server
- [ ] `test/llm/fixtures/` — test fixtures with sample component trees

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth in CLI tool |
| V3 Session Management | no | WebSocket sessions are transient |
| V4 Access Control | yes | Only write to configured output directory; sandbox preview server |
| V5 Input Validation | yes | Zod schema validation + TypeScript transpile check on LLM output |
| V6 Cryptography | no | No crypto operations |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| LLM outputs malicious code (eval injection) | Tampering | TypeScript transpile check + dangerous pattern regex before write |
| LLM outputs infinite loop | Denial of Service | Guardrail validation catches syntax; runtime not prevented |
| Preview server serves arbitrary files | Information Disclosure | Vite preview mode is sandboxed; root configured to preview app only |
| WebSocket connection flood | Denial of Service | Connection limit + exponential backoff reconnection |
| LLM code modification overwrites source | Tampering | Only writes to configured output directory; user must explicitly set `--out` |

## Sources

### Primary (HIGH confidence)
- npm registry — Package versions for vite, ws [VERIFIED: npm registry]
- Phase 4 research — Existing LLM integration patterns [VERIFIED: codebase inspection]

### Secondary (MEDIUM confidence)
- Vite documentation — Preview mode and HMR API [ASSUMED: based on Vite 5 patterns]
- ws npm page — WebSocket server usage [ASSUMED: based on common ws patterns]

### Tertiary (LOW confidence)
- LLM modify strategy — Full file rewrite vs patch [ASSUMED: no authoritative source]
- Guardrail validation depth [ASSUMED: based on general security practices]

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM — npm registry verified; slopcheck unavailable, packages marked [ASSUMED]
- Architecture: MEDIUM — Based on existing Phase 4 patterns; Vite preview approach unverified with Context7
- Pitfalls: MEDIUM — Based on general engineering experience; specific Vite 6 behaviors need verification

**Research date:** 2026-05-22
**Valid until:** 2026-06-21 (30 days — preview server patterns are relatively stable)
