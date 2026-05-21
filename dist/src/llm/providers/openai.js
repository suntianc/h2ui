import OpenAI from 'openai';
/**
 * Create OpenAI client per D-01 (direct SDK) and D-02 (baseURL for Ollama).
 * For Ollama: baseURL is required, apiKey must be set to any string (Ollama ignores it).
 */
export function createOpenAIClient(config) {
    return new OpenAI({
        apiKey: config.apiKey ?? process.env.OPENAI_API_KEY ?? 'ollama',
        baseURL: config.baseURL,
    });
}
//# sourceMappingURL=openai.js.map