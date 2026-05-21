/**
 * Estimate token count for a text string using tiktoken.
 * CRITICAL: Must call enc.free() after use to avoid WASM memory leak.
 * Uses cl100k_base encoding via gpt-4o-mini model (same encoding as gpt-4o, claude-3-opus, etc.)
 */
export declare function estimateTokens(text: string): number;
//# sourceMappingURL=tokens.d.ts.map