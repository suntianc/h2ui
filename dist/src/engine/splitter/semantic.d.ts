import type { CheerioAPI } from 'cheerio';
import type { Element } from 'domhandler';
/**
 * Convert a tag name + optional class to a PascalCase component name.
 * Examples:
 *   - 'header' → 'Header'
 *   - 'section' with class="features" → 'FeaturesSection'
 *   - 'nav' → 'Navigation'
 */
export declare function tagToComponentName(tag: string, classes: string[]): string;
/**
 * Check if an element is a semantic boundary tag.
 */
export declare function isSemanticTag(el: Element): boolean;
/**
 * Extract meaningful class names from an element (excludes generic wrappers).
 */
export declare function getMeaningfulClasses($: CheerioAPI, el: Element): string[];
/**
 * Check if a non-semantic div has a "distinct" class/ID pattern that warrants splitting.
 * Per D-07: heuristic detection of class/ID patterns in non-semantic divs.
 * Split if: ID present OR 2+ meaningful class tokens.
 */
export declare function hasDistinctPattern($: CheerioAPI, el: Element): boolean;
//# sourceMappingURL=semantic.d.ts.map