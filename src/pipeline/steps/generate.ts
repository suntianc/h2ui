import prettier from 'prettier';
import path from 'node:path';
import { writeFile, getOutputFilename } from '../../util/file.js';
import type { PipelineStep, PipelineContext } from '../../types/pipeline.js';

async function formatCode(code: string, isTypescript: boolean): Promise<string> {
  try {
    return await prettier.format(code, {
      parser: isTypescript ? 'typescript' : 'babel',
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
      printWidth: 100,
    });
  } catch {
    // Fallback to unformatted if Prettier fails
    return code;
  }
}

export const generateStep: PipelineStep = {
  name: 'generate',

  async run(ctx: PipelineContext): Promise<PipelineContext> {
    const newCtx = { ...ctx, warnings: [...ctx.warnings], errors: [...ctx.errors] };

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