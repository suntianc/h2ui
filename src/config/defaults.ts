import type { ConvertOptions } from '../types/pipeline.js';
import type { LLMConfig } from '../types/config.js';

export const DEFAULT_OPTIONS: ConvertOptions = {
  out: './h2ui_output/',
  typescript: true,
  strict: false,
  split: true,
  cssMode: 'module',
};

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  mode: 'auto',
  baseURL: undefined,
  apiKey: undefined,
};