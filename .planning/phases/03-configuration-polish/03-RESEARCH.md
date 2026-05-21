# Phase 3: Configuration + Polish — Research

**Researched:** 2026-05-21
**Status:** Ready for planning
**Confidence:** HIGH

---

## Research Summary

Phase 3 adds config file support (cosmiconfig) and CLI DX improvements (ora spinner, enhanced error messages). Key findings:

- **cosmiconfig v9.0.1** is current, works with ESM (the project uses `"type": "module"`), supports synchronous and async APIs
- **ora v9.4.0** is current, ESM-only, provides rich spinner API with `.succeed()/.fail()` for seamless integration
- **Similar file matching** can be done with simple Levenshtein distance (no extra dependency) or with fuse.js if richer matching needed
- Cosmiconfig + commander flag merging pattern: load config first, then spread CLI flags on top

---

## 1. cosmiconfig Integration

### Current Version: v9.0.1
- Released: 2026-03-02
- Requires Node 14+ (Node 22 fully supported)
- ESM compatible (uses dynamic `import()` for JS/TS modules)

### API Patterns

The project uses `"type": "module"` in package.json, so cosmiconfig works naturally:

```typescript
// Async (recommended for ESM)
import { cosmiconfig } from 'cosmiconfig';

const explorer = cosmiconfig('h2ui');
const result = await explorer.search();
// result?.config → parsed config object
// result?.filepath → path to config file
// result?.isEmpty → true if empty config

// If no config found, result is null → fall through to defaults
```

```typescript
// Sync (simpler for CLI startup)
import { cosmiconfigSync } from 'cosmiconfig';

const explorer = cosmiconfigSync('h2ui');
const result = explorer.search();
```

### Default Search Places (for module name "h2ui")

Cosmiconfig will automatically search (in order per directory):
1. `"h2ui"` property in `package.json`
2. `.h2uirc` (extensionless, parsed as YAML/JSON)
3. `.h2uirc.json`
4. `.h2uirc.yaml` / `.h2uirc.yml`
5. `.h2uirc.js` / `.h2uirc.ts` / `.h2uirc.mjs` / `.h2uirc.cjs`
6. `.config/h2uirc` / `.config/h2uirc.json` / etc.
7. `h2ui.config.js` / `h2ui.config.ts` / `h2ui.config.mjs` / `h2ui.config.cjs`

**Per CONTEXT.md D-01:** We want JSON-only and specific search order: `package.json` "h2ui" field → `.h2uirc` → `.h2uirc.json` → `.config/h2uirc`

This means we should set custom `searchPlaces`:
```typescript
const explorer = cosmiconfig('h2ui', {
  searchPlaces: [
    'package.json',        // "h2ui" property
    '.h2uirc',             // extensionless JSON
    '.h2uirc.json',
    '.config/h2uirc',      // in .config subdirectory
    '.config/h2uirc.json',
  ],
  // Force extensionless .h2uirc to parse as JSON (not YAML)
  loaders: {
    noExt: cosmiconfig.defaultLoaders['.json'],
  },
});
```

> **Important:** `.h2uirc` extensionless files default to YAML parsing. We need to override `loaders.noExt` to parse as JSON, since CONTEXT.md D-11 specifies JSON only.

### Search Strategy

By default, cosmiconfig's search strategy is:
- `'global'` if `stopDir` is specified (stops at home dir)
- `'none'` if no `stopDir`

For a CLI tool, using `searchStrategy: 'none'` (only CWD) is appropriate — no need to traverse up the directory tree for h2ui config.

### Missing Config Handling

When `explorer.search()` returns `null`, that means no config found — just use defaults. This is the standard pattern:

```typescript
const result = await explorer.search();
const configFile = result?.config ?? {};
// Merge: defaults < configFile < CLI flags
```

### CLI Flag Merging Pattern

Standard pattern for config + CLI flag merging (used by eslint, prettier, etc.):

```typescript
// 1. Start with defaults
const merged = { ...DEFAULT_OPTIONS };

// 2. Apply config file values (if found)
if (result?.config) {
  Object.assign(merged, result.config);
}

// 3. CLI flags override everything (commander provides parsed options)
// Only override if the flag was explicitly set
if (cmdOptions.out !== undefined) merged.out = cmdOptions.out;
if (cmdOptions.typescript !== undefined) merged.typescript = cmdOptions.typescript;
if (cmdOptions.strict !== undefined) merged.strict = cmdOptions.strict;
if (cmdOptions.split !== undefined) merged.split = cmdOptions.split;
// cssMode is config-file-only (no CLI flag for v1)
```

### Where to Integrate

cosmiconfig should be loaded at CLI startup in `src/cli/index.ts`, before command dispatch:

```typescript
// src/cli/index.ts
import { cosmiconfig } from 'cosmiconfig';

// Load config before parsing commands
const explorer = cosmiconfig('h2ui', {
  searchPlaces: ['package.json', '.h2uirc', '.h2uirc.json', '.config/h2uirc', '.config/h2uirc.json'],
  loaders: { noExt: (await import('cosmiconfig')).defaultLoaders['.json'] },
});
const configResult = await explorer.search();
const configFile = configResult?.config ?? {};

// Pass configFile to commands, or merge in convertCommand
```

Alternatively, load lazily in `convertCommand()` — keeps index.ts clean and only pays cost on actual conversion.

### Type Compatibility

Current `H2uiConfig` interface (`src/types/config.ts`):
```typescript
export interface H2uiConfig {
  out?: string;
  typescript?: boolean;
  strict?: boolean;
}
```

Need to add:
```typescript
export interface H2uiConfig {
  out?: string;
  typescript?: boolean;
  strict?: boolean;
  split?: boolean;       // NEW: enable component splitting
  cssMode?: 'module';    // NEW: CSS output format (only 'module' for v1)
}
```

---

## 2. ora Spinner Integration

### Current Version: v9.4.0
- Released: ~2026-04
- ESM-only (requires `"type": "module"` or `.mjs` extension)
- Project uses `"type": "module"` → direct ESM import works: `import ora from 'ora'`

### API Pattern

```typescript
import ora from 'ora';

const spinner = ora('Converting HTML to React components').start();

try {
  const ctx = await pipeline.run(initialCtx);
  spinner.succeed(`Wrote ${fileCount} files to ${outputDir}`);
} catch (err) {
  spinner.fail(`Conversion failed: ${err.message}`);
}
```

### Granularity

Per CONTEXT.md D-06: Spinner runs continuously during the full pipeline, not per-step. Pattern:

```typescript
// In convertCommand.ts
const spinner = ora('Parsing and converting HTML...').start();

const ctx = await pipeline.run(initialCtx);

if (ctx.errors.length > 0) {
  spinner.fail('Conversion completed with errors');
  // Show errors below
} else if (ctx.options.split && ctx.componentTree) {
  const fileCount = ctx.components?.length ?? 1;
  spinner.succeed(`Wrote ${fileCount} files to ${outputDir}`);
} else {
  spinner.succeed(`Wrote output to ${ctx.outputPath}`);
}
```

### Spinner + Console Output

ora handles `console.log()` during spinner gracefully — it auto-clears and re-renders:

```typescript
const spinner = ora('Processing...').start();

// These logs appear above the spinner (ora handles them)
console.log('Parsing complete');
console.log('Converting attributes...');

spinner.succeed('Done!');
```

**But warnings collection happens during pipeline — they need to be displayed AFTER spinner stops.**

Pattern:
```typescript
const spinner = ora('Converting HTML...').start();
const ctx = await pipeline.run(initialCtx);
spinner.stop(); // Stop spinner before showing warnings

if (ctx.warnings.length > 0) {
  showWarningSummary(ctx.warnings);
}

if (ctx.errors.length > 0) {
  // Handled with spinner.fail()
}
```

### Terminal Support

ora has built-in `isEnabled` detection — it disables itself in non-TTY/CI environments. No special handling needed.

### ESM Compatibility

ora v8+ is pure ESM. The project already uses `"type": "module"` and imports with `.js` extensions in TypeScript, so:
- `import ora from 'ora'` works
- `import { oraPromise } from 'ora'` also available for promise-wrapping shorthand

---

## 3. Error Suggestions (File Not Found → Similar Files)

### Approach: Simple Levenshtein Distance

No need for fuse.js — a simple Levenshtein distance function (30 lines) is sufficient for suggesting similar file paths:

```typescript
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i-1] === a[j-1]) {
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i-1][j-1] + 1,  // substitution
          matrix[i][j-1] + 1,    // insertion
          matrix[i-1][j] + 1     // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function suggestSimilarFiles(inputPath: string, directory: string): string[] {
  const files = fs.readdirSync(directory).filter(f => f.endsWith('.html'));
  const scored = files
    .map(f => ({ file: f, score: levenshtein(inputPath, f) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .filter(f => f.score < Math.min(inputPath.length, f.file.length) * 0.6); // threshold
  return scored.map(s => path.join(directory, s.file));
}
```

### Alternative: fuse.js v7.3.0
- 0 dependencies, lightweight (~15KB)
- Richer matching (prefix, fuzzy, threshold)
- `import Fuse from 'fuse.js'`
- Simpler API but adds a dependency

**Recommendation:** Simple Levenshtein is sufficient — no external dependency needed for this use case.

### Integration Pattern

Modify `convertCommand.ts` to add suggestion to error message:

```typescript
// Current:
if (!fs.existsSync(file)) {
  showError(`File not found: ${file}`);
  process.exit(1);
}

// Enhanced:
if (!fs.existsSync(file)) {
  const suggestions = suggestSimilarFiles(
    path.basename(file),
    path.dirname(path.resolve(file)) || '.'
  );
  if (suggestions.length > 0) {
    showError(`File not found: ${file}\n  Did you mean: ${suggestions[0]}?`);
  } else {
    showError(`File not found: ${file}\n  Run 'h2ui --help' for usage information.`);
  }
  process.exit(1);
}
```

---

## 4. Config Scaffold Generation (h2ui init)

### Current State

`src/cli/commands/init.ts` currently generates a minimal JSON config:

```typescript
const config = JSON.stringify({
  out: './h2ui_output/',
  typescript: true,
  strict: false,
}, null, 2);
```

### Enhancement

Generate a self-documenting config with all fields + inline comments. Since JSON doesn't support comments, use a template string that mimics JSON5-style comments:

```typescript
const config = `{
  "out": "./h2ui_output/",     // Output directory for generated components
  "typescript": true,          // Use .tsx (false for .jsx)
  "strict": false,             // Promote warnings to errors
  "split": true,               // Enable component splitting (use --no-split to disable)
  "cssMode": "module"          // CSS output format ('module' only for v1)
}
`;
```

Wait — JSON doesn't support comments! The standard approaches:
1. **JSON5** — supports comments, but requires a different parser
2. **Inline comments in template string** — user-facing but not valid JSON
3. **No comments in JSON** — standard JSON, add comments in README/docs
4. **Separate `.h2uirc` with template string** — write the file with comments, cosmiconfig only reads valid JSON. Comments in the file would break cosmiconfig parsing.

**Re-evaluation:** The most robust approach is to write the JSON template with comments in a template, then let cosmiconfig parse valid JSON configs. For the `init` command, we can:

**Option A (Recommended):** Generate a `.h2uirc` file with JSON **and** a commented version as a template string, then have the tool strip comments during read. But this is overcomplicated.

**Option B (Simpler):** Generate clean valid JSON, and write a companion comment block at the top of the file explaining each field. Since JSON doesn't support comments, use the `$schema` pattern or a README reference.

**Option C (Pragmatic):** Write a `.h2uirc.example` with comments for documentation, and have `h2ui init` generate a clean `.h2uirc` with valid JSON. The user can reference the example for documentation.

**Updated Recommendation (per CONTEXT.md D-05):** Since the CONTEXT.md explicitly specifies "full config scaffold with all fields + inline comments", and since `.h2uirc` is expected to be valid JSON for cosmiconfig, the safest approach is to use **JSON5** for the generated scaffold file, but have cosmiconfig load standard JSON. The init command can write a nice template, and if the user wants to use comments, they can use `.h2uirc.json` (standard JSON, no comments) vs `.h2uirc` (custom format).

**Simplest approach:** Write clean `.h2uirc` as valid JSON (cosmiconfig will parse it fine). Add a short comment section at the top of the JSON using a `_comment` key (this is a common pattern):

```json
{
  "_comment": "h2ui configuration file. See https://github.com/... for documentation.",
  "out": "./h2ui_output/",
  "typescript": true,
  "strict": false,
  "split": true,
  "cssMode": "module"
}
```

This is valid JSON, doesn't break parsers, and provides discoverability. Better than no comments at all.

---

## 5. Component Tree Preview Enhancement

### Current State

`src/cli/output.ts` already has `showComponentTree()` that renders Unicode tree. It's called from the pipeline generate step.

### Enhancement (D-13)

Add file count summary before the tree:

```
✓ Wrote 5 files to ./output

📦 App
├── Header
├── Navigation
├── Main
└── Footer
```

Integration: After spinner stops with `.succeed()`, call:

```typescript
// In convertCommand.ts after pipeline completes
if (ctx.componentTree) {
  showComponentTree(ctx.componentTree);
}
```

The `showComponentTree` already exists and works. The enhancement is to ensure the file count appears in the spinner success message (ora's `.succeed()` handles this).

---

## 6. Compatibility Notes

### ESM Compatibility
- **Project:** `"type": "module"` in package.json, imports use `.js` extensions in TypeScript
- **cosmiconfig v9:** ESM + CJS dual support. `import { cosmiconfig } from 'cosmiconfig'` works in ESM
- **ora v9:** ESM-only (`import ora from 'ora'`). Works with the project's ESM setup
- **No issues expected** with Node 22

### TypeScript Compatibility
- cosmiconfig v9 ships with TypeScript declarations (no `@types/cosmiconfig` needed for v9)
- ora v9 ships with TypeScript declarations (no `@types/ora` needed)
- Both are compatible with TypeScript 5.x

### Package.json Updates Required
```json
{
  "dependencies": {
    "cosmiconfig": "^9.0.1",
    "ora": "^9.4.0"
  }
}
```

**Note:** `chalk` was listed in the stack but CONTEXT.md D-12 says to keep ANSI colors directly. Only `ora` and `cosmiconfig` are new dependencies.

---

## 7. Config + CLI Flag Merging Architecture

### Recommended Architecture

```
CLI startup (index.ts)
  │
  ├── cosmiconfig.search() → config file (or null)
  │
  └── Pass config to convertCommand()
        │
        ├── defaults.ts → DEFAULT_OPTIONS
        ├── config file → partial overrides
        └── CLI flags → final overrides (highest priority)
              │
              ▼
        merged options → pipeline.run()
```

### Implementation Location

Create a new module `src/config/loader.ts`:

```typescript
import { cosmiconfig, cosmiconfigSync } from 'cosmiconfig';
import type { H2uiConfig } from '../types/config.js';

export interface LoadedConfig {
  config: Partial<H2uiConfig>;
  filepath: string | undefined;
}

export async function loadConfig(): Promise<LoadedConfig> {
  const explorer = cosmiconfig('h2ui', {
    searchPlaces: [
      'package.json',
      '.h2uirc',
      '.h2uirc.json',
      '.config/h2uirc',
      '.config/h2uirc.json',
    ],
    loaders: {
      noExt: (await import('cosmiconfig')).defaultLoaders['.json'],
    },
  });

  const result = await explorer.search();
  return {
    config: result?.config ?? {},
    filepath: result?.filepath,
  };
}
```

### Merge Utility

```typescript
// src/config/merge.ts or inline in convertCommand
import { DEFAULT_OPTIONS } from './defaults.js';
import type { ConvertOptions } from '../types/pipeline.js';

export function mergeOptions(
  configFile: Partial<H2uiConfig>,
  cliFlags: Record<string, any>
): ConvertOptions {
  return {
    out: cliFlags.out ?? configFile.out ?? DEFAULT_OPTIONS.out,
    typescript: cliFlags.typescript ?? configFile.typescript ?? DEFAULT_OPTIONS.typescript,
    strict: cliFlags.strict ?? configFile.strict ?? DEFAULT_OPTIONS.strict,
    split: cliFlags.split ?? configFile.split ?? DEFAULT_OPTIONS.split,
    cssMode: configFile.cssMode ?? DEFAULT_OPTIONS.cssMode,
  };
}
```

---

## 8. Version Pin Recommendations

| Package | Version | Rationale |
| ------- | ------- | --------- |
| cosmiconfig | ^9.0.1 | Latest stable; ESM + TypeScript declarations built-in |
| ora | ^9.4.0 | Latest stable; ESM-only; TypeScript declarations built-in |

Both packages have SemVer and are widely adopted in the Node.js CLI ecosystem.

---

## 9. Pitfalls to Avoid

### 1. Cosmiconfig `.h2uirc` Parsing as YAML
**Pitfall:** By default, extensionless rc files are parsed as YAML. Since JSON is a subset of YAML, pure JSON will parse correctly — but mixed JSON-with-comments will fail.
**Mitigation:** Override `loaders.noExt` to use JSON parser. Instruct users to write valid JSON in `.h2uirc`.

### 2. `h2ui init` Generating Invalid JSON
**Pitfall:** If inline comments are written to `.h2uirc`, cosmiconfig will fail to parse it.
**Mitigation:** Use JSON with a `_comment` key for the scaffold, or write clean JSON. Don't add actual JS-style comments to the JSON file.

### 3. ora ESM Import
**Pitfall:** `require('ora')` fails — ora v8+ is ESM-only.
**Mitigation:** Project already uses ESM (`"type": "module"`). Use `import ora from 'ora'`.

### 4. Spinner Blocking on Sync Operations
**Pitfall:** JavaScript is single-threaded — synchronous operations block the spinner animation.
**Mitigation:** The pipeline is already async, so the spinner will animate naturally. No synchronous work should be added between `spinner.start()` and `spinner.stop()`.

### 5. Config Not Found = Crash
**Pitfall:** Treating missing config as an error.
**Mitigation:** `explorer.search()` returning `null` is normal — just fall through to defaults. Only error if you explicitly require a config file.

### 6. CLI Flag Defaults vs Config Merging
**Pitfall:** Commander sets default values for flags (e.g., `--no-typescript` sets `typescript: false` as default). When merging, you can't tell if the user explicitly passed `--no-typescript` or if it's the default.
**Mitigation:** Use commander's option with explicit handling. For boolean flags with negation (`--no-typescript`), check if it's explicitly set by using commander's `opts()` and checking against defaults. Alternatively, remove defaults from commander option definitions and handle defaults in the merge function.

**Better approach:** Define commander options without defaults:
```typescript
.option('--out <directory>')
.option('--no-typescript')
.option('--no-split')
.option('--strict')
```
Then in merge function, `cmdOptions.typescript === undefined` means "not set" → use config file or default.

---

## 10. Sources

- [cosmiconfig v9.0.1 GitHub](https://github.com/cosmiconfig/cosmiconfig) — Full API reference
- [ora v9.4.0 npm](https://www.npmjs.com/package/ora) — Spinner API documentation
- [fuse.js v7.3.0](https://www.fusejs.io/) — Fuzzy search library (optional, not recommended for this use case)
- [cosmiconfig README (searchPlaces section)](https://github.com/cosmiconfig/cosmiconfig#searchPlaces) — Custom search places configuration
- [cosmiconfig loaders section](https://github.com/cosmiconfig/cosmiconfig#loaders) — Custom loader configuration for JSON-only parsing
- [Node.js ESM documentation](https://nodejs.org/api/esm.html) — ESM import patterns for CLI tools

---

*Phase: 03-configuration-polish*
*Researched: 2026-05-21*