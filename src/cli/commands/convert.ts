import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import type { ConvertOptions } from '../../types/pipeline.js';
import type { H2uiConfig } from '../../types/config.js';
import { DEFAULT_OPTIONS } from '../../config/defaults.js';
import { showError, showSuccess, showWarningSummary, showComponentTree } from '../output.js';
import { suggestSimilarFiles } from '../../util/suggest.js';

export async function convertCommand(
  file: string,
  options: { out?: string; typescript?: boolean; strict?: boolean; split?: boolean },
  configFile: Partial<H2uiConfig> = {},
): Promise<void> {
  if (!file) {
    showError('Missing required argument: <file>\n  Run \'h2ui --help\' for usage information.');
    process.exit(1);
  }

  if (!fs.existsSync(file)) {
    const dir = path.dirname(path.resolve(file));
    const suggestions = suggestSimilarFiles(file, dir);
    if (suggestions.length > 0) {
      showError(`File not found: ${file}\n  Did you mean: ${suggestions[0]}?`);
    } else {
      showError(`File not found: ${file}\n  Run 'h2ui --help' for usage information.`);
    }
    process.exit(1);
  }

  // Merge: CLI flags > config file > defaults
  const mergedConfig: ConvertOptions = {
    out: options.out ?? configFile.out ?? DEFAULT_OPTIONS.out,
    typescript: options.typescript !== undefined ? options.typescript : (configFile.typescript ?? DEFAULT_OPTIONS.typescript),
    strict: options.strict !== undefined ? options.strict : (configFile.strict ?? DEFAULT_OPTIONS.strict),
    split: options.split !== undefined ? options.split : (configFile.split ?? DEFAULT_OPTIONS.split),
    cssMode: configFile.cssMode ?? DEFAULT_OPTIONS.cssMode,
  };

  // Resolve paths
  const inputPath = path.resolve(file);
  const outputDir = path.resolve(mergedConfig.out);

  const spinner = ora('Parsing and converting HTML...').start();

  // Dynamic imports so CLI works without pipeline modules
  const { Pipeline } = await import('../../pipeline/index.js');
  const { parseStep } = await import('../../pipeline/steps/parse.js');
  const { convertStep } = await import('../../pipeline/steps/convert.js');
  const { generateStep } = await import('../../pipeline/steps/generate.js');

  // Build pipeline
  const pipeline = new Pipeline();
  pipeline.addStep(parseStep);

  // Only add splitting/CSS steps if split is not disabled
  if (mergedConfig.split !== false) {
    const { splitStep } = await import('../../engine/splitter/index.js');
    const { cssStep } = await import('../../engine/css/index.js');
    pipeline.addStep(splitStep);
    pipeline.addStep(convertStep);
    pipeline.addStep(cssStep);
  } else {
    pipeline.addStep(convertStep);
  }

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
    options: { ...mergedConfig, out: outputDir },
  });

  // Handle strict mode
  if (mergedConfig.strict && ctx.warnings.length > 0) {
    spinner.stop();
    showWarningSummary(ctx.warnings);
    showError('Strict mode: warnings promoted to errors');
    process.exit(1);
  }

  // Report errors
  if (ctx.errors.length > 0) {
    spinner.stop();
    for (const err of ctx.errors) {
      showError(err);
    }

    // Write partial output even with errors
    if (ctx.outputPath) {
      showSuccess(ctx.outputPath);
    }

    process.exit(1);
  }

  // Success
  spinner.stop();

  // Show warnings
  if (ctx.warnings.length > 0) {
    showWarningSummary(ctx.warnings);
  }

  // Show success with enhanced output
  if (ctx.outputPath) {
    if (mergedConfig.split && ctx.componentTree && ctx.components) {
      const fileCount = ctx.components.length;
      console.log(`\n\x1b[32m✓\x1b[0m Wrote ${fileCount} files to ${mergedConfig.out}`);
      showComponentTree(ctx.componentTree);
    } else {
      showSuccess(ctx.outputPath);
    }
  } else {
    showError('No output was generated');
    process.exit(1);
  }
}