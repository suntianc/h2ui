/**
 * Condense shorthand CSS properties.
 * Merges padding-top, padding-right, padding-bottom, padding-left → padding.
 * Same for margin and border.
 */
const SHORTHAND_RULES = [
    {
        properties: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
        shorthand: 'padding',
    },
    {
        properties: ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
        shorthand: 'margin',
    },
    {
        properties: ['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'],
        shorthand: 'border-width',
    },
    {
        properties: ['border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style'],
        shorthand: 'border-style',
    },
    {
        properties: ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'],
        shorthand: 'border-color',
    },
];
/**
 * Build a single shorthand value from longhand values.
 * 1-value:  top=right=bottom=left
 * 2-value:  top=bottom, right=left
 * 3-value:  top, right=left, bottom
 * 4-value:  top, right, bottom, left
 */
function buildShorthand(top, right, bottom, left, topExplicit, bottomExplicit, rightExplicit, leftExplicit) {
    if (top === right && right === bottom && bottom === left) {
        return top;
    }
    // 2-value: top equals bottom AND right equals left
    if (top === bottom && right === left) {
        return `${top} ${right}`;
    }
    // 3-value: right equals left (but top !== bottom)
    if (right === left) {
        return `${top} ${right} ${bottom}`;
    }
    return `${top} ${right} ${bottom} ${left}`;
}
/**
 * Condense CSS properties by merging longhands into shorthands.
 */
export function condenseProperties(props) {
    const result = { ...props };
    for (const rule of SHORTHAND_RULES) {
        const [top, right, bottom, left] = rule.properties;
        const hasTop = top in result;
        const hasRight = right in result;
        const hasBottom = bottom in result;
        const hasLeft = left in result;
        if (hasTop || hasRight || hasBottom || hasLeft) {
            const topExplicit = hasTop;
            const bottomExplicit = hasBottom;
            const rightExplicit = hasRight;
            const leftExplicit = hasLeft;
            const valTop = result[top] || '';
            const valRight = result[right] || result[left] || '';
            const valBottom = result[bottom] || '';
            const valLeft = result[left] || result[right] || '';
            // Remove longhands
            for (const p of rule.properties) {
                delete result[p];
            }
            // Only set shorthand if it's more compact
            const shorthand = buildShorthand(valTop, valRight, valBottom, valLeft, topExplicit, bottomExplicit, rightExplicit, leftExplicit);
            result[rule.shorthand] = shorthand;
        }
    }
    return result;
}
/**
 * Remove empty/unset/default values.
 */
export function cleanProperties(props) {
    const result = {};
    for (const [key, value] of Object.entries(props)) {
        const trimmed = value.trim();
        // Only filter truly empty strings - preserve intentional values like 'auto', '0', 'normal'
        if (trimmed !== '') {
            result[key] = trimmed;
        }
    }
    return result;
}
/**
 * Check if a declaration is a duplicate (has the same property+value already seen).
 */
export function isDuplicateDeclaration(property, value, existing) {
    return existing[property] === value;
}
//# sourceMappingURL=optimize.js.map