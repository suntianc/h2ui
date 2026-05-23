import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import type { ConvertOptions } from '../../types/pipeline.js';
import type { H2uiConfig, LLMConfig } from '../../types/config.js';
import { DEFAULT_OPTIONS, DEFAULT_LLM_CONFIG } from '../../config/defaults.js';
import { showError, showSuccess, showWarningSummary, showComponentTree } from '../output.js';
import { suggestSimilarFiles } from '../../util/suggest.js';

export async function convertCommand(
  file: string,
  options: {
    out?: string;
    type?: string;
    strict?: boolean;
    split?: boolean;
    llm?: string;
    framework?: 'react' | 'vue3';
    llmConfig?: LLMConfig;  // For programmatic callers passing LLMConfig directly
  },
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
    typescript: (options.type ?? 'tsx') === 'tsx',
    strict: options.strict !== undefined ? options.strict : (configFile.strict ?? DEFAULT_OPTIONS.strict),
    split: options.split !== undefined ? options.split : (configFile.split ?? DEFAULT_OPTIONS.split),
    // Note: If --css-mode CLI flag is added in future, update to:
    // cssMode: options.cssMode ?? configFile.cssMode ?? DEFAULT_OPTIONS.cssMode
    cssMode: configFile.cssMode ?? DEFAULT_OPTIONS.cssMode,
    framework: options.framework ?? configFile.framework ?? 'react',
  };

  // Merge LLM config: programmatic llmConfig > CLI --llm flag > config file > defaults
  // LLM enabled by default unless --llm off is specified
  let llmConfig: LLMConfig | undefined;
  if (options.llmConfig) {
    // Programmatic caller passed LLMConfig directly (CR-01 fix)
    llmConfig = options.llmConfig;
  } else if (options.llm !== 'off') {
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

  // Add unified LLM fidelity step BEFORE generateStep so results can influence output
  if (llmConfig && llmConfig.mode !== 'off') {
    const { llmFidelityStep } = await import('../../pipeline/steps/llm-fidelity.js');
    pipeline.addStep(llmFidelityStep);
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
    options: { ...mergedConfig, out: outputDir, llm: llmConfig },
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

      // Display LLM review results if available
      if (ctx.llmResult) {
        console.log('\n--- LLM Review ---');

        if (ctx.llmResult._fallback) {
          console.log('[llm] Warning: LLM review was unavailable, using rules-only output');
        } else {
          if (ctx.llmResult.naming_suggestions && ctx.llmResult.naming_suggestions.length > 0) {
            console.log('\nNaming suggestions:');
            for (const s of ctx.llmResult.naming_suggestions) {
              console.log(`  ${s.original} -> ${s.suggested}: ${s.rationale}`);
            }
          }

          if (ctx.llmResult.cleanup_hints && ctx.llmResult.cleanup_hints.length > 0) {
            console.log('\nCleanup hints:');
            for (const h of ctx.llmResult.cleanup_hints) {
              console.log(`  - ${h}`);
            }
          }

          if (ctx.llmResult.boundary_changes && ctx.llmResult.boundary_changes.length > 0) {
            console.log('\nBoundary changes:');
            for (const b of ctx.llmResult.boundary_changes) {
              console.log(`  ${b.action.toUpperCase()} ${b.component_id}: ${b.reason}`);
            }
          }

          if (ctx.llmResult.fidelity_report) {
            const fr = ctx.llmResult.fidelity_report;
            console.log('\nFidelity Report:');
            console.log(`  Structure match: ${fr.structure_match ? '✓' : '✗'}`);
            console.log(`  Text content match: ${fr.text_content_match ? '✓' : '✗'}`);
            console.log(`  CSS preservation: ${fr.css_preservation ? '✓' : '✗'}`);
            if (fr.attribute_preservation.length > 0) {
              console.log('  Missing attributes:');
              for (const ap of fr.attribute_preservation) {
                if (ap.missing_attributes.length > 0) {
                  console.log(`    ${ap.component}: ${ap.missing_attributes.join(', ')}`);
                }
              }
            }
            if (fr.fidelity_notes.length > 0) {
              console.log('  Notes:');
              for (const note of fr.fidelity_notes) {
                console.log(`    - ${note}`);
              }
            }
          }
        }
      }
    } else {
      showSuccess(ctx.outputPath);
    }
  } else {
    showError('No output was generated');
    process.exit(1);
  }
}