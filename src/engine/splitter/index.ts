import type { PipelineStep, PipelineContext } from '../../types/pipeline.js';

/**
 * Stub — will be replaced in Plan 02.
 * Splits HTML into component tree based on semantic tags.
 */
export const splitStep: PipelineStep = {
  name: 'split',
  async run(ctx: PipelineContext): Promise<PipelineContext> {
    return ctx;
  },
};