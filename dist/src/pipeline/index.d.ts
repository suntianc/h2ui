import type { PipelineContext, PipelineStep } from '../types/pipeline.js';
export declare class Pipeline {
    private steps;
    addStep(step: PipelineStep): void;
    insertStep(index: number, step: PipelineStep): void;
    removeStep(name: string): void;
    run(initialCtx: PipelineContext): Promise<PipelineContext>;
}
//# sourceMappingURL=index.d.ts.map