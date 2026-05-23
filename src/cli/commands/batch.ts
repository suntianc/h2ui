import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import pLimit from 'p-limit';
import { convertCommand } from './convert.js';
import type { ConvertOptions, PipelineContext } from '../../types/pipeline.js';
import type { H2uiConfig, LLMConfig } from '../../types/config.js';
import { DEFAULT_OPTIONS, DEFAULT_LLM_CONFIG } from '../../config/defaults.js';

// ============================================================================
// Types
// ============================================================================

export interface BatchFailure {
  file: string;
  error: string;
  suggestion: string;
}

export interface BatchResult {
  successes: string[];
  failures: BatchFailure[];
  totalProcessed: number;
}

// ============================================================================
// Batch Command
// ============================================================================

export interface BatchCommandOptions {
  out?: string;
  concurrency?: number;
  split?: boolean;
  strict?: boolean;
  llm?: string;
}

export async function batchCommand(
  pattern: string,
  options: BatchCommandOptions,
  configFile: Partial<H2uiConfig> = {},
): Promise<BatchResult> {
  // Find matching files
  const files = (await fg.glob(pattern)).sort();

  if (files.length === 0) {
    console.log(`No files found matching pattern: ${pattern}`);
    return { successes: [], failures: [], totalProcessed: 0 };
  }

  console.log(`Found ${files.length} file(s) matching pattern: ${pattern}`);

  // Concurrency limiter (bounded to max 4 per D-04)
  const concurrency = Math.min(options.concurrency ?? 1, 4);
  const limit = pLimit(concurrency);

  const successes: string[] = [];
  const failures: BatchFailure[] = [];
  let completed = 0;

  // Progress tracking
  const total = files.length;
  showBatchProgress(0, total);

  // Process all files
  await Promise.all(
    files.map((file) =>
      limit(async () => {
        try {
          const result = await runPipelineForBatch(file, options, configFile);

          if (result.errors.length === 0) {
            successes.push(file);
          } else {
            failures.push({
              file,
              error: result.errors.join('; '),
              suggestion: 'Check the file for HTML parsing errors',
            });
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          failures.push({
            file,
            error: message,
            suggestion: 'Check the file format and try again',
          });
        }

        completed++;
        showBatchProgress(completed, total);
      }),
    ),
  );

  // Clear progress and show summary
  clearBatchProgress();
  showBatchSummary(successes, failures);

  return {
    successes,
    failures,
    totalProcessed: total,
  };
}

// ============================================================================
// Pipeline Runner for Batch (no process.exit)
// ============================================================================

async function runPipelineForBatch(
  file: string,
  options: BatchCommandOptions,
  configFile: Partial<H2uiConfig>,
): Promise<PipelineContext> {
  // Merge config
  const mergedConfig: ConvertOptions = {
    out: options.out ?? configFile.out ?? DEFAULT_OPTIONS.out,
    typescript: true, // default to TSX
    strict: options.strict !== undefined ? options.strict : (configFile.strict ?? DEFAULT_OPTIONS.strict),
    split: options.split !== undefined ? options.split : (configFile.split ?? DEFAULT_OPTIONS.split),
    cssMode: configFile.cssMode ?? DEFAULT_OPTIONS.cssMode,
  };

  // Merge LLM config
  let llmConfig: LLMConfig | undefined;
  if (options.llm !== 'off') {
    llmConfig = {
      provider: (configFile.llm?.provider ?? DEFAULT_LLM_CONFIG.provider) as LLMConfig['provider'],
      model: configFile.llm?.model ?? DEFAULT_LLM_CONFIG.model,
      mode: configFile.llm?.mode ?? 'auto',
      baseURL: configFile.llm?.baseURL,
      apiKey: configFile.llm?.apiKey,
    };
  }

  // Resolve paths
  const inputPath = path.resolve(file);
  const outputDir = path.resolve(mergedConfig.out);

  // Read HTML content for pipeline
  const html = await fs.promises.readFile(inputPath, 'utf-8');

  // Compute output path for mirroring
  const outputPath = computeOutputPath(file, outputDir);

  // Dynamic imports for pipeline steps
  const { Pipeline } = await import('../../pipeline/index.js');
  const { parseStep } = await import('../../pipeline/steps/parse.js');
  const { convertStep } = await import('../../pipeline/steps/convert.js');
  const { generateStep } = await import('../../pipeline/steps/generate.js');

  // Build pipeline
  const pipeline = new Pipeline();
  pipeline.addStep(parseStep);

  if (mergedConfig.split !== false) {
    const { splitStep } = await import('../../engine/splitter/index.js');
    const { cssStep } = await import('../../engine/css/index.js');
    pipeline.addStep(splitStep);
    pipeline.addStep(convertStep);
    pipeline.addStep(cssStep);
  } else {
    pipeline.addStep(convertStep);
  }

  // Add LLM fidelity step if enabled
  if (llmConfig && llmConfig.mode !== 'off') {
    const { llmFidelityStep } = await import('../../pipeline/steps/llm-fidelity.js');
    pipeline.addStep(llmFidelityStep);
  }

  pipeline.addStep(generateStep);

  // Run pipeline directly (no process.exit)
  const ctx = await pipeline.run({
    html,
    filePath: inputPath,
    $: undefined,
    code: undefined,
    outputPath,
    warnings: [],
    errors: [],
    options: { ...mergedConfig, out: outputDir, llm: llmConfig },
  });

  return ctx;
}

// ============================================================================
// Output Path Mirroring
// ============================================================================

export function computeOutputPath(sourceFile: string, outDir: string): string {
  // Get relative path from cwd to source file
  const relative = path.relative(process.cwd(), sourceFile);

  // Mirror into output directory
  const mirrored = path.join(outDir, relative);

  // Convert file to directory (components split into folders)
  return mirrored.replace(/\.html$/i, '/');
}

// ============================================================================
// Progress & Summary Display
// ============================================================================

function showBatchProgress(current: number, total: number): void {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  const barLength = 10;
  const filled = Math.round((current / total) * barLength);
  const bar = '='.repeat(filled) + ' '.repeat(barLength - filled);
  process.stdout.write(`\r[${bar}] ${current}/${total} files (${percent}%)`);
}

function showBatchSummary(successes: string[], failures: BatchFailure[]): void {
  if (successes.length > 0) {
    console.log(`\nProcessed ${successes.length} file(s) successfully`);
  }

  if (failures.length > 0) {
    console.log(`\nFailed files (${failures.length}):`);
    console.log('┌' + '─'.repeat(56) + '┬' + '─'.repeat(30) + '┬' + '─'.repeat(14) + '┐');
    console.log('│ ' + 'File'.padEnd(54) + ' │ ' + 'Error'.padEnd(28) + ' │ ' + 'Suggestion'.padEnd(12) + ' │');
    console.log('├' + '─'.repeat(56) + '┼' + '─'.repeat(30) + '┼' + '─'.repeat(14) + '┤');

    for (const f of failures) {
      const file = f.file.length > 54 ? '...' + f.file.slice(-51) : f.file;
      const error = f.error.length > 28 ? f.error.slice(0, 25) + '...' : f.error;
      const suggestion = f.suggestion.length > 12 ? f.suggestion.slice(0, 9) + '...' : f.suggestion;
      console.log(`│ ${file.padEnd(54)} │ ${error.padEnd(28)} │ ${suggestion.padEnd(12)} │`);
    }

    console.log('└' + '─'.repeat(56) + '┴' + '─'.repeat(30) + '┴' + '─'.repeat(14) + '┘');
  }
}

function clearBatchProgress(): void {
  process.stdout.write('\r' + ' '.repeat(80) + '\r');
}
