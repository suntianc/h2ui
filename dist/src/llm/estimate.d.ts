/**
 * Estimate cost for a given token count and model.
 */
export declare function estimateCost(tokens: number, model: string): number;
/**
 * Display cost warning to console per D-04 (display-only) and D-05 (no blocking).
 * Shows: [llm] ~{tokens} tokens (~$估算: {cost}) -- calling {model}
 */
export declare function displayCostWarning(inputText: string, model: string): void;
//# sourceMappingURL=estimate.d.ts.map