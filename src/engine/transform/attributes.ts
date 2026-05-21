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

// Standard HTML attributes that pass through without modification or warnings
// These are attributes that are valid HTML but not in the special handling lists above
const STANDARD_ATTRIBUTES: Set<string> = new Set([
  'id', 'title', 'lang', 'dir', 'style', 'accesskey', 'role', 'type',
  'value', 'placeholder', 'min', 'max', 'step', 'pattern',
  'accept', 'size', 'rows', 'cols', 'wrap',
  'form', 'name',
  'src', 'alt', 'width', 'height', 'sizes', 'loading', 'decoding',
  'href', 'rel', 'target', 'download', 'ping',
  'charset', 'content', 'scheme',
  'integrity',
  'headers', 'scope', 'summary', 'border', 'rules', 'frame',
  'sandbox', 'allow',
  'xmlns', 'viewbox', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y',
  'd', 'points', 'fill', 'stroke', 'stroke-linecap',
  'stroke-linejoin', 'stroke-dasharray', 'stroke-opacity',
  'fill-opacity', 'fill-rule', 'opacity',
  'transform', 'clip-path', 'mask',
  // camelCase SVG attributes
  'viewbox', 'viewBox', 'clipPath', 'strokeLinecap',
  'strokeLinejoin', 'strokeDasharray', 'strokeOpacity',
  'fillOpacity', 'fillRule',
  'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'd',
  // camelCase SVG variants already handled by hyphenated check
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

function isStandardAttribute(name: string): boolean {
  if (STANDARD_ATTRIBUTES.has(name)) return true;
  if (name.startsWith('data-')) return true;
  if (name.startsWith('aria-')) return true;
  if (isEventHandler(name)) return true;
  return false;
}

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
export function mapAttribute(name: string, value: string): MappedAttribute {
  const lowerName = name.toLowerCase();

  // 1. Check boolean attributes first (some are also in renames: readonly)
  if (BOOLEAN_ATTRIBUTES.has(lowerName)) {
    const renamed = HTML_TO_JSX_RENAMES[lowerName];
    return { name: renamed || lowerName, value: true };
  }

  // 2. Check renamed attributes (class → className, for → htmlFor, etc.)
  const renamed = HTML_TO_JSX_RENAMES[name];
  if (renamed) {
    return { name: renamed, value };
  }

  // 3. Check event handlers (onclick → onClick)
  if (isEventHandler(name)) {
    const jsxName = `on${capitalize(name.slice(2))}`;
    return { name: jsxName, value };
  }

  // 4. Check hyphenated attributes (for SVG: stroke-width → strokeWidth)
  if (name.includes('-') && !name.startsWith('data-') && !name.startsWith('aria-')) {
    return { name: hyphenToCamelCase(name), value };
  }

  // 5. data-* and aria-* are kept as-is
  if (name.startsWith('data-') || name.startsWith('aria-')) {
    return { name, value };
  }

  // 6. Standard attributes are kept as-is without warning
  if (isStandardAttribute(name)) {
    return { name, value };
  }

  // 7. Unknown attributes: keep as-is with warning
  return { name, value, warning: `Unknown HTML attribute: ${name}` };
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