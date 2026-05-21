import type { PipelineStep, PipelineContext } from '../../types/pipeline.js';

/**
 * Stub — will be replaced in Plan 03.
 * Extracts inline styles and generates CSS Module files.
 */
export const cssStep: PipelineStep = {
  name: 'css',
  async run(ctx: PipelineContext): Promise<PipelineContext> {
    return ctx;
  },
};