---
phase: 08
type: validation
---

# Phase 08: Autonomous Agent - Validation

**Phase:** 08-autonomous-agent
**Requirements:** AGENT-01, AGENT-02, AGENT-03, AGENT-04, AGENT-05, AGENT-06, AGENT-07, AGENT-08, AGENT-09, AGENT-10
**Test Framework:** Vitest

## Automated Test Commands

### Per-Requirement Test Commands

| Req ID | Requirement | Automated Test Command |
|--------|-------------|----------------------|
| AGENT-01 | `--agent` flag enables agent mode | `h2ui convert tests/fixtures/vue/sample.html --agent --out /tmp/agent-test && echo "AGENT-01: PASS"` |
| AGENT-02 | PLAN phase outputs to console | `h2ui convert tests/fixtures/vue/sample.html --agent --out /tmp/agent-test 2>&1 \| grep -q "PLAN" && echo "AGENT-02: PASS"` |
| AGENT-03 | All 5 tools defined with Zod schemas | `vitest run tests/agent/tools.test.ts --reporter=verbose 2>&1` |
| AGENT-04 | Pipeline executes and verification runs | `vitest run tests/agent/graph/nodes.test.ts --reporter=verbose 2>&1` |
| AGENT-05 | Verification failure triggers REPAIR | `vitest run tests/agent/graph/nodes.test.ts --reporter=verbose 2>&1 \| grep -i repair` |
| AGENT-06 | Max 3 repair attempts enforced | `vitest run tests/agent/graph/nodes.test.ts --reporter=verbose 2>&1 \| grep -i "3 repair\|max repair"` |
| AGENT-07 | Failed strategies written to history | `vitest run tests/agent/history/manager.test.ts --reporter=verbose 2>&1` |
| AGENT-08 | Token count accumulates | `grep -r "token_count\|tokenCount" src/agent/ --include="*.ts" \| grep -v ".test.ts" \| wc -l` |
| AGENT-09 | Semantic validation via LLM | `vitest run tests/agent/verifier/agent.test.ts --reporter=verbose 2>&1` |
| AGENT-10 | Confidence score reported | `h2ui convert tests/fixtures/vue/sample.html --agent --out /tmp/agent-test 2>&1 \| grep -i "confidence"` |

### Full Validation Suite

```bash
# Phase 08 complete validation
echo "=== Phase 08 Validation ==="

echo "[1/10] AGENT-01: --agent flag..."
h2ui convert tests/fixtures/vue/sample.html --agent --out /tmp/agent-test 2>&1 && echo "AGENT-01: PASS" || echo "AGENT-01: FAIL"

echo "[2/10] AGENT-02: PLAN phase visible..."
h2ui convert tests/fixtures/vue/sample.html --agent --out /tmp/agent-test 2>&1 | grep -q "PLAN" && echo "AGENT-02: PASS" || echo "AGENT-02: FAIL"

echo "[3/10] AGENT-03: Tools with Zod schemas..."
vitest run tests/agent/tools.test.ts --reporter=verbose 2>&1

echo "[4/10] AGENT-04: Pipeline and verification..."
vitest run tests/agent/graph/nodes.test.ts --reporter=verbose 2>&1

echo "[5/10] AGENT-05: REPAIR triggered on failure..."
vitest run tests/agent/graph/nodes.test.ts --reporter=verbose 2>&1 | grep -i repair

echo "[6/10] AGENT-06: Max 3 repair attempts..."
vitest run tests/agent/graph/nodes.test.ts --reporter=verbose 2>&1 | grep -i "3 repair"

echo "[7/10] AGENT-07: History persistence..."
vitest run tests/agent/history/manager.test.ts --reporter=verbose 2>&1

echo "[8/10] AGENT-08: Token tracking..."
grep -r "token_count\|tokenCount" src/agent/ --include="*.ts" | grep -v ".test.ts" | wc -l

echo "[9/10] AGENT-09: Semantic validation..."
vitest run tests/agent/verifier/agent.test.ts --reporter=verbose 2>&1

echo "[10/10] AGENT-10: Confidence score..."
h2ui convert tests/fixtures/vue/sample.html --agent --out /tmp/agent-test 2>&1 | grep -i "confidence"
```

### Build Verification

```bash
# Must pass before any AGENT test
npm run build 2>&1 | grep -E "error|Error" | head -5
```

### Test File Locations

| Test File | Tests |
|-----------|-------|
| `tests/agent/tools.test.ts` | AGENT-03: tool definitions with Zod schemas |
| `tests/agent/graph/nodes.test.ts` | AGENT-02, AGENT-04, AGENT-05, AGENT-06: node behavior |
| `tests/agent/history/manager.test.ts` | AGENT-07: history persistence |
| `tests/agent/verifier/agent.test.ts` | AGENT-09, AGENT-10: confidence scoring |
| `tests/agent/cli.integration.test.ts` | AGENT-01, AGENT-02, AGENT-08: CLI integration |

## Success Criteria

All 10 automated commands must return exit code 0 for phase verification to pass.

## Notes

- Tests require `npm run build` to have completed successfully first
- Some tests require `.h2ui/agent-history.json` directory to exist
- AGENT-01, AGENT-02, AGENT-10 are integration tests requiring actual CLI execution
- AGENT-03 through AGENT-09 are unit tests that can run independently
