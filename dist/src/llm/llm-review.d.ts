import type { ComponentNode } from '../types/pipeline.js';
import type { LLMConfig } from '../types/config.js';
import { type ComponentReview } from './structured/review.js';
/**
 * Main LLM review service.
 * Calls the appropriate provider based on config, with graceful degradation per D-11.
 */
export declare function runLLMReview(componentTree: ComponentNode, config: LLMConfig): Promise<ComponentReview>;
//# sourceMappingURL=llm-review.d.ts.map