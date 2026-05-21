// HTML attribute names that map to different JSX attribute names
const HTML_TO_JSX_RENAMES: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  maxlength: 'maxLength',
  minlength: 'minLength',
  readonly: 'readOnly',
  autofocus: 'autoFocus',
  autoplay: 'autoPlay',
  autocomplete: 'autoComplete',
  novalidate: 'noValidate',
  formnovalidate: 'formNoValidate',
  formaction: 'formAction',
  formenctype: 'formEncType',
  formmethod: 'formMethod',
  formtarget: 'formTarget',
  inputmode: 'inputMode',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  cellpadding: 'cellPadding',
  cellspacing: 'cellSpacing',
  'accept-charset': 'acceptCharset',
  'http-equiv': 'httpEquiv',
  contenteditable: 'contentEditable',
  contextmenu: 'contextMenu',
  controlslist: 'controlsList',
  crossorigin: 'crossOrigin',
  datetime: 'dateTime',
  enctype: 'encType',
  frameborder: 'frameBorder',
  hreflang: 'hrefLang',
  ismap: 'isMap',
  srcdoc: 'srcDoc',
  srclang: 'srcLang',
  srcset: 'srcSet',
  usemap: 'useMap',
  referrerpolicy: 'referrerPolicy',
};

// Boolean attributes — value should be `true` in JSX if attribute is present
const BOOLEAN_ATTRIBUTES: Set<string> = new Set([
  'disabled', 'checked', 'selected', 'readonly', 'required',
  'multiple', 'muted', 'autoplay', 'controls', 'hidden',
  'loop', 'open', 'reversed', 'scoped', 'seamless',
  'itemscope', 'novalidate', 'formnovalidate', 'ismap',
  'allowfullscreen', 'default', 'defer', 'async',
]);

// Event handler prefixes — onclick → onClick, etc.
const EVENT_HANDLER_PREFIX = 'on';

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function hyphenToCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

function isEventHandler(name: string): boolean {
  return name.startsWith(EVENT_HANDLER_PREFIX) && name.length > 2;
}

export interface MappedAttribute {
  name: string;
  value: string | boolean | object;
  warning?: string;
}

/**
 * Map a single HTML attribute name+value to the JSX equivalent.
 * Returns the mapped attribute and an optional warning.
 */
export function mapAttribute(name: string, value: string): MappedAttribute {
  // Check renamed attributes (class → className, for → htmlFor, etc.)
  const renamed = HTML_TO_JSX_RENAMES[name];
  if (renamed) {
    return { name: renamed, value };
  }

  // Check boolean attributes
  if (BOOLEAN_ATTRIBUTES.has(name)) {
    return { name, value: true };
  }

  // Check event handlers (onclick → onClick)
  if (isEventHandler(name)) {
    const jsxName = `on${capitalize(name.slice(2))}`;
    return { name: jsxName, value };
  }

  // Check hyphenated attributes (for SVG: stroke-width → strokeWidth)
  if (name.includes('-') && !name.startsWith('data-') && !name.startsWith('aria-')) {
    return { name: hyphenToCamelCase(name), value };
  }

  // data-* and aria-* are kept as-is
  if (name.startsWith('data-') || name.startsWith('aria-')) {
    return { name, value };
  }

  // Unknown attributes: keep as-is with warning
  return { name, value, warning: `Unknown attribute: ${name}` };
}

/**
 * Map all attributes of an element from HTML to JSX.
 * Returns an array of mapped attribute entries and collected warnings.
 */
export function mapAllAttributes(
  attrs: Record<string, string>,
  warnings: string[]
): Array<{ name: string; value: string | boolean | object }> {
  const result: Array<{ name: string; value: string | boolean | object }> = [];

  for (const [name, value] of Object.entries(attrs)) {
    const mapped = mapAttribute(name, value);
    if (mapped.warning) {
      warnings.push(mapped.warning);
    }
    result.push({ name: mapped.name, value: mapped.value });
  }

  return result;
}