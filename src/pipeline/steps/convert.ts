import path from 'node:path';
import type { CheerioAPI } from 'cheerio';
import type { AnyNode, Element, Text } from 'domhandler';
import type { PipelineStep, PipelineContext } from '../../types/pipeline.js';
import { mapAllAttributes } from '../../engine/transform/attributes.js';
import { parseInlineStyle } from '../../engine/transform/style.js';
import { isVoidElement, formatJsxTag } from '../../engine/transform/elements.js';

/**
 * Generate JSX code string from a Cheerio AST root node.
 * Recursively processes all child nodes.
 */
function generateJsxFromNode(
  $: CheerioAPI,
  el: AnyNode,
  warnings: string[]
): string {
  if (el.type === 'text') {
    const text = (el as Text).data;
    return text || '';
  }

  if (el.type === 'comment') {
    return '';
  }

  const tagEl = el as Element;
  const tagName = tagEl.tagName.toLowerCase();

  // Special handling for HTML entities and raw text elements
  if (tagName === 'script' || tagName === 'style') {
    return '';
  }

  // Process attributes
  const rawAttrs = $(el).attr() || {};
  const mappedAttrs = mapAllAttributes(rawAttrs, warnings);

  // Generate attribute strings
  const attrStrings: string[] = [];
  for (const attr of mappedAttrs) {
    if (attr.name === 'style' && typeof attr.value === 'string') {
      // Parse style string and output as React style object
      const styleObj = parseInlineStyle(attr.value);
      if (styleObj) {
        const styleEntries = Object.entries(styleObj)
          .map(([k, v]) => `${k}: '${v.replace(/'/g, "\\'")}'`)
          .join(', ');
        attrStrings.push(`style={{ ${styleEntries} }}`);
      }
    } else if (attr.value === true) {
      // Boolean attribute: disabled
      attrStrings.push(attr.name);
    } else {
      // String attribute: className="container"
      const escaped = String(attr.value).replace(/"/g, '&quot;');
      attrStrings.push(`${attr.name}="${escaped}"`);
    }
  }

  const attrStr = attrStrings.length > 0 ? ' ' + attrStrings.join(' ') : '';

  // Get children
  const children = $(el).contents().toArray();
  const hasNonEmptyChildren = children.some(child => {
    if (child.type === 'text') {
      return !!((child as Text).data?.trim());
    }
    return child.type !== 'comment';
  });

  // Generate opening tag
  const opening = formatJsxTag(tagName, attrStr, hasNonEmptyChildren);

  if (isVoidElement(tagName) || !hasNonEmptyChildren) {
    return opening;
  }

  // Generate children content
  let childrenContent = '';
  for (const child of children) {
    childrenContent += generateJsxFromNode($, child, warnings);
  }

  return `${opening}${childrenContent}</${tagName}>`;
}

/**
 * Generate a complete React component from the parsed HTML.
 */
function generateComponent(
  $: CheerioAPI,
  componentName: string,
  isTypescript: boolean,
  warnings: string[]
): string {
  const bodyEl = $('body');
  let innerContent: string;

  if (bodyEl.length > 0) {
    const children = bodyEl.contents().toArray();
    if (children.length === 0) {
      innerContent = '<></>';
    } else if (children.length === 1) {
      innerContent = generateJsxFromNode($, children[0], warnings);
    } else {
      // Multiple top-level elements — wrap in fragment
      let fragmentContent = '';
      for (const child of children) {
        fragmentContent += generateJsxFromNode($, child, warnings);
      }
      innerContent = `<>${fragmentContent}</>`;
    }
  } else {
    // No body tag — wrap everything
    const rootNodes = $.root().contents().toArray();
    if (rootNodes.length === 0) {
      innerContent = '<></>';
    } else {
      let content = '';
      for (const node of rootNodes) {
        content += generateJsxFromNode($, node, warnings);
      }
      innerContent = content;
    }
  }

  const lines: string[] = [];

  if (isTypescript) {
    lines.push('interface Props {}');
    lines.push('');
  }

  // Indent the inner content by 2 spaces
  const indentedContent = innerContent
    .split('\n')
    .map(line => `  ${line}`)
    .join('\n');

  lines.push(`function ${componentName}(props${isTypescript ? ': Props' : ''}) {`);
  lines.push('  return (');
  lines.push(indentedContent);
  lines.push('  );');
  lines.push('}');
  lines.push('');
  lines.push(`export default ${componentName};`);
  lines.push('');

  return lines.join('\n');
}

export const convertStep: PipelineStep = {
  name: 'convert',

  async run(ctx: PipelineContext): Promise<PipelineContext> {
    const newCtx = { ...ctx, warnings: [...ctx.warnings], errors: [...ctx.errors] };

    if (!ctx.$) {
      newCtx.errors.push('Cannot convert: no parsed AST available');
      return newCtx;
    }

    try {
      const componentName = ctx.outputPath
        ? path.basename(ctx.outputPath, path.extname(ctx.outputPath))
        : 'Component';

      const code = generateComponent(ctx.$, componentName, ctx.options.typescript, newCtx.warnings);
      return { ...newCtx, code };
    } catch (err: any) {
      newCtx.errors.push(`Convert error: ${err.message}`);
      return newCtx;
    }
  },
};