import type { CheerioAPI } from 'cheerio';
import type { Element } from 'domhandler';
import type { PipelineStep, PipelineContext, ComponentNode } from '../../types/pipeline.js';
import { isSemanticTag, tagToComponentName, getMeaningfulClasses } from './semantic.js';
import { findRepeatedPatterns, type DetectedPattern } from './signature.js';
import { showComponentTree } from '../../cli/output.js';

/**
 * Build a component tree by recursively walking DOM children.
 * Non-semantic children are merged into the parent.
 */
function buildComponentTree(
  $: CheerioAPI,
  el: Element,
  depth: number,
  repeatedPatterns: DetectedPattern[]
): ComponentNode | null {
  const tag = el.tagName.toLowerCase();

  // Skip non-element nodes
  if (!tag || tag === 'script' || tag === 'style' || tag === 'html') {
    return null;
  }

  const classes = getMeaningfulClasses($, el);
  const name = tagToComponentName(tag, classes);

  // Check if this element is part of a repeated pattern
  const pattern = repeatedPatterns.find(p =>
    p.elements.includes(el)
  );
  const isRepeated = !!pattern;

  // Process children
  const childElements = $(el).contents().toArray()
    .filter((c): c is Element => c.type === 'tag');

  const children: ComponentNode[] = [];

  if (isSemanticTag(el) || depth === 0) {
    // This is a split point — recurse into children
    for (const child of childElements) {
      const childNode = buildComponentTree($, child, depth + 1, repeatedPatterns);
      if (childNode) {
        children.push(childNode);
      }
    }
  } else {
    // Non-semantic — merge direct semantic children, skip non-semantic
    for (const child of childElements) {
      if (isSemanticTag(child)) {
        const childNode = buildComponentTree($, child, depth + 1, repeatedPatterns);
        if (childNode) {
          children.push(childNode);
        }
      }
      // Non-semantic children at depth > 0 are merged (their content flows into parent JSX)
    }
  }

  const node: ComponentNode = {
    name,
    tag,
    element: el,
    children,
    isRepeated,
    repeatCount: isRepeated ? pattern!.count : undefined,
    cssProperties: {},
  };

  return node;
}

/**
 * Flatten a component tree into a list.
 */
function flattenTree(node: ComponentNode): ComponentNode[] {
  const result: ComponentNode[] = [node];
  for (const child of node.children) {
    result.push(...flattenTree(child));
  }
  return result;
}

export const splitStep: PipelineStep = {
  name: 'split',

  async run(ctx: PipelineContext): Promise<PipelineContext> {
    const newCtx = { ...ctx, warnings: [...ctx.warnings], errors: [...ctx.errors] };

    if (!ctx.$) {
      newCtx.errors.push('Cannot split: no parsed AST available');
      return newCtx;
    }

    try {
      const $ = ctx.$;
      const body = $('body');
      const bodyEl = body[0] as Element | undefined;

      if (!bodyEl) {
        newCtx.warnings.push('No <body> tag found — skipping component splitting');
        return { ...newCtx, componentTree: undefined };
      }

      // Find repeated patterns first
      const repeatedPatterns = findRepeatedPatterns(
        $, bodyEl, undefined, newCtx.warnings
      );

      // Build component tree
      const root = buildComponentTree($, bodyEl, 0, repeatedPatterns);

      if (!root) {
        newCtx.warnings.push('Could not build component tree — skipping split');
        return newCtx;
      }

      // Name the root component from filename
      const filename = ctx.filePath;
      const { toPascalCase } = await import('../../util/file.js');
      root.name = toPascalCase(filename);

      const flatList = flattenTree(root);

      // Display tree in console
      showComponentTree(root);

      return {
        ...newCtx,
        componentTree: root,
        // Store repeated patterns as serialized data for PipelineContext
        repeatedPatterns: repeatedPatterns.length > 0
          ? new Map(repeatedPatterns.map(p => [p.signature, p.elements]))
          : undefined,
      };
    } catch (err: any) {
      newCtx.errors.push(`Split error: ${err.message}`);
      return newCtx;
    }
  },
};