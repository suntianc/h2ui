import * as cheerio from 'cheerio';
import { readFile } from '../../util/file.js';
import type { PipelineStep, PipelineContext } from '../../types/pipeline.js';

export const parseStep: PipelineStep = {
  name: 'parse',

  async run(ctx: PipelineContext): Promise<PipelineContext> {
    const newCtx = { ...ctx, warnings: [...ctx.warnings], errors: [...ctx.errors] };

    try {
      const html = await readFile(ctx.filePath);
      const $ = cheerio.load(html);

      // Check for empty body
      const bodyContent = $('body').contents().length;
      if (bodyContent === 0) {
        newCtx.warnings.push('HTML body is empty — output will be an empty component');
      }

      return { ...newCtx, html, $ };
    } catch (err: any) {
      newCtx.errors.push(`Parse error: ${err.message}`);
      return newCtx;
    }
  },
};