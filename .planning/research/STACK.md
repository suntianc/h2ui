# Stack Additions for h2ui v1.1

**Project:** h2ui-cli
**Purpose:** Stack additions for batch conversion, Vue 3 SFC output, and autonomous agent repair
**Researched:** 2026/05/23
**Confidence:** HIGH

---

## Summary

Three new features require these stack additions:

| Feature | Required Addition | Version | Status |
|---------|------------------|---------|--------|
| Batch glob | `fast-glob` | ^3.3.3 | NEW |
| Vue 3 SFC output | `@vue/compiler-sfc` | ^3.5.34 | NEW |
| Autonomous agent | Upgrade `@anthropic-ai/sdk` | ^0.98.0 | UPGRADE |

**All other dependencies already exist in project.**

---

## 1. Batch Glob Processing

**For:** `h2u "src/**/*.html"` pattern-based batch conversion

| Library | Version | Purpose | Rationale |
|---------|---------|---------|-----------|
| **fast-glob** | ^3.3.3 | Pattern-based file discovery | 3-10x faster than `glob` npm package; Node.js 22 compatible |

**Installation:**
```bash
npm install fast-glob
```

**Usage:**
```typescript
import fg from 'fast-glob';

const files = await fg.glob(['**/*.html', '!**/node_modules/**'], {
  cwd: process.cwd(),
  absolute: true,
});

for (const file of files) {
  await convertFile(file);
}
```

**Why NOT alternatives:**
- `glob` npm package: Slower, less maintained, same pattern syntax
- `globby` (^16.2.0): Wrapper around fast-glob with CLI-friendly API; adds unnecessary layer
- Node.js built-in: No native glob support in Node 22

**Integration:** CLI commander argument parsing (existing: ^12.1.0)

---

## 2. Vue 3 Single-File Component Output

**For:** Generating `.vue` Single-File Components with `<template>`, `<script setup>`, `<style>`

| Library | Version | Purpose | Rationale |
|---------|---------|---------|-----------|
| **@vue/compiler-sfc** | ^3.5.34 | Programmatic SFC compilation | Official Vue 3 SFC compiler; version must match Vue |
| **vue** | ^3.5.34 | Peer dependency | Required by compiler-sfc |
| **@vitejs/plugin-vue** | ^6.0.7 | Vite preview integration | Only if Vue SFC preview server needed |

**Installation:**
```bash
npm install vue@^3.5.34 @vue/compiler-sfc@^3.5.34
npm install -D @vitejs/plugin-vue@^6.0.7
```

**@vue/compiler-sfc API for .vue generation:**

```typescript
import { parse, compileScript, compileTemplate, compileStyle } from '@vue/compiler-sfc';

// 1. Parse HTML source into SFC descriptor
const descriptor = parse(htmlSource, { filename: 'Component.vue' });

// 2. Compile script block with TypeScript
const script = compileScript(descriptor.descriptor, {
  id: 'unique-id',
  lang: 'ts',
});

// 3. Compile template
const template = compileTemplate({
  id: 'unique-id',
  filename: 'Component.vue',
  source: descriptor.descriptor.template.content,
});

// 4. Compile scoped styles
const styles = descriptor.descriptor.styles.map((style, i) =>
  compileStyle({
    id: `scoped-${i}`,
    filename: 'Component.vue',
    source: style.content,
    scoped: style.attrs.scoped !== undefined,
  })
);

// 5. Assemble SFC string
const vueSFC = `<template>
${descriptor.descriptor.template.content}
</template>

<script setup lang="ts">
${script.content}
</script>

<style${styles[0]?.scoped ? ' scoped' : ''}>
${styles[0]?.code}
</style>
`;
```

**Key compiler-sfc exports:**
- `parse()` - Parse .html/.vue source into descriptor with template/script/style blocks
- `compileScript()` - Process `<script setup>`, TypeScript support, CSS variable injection
- `compileTemplate()` - Compile template to render function
- `compileStyle()` - Process scoped CSS, CSS Modules

**Integration points:**
- Cheerio (existing: ^1.2.0) - Extract template/script/style from HTML
- css-tree (existing: ^3.2.1) - CSS Modules extraction (already in use)
- Output: Write `.vue` files alongside `.tsx`

---

## 3. Autonomous Agent Repair

**For:** Self-planning, tool-calling, verification loops to fix conversion errors autonomously

| Library | Version | Purpose | Rationale |
|---------|---------|---------|-----------|
| **@anthropic-ai/sdk** | ^0.98.0 | Tool use, verification loops | Already in project at ^0.97.1; upgrade for latest patterns |

**Upgrade:**
```bash
npm install @anthropic-ai/sdk@^0.98.0
```

**Already available (no changes needed):**
- Zod ^3.25.76 (existing; peer dependency requirement met)
- Tool definitions via SDK
- Message loop handling

**Autonomous agent pattern:**

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const client = new Anthropic();

// Tool definitions
const tools = [
  {
    name: 'convert_file',
    description: 'Convert HTML file to React/Vue component',
    input_schema: z.object({
      file_path: z.string(),
      output_format: z.enum(['tsx', 'vue']),
    }),
  },
  {
    name: 'verify_output',
    description: 'Verify converted component compiles',
    input_schema: z.object({
      file_path: z.string(),
    }),
  },
  {
    name: 'fix_errors',
    description: 'Fix conversion errors using LLM',
    input_schema: z.object({
      file_path: z.string(),
      errors: z.array(z.string()),
    }),
  },
];

// Agent loop with verification
async function autonomousRepair(htmlFile: string) {
  let messages = [{
    role: 'user',
    content: `Repair conversion for ${htmlFile}. Convert, verify, fix errors.`
  }];

  for (let i = 0; i < 5; i++) {  // max iterations
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      tools,
      messages,
    });

    for (const block of response.content) {
      if (block.type === 'tool_use') {
        const result = await executeTool(block.name, block.input);
        messages.push({
          role: 'user',
          content: [{
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result),
          }],
        });
      }
    }

    if (response.stop_reason === 'end_turn') {
      return 'Complete';
    }
  }
  return 'Max iterations reached';
}
```

**Verification loop pattern:**
```typescript
async function verifyAndFix(file: string): Promise<boolean> {
  const errors = await verify(file);
  if (errors.length === 0) return true;

  const fixed = await llm.fixErrors(file, errors);
  const newErrors = await verify(fixed);
  return newErrors.length === 0;
}
```

**Integration points:**
- Existing LLM provider abstraction (OpenAI/Anthropic/Ollama)
- Existing Zod schemas (^3.25.76)
- Existing cosmiconfig (^9.0.1)

---

## What NOT to Add

| Library | Why Avoid |
|---------|-----------|
| `glob` (npm) | Slower than fast-glob; deprecated patterns |
| `globby` | Wrapper layer; fast-glob is sufficient |
| `@vue/runtime-core` alone | Runtime only; need compiler-sfc for SFC generation |
| `vite-plugin-vue-next` | Package does not exist |
| Additional LLM SDKs | Already supporting OpenAI/Anthropic/Ollama |

---

## Version Compatibility

| New Package | Current Vue | Current Anthropic | Current Node |
|-------------|-------------|-------------------|--------------|
| fast-glob ^3.3.3 | N/A | N/A | v22.21.0 |
| @vue/compiler-sfc ^3.5.34 | 3.5.34 | N/A | N/A |
| @anthropic-ai/sdk ^0.98.0 | N/A | ^0.97.1 | N/A |

---

## Existing Dependencies (Unchanged)

These packages already exist and are sufficient:

| Package | Version | Purpose |
|---------|---------|---------|
| cheerio | ^1.2.0 | HTML parsing |
| css-tree | ^3.2.1 | CSS AST |
| commander | ^12.1.0 | CLI framework |
| cosmiconfig | ^9.0.1 | Config loading |
| zod | ^3.25.76 | Validation |
| openai | ^6.38.0 | LLM provider |
| ora | ^9.4.0 | Spinners |
| prettier | ^3.8.3 | Code formatting |
| vite | ^5.x | Preview server |

---

## Sources

- npm registry (verified via `npm view`)
- Vue.js core: https://github.com/vuejs/core (compiler-sfc README)
- fast-glob: https://github.com/mrmlnc/fast-glob
- Anthropic SDK: https://www.npmjs.com/package/@anthropic-ai/sdk

---

*Stack additions for h2ui v1.1 features*
*Researched: 2026/05/23*
