import type { CheerioAPI } from 'cheerio';
import type { Element } from 'domhandler';
/**
 * Check if a CSS property should be excluded (inheritable).
 */
export declare function isInheritable(property: string): boolean;
/**
 * Extract all style properties from an element and its subtree.
 * Returns merged CSS properties for the component.
 */
export declare function extractStylesFromElement($: CheerioAPI, el: Element, warnings: string[]): Record<string, string>;
/**
 * Parse a single inline style string to an object (synchronous).
 */
export declare function parseInlineStyleToRecord(styleString: string): Record<string, string>;
//# sourceMappingURL=extract.d.ts.map