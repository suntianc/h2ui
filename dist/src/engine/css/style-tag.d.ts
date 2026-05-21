import type { CheerioAPI } from 'cheerio';
import type { CSSFile } from '../../types/pipeline.js';
/**
 * Extract <style> tags from HTML head/body and convert to CSS Module files.
 * Returns array of CSSFiles named after their origin (e.g. 'global').
 */
export declare function extractStyleTags($: CheerioAPI, warnings: string[]): CSSFile[];
//# sourceMappingURL=style-tag.d.ts.map