# Phase 1: Core CLI + HTML→JSX/TSX Pipeline - Research

**Researched:** 2026-05-21
**Confidence:** HIGH

## 1. Commander Subcommand Setup

### Pattern: Subcommand mode with `h2ui convert <file>`

```typescript
import { Command } from 'commander';

const program = new Command();

program
  .name('h2ui')
  .description('Convert HTML to React components')
  .version('1.0.0');

// Subcommand: h2ui convert <file>
program
  .command('convert')
  .description('Convert an HTML file to React TSX/JSX')
  .argument('<file>', 'path to HTML file')
  .option('--out <directory>', 'output directory', './h2ui_output/')
  .option('--no-typescript', 'output .jsx instead of .tsx')
  .option('--strict', 'promote all warnings to errors')
  .action(async (file: string, options: { out: string; typescript: boolean; strict: boolean }) => {
    // Convert action
  });

// Subcommand: h2ui init
program
  .command('init')
  .description('Generate a .h2uirc config scaffold')
  .action(() => {
    // Generate config
  });

// Show help if no command
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse();
```

### Key Commander API patterns

| Feature | API | Example |
|---------|-----|---------|
| Subcommand | `.command('name')` | `.command('convert')` |
| Required argument | `.argument('<name>', 'desc')` | `.argument('<file>', 'HTML file')` |
| Optional argument | `.argument('[name]', 'desc')` | `.argument('[output]', 'dir')` |
| Boolean option | `.option('--flag')` | `.option('--no-typescript')` |
| Option with value | `.option('-f, --flag <value>')` | `.option('--out <dir>')` |
| Option with default | `.option('--flag <v>', 'desc', default)` | `.option('--out <dir>', 'desc', './h2ui_output/')` |
| Version | `.version('1.0.0')` | Creates `-V`/`--version` |
| Help | `.outputHelp()` | Manual help display |

### Entry point setup

```json
// package.json
{
  "bin": {
    "h2ui": "./bin/h2ui.js"
  }
}
```

```typescript
// bin/h2ui.ts
#!/usr/bin/env node
import { cli } from '../src/cli/index';
cli(process.argv).catch(console.error);
```

## 2. Cheerio HTML Parsing

### Loading and parsing

```typescript
import * as cheerio from 'cheerio';
import fs from 'fs/promises';

async function parseHtml(filePath: string): Promise<cheerio.CheerioAPI> {
  const html = await fs.readFile(filePath, 'utf-8');
  const $ = cheerio.load(html, {
    // Lenient mode by default - best-effort parse
    _useHtmlParser2: false,
    decodeEntities: true,
    xmlMode: false,
  });
  return $;
}
```

### AST traversal patterns

| Operation | Method | Returns |
|-----------|--------|---------|
| Select by tag | `$('div')` | Cheerio selection |
| Direct children | `$('div').children()` | Cheerio selection |
| All children (incl text) | `$('div').contents()` | Cheerio selection (includes text/comment nodes) |
| First child | `$('div').children().first()` | Cheerio |
| Filter by selector | `$('li').filter('.item')` | Cheerio |
| Find descendants | `$('div').find('p')` | Cheerio |
| Get tag name | `$(el).prop('tagName')` | string |
| Get attributes | `$(el).attr('class')` | string \| undefined |
| Get all attrs | `$(el).attr()` | { [name]: string } |
| Get text content | `$(el).text()` | string |
| Check if node | `$(el).prop('tagName')` | string \| undefined |
| Iterate nodes | `$('*').each((i, el) => { ... })` | void |

### Void element detection

Cheerio does NOT natively detect void elements. The HTML spec defines these void elements:

```
area, base, br, col, embed, hr, img, input, link, meta, param, source, track, wbr
```

Implementation approach: maintain a `Set<string>` of void element tag names, check against it when generating output.

### Children detection for self-closing logic

```typescript
function hasChildren($: cheerio.CheerioAPI, el: cheerio.Element): boolean {
  return $(el).contents().length > 0;
}
```

### Error handling in parse

```typescript
interface ParseResult {
  success: boolean;
  $?: cheerio.CheerioAPI;
  warnings: string[];
  error?: string;
}

function parseHtmlSafe(filePath: string): ParseResult {
  try {
    const $ = cheerio.load(html);
    return { success: true, $, warnings: [] };
  } catch (err) {
    return { success: false, warnings: [], error: `Parse error: ${err.message}` };
  }
}
```

## 3. Custom Attribute Mapping Table

### Complete HTML→JSX attribute mapping

This is the core of Phase 1. Every HTML attribute that differs in JSX must be mapped.

#### Standard HTML attributes that change name

| HTML | JSX | Type |
|------|-----|------|
| `class` | `className` | string |
| `for` | `htmlFor` | string |
| `tabindex` | `tabIndex` | number |
| `maxlength` | `maxLength` | number |
| `minlength` | `minLength` | number |
| `readonly` | `readOnly` | boolean |
| `autofocus` | `autoFocus` | boolean |
| `autoplay` | `autoPlay` | boolean |
| `autocomplete` | `autoComplete` | string |
| `novalidate` | `noValidate` | boolean |
| `formnovalidate` | `formNoValidate` | boolean |
| `formaction` | `formAction` | string |
| `formenctype` | `formEncType` | string |
| `formmethod` | `formMethod` | string |
| `formtarget` | `formTarget` | string |
| `inputmode` | `inputMode` | string |
| `colspan` | `colSpan` | number |
| `rowspan` | `rowSpan` | number |
| `cellpadding` | `cellPadding` | string |
| `cellspacing` | `cellSpacing` | string |
| `accept-charset` | `acceptCharset` | string |
| `http-equiv` | `httpEquiv` | string |
| `contenteditable` | `contentEditable` | string |
| `contextmenu` | `contextMenu` | string |
| `controlslist` | `controlsList` | string |
| `crossorigin` | `crossOrigin` | string |
| `datetime` | `dateTime` | string |
| `enctype` | `encType` | string |
| `frameborder` | `frameBorder` | number |
| `hreflang` | `hrefLang` | string |
| `ismap` | `isMap` | boolean |
| `srcdoc` | `srcDoc` | string |
| `srclang` | `srcLang` | string |
| `srcset` | `srcSet` | string |
| `usemap` | `useMap` | string |
| `referrerpolicy` | `referrerPolicy` | string |

#### Boolean attributes (HTML present → JSX `true` or absent → `false`)

```
disabled, checked, selected, readonly, required, multiple, muted,
autoplay, controls, hidden, loop, open, reversed, scoped,
seamless, itemScope, noValidate, formNoValidate, isMap, allowFullScreen,
default, defer, async, draggable, spellCheck, contentEditable
```

Note: In HTML, boolean attributes are "present" or "absent" (value doesn't matter). In JSX, they must be `{true}` or `{false}` or omitted.

#### Event handlers (lowercase → camelCase prefix)

| HTML | JSX |
|------|-----|
| `onclick` | `onClick` |
| `ondblclick` | `onDoubleClick` |
| `onchange` | `onChange` |
| `oninput` | `onInput` |
| `onsubmit` | `onSubmit` |
| `onfocus` | `onFocus` |
| `onblur` | `onBlur` |
| `onkeydown` | `onKeyDown` |
| `onkeypress` | `onKeyPress` |
| `onkeyup` | `onKeyUp` |
| `onmousedown` | `onMouseDown` |
| `onmouseup` | `onMouseUp` |
| `onmouseover` | `onMouseOver` |
| `onmousemove` | `onMouseMove` |
| `onmouseout` | `onMouseOut` |
| `onmouseenter` | `onMouseEnter` |
| `onmouseleave` | `onMouseLeave` |
| `onload` | `onLoad` |
| `onerror` | `onError` |
| `onresize` | `onResize` |
| `onscroll` | `onScroll` |
| `ontouchstart` | `onTouchStart` |
| `ontouchend` | `onTouchEnd` |
| `ontouchmove` | `onTouchMove` |
| `ontouchcancel` | `onTouchCancel` |
| `ondrag` | `onDrag` |
| `ondragstart` | `onDragStart` |
| `ondragend` | `onDragEnd` |
| `ondragover` | `onDragOver` |
| `ondragenter` | `onDragEnter` |
| `ondragleave` | `onDragLeave` |
| `ondrop` | `onDrop` |
| `onanimationstart` | `onAnimationStart` |
| `onanimationend` | `onAnimationEnd` |
| `onanimationiteration` | `onAnimationIteration` |
| `ontransitionend` | `onTransitionEnd` |
| `onwheel` | `onWheel` |
| `oncopy` | `onCopy` |
| `oncut` | `onCut` |
| `onpaste` | `onPaste` |
| `onauxclick` | `onAuxClick` |
| `ongotpointercapture` | `onGotPointerCapture` |
| `onlostpointercapture` | `onLostPointerCapture` |
| `onpointerdown` | `onPointerDown` |
| `onpointermove` | `onPointerMove` |
| `onpointerup` | `onPointerUp` |
| `onpointercancel` | `onPointerCancel` |
| `onpointerover` | `onPointerOver` |
| `onpointerout` | `onPointerOut` |
| `onpointerenter` | `onPointerEnter` |
| `onpointerleave` | `onPointerLeave` |
| `onpointerrawupdate` | `onPointerRawUpdate` |
| `onbeforeinput` | `onBeforeInput` |
| `oncompositionend` | `onCompositionEnd` |
| `oncompositionstart` | `onCompositionStart` |
| `oncompositionupdate` | `onCompositionUpdate` |

#### SVG attributes (camelCase conversion)

All SVG attributes with hyphens need camelCase conversion. Key examples:

| SVG | JSX |
|-----|-----|
| `stroke-width` | `strokeWidth` |
| `stroke-linecap` | `strokeLinecap` |
| `stroke-linejoin` | `strokeLinejoin` |
| `stroke-miterlimit` | `strokeMiterlimit` |
| `stroke-opacity` | `strokeOpacity` |
| `fill-opacity` | `fillOpacity` |
| `fill-rule` | `fillRule` |
| `clip-path` | `clipPath` |
| `clip-rule` | `clipRule` |
| `stop-color` | `stopColor` |
| `stop-opacity` | `stopOpacity` |
| `font-family` | `fontFamily` |
| `font-size` | `fontSize` |
| `font-weight` | `fontWeight` |
| `font-style` | `fontStyle` |
| `text-anchor` | `textAnchor` |
| `text-decoration` | `textDecoration` |
| `text-rendering` | `textRendering` |
| `letter-spacing` | `letterSpacing` |
| `word-spacing` | `wordSpacing` |
| `alignment-baseline` | `alignmentBaseline` |
| `dominant-baseline` | `dominantBaseline` |
| `view-box` | `viewBox` |
| `marker-start` | `markerStart` |
| `marker-mid` | `markerMid` |
| `marker-end` | `markerEnd` |
| `marker-width` | `markerWidth` |
| `marker-height` | `markerHeight` |
| `gradient-transform` | `gradientTransform` |
| `gradient-units` | `gradientUnits` |
| `pattern-transform` | `patternTransform` |
| `pattern-units` | `patternUnits` |

Complete list of all supported SVG attributes in React: see React docs reference (DOM Elements → All Supported HTML Attributes).

#### Style attribute conversion (CSS string → React style object)

```typescript
interface StyleRule {
  property: string;    // camelCase JSX property name
  value: string;       // original value
}

function parseInlineStyle(cssString: string): Record<string, string> {
  const result: Record<string, string> = {};
  const rules = cssString.split(';').filter(r => r.trim());
  
  for (const rule of rules) {
    const colonIdx = rule.indexOf(':');
    if (colonIdx === -1) continue;
    
    const prop = rule.slice(0, colonIdx).trim();
    const value = rule.slice(colonIdx + 1).trim();
    if (!prop || !value) continue;
    
    const camelProp = hyphenToCamelCase(prop);
    result[camelProp] = value;
  }
  
  return result;
}

function hyphenToCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
```

Vendor prefix handling:
- `-webkit-` → `Webkit` (capital W, e.g., `WebkitTransition`)
- `-moz-` → `Moz` (capital M, e.g., `MozAppearance`)
- `-ms-` → `ms` (lowercase, e.g., `msTransition`)
- `-o-` → `O` (capital O, e.g., `OAnimation`)

### Mapping table file structure

```typescript
// src/engine/transform/attributes.ts

// 1. Renamed attributes (HTML name → JSX name)
const HTML_ATTRIBUTE_RENAMES: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  maxlength: 'maxLength',
  minlength: 'minLength',
  readonly: 'readOnly',
  autofocus: 'autoFocus',
  autoplay: 'autoPlay',
  autocomplete: 'autoComplete',
  // ... etc
};

// 2. Boolean attributes (check if attribute name is in this set)
const BOOLEAN_ATTRIBUTES: Set<string> = new Set([
  'disabled', 'checked', 'selected', 'readonly', 'required',
  'multiple', 'muted', 'autoplay', 'controls', 'hidden',
  'loop', 'open', 'reversed', 'scoped',
  // ... etc
]);

// 3. Event handlers (prefix pattern: on + lowercase event name)
const EVENT_PREFIX = 'on';

// 4. SVG attributes with hyphens (auto-detect: if attribute has hyphen, camelCase it)
// This handles most SVG attributes generically

// 5. Style attribute (special handling - parse CSS string to object)
```

### Strategy: visitor pattern

```typescript
function transformAttributes(
  el: cheerio.Element,
  $: cheerio.CheerioAPI
): Record<string, string | boolean | object> {
  const rawAttrs = $(el).attr() || {};
  const result: Record<string, string | boolean | object> = {};

  for (const [name, value] of Object.entries(rawAttrs)) {
    if (name === 'style') {
      result.style = parseInlineStyle(value);
      continue;
    }

    // Check renamed attributes
    if (HTML_ATTRIBUTE_RENAMES[name]) {
      result[HTML_ATTRIBUTE_RENAMES[name]] = convertValue(name, value);
      continue;
    }

    // Check boolean attributes
    if (BOOLEAN_ATTRIBUTES.has(name)) {
      result[name] = true;
      continue;
    }

    // Check event handlers
    if (name.startsWith('on')) {
      result[`on${capitalize(name.slice(2))}`] = value;
      continue;
    }

    // Check SVG hyphenated attributes
    if (name.includes('-')) {
      result[hyphenToCamelCase(name)] = value;
      continue;
    }

    // Keep data-* and aria-* as-is (lowercase)
    if (name.startsWith('data-') || name.startsWith('aria-')) {
      result[name] = value;
      continue;
    }

    // Unknown attributes: keep as-is with warning
    result[name] = value;
  }

  return result;
}
```

## 4. PipelineStep Interface Design

### PipelineStep interface

```typescript
// src/types/pipeline.ts

export interface PipelineContext {
  /** Original HTML content */
  html: string;
  /** File path of input HTML */
  filePath: string;
  /** Parsed Cheerio API */
  $?: cheerio.CheerioAPI;
  /** Converted AST nodes */
  ast?: any;
  /** Generated JSX/TSX code string */
  code?: string;
  /** Output file path */
  outputPath?: string;
  /** Warnings accumulated during conversion */
  warnings: string[];
  /** Errors that stopped the pipeline */
  errors: string[];
  /** CLI options */
  options: ConvertOptions;
}

export interface PipelineStep {
  /** Step name (e.g., 'parse', 'convert', 'generate') */
  name: string;
  /** Execute the step. Returns a new context (immutable pattern). */
  run(ctx: PipelineContext): Promise<PipelineContext> | PipelineContext;
}

export interface ConvertOptions {
  out: string;
  typescript: boolean;
  strict: boolean;
}
```

### Pipeline runner

```typescript
// src/pipeline/index.ts

export class Pipeline {
  private steps: PipelineStep[] = [];

  addStep(step: PipelineStep): void {
    this.steps.push(step);
  }

  insertStep(index: number, step: PipelineStep): void {
    this.steps.splice(index, 0, step);
  }

  removeStep(name: string): void {
    this.steps = this.steps.filter(s => s.name !== name);
  }

  async run(initialCtx: PipelineContext): Promise<PipelineContext> {
    let ctx = initialCtx;

    for (const step of this.steps) {
      try {
        ctx = await step.run(ctx);
      } catch (err) {
        ctx.errors.push(`[${step.name}] ${err.message}`);
        if (ctx.options.strict) break;
      }
    }

    return ctx;
  }
}
```

### Step implementations (Phase 1 scoped)

```typescript
// src/pipeline/steps/parse.ts
export const parseStep: PipelineStep = {
  name: 'parse',
  async run(ctx: PipelineContext): Promise<PipelineContext> {
    const html = await fs.readFile(ctx.filePath, 'utf-8');
    const $ = cheerio.load(html);
    return { ...ctx, html, $ };
  },
};

// src/pipeline/steps/convert.ts
export const convertStep: PipelineStep = {
  name: 'convert',
  run(ctx: PipelineContext): PipelineContext {
    const code = convertToJsx(ctx.$!, ctx.options);
    return { ...ctx, code };
  },
};

// src/pipeline/steps/generate.ts
export const generateStep: PipelineStep = {
  name: 'generate',
  async run(ctx: PipelineContext): Promise<PipelineContext> {
    const outputPath = await writeOutput(ctx.code!, ctx.options);
    return { ...ctx, outputPath };
  },
};
```

## 5. Self-closing Tag / Void Element Handling

### Complete list of HTML void elements

```typescript
const VOID_ELEMENTS: Set<string> = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);
```

### Generation logic

```typescript
function generateJsxTag(tagName: string, attrs: string, hasChildren: boolean): string {
  const isVoid = VOID_ELEMENTS.has(tagName.toLowerCase());
  
  if (isVoid || !hasChildren) {
    return `<${tagName}${attrs} />`;
  }
  
  return `<${tagName}${attrs}>`;
}
```

### Children detection

```typescript
function elementHasChildren($: cheerio.CheerioAPI, el: cheerio.AnyNode): boolean {
  // Check if element has any child nodes (element nodes, text nodes, or comment nodes)
  const children = $(el).contents();
  if (children.length === 0) return false;
  
  // Filter out whitespace-only text nodes
  for (const child of children.toArray()) {
    if (child.type === 'tag') return true;
    if (child.type === 'text' && child.data?.trim()) return true;
  }
  
  return false;
}
```

## 6. File Output & Naming

### PascalCase filename conversion

```typescript
import path from 'path';

function getOutputFilename(inputPath: string, isTypescript: boolean): string {
  const basename = path.basename(inputPath, path.extname(inputPath));
  const pascalName = toPascalCase(basename);
  const ext = isTypescript ? '.tsx' : '.jsx';
  return `${pascalName}${ext}`;
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_.\s]+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}
```

### File writing with Prettier

```typescript
import prettier from 'prettier';

async function formatCode(code: string, parser: 'typescript' | 'babel'): Promise<string> {
  try {
    return await prettier.format(code, {
      parser,
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
      printWidth: 100,
    });
  } catch {
    return code; // Fallback to unformatted if Prettier fails
  }
}

async function writeOutputFile(
  outputDir: string,
  filename: string,
  code: string,
  isTypescript: boolean
): Promise<string> {
  const outputPath = path.join(outputDir, filename);
  const parser = isTypescript ? 'typescript' : 'babel';
  const formatted = await formatCode(code, parser);
  
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputPath, formatted, 'utf-8');
  
  return outputPath;
}
```

### Component template

```typescript
function generateComponentTemplate(
  componentName: string,
  innerJsx: string,
  isTypescript: boolean,
  imports: string[] = []
): string {
  const lines: string[] = [
    ...imports,
    '',
    `function ${componentName}() {`,
    `  return (`,
    `    ${innerJsx}`,
    `  );`,
    `}`,
    '',
    `export default ${componentName};`,
    '',
  ];
  return lines.join('\n');
}
```

## 7. Testing Strategy

### Test structure

```
test/
├── fixtures/
│   ├── simple.html            # Basic HTML with various attributes
│   ├── svg.html               # SVG elements
│   ├── void-elements.html     # Test self-closing tags
│   ├── style-attributes.html  # Inline style tests
│   ├── empty.html             # Edge case: empty file
│   └── malformed.html         # Edge case: malformed HTML
├── engine/
│   ├── transform.test.ts      # Attribute mapping tests
│   ├── style.test.ts          # Style parsing tests
│   └── generator.test.ts      # Code generation tests
├── pipeline/
│   └── pipeline.test.ts       # Pipeline integration tests
└── cli/
    └── cli.test.ts            # CLI integration tests
```

### Test examples

```typescript
// test/engine/transform.test.ts
import { describe, it, expect } from 'vitest';
import { transformAttributes } from '../../src/engine/transform/attributes';

describe('attribute mapping', () => {
  it('converts class to className', () => {
    const result = mapAttribute('class', 'container');
    expect(result).toEqual({ name: 'className', value: 'container' });
  });

  it('converts for to htmlFor', () => {
    const result = mapAttribute('for', 'email');
    expect(result).toEqual({ name: 'htmlFor', value: 'email' });
  });

  it('converts boolean attributes', () => {
    const result = mapAttribute('disabled', '');
    expect(result).toEqual({ name: 'disabled', value: true });
  });

  it('converts hyphenated SVG attributes', () => {
    const result = mapAttribute('stroke-width', '2');
    expect(result).toEqual({ name: 'strokeWidth', value: '2' });
  });
});

describe('inline style conversion', () => {
  it('converts CSS string to React style object', () => {
    const result = parseInlineStyle('color: red; font-size: 16px');
    expect(result).toEqual({ color: 'red', fontSize: '16px' });
  });

  it('handles vendor prefixes', () => {
    const result = parseInlineStyle('-webkit-transition: all 0.3s');
    expect(result).toEqual({ WebkitTransition: 'all 0.3s' });
  });
});

describe('void elements', () => {
  it('detects void elements', () => {
    expect(isVoidElement('br')).toBe(true);
    expect(isVoidElement('div')).toBe(false);
  });
});
```

### Edge cases to test

| Test case | What it validates |
|-----------|-------------------|
| Empty HTML file | Pipeline handles gracefully |
| HTML with only comments | No content, clean output |
| Self-closing tags (`<br>`, `<hr>`) | `<br />`, `<hr />` output |
| Non-void self-closing (`<div />`) | `<div></div>` output |
| data-* attributes | Preserved as-is |
| aria-* attributes | Preserved as-is |
| Custom data attributes | Kept with warning |
| Inline style with vendor prefixes | Proper prefix capitalization |
| Very deeply nested HTML | No stack overflow |
| Unicode/emoji in HTML | Preserved in output |
| DOCTYPE declaration | Stripped (not React valid) |
| HTML comments | Stripped from output |
| SVG with many attributes | All camelCased correctly |
| Event handlers | All properly converted |
| Boolean attributes without value | All set to `true` |
| Multiple class names | Preserved as single string |
| Empty style attribute | No style object generated |

## 8. Validation Architecture

| Success Criterion | Verification Method | Command/Check |
|-|-|-|
| User can run `h2ui convert input.html --out ./components` | Integration test | `node bin/h2ui.js convert test/fixtures/simple.html --out /tmp/test-output` and check `/tmp/test-output` for `.tsx` files |
| `class` → `className` | Unit test | `npm test -- --grep "attribute mapping"` — expect `className` in output |
| `style="..."` → `style={{...}}` | Unit test + integration | Check output contains `style={{` with camelCase keys |
| `for` → `htmlFor` | Unit test | `npm test -- --grep "htmlFor"` |
| Void elements self-close | Unit test | Check output for `<br />` not `<br>` |
| SVG attributes camelCased | Unit test with SVG fixture | `npm test -- --grep "svg"` |
| `--no-typescript` generates `.jsx` | Integration test | Check output file extension is `.jsx` |
| Invalid paths show errors | Unit test on CLI | `npm test -- --grep "error handling"` |
| Pipeline architecture testable | Unit test per pipeline step | Each step has its own test file |
| Warning system works | Integration test | Warnings collected and displayed in summary |
| `--strict` promotes warnings to errors | Integration test | Parse with `--strict`, expect exit on warnings |

## 9. Risks and Mitigations

| Risk | Impact | Detection | Mitigation |
|------|--------|-----------|------------|
| Incomplete attribute mapping | Missing attribute conversions | Manual audit of React DOM differences doc | Start with comprehensive mapping, add tests for each attribute type |
| Cheerio version API changes | Parse errors | CI build failure | Pin cheerio version, use stable API surface |
| Prettier formatting failures | Unformatted output | CI test | Graceful fallback to unformatted code |
| Large HTML files (100k+ lines) | Memory issues, slow conversion | Performance test with large fixture | Stream-based parsing if needed |
| SVG namespace issues | Invalid SVG output | Manual verification with complex SVG | Test with real-world SVG examples |
| Event handler context loss | Broken event handlers | Code review | Ensure proper handler name mapping |
| Boolean attribute auto-close tag conflict | `<br />` vs `<br>` | Unit test | Void element check before boolean attribute check |

## 10. Edge Cases

### Empty HTML
```html
<!-- No content -->
```
Output: Empty component with no return value (or minimal valid JSX).

### HTML with only comments
```html
<!-- This is a comment -->
<!-- Another comment -->
```
Output: Component with empty fragment `<></>` or no content.

### Non-void elements that appear self-closing
```html
<div />
<script />
```
These are NOT void elements. Must generate `<div></div>` and `<script></script>`.

### Inline style edge cases
- `style="color: red; font-size: 16px; padding: 10px 20px"` → `{{ color: 'red', fontSize: '16px', padding: '10px 20px' }}`
- `style="background: url('image.png')"` → `{{ background: "url('image.png')" }}`
- `style=""` (empty) → no style attribute in output

### Hyphenated attributes that aren't SVG
`accept-charset`, `http-equiv` — these are standard HTML attributes that need specific mapping, not generic hyphen-to-camelCase.

### Currency/emoji in text content
Must be preserved verbatim in JSX output (React handles Unicode natively).

### DOCTYPE declaration
```html
<!DOCTYPE html>
<html>...</html>
```
Must be stripped. Not valid in JSX.

### HTML comments
```html
<!-- header section -->
<div class="header">...</div>
```
Comments should be stripped (or optionally converted to JSX comments `{/* ... */}`).

---

*Phase 1 research completed: 2026-05-21*
*Ready for planning: yes*