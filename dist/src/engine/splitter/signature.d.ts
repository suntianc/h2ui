import type { CheerioAPI } from 'cheerio';
import type { Element } from 'domhandler';
interface SignatureConfig {
    maxDepth: number;
    minRepeat: number;
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
export declare function findRepeatedPatterns($: CheerioAPI, root: Element, config: SignatureConfig | undefined, warnings: string[]): DetectedPattern[];
export {};
//# sourceMappingURL=signature.d.ts.map