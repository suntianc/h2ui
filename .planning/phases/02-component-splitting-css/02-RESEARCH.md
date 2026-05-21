# Phase 2: Component Splitting + CSS Extraction - Research

**Researched:** 2026-05-21
**Confidence:** HIGH

## 1. Semantic Tag Detection with Cheerio

### Pattern: Walk Cheerio root, find semantic boundary tags

Cheerio provides `$('body').children()` to get direct children of `<body>`. We traverse recursively to build component tree.

**Key Cheerio methods:**
- `$(el).children()` — direct children only
- `$(el).contents().toArray()` — all children including text (for full AST traversal)
- `$(el).prop('tagName')` — get tag name
- `$(el).attr()` — get attributes
- `element.type === 'text'` / `'tag'` / `'comment'` — domhandler node types
- `$(el).find(selector)` — deep search within subtree

**Semantic boundary tags (React component boundaries):**
```typescript
const SEMANTIC_TAGS = new Set([
  'header', 'nav', 'main', 'section', 'article', 'footer',
]);
```

**Detection algorithm:**
1. Walk top-level children of `<body>`
2. If child is semantic tag → create component node, recurse into children for nested semantics
3. If child is NOT semantic → merge into parent component (with depth limit of 1)
4. Assign PascalCase names from tag: `header` → `Header`, `nav` → `Navigation`, `section.features` → `FeaturesSection`

### Anti-pattern: Using `$('header, nav, main, ...').each()`
This loses parent-child nesting context. Must use recursive walk from root.

---

## 2. Structure-Signature Matching for Repeated Components

### Core Algorithm: Subtree Serialization + Hash Map

This is a known algorithm pattern (LeetCode 652 "Find Duplicate Subtrees"). Adapted for DOM trees:

```typescript
interface SignatureContext {
  depth: number;
  maxDepth: number;  // Default: 3
}

function computeSignature(
  $: CheerioAPI,
  el: Element,
  ctx: SignatureContext
): string {
  if (ctx.depth > ctx.maxDepth) return '';

  const tag = el.tagName.toLowerCase();
  const classes = ($(el).attr('class') || '').split(/\s+/).filter(Boolean);
  const classStr = classes.sort().join('.');  // Sort for canonical form
  const prefix = `${tag}[${classStr}]<`;
  
  const children = $(el).contents().toArray()
    .filter((c): c is Element => c.type === 'tag')
    .slice(0, 10);  // Limit breadth too

  const childSigs = children
    .map(child => computeSignature($, child, {
      depth: ctx.depth + 1,
      maxDepth: ctx.maxDepth,
    }))
    .filter(Boolean)
    .join(',');

  return `${prefix}${childSigs}>`;
}
```

**Duplicate detection:**
```
1. For each element matching candidate pattern (div, li, article, section):
   a. Compute subtree signature
   b. Skip if depth < 2 (too shallow to be meaningful pattern)
   c. Add to Map<signature, Element[]>
2. Filter map entries where Element[].length >= MIN_REPEAT (default: 2)
3. Sort by element count descending (most repeated first)
4. Assign component names from class or index: "Card", "FeatureCard", "ListItem"
```

### Performance considerations
- Computational complexity: O(N * D) where N = elements, D = depth limit
- With max depth of 3, this is ~O(N) in practice for most HTML
- Cache signatures for visited nodes to avoid recomputation

### Edge cases
- Empty signatures for deep nodes: return empty string, filter in parent
- Class-only different: `.card` vs `.card highlight` — same base class → same signature
- Text-only children: `<h3>Title</h3>` different from `<h3>Other</h3>` — ignore text content

---

## 3. CSS Processing Pipeline with css-tree

### Installation
```
npm install css-tree
```

### Core API Usage

**Parse inline style string → AST → validate/manipulate → generate CSS string:**

```typescript
import { parse, generate, walk } from 'css-tree';

// Parse the style string as a declaration list
// Perfect for HTML inline `style="color: red; font-size: 16px"` attribute values
const ast = parse('color: red; font-size: 16px', {
  context: 'declarationList',  // ← KEY: parses semicolon-separated declarations
  positions: false,
});

// Walk the AST to inspect/filter declarations
const declarations: { property: string; value: string }[] = [];
walk(ast, (node) => {
  if (node.type === 'Declaration') {
    declarations.push({
      property: node.property,
      value: generate(node.value),  // Re-generate value string from value AST
    });
  }
});

// Generate CSS string from AST
const css = generate(ast);  // → "color: red; font-size: 16px"
```

**Key contexts for our use case:**

| Context | Use | Example Input |
|---------|-----|------|
| `'declarationList'` | Parse inline `style=""` values | `"color: red; margin: 10px"` |
| `'stylesheet'` | Parse full `<style>` block content | `.card { color: red; }` |

### CSS Property Classification

```typescript
const CSS_INHERITABLE = new Set([
  'color', 'font', 'font-family', 'font-size', 'font-style',
  'font-weight', 'font-variant', 'line-height', 'letter-spacing',
  'text-align', 'text-indent', 'text-transform', 'white-space',
  'word-spacing', 'visibility', 'cursor',
]);

const CSS_SHORTHAND_PROPS = new Set([
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-width', 'border-style', 'border-color',
  'background', 'font',
]);

const CSS_NON_INHERITABLE = new Set([
  // Layout
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'display', 'position', 'top', 'right', 'bottom', 'left',
  'overflow', 'overflow-x', 'overflow-y', 'float', 'clear',
  // Flex/Grid
  'flex', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis',
  'justify-content', 'align-items', 'align-content', 'align-self', 'gap',
  'grid', 'grid-template', 'grid-column', 'grid-row', 'grid-area',
  // Box model
  'padding', 'margin', 'border', 'border-radius', 'border-collapse',
  'background', 'background-color', 'background-image', 'background-repeat',
  'box-shadow', 'box-sizing',
  // Visual
  'opacity', 'transform', 'transition', 'animation',
  'z-index', 'clip', 'clip-path',
  // Text decoration (not inherited)
  'text-decoration', 'text-shadow',
]);
```

### CSS Module Generation Pattern

```typescript
function generateCSSModule(
  componentName: string,
  cssProps: Record<string, string>
): string {
  const className = componentName[0].toLowerCase() + componentName.slice(1);
  const css = Object.entries(cssProps)
    .map(([prop, val]) => `  ${prop}: ${val};`)
    .join('\n');

  return `.${className} {\n${css}\n}\n`;
}

// Component that USES the CSS Module
function generateComponentImport(componentName: string): string {
  return `import styles from './${componentName}.module.css';\n`;
}

// Usage in JSX
function generateClassNameUsage(componentName: string): string {
  const className = componentName[0].toLowerCase() + componentName.slice(1);
  return `className={styles.${className}}`;
}
```

---

## 4. CSS Shorthand Condensation

### Pattern: Detect related longhands and merge into shorthand

```typescript
function condensePadding(props: Record<string, string>): Record<string, string> {
  const top = props['padding-top'];
  const right = props['padding-right'];
  const bottom = props['padding-bottom'];
  const left = props['padding-left'];

  if (!top && !right && !bottom && !left) return props;

  const result = { ...props };
  delete result['padding-top'];
  delete result['padding-right'];
  delete result['padding-bottom'];
  delete result['padding-left'];

  if (top === right && right === bottom && bottom === left) {
    result.padding = top;
  } else if (top === bottom && right === left) {
    result.padding = `${top} ${right}`;
  } else if (right === left) {
    result.padding = `${top} ${right} ${bottom}`;
  } else {
    result.padding = `${top} ${right} ${bottom} ${left}`;
  }

  return result;
}
```

Same pattern for `margin` and `border`.

---

## 5. Shared CSS Deduplication

### Pattern: Collect all component CSS → detect duplicates → extract to shared

```typescript
interface StyleDeclaration {
  property: string;
  value: string;
}

interface ComponentStyles {
  name: string;
  declarations: StyleDeclaration[];
}

function extractSharedStyles(
  components: ComponentStyles[]
): { shared: ComponentStyles; components: ComponentStyles[] } {
  // Count how many components use each (property, value) pair
  const declarationFrequency = new Map<string, Set<string>>();
  // key = `${property}:${value}`
  // value = Set<componentName>

  for (const comp of components) {
    for (const decl of comp.declarations) {
      const key = `${decl.property}:${decl.value}`;
      if (!declarationFrequency.has(key)) {
        declarationFrequency.set(key, new Set());
      }
      declarationFrequency.get(key)!.add(comp.name);
    }
  }

  // Declarations used by 2+ components → shared
  const sharedDeclarations: StyleDeclaration[] = [];
  const sharedKeys = new Set<string>();

  for (const [key, components] of declarationFrequency) {
    if (components.size >= 2) {
      const [property, ...valueParts] = key.split(':');
      sharedDeclarations.push({
        property,
        value: valueParts.join(':'),
      });
      sharedKeys.add(key);
    }
  }

  // Remove shared declarations from individual components
  const updatedComponents = components.map(comp => ({
    ...comp,
    declarations: comp.declarations.filter(
      d => !sharedKeys.has(`${d.property}:${d.value}`)
    ),
  }));

  return {
    shared: { name: 'shared', declarations: sharedDeclarations },
    components: updatedComponents,
  };
}
```

### When to skip deduplication
- If shared CSS has only 1-2 declarations, not worth extracting
- Threshold: at least 3 shared declarations to create `shared.module.css`

---

## 6. Component Tree Display (Console)

### Pattern: Recursive tree render with Unicode box-drawing chars

```typescript
function renderComponentTree(
  node: ComponentNode,
  prefix: string = '',
  isLast: boolean = true,
  isRoot: boolean = true
): string {
  if (isRoot) {
    let result = `📦 ${node.name}\n`;
    node.children.forEach((child, idx) => {
      const last = idx === node.children.length - 1;
      result += renderComponentTree(child, '', last, false);
    });
    return result;
  }

  const connector = isLast ? '└── ' : '├── ';
  const childPrefix = isLast ? '    ' : '│   ';
  let label = node.name;
  if (node.isRepeated) {
    label += `  ← reused ${node.repeatCount}x`;
  }
  
  let result = `${prefix}${connector}${label}\n`;
  node.children.forEach((child, idx) => {
    const last = idx === node.children.length - 1;
    result += renderComponentTree(child, `${prefix}${childPrefix}`, last, false);
  });
  return result;
}

// Output format:
// 📦 App
// ├── Header
// ├── Navigation
// ├── Main
// │   ├── HeroSection
// │   ├── Features
// │   │   ├── FeatureCard  ← reused 3x
// │   │   ├── FeatureCard  ← reused 3x
// │   │   └── FeatureCard  ← reused 3x
// │   └── Footer
// └── Sidebar
```

---

## 7. Pipeline Integration Pattern

### New Pipeline Steps

```typescript
// Step 2: Split (inserted after parse)
const splitStep: PipelineStep = {
  name: 'split',
  async run(ctx: PipelineContext): Promise<PipelineContext> {
    const $ = ctx.$!;
    const splitResult = splitIntoComponents($, ctx.filePath, ctx.warnings);
    const duplicatePatterns = findRepeatedPatterns($, ctx.warnings);
    return { ...ctx, componentTree: splitResult, repeatedPatterns: duplicatePatterns };
  },
};

// Step 4: CSS (inserted after convert)
const cssStep: PipelineStep = {
  name: 'css',
  async run(ctx: PipelineContext): Promise<PipelineContext> {
    // ctx.components should contain per-component JSX code
    // Extract style attributes, generate CSS Modules
    const cssFiles = extractCSS(ctx.components!, ctx.options, ctx.warnings);
    return { ...ctx, cssFiles };
  },
};
```

### Modified PipelineContext

```typescript
interface PipelineContext {
  // Existing fields
  html: string;
  filePath: string;
  $?: CheerioAPI;
  code?: string;          // Will be removed or repurposed
  outputPath?: string;
  warnings: string[];
  errors: string[];
  options: ConvertOptions;

  // New Phase 2 fields
  componentTree?: ComponentNode;           // Root of component tree
  repeatedPatterns?: Map<string, Element[]>; // Detected duplicate patterns
  components?: ComponentOutput[];          // Per-component JSX code
  cssFiles?: CSSFile[];                    // Generated CSS files
}

interface ComponentOutput {
  name: string;
  code: string;       // Full component JSX code
  css: Record<string, string>;  // CSS properties for this component
}

interface CSSFile {
  name: string;       // 'shared' | component name
  css: string;        // Generated CSS string
}
```

### CLI Integration

In `src/cli/commands/convert.ts`, add new steps to pipeline:

```typescript
const { splitStep } = await import('../../engine/splitter/index.js');
const { cssStep } = await import('../../engine/css/index.js');

pipeline.insertStep(1, splitStep);  // After parse, before convert
pipeline.addStep(cssStep);          // After convert, before generate
```

The `generateStep` must be modified to write multiple files instead of one.

---

## 8. Existing Code to Leverage

### `src/engine/transform/style.ts`
- `parseInlineStyle(cssString)` already converts inline style → `{ camelProp: value }` object
- Can be reused directly as input to CSS extraction

### `src/pipeline/steps/convert.ts`
- `generateJsxFromNode()` — recursively converts Cheerio element → JSX string
- Needs refactoring: currently generates single component; needs to work per-component-node

### `src/pipeline/steps/generate.ts`
- `writeFile()` — single file write
- Needs refactoring: write N .tsx files + M .module.css files

---

## 9. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large HTML files with hundreds of elements | Slow signature computation | Depth/breadth limits; skip text nodes |
| `<style>` tag parsing edge cases | CSS extraction errors | css-tree handles tolerant parsing |
| Nested semantic tags (header inside section) | Component hierarchy confusion | Depth-first recursive, parent wins if ambiguity |
| Non-standard CSS values in inline style | css-tree parse errors | css-tree tolerant mode; fallback to raw string |
| No explicit component names for sections | Poor naming | Add TODO markers; LLM pass in Phase 4 |

---

## Sources

- [Cheerio Traversing Docs](https://cheerio.js.org/docs/basics/traversing/) - DOM navigation methods
- [css-tree GitHub](https://github.com/csstree/csstree) - Parser, walker, generator, lexer
- [css-tree Parsing Docs](https://github.com/csstree/csstree/blob/master/docs/parsing.md) - API reference with context options
- [LeetCode 652 - Find Duplicate Subtrees](https://leetcode.com/problems/find-duplicate-subtrees/) - Subtree serialization pattern
- [Neetcode - Find Duplicate Subtrees](https://neetcode.io/solutions/find-duplicate-subtrees) - DFS serialization approach

---
*Research for: Phase 2 - Component Splitting + CSS Extraction*
*Researched: 2026-05-21*