// Complete list of HTML void elements per HTML spec
// These cannot have children and must use self-closing syntax in JSX
const VOID_ELEMENTS: Set<string> = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

/**
 * Check if a tag name is a void element (cannot have children).
 */
export function isVoidElement(tagName: string): boolean {
  return VOID_ELEMENTS.has(tagName.toLowerCase());
}

/**
 * Convert HTML tag name to JSX output.
 * Returns the opening tag string, potentially self-closing.
 */
export function formatJsxTag(
  tagName: string,
  attributes: string,
  hasChildren: boolean
): string {
  const isVoid = isVoidElement(tagName);

  if (isVoid || !hasChildren) {
    return `<${tagName}${attributes} />`;
  }

  return `<${tagName}${attributes}>`;
}