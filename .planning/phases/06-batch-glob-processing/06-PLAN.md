---
phase: "06"
plan: "01"
type: execute
wave: 1
depends_on: []
files_modified:
  - "src/cli/commands/batch.ts"
  - "src/cli/index.ts"
  - "package.json"
autonomous: false
requirements:
  - "BATCH-01"
  - "BATCH-02"
  - "BATCH-03"
  - "BATCH-04"
  - "BATCH-05"
  - "BATCH-06"
  - "BATCH-07"
user_setup:
  - service: npm
    why: "Install fast-glob and p-limit packages for batch processing"
    verification:
      - command: "npm list fast-glob p-limit 2>/dev/null || echo 'NOT_INSTALLED'"
        expected: "fast-glob and p-limit in dependency list"

must_haves:
  truths:
    - "User can run `h2u batch \"src/**/*.html\"` and matching files are found"
    - "Files are processed sequentially by default (concurrency=1)"
    - "Individual file failures do not stop the batch"
    - "Failed files are tracked with error messages"
    - "Exit code is non-zero if any file failed"
    - "Output directory structure mirrors source layout"
  artifacts:
    - path: "src/cli/commands/batch.ts"
      provides: "Batch command controller with glob matching and concurrency"
      min_lines: 150
      exports: ["batchCommand"]
    - path: "src/cli/index.ts"
      provides: "Commander batch subcommand registration"
      contains: ".command('batch')"
    - path: "package.json"
      provides: "fast-glob and p-limit dependencies"
      contains: '"fast-glob"'
      contains: '"p-limit"'
  key_links:
    - from: "src/cli/commands/batch.ts"
      to: "src/pipeline/index.ts"
      via: "Pipeline class reuse per file"
      pattern: "new Pipeline\\(\\)"
    - from: "src/cli/index.ts"
      to: "src/cli/commands/batch.ts"
      via: "Commander .action() call"
      pattern: "batchCommand"
    - from: "src/cli/commands/batch.ts"
      to: "fast-glob"
      via: "import and fg.glob() call"
      pattern: "import.*fast-glob"

---

<objective>
Create batch command with glob pattern matching, sequential default processing, and bounded concurrency control. This is Wave 1: establishes the batch command scaffold and dependency installation.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@src/cli/commands/convert.ts
@src/cli/index.ts
@src/pipeline/index.ts
@src/types/pipeline.ts
</context>

<interfaces>
<!-- Key types and contracts the executor needs. Extracted from codebase. -->

From src/types/pipeline.ts:
```typescript
export interface ConvertOptions {
  out: string;
  typescript: boolean;
  strict: boolean;
  split: boolean;
  cssMode: 'module' | 'scoped' | 'inline' | 'global';
  llm?: LLMConfig;
}

export interface PipelineContext {
  html: string;
  filePath: string;
  $?: CheerioAPI;
  code?: string;
  outputPath?: string;
  warnings: string[];
  errors: string[];
  options: ConvertOptions;
  componentTree?: ComponentNode;
  components?: ComponentOutput[];
}
```

From src/cli/commands/convert.ts:
```typescript
export async function convertCommand(
  file: string,
  options: {
    out?: string;
    type?: string;
    strict?: boolean;
    split?: boolean;
    llm?: string;
    llmConfig?: LLMConfig;
  },
  configFile: Partial<H2uiConfig> = {},
): Promise<void>
```
</interfaces>

<tasks>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 0: Verify package legitimacy — fast-glob and p-limit</name>
  <files>package.json</files>
  <read_first>
    - https://npmjs.com/package/fast-glob (verify 3.3.x, author mrmlnc, repo github.com/mrmlnc/fast-glob)
    - https://npmjs.com/package/p-limit (verify 7.3.x, author sindresorhus, repo github.com/sindresorhus/p-limit)
  </read_first>
  <action>
    Verify fast-glob and p-limit on npmjs.com:
    1. fast-glob: check version is 3.3.x, author is mrmlnc, GitHub repo matches
    2. p-limit: check version is 7.3.x, author is sindresorhus, GitHub repo matches
    These are [ASSUMED] packages per RESEARCH.md — must verify before install.
  </action>
  <acceptance_criteria>
    - [ ] Verified fast-glob on npmjs.com (version, author, repo)
    - [ ] Verified p-limit on npmjs.com (version, author, repo)
    - [ ] Both packages are legitimate open source with no suspicious signals
  </acceptance_criteria>
  <verify>
    <automated>MISSING — human verification required for package legitimacy gate</automated>
  </verify>
  <done>Package legitimacy verified, executor can proceed with npm install</done>
</task>

<task type="auto">
  <name>Task 1: Install fast-glob and p-limit dependencies</name>
  <files>package.json</files>
  <read_first>
    - package.json
  </read_first>
  <action>
    Run: npm install fast-glob p-limit
    Add both packages to package.json dependencies.
    Versions will be latest compatible (fast-glob 3.3.x, p-limit 7.3.x).
  </action>
  <acceptance_criteria>
    - [ ] fast-glob appears in package.json dependencies
    - [ ] p-limit appears in package.json dependencies
    - [ ] package-lock.json updated with new dependencies
  </acceptance_criteria>
  <verify>
    <automated>npm list fast-glob p-limit</automated>
  </verify>
  <done>fast-glob and p-limit installed and listed in package.json</done>
</task>

<task type="auto">
  <name>Task 2: Create batch command scaffold in src/cli/commands/batch.ts</name>
  <files>src/cli/commands/batch.ts</files>
  <read_first>
    - src/cli/commands/convert.ts
    - src/pipeline/index.ts
    - src/types/pipeline.ts
  </read_first>
  <action>
    Create src/cli/commands/batch.ts with batchCommand function that:
    1. Accepts pattern (string), options ({ out?, concurrency?, split?, strict?, llm? }, configFile)
    2. Uses fast-glob to match files: const files = (await fg.glob(pattern)).sort()
    3. Creates concurrency limiter: const limit = pLimit(Math.min(concurrency ?? 1, 4))
    4. Creates BatchResult interface: { successes: string[], failures: Array<{file, error, suggestion}> }
    5. Processes each file by calling convertCommand internally (per D-12, reuse pipeline)
    6. Each file wrapped in try/catch for error isolation (D-05)
    7. Track successes and failures separately
    8. Show progress bar during batch: [====    ] 3/10 files (30%)
    9. Return BatchResult object with successes and failures

    Key imports:
    - import fg from 'fast-glob'
    - import pLimit from 'p-limit'
    - import { convertCommand } from './convert.js'

    Note: For concurrent execution, batchCommand will need to call pipeline.run() directly
    rather than convertCommand (which has process.exit). Create a helper that runs pipeline
    without exit calls for batch reuse.
  </action>
  <acceptance_criteria>
    - [ ] batchCommand function exported from batch.ts
    - [ ] fast-glob used for pattern matching with .sort() on results
    - [ ] pLimit used for concurrency control (max 4)
    - [ ] BatchResult interface defined with successes and failures
    - [ ] Error isolation per file with try/catch
    - [ ] Progress bar shows percentage and count
  </acceptance_criteria>
  <verify>
    <automated>grep -c "export.*batchCommand" src/cli/commands/batch.ts && grep -c "fg.glob" src/cli/commands/batch.ts && grep -c "pLimit" src/cli/commands/batch.ts</automated>
  </verify>
  <done>batchCommand scaffold created with glob matching, concurrency control, error isolation, progress bar</done>
</task>

<task type="auto">
  <name>Task 3: Register batch subcommand in src/cli/index.ts</name>
  <files>src/cli/index.ts</files>
  <read_first>
    - src/cli/index.ts
  </read_first>
  <action>
    Add batch subcommand to Commander program in src/cli/index.ts:

    ```typescript
    program
      .command('batch')
      .description('Convert multiple HTML files with glob patterns')
      .argument('<pattern>', 'Glob pattern for HTML files (quote it!)')
      .option('--out <directory>', 'output directory (default: ./h2ui_output/)')
      .option('--concurrency <number>', 'parallel files (default: 1, max: 4)', parseInt, 1)
      .option('--no-split', 'disable component splitting')
      .option('--strict', 'promote all warnings to errors')
      .option('--llm <mode>', 'LLM mode: on or off (default: on)')
      .action(async (pattern: string, options) => {
        showBanner();
        const { config: configFile } = await loadConfig();
        // TODO: batchCommand will be implemented in Wave 2
      });
    ```

    Import batchCommand after it is created.
  </action>
  <acceptance_criteria>
    - [ ] .command('batch') registered with Commander
    - [ ] --concurrency flag with parseInt, default 1
    - [ ] --out, --no-split, --strict, --llm options matching convert command
  </acceptance_criteria>
  <verify>
    <automated>grep -c "\.command('batch')" src/cli/index.ts</automated>
  </verify>
  <done>Batch subcommand registered in CLI with all required options</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client -> Node.js | Glob pattern is user input from CLI |
| Node.js -> filesystem | fast-glob reads files matched by pattern |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-06-01 | Denial of Service | fast-glob | mitigate | User-provided glob is intentional; limit max concurrency=4 per D-04 |
| T-06-02 | Path Traversal | Output writing | mitigate | Use path.resolve() to validate output stays within outDir |
| T-06-SC | Supply Chain | npm packages | mitigate | Human checkpoint verifies fast-glob and p-limit on npmjs.com before install |
</threat_model>

<verification>
- Batch command is registered: `h2u batch --help` shows usage
- fast-glob and p-limit in dependencies: `npm list fast-glob p-limit`
- Glob matching works: `h2u batch "test/fixtures/*.html"` processes files
- Sequential by default: Check that concurrency defaults to 1
- Progress bar shows: `[====    ] X/N files (X%)` format
</verification>

<success_criteria>
- `h2u batch "src/**/*.html"` finds and lists matching files
- Batch processes sequentially by default (concurrency=1)
- `--concurrency 4` flag accepted
- Individual file failure does not stop batch
- Failed files tracked in BatchResult.failures array
</success_criteria>

<output>
Create `.planning/phases/06-batch-glob-processing/06-01-SUMMARY.md` when done
</output>
---

---
phase: "06"
plan: "02"
type: execute
wave: 2
depends_on:
  - "06-01"
files_modified:
  - "src/cli/commands/batch.ts"
  - "src/cli/output.ts"
autonomous: true
requirements:
  - "BATCH-01"
  - "BATCH-02"
  - "BATCH-03"
  - "BATCH-04"
  - "BATCH-05"
  - "BATCH-06"
  - "BATCH-07"

must_haves:
  truths:
    - "User can run `h2u batch \"src/**/*.html\"` and matching files are found"
    - "Files are processed sequentially by default (concurrency=1)"
    - "Individual file failures do not stop the batch"
    - "Failed files are tracked with error messages"
    - "Exit code is non-zero if any file failed"
    - "Output directory structure mirrors source layout"
  artifacts:
    - path: "src/cli/commands/batch.ts"
      provides: "Complete batch processing with concurrency, error isolation, progress bar"
      min_lines: 200
      exports: ["batchCommand"]
    - path: "src/cli/output.ts"
      provides: "Batch-specific output utilities (progress bar, summary table)"
      contains: "showBatchProgress"
      contains: "showBatchSummary"
  key_links:
    - from: "src/cli/commands/batch.ts"
      to: "src/cli/output.ts"
      via: "showBatchProgress, showBatchSummary imports"
      pattern: "import.*showBatch"

---

<objective>
Complete batch command implementation: concurrency control, error isolation, progress bar, path mirroring, exit codes, and summary table.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@src/cli/commands/batch.ts
@src/cli/output.ts
@src/pipeline/index.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement batch pipeline runner (no process.exit)</name>
  <files>src/cli/commands/batch.ts</files>
  <read_first>
    - src/cli/commands/convert.ts
    - src/cli/commands/batch.ts
    - src/pipeline/index.ts
  </read_first>
  <action>
    Create a helper function runPipelineForBatch(file: string, options: ConvertOptions, llmConfig?: LLMConfig)
    that:
    1. Loads HTML from file
    2. Resolves paths (inputPath, outputDir)
    3. Builds Pipeline with same steps as convertCommand
    4. Runs pipeline.run() directly (no process.exit on error)
    5. Returns PipelineContext (success or with errors array populated)

    This helper is used by batchCommand instead of convertCommand (which calls process.exit).
    The batch command manages its own exit code based on aggregated results.

    Steps to build pipeline:
    - parseStep (always)
    - splitStep + convertStep + cssStep (if split !== false)
    - llmFidelityStep (if llm enabled)
    - generateStep (always)
  </action>
  <acceptance_criteria>
    - [ ] runPipelineForBatch function defined and exported
    - [ ] Pipeline built with correct steps based on options
    - [ ] No process.exit calls in runPipelineForBatch
    - [ ] Returns PipelineContext with errors array populated on failure
  </acceptance_criteria>
  <verify>
    <automated>grep -c "runPipelineForBatch" src/cli/commands/batch.ts</automated>
  </verify>
  <done>Helper function runPipelineForBatch created for batch reuse</done>
</task>

<task type="auto">
  <name>Task 2: Implement batch processing with concurrency and error isolation</name>
  <files>src/cli/commands/batch.ts</files>
  <read_first>
    - src/cli/commands/batch.ts
    - src/cli/commands/convert.ts
  </read_first>
  <action>
    Update batchCommand to process files with:
    1. Concurrency: const limit = pLimit(Math.min(concurrency ?? 1, 4)) // D-04: max 4
    2. Process files: await Promise.all(files.map(file => limit(async () => { ... })))
    3. Per-file error handling: try { ctx = await runPipelineForBatch(...) } catch (err) { ... }
    4. Success: ctx.errors.length === 0 — add to successes, write output
    5. Failure: add to failures array with { file, error: err.message, suggestion: '...' }
    6. On failure: DO NOT write output for that file (D-06: failed files NOT written)

    BatchResult interface:
    ```typescript
    interface BatchFailure {
      file: string;
      error: string;
      suggestion: string;
    }
    interface BatchResult {
      successes: string[];
      failures: BatchFailure[];
      totalProcessed: number;
    }
    ```

    Progress bar updates after each file completes.
  </action>
  <acceptance_criteria>
    - [ ] pLimit used with max concurrency of 4
    - [ ] Per-file try/catch wraps pipeline execution
    - [ ] Successful files added to successes array
    - [ ] Failed files added to failures array with error and suggestion
    - [ ] Failed files do NOT write output
  </acceptance_criteria>
  <verify>
    <automated>grep -c "BatchFailure" src/cli/commands/batch.ts && grep -c "pLimit" src/cli/commands/batch.ts</automated>
  </verify>
  <done>Batch processes files with concurrency control and error isolation</done>
</task>

<task type="auto">
  <name>Task 3: Add batch output utilities to src/cli/output.ts</name>
  <files>src/cli/output.ts</files>
  <read_first>
    - src/cli/output.ts
  </read_first>
  <action>
    Add to src/cli/output.ts:

    1. showBatchProgress(current: number, total: number): void
       - Writes to stdout: `\r[${bar}] ${current}/${total} files (${percent}%)`
       - Uses '=' for filled, ' ' for empty, 10-char bar
       - No newline, uses \r to overwrite

    2. showBatchSummary(successes: string[], failures: BatchFailure[]): void
       - If successes > 0: console.log(`\nProcessed ${successes.length} files successfully`)
       - If failures > 0: print table with columns: File | Error | Suggestion
       - Table uses box-drawing characters: ┌─┬─┐ etc.
       - Example:
         ```
         ┌──────────────────────┬─────────────────────────────┬──────────────┐
         │ File                  │ Error                      │ Suggestion   │
         ├──────────────────────┼─────────────────────────────┼──────────────┤
         │ src/bad.html          │ Failed to parse: ...       │ Check file   │
         └──────────────────────┴─────────────────────────────┴──────────────┘
         ```

    3. clearBatchProgress(): void
       - Writes spaces to clear the progress line
       - Writes \r to return to line start
  </action>
  <acceptance_criteria>
    - [ ] showBatchProgress function exported
    - [ ] showBatchSummary function exported with table formatting
    - [ ] Progress bar shows [====    ] format with percentage
    - [ ] Summary table uses box-drawing characters
  </acceptance_criteria>
  <verify>
    <automated>grep -c "showBatchProgress" src/cli/output.ts && grep -c "showBatchSummary" src/cli/output.ts</automated>
  </verify>
  <done>Batch output utilities added: progress bar, summary table, progress clearing</done>
</task>

<task type="auto">
  <name>Task 4: Wire progress bar and summary into batchCommand</name>
  <files>src/cli/commands/batch.ts</files>
  <read_first>
    - src/cli/commands/batch.ts
    - src/cli/output.ts
  </read_first>
  <action>
    Update batchCommand to:
    1. Show initial progress: showBatchProgress(0, files.length)
    2. Update progress after each file: showBatchProgress(completed, total)
    3. After all files: clearBatchProgress() then showBatchSummary(successes, failures)
    4. Set process.exitCode = failures.length > 0 ? 1 : 0 (D-08: non-zero if any failed)
    5. Call process.exit() with the exit code

    The batch command should:
    - Start with progress bar showing 0/total
    - Update progress as each file completes (concurrent files may update out of order)
    - Clear progress and show summary when all done
    - Exit with code 1 if any failures, 0 otherwise
  </action>
  <acceptance_criteria>
    - [ ] Progress bar updates during batch processing
    - [ ] Summary table shown at end of batch
    - [ ] Exit code is 1 when failures exist
    - [ ] Exit code is 0 when all succeed
  </acceptance_criteria>
  <verify>
    <automated>grep -c "process.exitCode" src/cli/commands/batch.ts && grep -c "showBatchSummary" src/cli/commands/batch.ts</automated>
  </verify>
  <done>Progress bar and summary wired into batch command with correct exit codes</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| batch -> pipeline | Per-file pipeline execution with error isolation |
| batch -> filesystem | Output files written to mirrored directory structure |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-06-03 | Information Disclosure | Error messages | accept | Error messages are from user files, low risk |
| T-06-04 | Denial of Service | p-limit | accept | Max concurrency=4 prevents resource exhaustion |
</threat_model>

<verification>
- `h2u batch "test/fixtures/*.html"` processes all fixture files
- Progress bar visible during processing: `[====    ] X/N files (X%)`
- Summary table shown at end with success/failure counts
- Exit code 0 when all succeed, 1 when any fails
</verification>

<success_criteria>
- Batch processes multiple files with concurrency control
- Progress bar updates during batch
- Error isolation: one bad file doesn't stop batch
- Exit code correct (0 = all success, 1 = any failure)
- Summary shows both successes and failures
</success_criteria>

<output>
Create `.planning/phases/06-batch-glob-processing/06-02-SUMMARY.md` when done
</output>
---

---
phase: "06"
plan: "03"
type: execute
wave: 3
depends_on:
  - "06-02"
files_modified:
  - "src/cli/commands/batch.ts"
autonomous: true
requirements:
  - "BATCH-01"
  - "BATCH-02"
  - "BATCH-03"
  - "BATCH-04"
  - "BATCH-05"
  - "BATCH-06"
  - "BATCH-07"

must_haves:
  truths:
    - "User can run `h2u batch \"src/**/*.html\"` and matching files are found"
    - "Files are processed sequentially by default (concurrency=1)"
    - "Individual file failures do not stop the batch"
    - "Failed files are tracked with error messages"
    - "Exit code is non-zero if any file failed"
    - "Output directory structure mirrors source layout"
  artifacts:
    - path: "src/cli/commands/batch.ts"
      provides: "Complete batch processing with output mirroring"
      min_lines: 250
      exports: ["batchCommand", "computeOutputPath"]
  key_links:
    - from: "src/cli/commands/batch.ts"
      to: "path.relative"
      via: "Output path computation for mirroring"
      pattern: "path\\.relative.*path\\.join"
---

<objective>
Add output directory mirroring so that `src/a/page.html` produces `output/src/a/page/` structure.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@src/cli/commands/batch.ts
@src/cli/commands/convert.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement computeOutputPath for directory mirroring</name>
  <files>src/cli/commands/batch.ts</files>
  <read_first>
    - src/cli/commands/batch.ts
  </read_first>
  <action>
    Add computeOutputPath function to batch.ts:

    ```typescript
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

    This preserves the full directory structure from cwd. For example:
    - sourceFile: "/abs/path/src/a/page.html"
    - outDir: "./output"
    - relative: "src/a/page.html"
    - mirrored: "./output/src/a/page.html"
    - result: "./output/src/a/page/" (for component splitting output)

    Note: The Pipeline expects outputPath to be a directory (with trailing slash for component output).
  </action>
  <acceptance_criteria>
    - [ ] computeOutputPath function exported
    - [ ] path.relative used to get relative path from cwd
    - [ ] path.join used to build mirrored output path
    - [ ] Trailing slash added for component output directory
  </acceptance_criteria>
  <verify>
    <automated>grep -c "computeOutputPath" src/cli/commands/batch.ts && grep -c "path.relative" src/cli/commands/batch.ts</automated>
  </verify>
  <done>computeOutputPath function created for directory mirroring</done>
</task>

<task type="auto">
  <name>Task 2: Wire output path mirroring into batch processing</name>
  <files>src/cli/commands/batch.ts</files>
  <read_first>
    - src/cli/commands/batch.ts
    - src/pipeline/index.ts
  </read_first>
  <action>
    Update batch processing in batchCommand to:
    1. For each file, compute output path: const outputPath = computeOutputPath(file, resolvedOutDir)
    2. Pass outputPath to runPipelineForBatch as part of options
    3. Pipeline will write to that directory, preserving structure

    The PipelineContext expects outputPath to be set. In runPipelineForBatch:
    - Set ctx.outputPath = computeOutputPath(file, options.out) before running pipeline
    - Pipeline's generateStep will write to that directory

    This ensures:
    - src/a/page.html -> output/src/a/page/
    - src/b/c.html -> output/src/b/c/
    - Full path depth preserved (D-10: no path depth limit)
  </action>
  <acceptance_criteria>
    - [ ] Output path computed per file using computeOutputPath
    - [ ] Directory structure mirrored: src/a/page.html -> output/src/a/page/
    - [ ] Full path depth preserved without limit
  </acceptance_criteria>
  <verify>
    <automated>grep -c "computeOutputPath(file" src/cli/commands/batch.ts</automated>
  </verify>
  <done>Output path mirroring wired into batch processing</done>
</task>

<task type="auto">
  <name>Task 3: Final verification and cleanup</name>
  <files>src/cli/commands/batch.ts</files>
  <read_first>
    - src/cli/commands/batch.ts
    - src/cli/index.ts
  </read_first>
  <action>
    1. Verify batch command in index.ts calls batchCommand (not TODO):
       - Import batchCommand from './commands/batch.js'
       - Pass (pattern, options) to batchCommand(pattern, options, configFile)

    2. Test the full flow:
       - Create test/fixtures/batch/ directory with nested HTML files
       - Run: h2u batch "test/fixtures/batch/**/*.html" --out ./test-output
       - Verify output mirrors: test-output/test/fixtures/batch/a/page/
       - Verify failures don't write output

    3. Ensure all exports are correct in batch.ts:
       - batchCommand: main entry point
       - runPipelineForBatch: helper for pipeline reuse
       - computeOutputPath: utility for path mirroring
       - BatchResult, BatchFailure: types

    4. Clean up any TODO comments in the code
  </action>
  <acceptance_criteria>
    - [ ] index.ts imports and calls batchCommand correctly
    - [ ] `h2u batch "test/fixtures/*.html" --out ./test-output` works
    - [ ] Output directory structure mirrors source: output/test/fixtures/a/page/
    - [ ] All exports present and correct
  </acceptance_criteria>
  <verify>
    <automated>h2u batch "test/fixtures/*.html" --out /tmp/batch-test-output && ls -la /tmp/batch-test-output/test/fixtures/</automated>
  </verify>
  <done>Batch command fully functional with output mirroring</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| batch -> filesystem | Mirrored output paths computed from cwd |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-06-05 | Path Traversal | Output paths | mitigate | path.relative prevents .. traversal; output always within outDir |
</threat_model>

<verification>
- `h2u batch "src/**/*.html" --out ./output"` creates mirrored structure
- src/a/page.html -> output/src/a/page/
- Exit code correct based on failures
- All 7 BATCH requirements verifiable via CLI
</verification>

<success_criteria>
- BATCH-01: Glob pattern finds multiple files
- BATCH-02: Sequential by default (concurrency=1)
- BATCH-03: --concurrency N works (bounded to max 4)
- BATCH-04: One file failure doesn't stop batch
- BATCH-05: Failures have error message + suggestion
- BATCH-06: Exit code 1 when any failure
- BATCH-07: Output mirrors source directory layout
</success_criteria>

<output>
Create `.planning/phases/06-batch-glob-processing/06-03-SUMMARY.md` when done
</output>
