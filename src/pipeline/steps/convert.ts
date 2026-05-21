import type { CheerioAPI } from 'cheerio';
import type { AnyNode, Element, Text } from 'domhandler';
import type { PipelineStep, PipelineContext, ComponentNode, ComponentOutput } from '../../types/pipeline.js';
import { mapAllAttributes } from '../../engine/transform/attributes.js';
import { parseInlineStyle } from '../../engine/transform/style.js';
import { isVoidElement, formatJsxTag } from '../../engine/transform/elements.js';
import { toPascalCase } from '../../util/file.js';

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
 * Generate a complete React component from the parsed HTML (single output mode).
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

// ── Phase 2: Per-component generation ──

/**
 * Flatten a component tree into a flat list (top-down).
 */
function flattenTree(node: ComponentNode): ComponentNode[] {
  return [node, ...node.children.flatMap(flattenTree)];
}

/**
 * Generate code for a single child component.
 * Each component gets its own file with imports for children + CSS Module.
 */
function generateComponentCode(
  node: ComponentNode,
  isTypescript: boolean,
  allComponents: ComponentOutput[],
  warnings: string[]
): string {
  const lines: string[] = [];

  // Import child components
  for (const child of node.children) {
    const childOutput = allComponents.find(c => c.name === child.name);
    if (childOutput) {
      lines.push(`import ${child.name} from './${child.name}';`);
    }
  }

  // Import CSS Module if component has styles
  const hasCss = node.cssProperties && Object.keys(node.cssProperties).length > 0;
  if (hasCss) {
    lines.push(`import styles from './${node.name}.module.css';`);
  }

  if (lines.length > 0) lines.push('');

  // Props interface for TypeScript
  if (isTypescript) {
    lines.push('import type { ReactNode } from \'react\';');
    lines.push('');
    lines.push('interface Props {');
    lines.push('  children?: ReactNode;');
    lines.push('}');
    lines.push('');
  }

  // Build JSX content from the node's element children
  const $ = (node.element as any).__cheerioContext;
  // Actually, we need to generate JSX from the element's content
  // using the CheerioAPI that was available during conversion
  // This will be populated differently
  const jsxContent = generateJsxFromNode(
    // We'll use a simpler approach: render children inline
    // but wrap with CSS module className if has CSS
    null as any,
    node.element,
    warnings
  );

  // For now, just generate placeholders - the actual content rendering
  // happens via the element tree during conversion
  const innerContent = `<div>${node.name} content</div>`;

  const classNameAttr = hasCss
    ? ` className={styles.${node.name[0].toLowerCase() + node.name.slice(1)}}`
    : '';

  lines.push(`function ${node.name}(props${isTypescript ? ': Props' : ''}) {`);
  lines.push('  return (');
  lines.push(`    <div${classNameAttr}>`);
  lines.push(`      ${innerContent}`);
  lines.push('    </div>');
  lines.push('  );');
  lines.push('}');
  lines.push('');
  lines.push(`export default ${node.name};`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate the root/parent component that imports all children
 * and renders them with their correct positions.
 */
function generateRootComponent(
  $: CheerioAPI,
  root: ComponentNode,
  allComponents: ComponentOutput[],
  isTypescript: boolean,
  warnings: string[]
): string {
  const lines: string[] = [];

  // Import child components
  for (const child of root.children) {
    lines.push(`import ${child.name} from './${child.name}';`);
  }

  // Import CSS Module for root
  const hasCss = root.cssProperties && Object.keys(root.cssProperties).length > 0;
  if (hasCss) {
    lines.push(`import styles from './${root.name}.module.css';`);
  }

  lines.push('');

  if (isTypescript) {
    lines.push('import type { ReactNode } from \'react\';');
    lines.push('');
    lines.push('interface Props {');
    lines.push('  children?: ReactNode;');
    lines.push('}');
    lines.push('');
  }

  const classNameAttr = hasCss
    ? ` className={styles.${root.name[0].toLowerCase() + root.name.slice(1)}}`
    : '';

  lines.push(`function ${root.name}(props${isTypescript ? ': Props' : ''}) {`);
  lines.push('  return (');
  lines.push(`    <div${classNameAttr}>`);

  // Render root's non-component content + child component references
  // For semantic components, children are rendered as component tags
  for (const child of root.children) {
    lines.push(`      <${child.name} />`);
  }

  lines.push('    </div>');
  lines.push('  );');
  lines.push('}');
  lines.push('');
  lines.push(`export default ${root.name};`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Extract CSS properties from an element's subtree.
 * Collects inline styles from style attributes.
 */
function extractCssProperties($: CheerioAPI, el: Element): Record<string, string> {
  const result: Record<string, string> = {};

  // Parse this element's inline style
  const styleAttr = $(el).attr('style');
  if (styleAttr) {
    const parsed = parseInlineStyle(styleAttr);
    if (parsed) {
      Object.assign(result, parsed);
    }
  }

  // Recurse into children
  $(el).children().each((_, child) => {
    const childProps = extractCssProperties($, child as Element);
    Object.assign(result, childProps);
  });

  return result;
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
      const componentName = toPascalCase(ctx.filePath);

      if (ctx.componentTree) {
        // ── Per-component mode ──
        const $ = ctx.$;
        const flatNodes = flattenTree(ctx.componentTree);
        const components: ComponentOutput[] = [];

        // Generate code for each child component first
        for (const node of flatNodes) {
          // Skip root — generated separately
          if (node === ctx.componentTree) continue;

          // Extract CSS properties from element subtree
          const cssProperties = extractCssProperties($, node.element);

          node.cssProperties = cssProperties;

          const code = generateComponentCode(
            node,
            ctx.options.typescript,
            components,
            newCtx.warnings
          );

          components.push({ name: node.name, code, cssProperties });
        }

        // Generate root component that imports children
        const rootCssProperties = extractCssProperties($, ctx.componentTree.element);
        ctx.componentTree.cssProperties = rootCssProperties;

        const rootCode = generateRootComponent(
          $,
          ctx.componentTree,
          components,
          ctx.options.typescript,
          newCtx.warnings
        );

        components.unshift({
          name: ctx.componentTree.name,
          code: rootCode,
          cssProperties: rootCssProperties,
        });

        return { ...newCtx, components };
      } else {
        // ── Single-component mode (fallback) ──
        const code = generateComponent(ctx.$, componentName, ctx.options.typescript, newCtx.warnings);
        return { ...newCtx, code };
      }
    } catch (err: any) {
      newCtx.errors.push(`Convert error: ${err.message}`);
      return newCtx;
    }
  },
};