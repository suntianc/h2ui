import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { convertStep } from '../../src/pipeline/steps/convert.js';
import type { PipelineContext } from '../../src/types/pipeline.js';

describe('Pipeline Pre-tag handling', () => {
  it('preserves spacing and newlines inside <pre> by wrapping in template literals', async () => {
    const html = `
      <div>
        <pre>┌──────────────────┐
 │ MCP 服务列表     │
 └──────────────────┘</pre>
      </div>
    `;
    const $ = cheerio.load(html);
    const ctx: PipelineContext = {
      html,
      filePath: 'Dashboard.html',
      $,
      warnings: [],
      errors: [],
      options: {
        out: 'verify-work/output',
        typescript: false,
        strict: true,
        split: false,
        cssMode: 'global',
      },
    };

    const result = await convertStep.run(ctx);
    expect(result.errors).toHaveLength(0);
    expect(result.code).toContain('{\`┌──────────────────┐');
    expect(result.code).toContain('│ MCP 服务列表     │');
    expect(result.code).toContain('└──────────────────┘\`}');
  });

  it('escapes backticks and backslashes in <pre> content', async () => {
    const html = `
      <pre>Hello \`world\` and \\backslash\\</pre>
    `;
    const $ = cheerio.load(html);
    const ctx: PipelineContext = {
      html,
      filePath: 'Dashboard.html',
      $,
      warnings: [],
      errors: [],
      options: {
        out: 'verify-work/output',
        typescript: false,
        strict: true,
        split: false,
        cssMode: 'global',
      },
    };

    const result = await convertStep.run(ctx);
    expect(result.errors).toHaveLength(0);
    expect(result.code).toContain('{\`Hello \\\`world\\\` and \\\\backslash\\\\`}');
  });
});