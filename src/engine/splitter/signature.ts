import type { CheerioAPI } from 'cheerio';
import type { Element } from 'domhandler';

interface SignatureConfig {
  maxDepth: number;    // Default: 3
  minRepeat: number;   // Default: 2
}

const DEFAULT_CONFIG: SignatureConfig = {
  maxDepth: 3,
  minRepeat: 2,
};

/**
 * Compute a canonical structure signature for a DOM subtree.
 * Uses tag name + class order (sorted) + child structure.
 * Text content is ignored — only structure matters.
 */
function computeSignature(
  $: CheerioAPI,
  el: Element,
  depth: number,
  config: SignatureConfig
): string {
  if (depth > config.maxDepth) return '';

  const tag = el.tagName.toLowerCase();
  const classes = ($(el).attr('class') || '')
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join('.');

  const prefix = classes ? `${tag}.${classes}` : tag;

  // Get child elements (skip text and comment nodes)
  const children = $(el).contents().toArray()
    .filter((c): c is Element => c.type === 'tag');

  // Limit breadth to avoid exponential blowup
  const MAX_BREADTH = 10;
  const childSigs = children
    .slice(0, MAX_BREADTH)
    .map(child => computeSignature($, child, depth + 1, config))
    .filter(Boolean);

  if (childSigs.length === 0) return prefix;
  return `${prefix}(${childSigs.join(',')})`;
}

export interface DetectedPattern {
  signature: string;
  elements: Element[];
  count: number;
  componentName: string;
}

/**
 * Find repeated DOM patterns in the document.
 * Returns patterns sorted by occurrence count (most frequent first).
 */
export function findRepeatedPatterns(
  $: CheerioAPI,
  root: Element,
  config: SignatureConfig = DEFAULT_CONFIG,
  warnings: string[]
): DetectedPattern[] {
  const signatureMap = new Map<string, Element[]>();
  const MIN_DEPTH = 2;  // Skip root-level nodes, too shallow

  // Collect signatures for all candidate elements
  function collect(node: Element, depth: number): void {
    const tag = node.tagName.toLowerCase();

    // Only consider container-like elements
    if (['div', 'article', 'li', 'section', 'tr', 'figure'].includes(tag)) {
      const sig = computeSignature($, node, 1, config);

      if (sig && depth >= MIN_DEPTH) {
        if (!signatureMap.has(sig)) {
          signatureMap.set(sig, []);
        }
        signatureMap.get(sig)!.push(node);
      }
    }

    // Recurse into children
    $(node).contents().toArray()
      .filter((c): c is Element => c.type === 'tag')
      .forEach(child => collect(child, depth + 1));
  }

  collect(root, 0);

  // Filter and sort by frequency
  const patterns: DetectedPattern[] = [];
  for (const [signature, elements] of signatureMap) {
    if (elements.length >= config.minRepeat) {
      const firstEl = elements[0];
      const classes = ($(firstEl).attr('class') || '')
        .split(/\s+/)
        .filter(Boolean);

      // Name from class or tag
      const significantClass = classes.find(
        c => !['container', 'wrapper', 'inner', 'content'].includes(c)
      );
      const componentName = significantClass
        ? significantClass
            .split(/[-_]/)
            .map(s => s.charAt(0).toUpperCase() + s.slice(1))
            .join('')
        : firstEl.tagName.charAt(0).toUpperCase() + firstEl.tagName.slice(1);

      patterns.push({ signature, elements, count: elements.length, componentName });
    }
  }

  patterns.sort((a, b) => b.count - a.count);

  if (patterns.length > 0) {
    warnings.push(`Found ${patterns.length} repeated pattern(s): ${patterns.map(p => `${p.componentName} (${p.count}x)`).join(', ')}`);
  }

  return patterns;
}