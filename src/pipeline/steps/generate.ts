import prettier from 'prettier';
import path from 'node:path';
import { writeFile, getOutputFilename } from '../../util/file.js';
import type { PipelineStep, PipelineContext, ComponentOutput, CSSFile, ComponentNode } from '../../types/pipeline.js';

async function formatCode(code: string, isTypescript: boolean): Promise<string> {
  try {
    return await prettier.format(code, {
      parser: isTypescript ? 'typescript' : 'babel',
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
      printWidth: 100,
    });
  } catch (err) {
    // Fallback to unformatted if Prettier fails
    console.warn(`Prettier formatting failed: ${(err as Error).message}. Using unformatted code.`);
    return code;
  }
}

/**
 * Format Vue SFC content using prettier with vue parser.
 */
async function formatVueSFC(code: string): Promise<string> {
  try {
    return await prettier.format(code, {
      parser: 'vue',
      semi: true,
      singleQuote: true,
      printWidth: 100,
    });
  } catch (err) {
    // Fallback to unformatted if Prettier fails
    console.warn(`Prettier Vue formatting failed: ${(err as Error).message}. Using unformatted code.`);
    return code;
  }
}

/**
 * Generate CSS content for Vue scoped style block.
 */
function generateVueCSS(name: string, properties: Record<string, string>): string {
  const className = name[0].toLowerCase() + name.slice(1);
  const cssLines = Object.entries(properties)
    .filter(([_, v]) => v && v.trim())
    .map(([prop, val]) => `  ${prop}: ${val};`);

  if (cssLines.length === 0) return '';
  return `.${className} {\n${cssLines.join('\n')}\n}\n`;
}

/**
 * Generate a Vue 3 Single-File Component (SFC) string.
 */
function generateVueSFC(
  componentName: string,
  template: string,
  cssProperties: Record<string, string>,
  childImports: string[] = []
): string {
  const blocks: string[] = [];

  // Build script setup block
  const scriptLines: string[] = [];
  scriptLines.push('<script setup lang="ts">');

  // Add child component imports
  for (const child of childImports) {
    scriptLines.push(`import ${child} from './${child}.vue'`);
  }

  // Add defineProps if there are props (simplified - no runtime props extraction yet)
  // For now, omit props if no child components need them

  scriptLines.push('</script>');
  blocks.push(scriptLines.join('\n'));

  // Add template block
  blocks.push(`<template>`);
  blocks.push(`  ${template}`);
  blocks.push(`</template>`);

  // Add style scoped block if there are CSS properties
  if (cssProperties && Object.keys(cssProperties).length > 0) {
    const css = generateVueCSS(componentName, cssProperties);
    if (css) {
      blocks.push('<style scoped>');
      blocks.push(css);
      blocks.push('</style>');
    }
  }

  return blocks.join('\n');
}

// Named export for Vue SFC generation
export { generateVueSFC };

/**
 * Generate CSS Module content from a set of properties.
 */
function generateCSSModule(name: string, properties: Record<string, string>): string {
  const className = name[0].toLowerCase() + name.slice(1);
  const cssLines = Object.entries(properties)
    .filter(([_, v]) => v && v.trim())
    .map(([prop, val]) => `  ${prop}: ${val};`);

  if (cssLines.length === 0) return '';
  return `.${className} {\n${cssLines.join('\n')}\n}\n`;
}

/**
 * Write a single file with formatted content.
 */
async function writeFormattedFile(
  outputPath: string,
  content: string,
  formatAs: 'typescript' | 'babel'
): Promise<string> {
  const formatted = await formatCode(content, formatAs === 'typescript');
  return writeFile(outputPath, formatted);
}

function toPreviewTree(node: ComponentNode): {
  name: string;
  tag: string;
  isRepeated?: boolean;
  repeatCount?: number;
  children: ReturnType<typeof toPreviewTree>[];
} {
  return {
    name: node.name,
    tag: node.tag,
    isRepeated: node.isRepeated,
    repeatCount: node.repeatCount,
    children: node.children.map(toPreviewTree),
  };
}

export const generateStep: PipelineStep = {
  name: 'generate',

  async run(ctx: PipelineContext): Promise<PipelineContext> {
    const newCtx = { ...ctx, warnings: [...ctx.warnings], errors: [...ctx.errors] };
    const isVue = ctx.options.framework === 'vue3';

    if (ctx.components && ctx.components.length > 0) {
      // ── Multi-component mode ──
      const outputDir = ctx.options.out;
      const writtenFiles: string[] = [];

      try {
        // Write each component's file
        for (const comp of ctx.components) {
          if (isVue) {
            // Vue SFC mode
            const fileName = `${comp.name}.vue`;
            const filePath = path.join(outputDir, fileName);

            // Collect child component imports
            const childImports = ctx.components
              .filter(c => c.name !== comp.name)
              .map(c => c.name);

            // Generate Vue SFC with template, imports, and CSS
            const vueSFC = generateVueSFC(
              comp.name,
              comp.vueTemplate || comp.code,
              comp.cssProperties,
              childImports
            );

            const formatted = await formatVueSFC(vueSFC);
            await writeFile(filePath, formatted);
            writtenFiles.push(filePath);
          } else {
            // React TSX/JSX mode
            const ext = ctx.options.typescript ? '.tsx' : '.jsx';
            const fileName = `${comp.name}${ext}`;
            const filePath = path.join(outputDir, fileName);

            const formatted = await formatCode(comp.code, ctx.options.typescript);
            await writeFile(filePath, formatted);
            writtenFiles.push(filePath);
          }
        }

        // Write CSS files only for React (Vue CSS goes in style blocks)
        if (!isVue) {
          // Write CSS Module files from ctx.cssFiles
          if (ctx.cssFiles) {
            for (const cssFile of ctx.cssFiles) {
              if (!cssFile.css || !cssFile.css.trim()) continue;

              const isGlobal = cssFile.name === 'global' || cssFile.name.startsWith('global-');
              const cssFileName = isGlobal ? `${cssFile.name}.css` : `${cssFile.name}.module.css`;
              const cssFilePath = path.join(outputDir, cssFileName);
              await writeFile(cssFilePath, cssFile.css);
              writtenFiles.push(cssFilePath);
            }
          }

          // Also generate CSS Modules from component cssProperties
          // (in case cssStep was not inserted but components have cssProperties)
          if (ctx.components && (!ctx.cssFiles || ctx.cssFiles.length === 0)) {
            for (const comp of ctx.components) {
              const css = generateCSSModule(comp.name, comp.cssProperties);
              if (css) {
                const cssFilePath = path.join(outputDir, `${comp.name}.module.css`);
                await writeFile(cssFilePath, css);
                writtenFiles.push(cssFilePath);
              }
            }
          }
        }

        // Persist component tree for preview server consumption.
        if (ctx.componentTree) {
          const treePath = path.join(outputDir, '.h2ui-component-tree.json');
          const headLinks: string[] = [];
          if (ctx.$) {
            const $ = ctx.$;
            $('link').each((_, el) => {
              const linkHtml = $(el).toString();
              if (linkHtml) {
                headLinks.push(linkHtml);
              }
            });
          }
          const treeData = {
            ...toPreviewTree(ctx.componentTree),
            headLinks,
          };
          await writeFile(treePath, JSON.stringify(treeData, null, 2));
          writtenFiles.push(treePath);
        }

        // Set output path to the directory for reference
        return {
          ...newCtx,
          outputPath: outputDir,
          warnings: [...newCtx.warnings, `Wrote ${writtenFiles.length} files to ${outputDir}`],
        };
      } catch (err: any) {
        newCtx.errors.push(`Generate error: ${err.message}`);
        return newCtx;
      }
    }

    // ── Single-component mode (fallback) ──
    if (!ctx.code) {
      newCtx.errors.push('Cannot generate: no code to write');
      return newCtx;
    }

    try {
      const filename = getOutputFilename(ctx.filePath, ctx.options.typescript);
      const outputPath = path.join(ctx.options.out, filename);

      if (isVue) {
        // Vue SFC mode - generate SFC with template and CSS
        const vueSFC = generateVueSFC(
          ctx.vueTemplate ? 'Component' : 'App',
          ctx.vueTemplate || ctx.code,
          {}, // No CSS properties in single-component mode
          []
        );
        const formatted = await formatVueSFC(vueSFC);
        const absolutePath = await writeFile(outputPath, formatted);
        return { ...newCtx, outputPath: absolutePath };
      } else {
        // React mode
        const formatted = await formatCode(ctx.code, ctx.options.typescript);
        const absolutePath = await writeFile(outputPath, formatted);
        return { ...newCtx, outputPath: absolutePath };
      }
    } catch (err: any) {
      newCtx.errors.push(`Generate error: ${err.message}`);
      return newCtx;
    }
  },
};
