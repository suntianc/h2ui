import Anthropic from '@anthropic-ai/sdk';
/**
 * Create Anthropic client per D-01 (direct SDK).
 * apiKey defaults to ANTHROPIC_API_KEY env var.
 */
export function createAnthropicClient(config) {
    return new Anthropic({
        apiKey: config.apiKey ?? process.env.ANTHROPIC_API_KEY,
    });
}
//# sourceMappingURL=anthropic.js.map