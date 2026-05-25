/**
 * LLM tool for the autonomous agent.
 *
 * Provides run_llm tool for direct LLM calls.
 *
 * @module agent/tools/llm
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { createAnthropicClient } from '../../llm/providers/anthropic.js';
import type { LLMConfig } from '../../types/config.js';

/**
 * Tool for calling the LLM with a prompt.
 */
export const runLLMTool = tool(
  async ({ prompt, context }: { prompt: string; context?: Record<string, string> }) => {
    const config: LLMConfig = {
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      mode: 'auto',
    };

    const client = createAnthropicClient(config);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: context
            ? `${prompt}\n\nContext:\n${JSON.stringify(context, null, 2)}`
            : prompt,
        },
      ],
    });

    if (response.content[0]?.type === 'text') {
      return response.content[0].text;
    }

    return 'LLM response was not text';
  },
  {
    name: 'run_llm',
    description: 'Call the LLM with a prompt.',
    schema: z.object({
      prompt: z.string().describe('The prompt to send to the LLM.'),
      context: z.record(z.string()).optional().describe('Optional context object.'),
    }),
  }
);
