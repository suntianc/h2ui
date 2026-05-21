/**
 * Condense shorthand CSS properties.
 * Merges padding-top, padding-right, padding-bottom, padding-left → padding.
 * Same for margin and border.
 */

interface ShorthandRule {
  properties: [string, string, string, string];  // top, right, bottom, left
  shorthand: string;
}

const SHORTHAND_RULES: ShorthandRule[] = [
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
function buildShorthand(top: string, right: string, bottom: string, left: string): string {
  if (top === right && right === bottom && bottom === left) {
    return top;
  }
  if (top === bottom && right === left) {
    return `${top} ${right}`;
  }
  if (right === left) {
    return `${top} ${right} ${bottom}`;
  }
  return `${top} ${right} ${bottom} ${left}`;
}

/**
 * Condense CSS properties by merging longhands into shorthands.
 */
export function condenseProperties(props: Record<string, string>): Record<string, string> {
  const result = { ...props };

  for (const rule of SHORTHAND_RULES) {
    const [top, right, bottom, left] = rule.properties;
    const hasTop = top in result;
    const hasRight = right in result;
    const hasBottom = bottom in result;
    const hasLeft = left in result;

    if (hasTop || hasRight || hasBottom || hasLeft) {
      const valTop = result[top] || '';
      const valRight = result[right] || result[top] || '';
      const valBottom = result[bottom] || result[top] || '';
      const valLeft = result[left] || result[right] || result[top] || '';

      // Remove longhands
      for (const p of rule.properties) {
        delete result[p];
      }

      // Only set shorthand if it's more compact
      const shorthand = buildShorthand(valTop, valRight, valBottom, valLeft);
      result[rule.shorthand] = shorthand;
    }
  }

  return result;
}

/**
 * Remove empty/unset/default values.
 */
export function cleanProperties(props: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(props)) {
    const trimmed = value.trim();
    if (trimmed && trimmed !== 'initial' && trimmed !== 'inherit') {
      result[key] = trimmed;
    }
  }
  return result;
}

/**
 * Check if a declaration is a duplicate (has the same property+value already seen).
 */
export function isDuplicateDeclaration(
  property: string,
  value: string,
  existing: Record<string, string>
): boolean {
  return existing[property] === value;
}