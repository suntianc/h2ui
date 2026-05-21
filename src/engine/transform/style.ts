const VENDOR_PREFIX_MAP: Record<string, string> = {
  '-webkit-': 'Webkit',
  '-moz-': 'Moz',
  '-ms-': 'ms',
  '-o-': 'O',
};

function hyphenToCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

function vendorPrefixToCamelCase(prop: string): string {
  for (const [prefix, replacement] of Object.entries(VENDOR_PREFIX_MAP)) {
    if (prop.startsWith(prefix)) {
      const rest = prop.slice(prefix.length);
      // Capitalize first letter of rest for proper camelCase
      const capitalized = rest.charAt(0).toUpperCase() + rest.slice(1);
      return replacement + hyphenToCamelCase(capitalized);
    }
  }
  return hyphenToCamelCase(prop);
}

/**
 * Parse a CSS style string into a React-compatible style object.
 * Example: "color: red; font-size: 16px" → { color: 'red', fontSize: '16px' }
 */
export function parseInlineStyle(cssString: string): Record<string, string> | undefined {
  if (!cssString || !cssString.trim()) {
    return {};
  }

  const result: Record<string, string> = {};

  // Split by semicolons, handle edge cases like values containing colons
  const rules = cssString.split(';');

  for (const rule of rules) {
    const trimmed = rule.trim();
    if (!trimmed) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const prop = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim();

    if (!prop || !value) continue;

    const camelProp = vendorPrefixToCamelCase(prop);
    result[camelProp] = value;
  }

  return Object.keys(result).length > 0 ? result : undefined;
}