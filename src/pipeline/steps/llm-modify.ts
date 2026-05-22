import type { PipelineStep, PipelineContext } from '../../types/pipeline.js';
import { runLLMModify, validateBeforeWrite } from '../../llm/llm-modify.js';

/**
 * @deprecated Use llmFidelityStep instead. This step is kept for backward compatibility during migration.
 * llmFidelityStep combines review, modify, and fidelity validation in a single step.
 */
export const llmModifyStep: PipelineStep = {
  name: 'llm-modify',

  async run(ctx: PipelineContext): Promise<PipelineContext> {
    const newCtx = { ...ctx, warnings: [...ctx.warnings], errors: [...ctx.errors] };
    const llmConfig = ctx.options.llm;

    // D-10: skip if mode is 'off' or no config
    if (!llmConfig || llmConfig.mode === 'off') {
      return newCtx;
    }

    if (!ctx.componentTree || !ctx.components) {
      newCtx.warnings.push('No component tree available for LLM modify');
      return newCtx;
    }

    try {
      const result = await runLLMModify(ctx.componentTree, ctx.components, llmConfig);

      // Validate and apply each modified component
      const updatedComponents = [...ctx.components];
      for (const comp of result.components) {
        const validation = validateBeforeWrite(comp.code);
        if (!validation.valid) {
          console.error(`[llm-modify] Validation failed for ${comp.name}: ${validation.error}`);
          newCtx.warnings.push(`LLM component "${comp.name}" skipped due to validation failure`);
          continue;
        }
        const idx = updatedComponents.findIndex(c => c.name === comp.name);
        if (idx !== -1) {
          updatedComponents[idx] = { ...updatedComponents[idx], code: comp.code };
        } else {
          console.warn(`[llm-modify] Component "${comp.name}" not found in existing components`);
        }
      }

      return { ...newCtx, components: updatedComponents };
    } catch (err: any) {
      // D-11/D-12: graceful degradation (WR-02 fix: set _fallback and add warning)
      console.warn(`[llm-modify] error: ${err.message}, falling back to rules-only`);
      return {
        ...newCtx,
        llmResult: { approved: false, _fallback: true } as PipelineContext['llmResult'],
        warnings: [...newCtx.warnings, `LLM modify failed: ${err.message}`],
      };
    }
  },
};
