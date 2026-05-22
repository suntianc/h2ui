/**
 * Shared utilities for LLM services.
 * Contains stringifySafe and translateLLMError which were duplicated across modules.
 */

/**
 * Translate SDK errors to user-friendly Chinese messages.
 */
export function translateLLMError(err: any): string {
  const msg = err.message ?? String(err);

  // Missing API key
  if (msg.includes('apiKey') || msg.includes('API key') || msg.includes('Missing credentials')) {
    return '未配置 API key，请检查 .h2uirc 或环境变量';
  }
  // Network errors
  if (msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED') || msg.includes('fetch') || msg.includes('network')) {
    return '网络连接失败，请检查 API 地址和网络';
  }
  // Authentication errors
  if (msg.includes('401') || msg.includes('403') || msg.includes('Unauthorized') || msg.includes('authentication')) {
    return 'API 认证失败，请检查 API key 是否正确';
  }
  // Rate limit
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('Rate limit')) {
    return '请求频率超限，请稍后重试';
  }
  // Model not found
  if (msg.includes('model') && (msg.includes('not found') || msg.includes('does not exist'))) {
    return `模型不存在或不可用: ${err.model ?? '未知'}`;
  }
  // Default: show original message
  return msg;
}

/**
 * JSON.stringify with circular reference handling.
 * domhandler Element objects have parent pointers that cause serialization to fail.
 */
export function stringifySafe(obj: unknown): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return undefined; // Remove circular reference
      }
      seen.add(value);
    }
    // Handle domhandler-specific circular props
    if (key === 'parent' || key === 'next' || key === 'prev') {
      return undefined;
    }
    return value;
  });
}
