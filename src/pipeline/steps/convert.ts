import type { CheerioAPI } from 'cheerio';
import type { AnyNode, Element, Text } from 'domhandler';
import type { PipelineStep, PipelineContext, ComponentNode, ComponentOutput } from '../../types/pipeline.js';
import { mapAllAttributes } from '../../engine/transform/attributes.js';
import { parseInlineStyle } from '../../engine/transform/style.js';
import { isVoidElement, formatJsxTag } from '../../engine/transform/elements.js';
import { toPascalCase } from '../../util/file.js';
import { flattenTree } from '../../util/tree.js';
import { extractStylesFromElement } from '../../engine/css/extract.js';

// Vue attribute mapping sets
const VUE_EVENT_ATTRS = new Set([
  'onclick', 'oninput', 'onblur', 'onfocus', 'onchange', 'onsubmit',
  'onkeydown', 'onkeyup', 'onmouseover', 'onmouseout', 'ondblclick',
  'oncontextmenu', 'onmousedown', 'onmouseup', 'onload', 'onerror'
]);

const VUE_BOOLEAN_ATTRS = new Set(['disabled', 'checked', 'readonly', 'selected', 'multiple', 'autofocus']);

/**
 * Map HTML attributes to Vue template syntax.
 * Returns array of Vue attribute strings.
 */
function mapVueAttributes(rawAttrs: Record<string, string>, warnings: string[]): string[] {
  const attrStrings: string[] = [];

  for (const [key, value] of Object.entries(rawAttrs)) {
    if (key === 'style') {
      // Skip style attribute — CSS is extracted to <style scoped> block
      // Do NOT output inline styles in Vue templates
    } else if (VUE_EVENT_ATTRS.has(key)) {
      // onclick -> @click, oninput -> @input, etc.
      const vueEvent = '@' + key.slice(2);
      attrStrings.push(`${vueEvent}="${value}"`);
    } else if (VUE_BOOLEAN_ATTRS.has(key)) {
      // disabled, checked, readonly -> :disabled, :checked, :readonly
      attrStrings.push(`:${key}="${value}"`);
    } else if (key === 'className') {
      // Skip for Vue — use class directly
    } else if (key === 'htmlFor') {
      // Skip for Vue — use for directly
    } else if (value === undefined || value === null) {
      // Skip undefined/null values
    } else {
      attrStrings.push(`${key}="${value}"`);
    }
  }

  return attrStrings;
}

/**
 * Generate Vue template HTML string from a Cheerio AST root node.
 * Recursively processes all child nodes with Vue attribute mapping.
 */
function renderVueTemplate(
  $: CheerioAPI,
  el: AnyNode,
  warnings: string[],
  inPre: boolean = false
): string {
  if (el.type === 'text') {
    const text = (el as Text).data || '';
    if (inPre) {
      // In pre tags, escape template expressions but keep text as-is
      return text;
    }
    return text;
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

  // Process attributes with Vue mapping
  const rawAttrs = $(el).attr() || {};
  const attrStrings = mapVueAttributes(rawAttrs, warnings);

  const attrStr = attrStrings.length > 0 ? ' ' + attrStrings.join(' ') : '';

  // Check for void elements
  const voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  const isVoid = voidElements.has(tagName);

  // Get children
  const children = $(el).contents().toArray();
  const hasNonEmptyChildren = children.some(child => {
    if (child.type === 'text') {
      return !!((child as Text).data?.trim());
    }
    return child.type !== 'comment';
  });

  // Generate opening tag
  const opening = `<${tagName}${attrStr}>`;
  const closing = `</${tagName}>`;

  if (isVoid || !hasNonEmptyChildren) {
    // Self-closing void elements in Vue templates need proper handling
    // Use self-closing for void elements
    return `<${tagName}${attrStr} />`;
  }

  // Generate children content
  let childrenContent = '';
  for (const child of children) {
    childrenContent += renderVueTemplate($, child, warnings, inPre || tagName === 'pre');
  }

  return `${opening}${childrenContent}${closing}`;
}

/**
 * Generate JSX code string from a Cheerio AST root node.
 * Recursively processes all child nodes.
 */
function generateJsxFromNode(
  $: CheerioAPI,
  el: AnyNode,
  warnings: string[],
  inPre: boolean = false
): string {
  if (el.type === 'text') {
    const text = (el as Text).data || '';
    if (inPre) {
      // Escape backslashes, backticks, and template expression starters
      const escaped = text
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\${/g, '\\${');
      return `{\`${escaped}\`}`;
    }
    return text;
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
    childrenContent += generateJsxFromNode($, child, warnings, inPre || tagName === 'pre');
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

  // Import global CSS if any style tags exist
  const styleTagsCount = $('style').length;
  for (let i = 0; i < styleTagsCount; i++) {
    const name = i === 0 ? 'global' : `global-${i + 1}`;
    lines.push(`import './${name}.css';`);
  }
  if (styleTagsCount > 0) {
    lines.push('');
  }

  if (isTypescript) {
    lines.push('interface Props {}');
    lines.push('');
  }

  lines.push(`function ${componentName}(props${isTypescript ? ': Props' : ''}) {`);
  lines.push('  return (');
  lines.push(innerContent);
  lines.push('  );');
  lines.push('}');
  lines.push('');
  lines.push(`export default ${componentName};`);
  lines.push('');

  return lines.join('\n');
}

// ── Phase 2: Per-component generation ──

/**
 * Generate code for a single child component.
 * Each component gets its own file with imports for children + CSS Module.
 */
function generateComponentCode(
  $: CheerioAPI,
  node: ComponentNode,
  isTypescript: boolean,
  allComponents: ComponentOutput[],
  warnings: string[]
): string {
  const lines: string[] = [];
  lines.push('import React from \'react\';');
  lines.push('');

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
  const jsxContent = generateJsxFromNode($, node.element, warnings);

  // Use the actual rendered JSX content
  const innerContent = jsxContent;

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
  lines.push('import React from \'react\';');

  // Import global CSS if any style tags exist
  const styleTagsCount = $('style').length;
  for (let i = 0; i < styleTagsCount; i++) {
    const name = i === 0 ? 'global' : `global-${i + 1}`;
    lines.push(`import './${name}.css';`);
  }

  lines.push('');

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
  const rootEl = root.element;
  const rootChildren = $(rootEl).contents().toArray();
  for (const child of rootChildren) {
    if (child.type === 'text') {
      const text = (child as Text).data?.trim();
      if (text) {
        lines.push(`      ${text}`);
      }
    } else if (child.type === 'tag') {
      const tagName = (child as Element).tagName.toLowerCase();
      // Only render if NOT a child component
      const isChildComponent = root.children.some(c => c.name.toLowerCase() === tagName);
      if (!isChildComponent) {
        const content = generateJsxFromNode($, child, warnings);
        if (content) {
          lines.push(`      ${content}`);
        }
      }
    }
  }

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
function extractCssProperties($: CheerioAPI, el: Element, warnings: string[]): Record<string, string> {
  // Use extractStylesFromElement which recursively traverses all descendants
  return extractStylesFromElement($, el, warnings);
}

// Named exports for Vue rendering
export { renderVueTemplate, mapVueAttributes };

export const convertStep: PipelineStep = {
  name: 'convert',

  async run(ctx: PipelineContext): Promise<PipelineContext> {
    const newCtx = { ...ctx, warnings: [...ctx.warnings], errors: [...ctx.errors] };

    if (!ctx.$) {
      newCtx.errors.push('Cannot convert: no parsed AST available');
      return newCtx;
    }

    const isVue = ctx.options.framework === 'vue3';

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
          const cssProperties = extractCssProperties($, node.element, newCtx.warnings);
          node.cssProperties = cssProperties;

          // Remove style attribute after extraction so it's not output in template
          if (isVue) {
            $(node.element).removeAttr('style');
          }

          if (isVue) {
            // Vue mode: generate template HTML using renderVueTemplate
            const vueTemplate = renderVueTemplate($, node.element, newCtx.warnings);
            components.push({ name: node.name, code: '', cssProperties, vueTemplate });
          } else {
            // React mode: generate TSX component code
            const code = generateComponentCode(
              $,
              node,
              ctx.options.typescript,
              components,
              newCtx.warnings
            );
            components.push({ name: node.name, code, cssProperties });
          }
        }

        // Generate root component that imports children
        const rootCssProperties = extractCssProperties($, ctx.componentTree.element, newCtx.warnings);
        ctx.componentTree.cssProperties = rootCssProperties;

        // Remove style attribute after extraction so it's not output in template
        if (isVue) {
          $(ctx.componentTree.element).removeAttr('style');
        }

        if (isVue) {
          // Vue mode: generate root Vue template
          const vueTemplate = renderVueTemplate($, ctx.componentTree.element, newCtx.warnings);
          components.unshift({
            name: ctx.componentTree.name,
            code: '',
            cssProperties: rootCssProperties,
            vueTemplate,
          });
        } else {
          // React mode: generate root TSX component
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
        }

        return { ...newCtx, components };
      } else {
        // ── Single-component mode (fallback) ──
        if (isVue) {
          // Vue single-component mode
          const vueTemplate = renderVueTemplate(ctx.$, ctx.$.root()[0], newCtx.warnings);
          return { ...newCtx, code: vueTemplate, vueTemplate };
        } else {
          // React single-component mode
          const code = generateComponent(ctx.$, componentName, ctx.options.typescript, newCtx.warnings);
          return { ...newCtx, code };
        }
      }
    } catch (err: any) {
      newCtx.errors.push(`Convert error: ${err.message}`);
      return newCtx;
    }
  },
};
