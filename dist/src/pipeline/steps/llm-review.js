import { runLLMReview } from '../../llm/llm-review.js';
export const llmReviewStep = {
    name: 'llm-review',
    async run(ctx) {
        const newCtx = { ...ctx, warnings: [...ctx.warnings], errors: [...ctx.errors] };
        // D-10: Check llm.mode
        const llmConfig = ctx.options.llm;
        if (!llmConfig || llmConfig.mode === 'off') {
            return newCtx; // Pure rules, no LLM
        }
        // D-10 auto mode: check for warnings that should trigger LLM
        if (llmConfig.mode === 'auto') {
            const hasRelevantWarnings = ctx.warnings.some(w => w.includes('ambiguous') || w.includes('unknown-attribute'));
            if (!hasRelevantWarnings) {
                return newCtx; // No relevant warnings, skip LLM
            }
        }
        // Need componentTree for LLM review
        if (!ctx.componentTree) {
            newCtx.warnings.push('No component tree available for LLM review');
            return newCtx;
        }
        try {
            const result = await runLLMReview(ctx.componentTree, llmConfig);
            // Apply LLM result to context
            return {
                ...newCtx,
                llmResult: result,
            };
        }
        catch (err) {
            // D-11: graceful degradation - explicit error + fallback
            console.warn(`[llm] error: ${err.message}, falling back to rules-only`);
            return {
                ...newCtx,
                llmResult: { approved: false, _fallback: true },
                warnings: [...newCtx.warnings, `LLM review failed: ${err.message}`],
            };
        }
    },
};
//# sourceMappingURL=llm-review.js.map