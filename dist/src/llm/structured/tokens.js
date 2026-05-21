import { encoding_for_model } from 'tiktoken';
/**
 * Estimate token count for a text string using tiktoken.
 * CRITICAL: Must call enc.free() after use to avoid WASM memory leak.
 * Uses cl100k_base encoding via gpt-4o-mini model (same encoding as gpt-4o, claude-3-opus, etc.)
 */
export function estimateTokens(text) {
    const enc = encoding_for_model('gpt-4o-mini');
    try {
        const count = enc.encode(text).length;
        return count;
    }
    finally {
        enc.free(); // ALWAYS free to avoid WASM memory leak
    }
}
//# sourceMappingURL=tokens.js.map