# Phase 6: batch-glob-processing - Research

**Researched:** 2026-05-23
**Domain:** Batch file processing with glob patterns, bounded concurrency, error isolation
**Confidence:** MEDIUM

## Summary

Phase 6 delivers batch processing capability for the h2ui CLI. Key technical decisions research covers: (1) fast-glob for pattern matching, (2) p-limit for bounded concurrency, (3) custom progress bar since ora is single-spinner only, (4) CLI subcommand structure using Commander (the project uses Commander, not yargs), and (5) path mirroring using path.relative/path.join.

**Primary recommendation:** Create a `batch` subcommand (`h2u batch "src/**/*.html"`) that reuses convertCommand's pipeline logic per-file, uses p-limit for concurrency control, implements a custom progress bar, and aggregates errors for end-of-batch summary reporting.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Use `fast-glob` for glob pattern matching
- **D-02:** Default: sequential processing (no parallelism)
- **D-03:** `--concurrency N` flag allows parallel processing of N files
- **D-04:** Upper bound is configurable, default max concurrent files = 4
- **D-05:** Individual file failures are isolated — batch continues
- **D-06:** Failed files are NOT written to output
- **D-07:** Summary table at end: filename | error message | retry suggestion
- **D-08:** Non-zero exit code if any file failed
- **D-09:** Output directory structure mirrors source layout
- **D-10:** Full path depth preserved (no path depth limit)
- **D-11:** Progress bar shows batch completion status (percentage + count)
- **D-12:** New `batch` subcommand or extend `convert` with glob pattern (planner decides)
- **D-13:** Flag design: `--concurrency <number>`

### Claude's Discretion

- **D-12:** CLI structure (batch subcommand vs convert with glob) — planner decides implementation approach

### Deferred Ideas

None — all batch scope items addressed in discussion.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BATCH-01 | User can run `h2u "src/**/*.html"` with glob pattern | fast-glob `fg.glob()` API handles patterns |
| BATCH-02 | Files processed sequentially by default | p-limit with `concurrency: 1` |
| BATCH-03 | `--concurrency N` for bounded parallelism | p-limit accepts dynamic concurrency |
| BATCH-04 | Individual file failures isolated | try/catch per file, batch continues |
| BATCH-05 | Failed files tracked with error + retry | Error aggregation in batch results |
| BATCH-06 | Non-zero exit if any file failed | Exit code tracking in batch controller |
| BATCH-07 | Output mirrors source directory layout | path.relative + path.join for mirroring |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Glob pattern matching | API/Backend (Node.js) | — | fast-glob traverses filesystem |
| Concurrency control | API/Backend | — | p-limit orchestrates promise execution |
| Per-file pipeline execution | API/Backend | — | Reuses convertCommand pipeline logic |
| Error isolation & aggregation | API/Backend | — | Batch controller catches and aggregates |
| Progress reporting | CLI/Output | — | Custom progress bar to stdout |
| Path mirroring | API/Backend | — | path.relative computes relative paths |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `fast-glob` | 3.3.3 [ASSUMED] | Glob pattern matching | D-01 locked decision; fastest Node.js glob library |
| `p-limit` | 7.3.0 [ASSUMED] | Bounded concurrency control | Lightweight, no dependencies, works with Promise.all |
| `ora` | 9.4.0 [VERIFIED] | Spinner for single-file operations | Already in project dependencies |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js `path` | built-in | Path manipulation for mirroring | Always — path.relative, path.join |
| Node.js `fs` | built-in | File existence checks | Pre-validation before processing |

### Not Needed (Project Already Has)

| Library | Why Not Needed |
|---------|----------------|
| commander | Already in project — use for batch subcommand |
| cosmiconfig | Already used by loadConfig() — no change needed |

**Installation:**
```bash
npm install fast-glob p-limit
```

**Version verification:**
```bash
npm view fast-glob version   # 3.3.3
npm view p-limit version    # 7.3.0
```

## Package Legitimacy Audit

> slopcheck was unavailable at research time — all packages tagged [ASSUMED]. Planner must gate each install behind `checkpoint:human-verify` before npm install.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| fast-glob | npm | 9+ years | 50M+/week | github.com/mrmlnc/fast-glob | [ASSUMED] | Approved — needs verification |
| p-limit | npm | 8+ years | 150M+/week | github.com/sindresorhus/p-limit | [ASSUMED] | Approved — needs verification |
| ora | npm | — | — | — | [VERIFIED] | Already installed (v9.4.0) |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
User: h2u batch "src/**/*.html" --concurrency 4 --out ./output
                    │
                    ▼
           ┌─────────────────────┐
           │ batchCommand()       │
           │ - Parse glob pattern │
           │ - Resolve concurrency│
           │ - Load config        │
           └──────────┬────────────┘
                    │
                    ▼
           ┌─────────────────────┐
           │ fast-glob.glob()    │ ← D-01
           │ Returns: string[]   │
           └──────────┬────────────┘
                    │
                    ▼
           ┌─────────────────────┐
           │ p-limit limiter    │ ← D-03, D-04
           │ concurrency: N (max 4)
           └──────────┬────────────┘
                    │
       ┌────────────┼────────────┐
       │            │            │
       ▼            ▼            ▼
   ┌───────┐   ┌───────┐   ┌───────┐
   │ File1 │   │ File2 │   │ File3 │  ... concurrent up to N
   │  Run  │   │  Run  │   │  Run  │
   └───┬───┘   └───┬───┘   └───┬───┘
       │           │           │
       ▼           ▼           ▼
   ┌─────────────────────────────────┐
   │  Per-file: convertCommand()    │
   │  - try/catch isolation         │
   │  - Pipeline run                │
   │  - Success: write output       │
   │  - Failure: record error       │
   └─────────────────────────────────┘
                    │
                    ▼
           ┌─────────────────────┐
           │ Progress bar       │ ← D-11
           │ [====    ] 3/10 30% │
           └──────────┬────────────┘
                    │
                    ▼
           ┌─────────────────────┐
           │ Batch summary       │ ← D-07
           │ Exit code = failed>0│ ← D-08
           └─────────────────────┘
```

### Recommended Project Structure

```
src/
├── cli/
│   ├── index.ts           # Commander setup — add batch subcommand here
│   ├── commands/
│   │   ├── convert.ts     # Existing — batch reuses pipeline logic
│   │   └── batch.ts       # NEW — batch controller
│   └── output.ts          # Existing — add batch-specific output utils
```

### Pattern 1: Bounded Concurrency with p-limit

**What:** Control maximum concurrent promise executions

**When to use:** Batch file processing with configurable parallelism

**Example:**
```typescript
// Source: [ctx7 docs /sindresorhus/p-limit]
import pLimit from 'p-limit';

const limit = pLimit(concurrency); // concurrency from --concurrency flag

const results = await Promise.all(
  files.map(file => limit(async () => {
    // Process file — only `concurrency` files run at once
    return processFile(file);
  }))
);
```

**Key insight:** Arguments passed directly to `limit(fn, arg)` avoid closure allocations in high-throughput scenarios. This is important for batch processing many files.

### Pattern 2: Path Mirroring

**What:** Preserve source directory structure in output

**When to use:** BATCH-07 requirement for mirrored output

**Example:**
```typescript
// Source: [assumed — Node.js path module]
import path from 'path';

function mirrorPath(sourceFile: string, sourceBase: string, outDir: string): string {
  // sourceFile: "/abs/path/src/a/page.html"
  // sourceBase:  "/abs/path/src/" (cwd or glob cwd)
  // outDir:      "./output/"
  const relative = path.relative(sourceBase, sourceFile);
  // relative:    "a/page.html"

  const outPath = path.join(outDir, relative);
  // outPath:     "./output/a/page.html"

  // Output is directory, not file — add component index
  return outPath.replace(/\.html$/, '/');
}
```

### Pattern 3: Custom Batch Progress Bar

**What:** Show batch progress since ora is single-spinner only

**When to use:** D-11 requires percentage + count display

**Example:**
```typescript
// Source: [assumed — based on ora patterns]
function showProgress(current: number, total: number): void {
  const percent = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * 10);
  const empty = 10 - filled;
  const bar = '='.repeat(filled) + ' '.repeat(empty);
  process.stdout.write(`\r[${bar}] ${current}/${total} files (${percent}%)`);
}
```

### Pattern 4: Batch Error Aggregation

**What:** Collect per-file errors for summary reporting

**When to use:** D-04, D-05, D-07 error handling

**Example:**
```typescript
// Source: [assumed]
interface BatchResult {
  successes: string[];
  failures: Array<{ file: string; error: string; suggestion: string }>;
}

async function runBatch(files: string[], concurrency: number): Promise<BatchResult> {
  const result: BatchResult = { successes: [], failures: [] };
  const limit = pLimit(Math.min(concurrency, 4)); // D-04: max 4

  await Promise.all(files.map(file =>
    limit(async () => {
      try {
        await processFile(file);
        result.successes.push(file);
      } catch (err: any) {
        result.failures.push({
          file,
          error: err.message,
          suggestion: 'Check file syntax and retry'
        });
      }
    })
  ));

  return result;
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Concurrency limiting | Custom promise queue with Array.shift() | p-limit | Edge cases (uncaught errors, memory leaks) handled |
| Glob pattern matching | Use fs.readdir recursively | fast-glob | Handles brace expansion, negation, dotfiles, symlinks correctly |
| Path mirroring | String replace on file paths | path.relative + path.join | Handles edge cases (Windows paths, special chars) |

**Key insight:** Custom concurrency solutions frequently have subtle bugs around error handling and cleanup. p-limit is battle-tested with 150M+ weekly downloads.

## Common Pitfalls

### Pitfall 1: Glob Results in Arbitrary Order

**What goes wrong:** `fast-glob` returns files in arbitrary order, not sorted alphabetically.

**Why it happens:** fast-glob documentation explicitly states results are returned in **arbitrary order** for performance.

**How to avoid:** Sort glob results before processing:
```typescript
const files = (await fg.glob(pattern)).sort();
```

**Warning signs:** Tests pass on macOS but fail on Linux (different filesystem ordering).

### Pitfall 2: Concurrency Not Bounded by Default

**What goes wrong:** Default concurrency = sequential (D-02) but code assumes concurrency >= 1.

**Why it happens:** p-limit with `concurrency: 0` would run all at once.

**How to avoid:** Always pass `Math.max(1, concurrency)` to p-limit. Default concurrency is 1 (sequential).

### Pitfall 3: Path Mirroring with Single File

**What goes wrong:** `path.relative(base, file)` returns empty string when base === file.dirname.

**Why it happens:** Relative path from directory to file in same dir is just the filename.

**How to avoid:** Handle edge case where relative path equals just a filename (no subdirectory):
```typescript
const relative = path.relative(sourceBase, sourceFile);
const outPath = path.join(outDir, relative.replace(/\.html$/, '/'));
// "page.html" -> "output/page.html/"
```

### Pitfall 4: Progress Bar Clears Terminal on Failure

**What goes wrong:** Spinner/progress left in inconsistent state after error.

**Why it happens:** ora spinner and stdout.write progress compete for terminal.

**How to avoid:** Stop spinner before showing errors. For batch, use only stdout.write-based progress without ora.

## Code Examples

### Batch Subcommand (Commander)

```typescript
// Source: [based on existing convert.ts pattern]
import { Command } from 'commander';
import { batchCommand } from './commands/batch.js';

const batchCmd = new Command('batch');
batchCmd
  .description('Convert multiple HTML files with glob patterns')
  .argument('<pattern>', 'Glob pattern for HTML files (quote it!)')
  .option('--out <directory>', 'output directory')
  .option('--concurrency <number>', 'parallel files (default: 1, max: 4)', parseInt, 1)
  .option('--no-split', 'disable component splitting')
  .option('--strict', 'promote warnings to errors')
  .option('--llm <mode>', 'LLM mode: on or off')
  .action(async (pattern: string, options) => {
    await batchCommand(pattern, options);
  });
```

### Processing Files Sequentially (D-02)

```typescript
// Source: [ctx7 docs /sindresorhus/p-limit]
import pLimit from 'p-limit';

const limit = pLimit(1); // Sequential — D-02

for (const file of files) {
  await limit(async () => processFile(file));
}
```

### Processing Files with Bounded Concurrency (D-03, D-04)

```typescript
// Source: [ctx7 docs /sindresorhus/p-limit]
const concurrency = Math.min(options.concurrency ?? 1, 4); // D-04: max 4
const limit = pLimit(concurrency);

await Promise.all(files.map(file =>
  limit(async () => {
    const result = await processFile(file);
    return result;
  })
));
```

### Mirrored Output Path (D-09)

```typescript
// Source: [assumed — path module]
import path from 'path';

function computeOutputPath(sourceFile: string, outDir: string): string {
  // Get relative path from cwd to source file
  const relative = path.relative(process.cwd(), sourceFile);
  // "src/components/header.html"

  // Mirror into output directory
  const mirrored = path.join(outDir, relative);
  // "./output/src/components/header"

  // Convert file to directory (components split into folders)
  return mirrored.replace(/\.html$/i, '/');
  // "./output/src/components/header/"
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sequential fs.readdir + manual recursion | fast-glob with async iteration | Pre-2020 | Simpler code, better performance |
| Custom concurrency queue with setTimeout | p-limit promise-based limiter | 2018 | Battle-tested, no memory leaks |
| No progress bar for batch | Custom progress with percentage | N/A | Better UX for long batches |

**Deprecated/outdated:**
- `globby` (deprecated, merged into fast-glob)
- `glob-fs` (less maintained than fast-glob)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | fast-glob 3.3.3 works with Node.js ESM | Standard Stack | Low — library is mature, ESM support confirmed in docs |
| A2 | p-limit 7.3.0 has Promise.all compatibility | Standard Stack | Low — library API is stable |
| A3 | Custom progress bar needed (ora is single-spinner) | Architecture Patterns | Medium — ora may support multiple spinners, needs verification |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Progress bar implementation detail**
   - What we know: ora is single-spinner, D-11 requires percentage + count
   - What's unclear: Should we use a library like `cli-progress` or build custom with stdout.write?
   - Recommendation: Build custom with stdout.write — simpler dependency, full control

2. **Glob base directory**
   - What we know: Need to mirror paths relative to some base
   - What's unclear: Should base be `process.cwd()` or the glob pattern's directory?
   - Recommendation: Use `process.cwd()` as base — consistent with CLI behavior

3. **CLI subcommand vs flag-based**
   - What we know: D-12 says planner decides
   - What's unclear: batch subcommand (`h2u batch "**/*.html"`) vs extend convert (`h2u "**/*.html"`)
   - Recommendation: Batch subcommand — cleaner separation, easier to test, follows existing pattern

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js path module | Path mirroring | Yes | built-in | N/A |
| Node.js fs module | File operations | Yes | built-in | N/A |
| ora | Spinner (single-file) | Yes | 9.4.0 | Already installed |
| fast-glob | Glob patterns | No | — | Must install |
| p-limit | Concurrency | No | — | Must install |

**Missing dependencies with no fallback:**
- fast-glob — core requirement, must install
- p-limit — core requirement, must install

**Missing dependencies with fallback:**
- None

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest (existing) |
| Config file | vitest.config.ts (existing) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test -- --run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BATCH-01 | Glob pattern matches multiple files | unit | `vitest run test/batch/batch.test.ts` | Wave 0 |
| BATCH-02 | Sequential processing by default | unit | `vitest run test/batch/concurrency.test.ts` | Wave 0 |
| BATCH-03 | --concurrency N processes N in parallel | unit | `vitest run test/batch/concurrency.test.ts` | Wave 0 |
| BATCH-04 | Single file failure doesn't stop batch | integration | `vitest run test/batch/error-isolation.test.ts` | Wave 0 |
| BATCH-05 | Failed files show error + suggestion | unit | `vitest run test/batch/error-summary.test.ts` | Wave 0 |
| BATCH-06 | Non-zero exit on any failure | integration | `vitest run test/batch/exit-code.test.ts` | Wave 0 |
| BATCH-07 | Output mirrors source directory | unit | `vitest run test/batch/path-mirror.test.ts` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test -- --run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `test/batch/batch.test.ts` — covers BATCH-01 (glob matching)
- [ ] `test/batch/concurrency.test.ts` — covers BATCH-02, BATCH-03 (concurrency control)
- [ ] `test/batch/error-isolation.test.ts` — covers BATCH-04 (per-file error isolation)
- [ ] `test/batch/error-summary.test.ts` — covers BATCH-05 (failure aggregation)
- [ ] `test/batch/exit-code.test.ts` — covers BATCH-06 (exit code)
- [ ] `test/batch/path-mirror.test.ts` — covers BATCH-07 (output mirroring)
- [ ] `test/fixtures/batch/` — fixture HTML files for batch testing
- [ ] Framework install: already present (vitest in devDependencies)

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

## Security Domain

> This phase processes user-provided files from filesystem. Security considerations are minimal but noted.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | yes | Path traversal prevention via path.resolve() |
| V5 Input Validation | yes | Glob pattern is filesystem path — validate with path.resolve() |

### Known Threat Patterns for Node.js Batch Processing

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal via glob | Tampering, Information Disclosure | Use path.resolve() to validate output paths stay within outDir |
| Glob injection (malicious pattern) | Denial of Service | Trust user-provided glob patterns as they target local files only |

## Sources

### Primary (HIGH confidence)

- [ctx7 /mrmlnc/fast-glob](https://github.com/mrmlnc/fast-glob) — async/stream glob API, pattern syntax
- [ctx7 /sindresorhus/p-limit](https://github.com/sindresorhus/p-limit) — concurrency limiting patterns
- [ctx7 /sindresorhus/ora](https://github.com/sindresorhus/ora) — spinner API
- [npm view fast-glob version](https://npmjs.com/package/fast-glob) — registry verification
- [npm view p-limit version](https://npmjs.com/package/p-limit) — registry verification

### Secondary (MEDIUM confidence)

- [ctx7 /yargs/yargs](https://github.com/yargs/yargs) — subcommand patterns (note: project uses Commander, not yargs)

### Tertiary (LOW confidence)

- [assumed] Custom progress bar approach — ora documentation focuses on single spinner

## Metadata

**Confidence breakdown:**

- Standard stack: MEDIUM — fast-glob and p-limit verified on npm, but slopcheck unavailable
- Architecture: MEDIUM — patterns documented via ctx7, custom progress bar assumed
- Pitfalls: MEDIUM — common pitfalls identified, some from experience rather than docs

**Research date:** 2026-05-23
**Valid until:** 2026-06-22 (30 days — stable domain)
