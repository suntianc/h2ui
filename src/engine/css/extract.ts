import type { CheerioAPI } from 'cheerio';
import type { Element } from 'domhandler';

/**
 * CSS properties that inherit by default.
 * These are NOT extracted — rely on native CSS inheritance.
 */
const INHERITABLE_PROPS = new Set([
  'color', 'font', 'font-family', 'font-size', 'font-style',
  'font-weight', 'font-variant', 'line-height', 'letter-spacing',
  'text-align', 'text-indent', 'text-transform', 'white-space',
  'word-spacing', 'visibility', 'cursor', 'direction',
  'list-style', 'orphans', 'widows',
]);

/**
 * Check if a CSS property should be excluded (inheritable).
 */
export function isInheritable(property: string): boolean {
  return INHERITABLE_PROPS.has(property);
}

/**
 * Simple CSS string parser.
 * Parses "color: red; font-size: 16px" → { "font-size": "16px" }
 * Filters out inheritable properties.
 */
function parseStyleStringSimple(styleString: string): Record<string, string> {
  const result: Record<string, string> = {};
  const rules = styleString.split(';');

  for (const rule of rules) {
    const trimmed = rule.trim();
    if (!trimmed) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const prop = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim();

    if (!prop || !value) continue;

    // Exclude inheritable properties
    if (!isInheritable(prop)) {
      result[prop] = value;
    }
  }

  return result;
}

/**
 * Extract all style properties from an element and its subtree.
 * Returns merged CSS properties for the component.
 */
export function extractStylesFromElement(
  $: CheerioAPI,
  el: Element,
  warnings: string[]
): Record<string, string> {
  const merged: Record<string, string> = {};

  // Extract from this element's style attribute
  const styleAttr = $(el).attr('style');
  if (styleAttr) {
    const styles = parseStyleStringSimple(styleAttr);
    Object.assign(merged, styles);
  }

  // Recursively extract from child elements
  $(el).contents().toArray()
    .filter((c): c is Element => c.type === 'tag')
    .forEach(child => {
      const childStyles = extractStylesFromElement($, child, warnings);
      Object.assign(merged, childStyles);
    });

  return merged;
}

/**
 * Parse a single inline style string to an object (synchronous).
 */
export function parseInlineStyleToRecord(styleString: string): Record<string, string> {
  return parseStyleStringSimple(styleString);
}