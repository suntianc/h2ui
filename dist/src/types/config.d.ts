export interface LLMConfig {
    /** Provider: 'openai' | 'anthropic' | 'ollama' (default: 'openai') */
    provider?: 'openai' | 'anthropic' | 'ollama';
    /** Model name per provider (default: 'gpt-4o-mini' for openai) */
    model?: string;
    /** 'off' | 'auto' | 'always' (default: 'auto') per D-10 */
    mode?: 'off' | 'auto' | 'always';
    /** Custom baseURL for Ollama/OpenAI-compatible APIs per D-02 */
    baseURL?: string;
    /** API key (defaults to process.env.OPENAI_API_KEY / process.env.ANTHROPIC_API_KEY) */
    apiKey?: string;
}
export interface H2uiConfig {
    out?: string;
    typescript?: boolean;
    strict?: boolean;
    split?: boolean;
    cssMode?: 'module' | 'scoped' | 'inline' | 'global';
    llm?: LLMConfig;
}
//# sourceMappingURL=config.d.ts.map