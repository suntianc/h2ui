export interface MappedAttribute {
    name: string;
    value: string | boolean | object;
    warning?: string;
}
/**
 * Map a single HTML attribute name+value to the JSX equivalent.
 * Returns the mapped attribute and an optional warning.
 *
 * Order of precedence:
 * 1. Boolean attributes (disabled → disabled={true})
 * 2. Renamed attributes (class → className, for → htmlFor)
 * 3. Event handlers (onclick → onClick)
 * 4. Hyphenated attrs → camelCase (stroke-width → strokeWidth)
 * 5. data-* / aria-* → kept as-is
 * 6. Standard HTML attributes → pass through
 * 7. Unknown → pass through with warning
 */
export declare function mapAttribute(name: string, value: string): MappedAttribute;
/**
 * Map all attributes of an element from HTML to JSX.
 * Returns an array of mapped attribute entries and collected warnings.
 */
export declare function mapAllAttributes(attrs: Record<string, string>, warnings: string[]): Array<{
    name: string;
    value: string | boolean | object;
}>;
//# sourceMappingURL=attributes.d.ts.map