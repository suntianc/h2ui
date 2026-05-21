import fs from 'node:fs';
import path from 'node:path';
import type { ConvertOptions } from '../../types/pipeline.js';
import { Pipeline } from '../../pipeline/index.js';
import { parseStep } from '../../pipeline/steps/parse.js';
import { convertStep } from '../../pipeline/steps/convert.js';
import { generateStep } from '../../pipeline/steps/generate.js';
import { showError, showSuccess, showWarningSummary } from '../output.js';

export async function convertCommand(
  file: string,
  options: { out: string; typescript: boolean; strict: boolean }
): Promise<void> {
  const opts: ConvertOptions = {
    out: options.out || './h2ui_output/',
    typescript: options.typescript !== false,
    strict: options.strict || false,
  };

  if (!file) {
    showError('Missing required argument: <file>');
    process.exit(1);
  }

  if (!fs.existsSync(file)) {
    showError(`File not found: ${file}`);
    process.exit(1);
  }

  // Resolve paths
  const inputPath = path.resolve(file);
  const outputDir = path.resolve(opts.out);

  // Build pipeline
  const pipeline = new Pipeline();
  pipeline.addStep(parseStep);
  pipeline.addStep(convertStep);
  pipeline.addStep(generateStep);

  // Run pipeline
  const ctx = await pipeline.run({
    html: '',
    filePath: inputPath,
    $: undefined,
    code: undefined,
    outputPath: undefined,
    warnings: [],
    errors: [],
    options: { ...opts, out: outputDir },
  });

  // Handle strict mode
  if (opts.strict && ctx.warnings.length > 0) {
    showWarningSummary(ctx.warnings);
    showError('Strict mode: warnings promoted to errors');
    process.exit(1);
  }

  // Report errors
  if (ctx.errors.length > 0) {
    for (const err of ctx.errors) {
      showError(err);
    }

    // Write partial output even with errors (D-21)
    if (ctx.outputPath) {
      showSuccess(ctx.outputPath);
    }

    process.exit(1);
  }

  // Show warnings
  if (ctx.warnings.length > 0) {
    showWarningSummary(ctx.warnings);
  }

  // Show success
  if (ctx.outputPath) {
    showSuccess(ctx.outputPath);
  } else {
    showError('No output was generated');
    process.exit(1);
  }
}