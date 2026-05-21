/**
 * Condense shorthand CSS properties.
 * Merges padding-top, padding-right, padding-bottom, padding-left → padding.
 * Same for margin and border.
 */
/**
 * Condense CSS properties by merging longhands into shorthands.
 */
export declare function condenseProperties(props: Record<string, string>): Record<string, string>;
/**
 * Remove empty/unset/default values.
 */
export declare function cleanProperties(props: Record<string, string>): Record<string, string>;
/**
 * Check if a declaration is a duplicate (has the same property+value already seen).
 */
export declare function isDuplicateDeclaration(property: string, value: string, existing: Record<string, string>): boolean;
//# sourceMappingURL=optimize.d.ts.map