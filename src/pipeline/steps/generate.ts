import prettier from 'prettier';
import path from 'node:path';
import { writeFile, getOutputFilename } from '../../util/file.js';
import type { PipelineStep, PipelineContext, ComponentOutput, CSSFile } from '../../types/pipeline.js';

async function formatCode(code: string, isTypescript: boolean): Promise<string> {
  try {
    return await prettier.format(code, {
      parser: isTypescript ? 'typescript' : 'babel',
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
      printWidth: 100,
    });
  } catch (err) {
    // Fallback to unformatted if Prettier fails
    console.warn(`Prettier formatting failed: ${(err as Error).message}. Using unformatted code.`);
    return code;
  }
}

/**
 * Generate CSS Module content from a set of properties.
 */
function generateCSSModule(name: string, properties: Record<string, string>): string {
  const className = name[0].toLowerCase() + name.slice(1);
  const cssLines = Object.entries(properties)
    .filter(([_, v]) => v && v.trim())
    .map(([prop, val]) => `  ${prop}: ${val};`);

  if (cssLines.length === 0) return '';
  return `.${className} {\n${cssLines.join('\n')}\n}\n`;
}

/**
 * Write a single file with formatted content.
 */
async function writeFormattedFile(
  outputPath: string,
  content: string,
  formatAs: 'typescript' | 'babel'
): Promise<string> {
  const formatted = await formatCode(content, formatAs === 'typescript');
  return writeFile(outputPath, formatted);
}

export const generateStep: PipelineStep = {
  name: 'generate',

  async run(ctx: PipelineContext): Promise<PipelineContext> {
    const newCtx = { ...ctx, warnings: [...ctx.warnings], errors: [...ctx.errors] };

    if (ctx.components && ctx.components.length > 0) {
      // ── Multi-component mode ──
      const outputDir = ctx.options.out;
      const writtenFiles: string[] = [];

      try {
        // Write each component's .tsx/.jsx file
        for (const comp of ctx.components) {
          const ext = ctx.options.typescript ? '.tsx' : '.jsx';
          const fileName = `${comp.name}${ext}`;
          const filePath = path.join(outputDir, fileName);

          const formatted = await formatCode(comp.code, ctx.options.typescript);
          await writeFile(filePath, formatted);
          writtenFiles.push(filePath);
        }

        // Write CSS Module files from ctx.cssFiles
        if (ctx.cssFiles) {
          for (const cssFile of ctx.cssFiles) {
            if (!cssFile.css || !cssFile.css.trim()) continue;

            const cssFileName = `${cssFile.name}.module.css`;
            const cssFilePath = path.join(outputDir, cssFileName);
            await writeFile(cssFilePath, cssFile.css);
            writtenFiles.push(cssFilePath);
          }
        }

        // Also generate CSS Modules from component cssProperties
        // (in case cssStep was not inserted but components have cssProperties)
        if (ctx.components && (!ctx.cssFiles || ctx.cssFiles.length === 0)) {
          for (const comp of ctx.components) {
            const css = generateCSSModule(comp.name, comp.cssProperties);
            if (css) {
              const cssFilePath = path.join(outputDir, `${comp.name}.module.css`);
              await writeFile(cssFilePath, css);
              writtenFiles.push(cssFilePath);
            }
          }
        }

        // Set output path to the directory for reference
        return {
          ...newCtx,
          outputPath: outputDir,
          warnings: [...newCtx.warnings, `Wrote ${writtenFiles.length} files to ${outputDir}`],
        };
      } catch (err: any) {
        newCtx.errors.push(`Generate error: ${err.message}`);
        return newCtx;
      }
    }

    // ── Single-component mode (fallback) ──
    if (!ctx.code) {
      newCtx.errors.push('Cannot generate: no code to write');
      return newCtx;
    }

    try {
      const filename = getOutputFilename(ctx.filePath, ctx.options.typescript);
      const outputPath = path.join(ctx.options.out, filename);

      const formatted = await formatCode(ctx.code, ctx.options.typescript);
      const absolutePath = await writeFile(outputPath, formatted);

      return { ...newCtx, outputPath: absolutePath };
    } catch (err: any) {
      newCtx.errors.push(`Generate error: ${err.message}`);
      return newCtx;
    }
  },
};