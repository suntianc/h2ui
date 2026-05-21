import OpenAI from 'openai';
import type { LLMConfig } from '../../types/config.js';
/**
 * Create OpenAI client per D-01 (direct SDK) and D-02 (baseURL for Ollama).
 * For Ollama: baseURL is required, apiKey must be set to any string (Ollama ignores it).
 */
export declare function createOpenAIClient(config: LLMConfig): OpenAI;
//# sourceMappingURL=openai.d.ts.map