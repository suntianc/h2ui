import type { CheerioAPI } from 'cheerio';
import type { Element } from 'domhandler';

/**
 * Semantic HTML tags that form component boundaries.
 * Each becomes a separate component.
 */
const SEMANTIC_TAGS = new Set([
  'header', 'nav', 'main', 'section', 'article', 'footer',
]);

/**
 * Tags that are container/div-equivalent — allowed to have children merged in.
 */
const CONTAINER_TAGS = new Set([
  'div', 'span', 'section', 'article',
]);

/**
 * Convert a tag name + optional class to a PascalCase component name.
 * Examples:
 *   - 'header' → 'Header'
 *   - 'section' with class="features" → 'FeaturesSection'
 *   - 'nav' → 'Navigation'
 */
export function tagToComponentName(tag: string, classes: string[]): string {
  // Check for meaningful class names
  const significantClass = classes.find(
    c => !['container', 'wrapper', 'inner', 'content'].includes(c)
  );
  if (significantClass) {
    const classPart = significantClass
      .split(/[-_]/)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join('');
    const tagPart = tag.charAt(0).toUpperCase() + tag.slice(1);
    return `${classPart}${tagPart}`;
  }

  // Named tag mapping - explicit mappings for tags whose default PascalCase would be unclear
  const TAG_NAMES: Record<string, string> = {
    header: 'Header',
    nav: 'Navigation',
    main: 'Main',
    section: 'Section',
    article: 'Article',
    footer: 'Footer',
    aside: 'Aside',
    figure: 'Figure',
    figcaption: 'Figcaption',
    time: 'Time',
    address: 'Address',
    details: 'Details',
    summary: 'Summary',
  };

  return TAG_NAMES[tag] || (tag.charAt(0).toUpperCase() + tag.slice(1));
}

/**
 * Check if an element is a semantic boundary tag.
 */
export function isSemanticTag(el: Element): boolean {
  return SEMANTIC_TAGS.has(el.tagName.toLowerCase());
}

/**
 * Extract meaningful class names from an element (excludes generic wrappers).
 */
export function getMeaningfulClasses($: CheerioAPI, el: Element): string[] {
  const classAttr = $(el).attr('class') || '';
  const EXCLUDED = new Set(['container', 'wrapper', 'inner', 'content', 'root']);
  return classAttr
    .split(/\s+/)
    .filter(Boolean)
    .filter(c => !EXCLUDED.has(c));
}

/**
 * Check if a non-semantic div has a "distinct" class/ID pattern that warrants splitting.
 * Per D-07: heuristic detection of class/ID patterns in non-semantic divs.
 * Split if: ID present OR 2+ meaningful class tokens.
 */
export function hasDistinctPattern($: CheerioAPI, el: Element): boolean {
  const id = $(el).attr('id');
  if (id && id.trim().length > 0) return true;
  const classes = getMeaningfulClasses($, el);
  return classes.length >= 2;
}

