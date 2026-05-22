import type { PipelineStep, PipelineContext } from '../../types/pipeline.js';
import { runLLMFidelity, validateBeforeWrite } from '../../llm/llm-fidelity.js';

export const llmFidelityStep: PipelineStep = {
  name: 'llm-fidelity',

  async run(ctx: PipelineContext): Promise<PipelineContext> {
    const newCtx = { ...ctx, warnings: [...ctx.warnings], errors: [...ctx.errors] };
    const llmConfig = ctx.options.llm;

    // D-10: skip if mode is 'off' or no config
    if (!llmConfig || llmConfig.mode === 'off') {
      return newCtx;
    }

    // D-10 auto mode: check for warnings that should trigger LLM
    // 'always' mode: always run LLM regardless of warnings (WR-03: no early return)
    if (llmConfig.mode === 'auto') {
      const hasRelevantWarnings = ctx.warnings.some(w =>
        w.includes('ambiguous') || w.includes('unknown-attribute')
      );
      if (!hasRelevantWarnings) {
        return newCtx;  // No relevant warnings, skip LLM
      }
    }
    // 'always' mode falls through and proceeds to LLM call

    // Need componentTree, components, AND ctx.html for fidelity check
    if (!ctx.componentTree || !ctx.components) {
      newCtx.warnings.push('No component tree available for LLM fidelity check');
      return newCtx;
    }

    if (!ctx.html) {
      newCtx.warnings.push('No original HTML available for fidelity validation');
      return newCtx;
    }

    try {
      const result = await runLLMFidelity(ctx.html, ctx.componentTree, ctx.components, llmConfig);

      // Apply modified components with validateBeforeWrite validation
      const updatedComponents = [...ctx.components];
      for (const comp of result.components) {
        const validation = validateBeforeWrite(comp.code);
        if (!validation.valid) {
          console.error(`[llm-fidelity] Validation failed for ${comp.name}: ${validation.error}`);
          newCtx.warnings.push(`LLM component "${comp.name}" skipped due to validation failure`);
          continue;
        }
        const idx = updatedComponents.findIndex(c => c.name === comp.name);
        if (idx !== -1) {
          updatedComponents[idx] = { ...updatedComponents[idx], code: comp.code };
        } else {
          console.warn(`[llm-fidelity] Component "${comp.name}" not found in existing components`);
        }
      }

      console.log(`[llm-fidelity] API Success! Modified ${result.components.length} components.`);

      // Build llmResult with review + fidelity_report
      const llmResult = {
        approved: result.approved,
        boundary_changes: result.boundary_changes,
        naming_suggestions: result.naming_suggestions,
        cleanup_hints: result.cleanup_hints,
        components: result.components,
        fidelity_report: result.fidelity_report,
        _fallback: false,
      };

      return { ...newCtx, components: updatedComponents, llmResult };
    } catch (err: any) {
      // D-11: graceful degradation - explicit error + fallback
      console.warn(`[llm-fidelity] error: ${err.message}, falling back to rules-only`);
      return {
        ...newCtx,
        llmResult: { approved: false, _fallback: true } as PipelineContext['llmResult'],
        warnings: [...newCtx.warnings, `LLM fidelity check failed: ${err.message}`],
      };
    }
  },
};
