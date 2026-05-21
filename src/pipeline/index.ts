import type { PipelineContext, PipelineStep } from '../types/pipeline.js';

export class Pipeline {
  private steps: PipelineStep[] = [];

  addStep(step: PipelineStep): void {
    this.steps.push(step);
  }

  insertStep(index: number, step: PipelineStep): void {
    this.steps.splice(index, 0, step);
  }

  removeStep(name: string): void {
    this.steps = this.steps.filter(s => s.name !== name);
  }

  async run(initialCtx: PipelineContext): Promise<PipelineContext> {
    let ctx = initialCtx;

    for (const step of this.steps) {
      try {
        ctx = await step.run(ctx);
      } catch (err: any) {
        ctx = {
          ...ctx,
          errors: [...ctx.errors, `[${step.name}] ${err.message}`],
        };
        if (ctx.options.strict) break;
      }
    }

    return ctx;
  }
}