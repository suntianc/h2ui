# Architecture Research

**Domain:** HTML-to-React Component Conversion CLI Tool
**Researched:** 2026-05-21
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI Layer                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ commander │  │  chalk   │  │   ora    │  │  config  │    │
│  └─────┬────┘  └──────────┘  └──────────┘  └──────────┘    │
│        │                                                     │
├────────┴───────────────────────────────────────────────────┤
│                  Pipeline Layer                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │              Conversion Pipeline                    │      │
│  │  INPUT → Parse → Split → Transform → Generate      │      │
│  └──────────────────────────────────────────────────┘       │
│        │                                                     │
├────────┴───────────────────────────────────────────────────┤
│                  Engine Layer                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Parser  │  │  Splitter│  │Transform │  │Generator │    │
│  │  Engine  │  │  Engine  │  │Engine    │  │Engine    │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│  ┌──────────┐  ┌──────────┐                                  │
│  │   CSS    │  │  LLM     │                                  │
│  │  Engine  │  │ Provider │                                  │
│  └──────────┘  └──────────┘                                  │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
| --------- | -------------- | ---------------------- |
| CLI Layer | Parse args, show output, orchestrate | commander + chalk |
| Pipeline | Orchestrate conversion steps | Sequential pipeline with error handling |
| Parser Engine | Parse HTML to AST | Cheerio |
| Splitter Engine | Detect component boundaries, build component tree | Custom semantic analysis on Cheerio AST |
| Transform Engine | Convert HTML attributes to JSX, extract styles | Rule-based attribute mapping |
| CSS Engine | Extract/transform CSS to CSS Modules | css-tree |
| LLM Provider | Interface for optional LLM enhancement | OpenRouter/OpenAI SDK |
| Generator Engine | Output component files (TSX/JSX + CSS) | Template-based code generation |

## Recommended Project Structure

```
h2ui/
├── src/
│   ├── cli/              # CLI interfaces
│   │   ├── index.ts       # Commander setup, arg parsing
│   │   ├── commands/      # CLI commands
│   │   │   ├── convert.ts  # `h2ui <file>` command
│   │   │   └── init.ts     # `h2ui init` config generator
│   │   └── output.ts      # Terminal output formatting
│   ├── pipeline/          # Conversion orchestration
│   │   ├── index.ts       # Pipeline runner
│   │   ├── pipeline.ts    # Pipeline step definitions
│   │   └── steps/         # Individual pipeline steps
│   │       ├── parse.ts
│   │       ├── split.ts
│   │       ├── transform.ts
│   │       ├── css.ts
│   │       ├── llm.ts
│   │       └── generate.ts
│   ├── engine/            # Core conversion engines
│   │   ├── parser/        # HTML parsing
│   │   │   ├── index.ts   # Cheerio wrapper
│   │   │   └── types.ts
│   │   ├── splitter/      # Component boundary detection
│   │   │   ├── index.ts
│   │   │   ├── semantic.ts   # Semantic tag detection
│   │   │   └── nesting.ts    # Nesting depth analysis
│   │   ├── transform/     # HTML→JSX transformation
│   │   │   ├── index.ts
│   │   │   ├── attributes.ts # class→className, etc.
│   │   │   ├── style.ts      # style attr → React style object
│   │   │   └── children.ts   # children handling
│   │   ├── css/           # CSS processing
│   │   │   ├── index.ts
│   │   │   ├── extract.ts    # Extract inline styles
│   │   │   ├── module.ts     # Generate CSS Modules
│   │   │   └── optimize.ts   # CSS optimization
│   │   ├── llm/           # LLM integration
│   │   │   ├── index.ts
│   │   │   ├── provider.ts   # Provider abstraction
│   │   │   ├── prompts.ts    # LLM prompts
│   │   │   └── naming.ts     # Component naming
│   │   └── generator/     # Code generation
│   │       ├── index.ts
│   │       ├── tsx.ts        # TSX generation
│   │       ├── jsx.ts        # JSX generation
│   │       ├── css-module.ts # CSS Module generation
│   │       └── template.ts   # Component templates
│   ├── config/            # Configuration
│   │   ├── index.ts
│   │   ├── schema.ts      # Config validation
│   │   └── defaults.ts    # Default settings
│   ├── types/             # TypeScript types
│   │   ├── component.ts   # Component tree types
│   │   ├── config.ts      # Config types
│   │   └── pipeline.ts    # Pipeline types
│   └── util/              # Utilities
│       ├── file.ts        # File I/O
│       ├── path.ts        # Path resolution
│       └── logger.ts      # Logging
├── test/
│   ├── fixtures/          # Test HTML files
│   ├── engine/
│   └── pipeline/
├── bin/
│   └── h2ui               # Package entry point
└── package.json
```

### Structure Rationale

- **`cli/`:** Separates CLI concerns from core logic — easy to add new commands
- **`pipeline/`:** Explicit step-based pipeline makes the conversion flow clear and debuggable
- **`engine/`:** Each engine is independently testable; engines follow single responsibility
- **`config/`:** Centralized config handling for both CLI flags and config file
- **`test/fixtures/`:** Real HTML files for integration testing

## Architectural Patterns

### Pattern 1: Pipeline Architecture

**What:** Sequential steps where each step receives the previous step's output, transforms it, and passes it forward. Steps can be conditionally included/excluded.

**When to use:** Multi-stage conversion pipelines with clear input/output at each stage.

**Trade-offs:**
- Pro: Clear data flow, easy to add/remove/reorder steps
- Pro: Each step is independently testable
- Con: Can't easily skip ahead (sequential by nature)
- Con: Intermediate state must be passed through

**Example:**
```typescript
interface PipelineContext {
  html: string;
  ast: Cheerio;
  components: ComponentNode[];
  cssFiles: CSSFile[];
  outputFiles: OutputFile[];
}

const pipeline = [
  parseStep,
  splitStep,
  transformStep,
  cssStep,
  llmStep,  // optional
  generateStep,
];

const result = await runPipeline(pipeline, { html: input });
```

### Pattern 2: Visitor Pattern for AST Transformation

**What:** Walk the parsed AST and apply transformation rules to each node.

**When to use:** When you need to apply consistent transformations across all nodes (e.g., converting HTML attributes to JSX).

**Trade-offs:**
- Pro: Each transformation is isolated and composable
- Pro: Easy to add new attribute conversions
- Con: Single large visitor can be hard to read

**Example:**
```typescript
const visitors = [
  convertClassName,
  convertStyleAttribute,
  convertHtmlAttributes,
  convertEvents,
  convertChildren,
];

function transformNode(node: CheerioElement): JSXNode {
  const jsxNode = { ...node };
  visitors.forEach(visitor => visitor(jsxNode));
  return jsxNode;
}
```

### Pattern 3: Provider Abstraction for LLM

**What:** Abstract LLM provider behind a common interface so users can bring any provider.

**When to use:** When the tool should work with multiple LLM backends.

**Trade-offs:**
- Pro: Future-proof, users not locked to one provider
- Pro: Easy to add new providers
- Con: Need to abstract different API shapes
- Con: Some features may not work with all providers

**Example:**
```typescript
interface LLMProvider {
  name: string;
  complete(prompt: string, options?: LLMOptions): Promise<string>;
}

class OpenAIProvider implements LLMProvider { ... }
class AnthropicProvider implements LLMProvider { ... }
class OllamaProvider implements LLMProvider { ... }
```

## Data Flow

### Conversion Flow

```
[Input HTML]
    ↓
[Step 1: Parse]  ──  Cheerio.load(html)
    ↓ AST
[Step 2: Split]  ──  Detect semantic boundaries → Component Tree
    ↓ ComponentNodes[]
[Step 3: Transform]  ──  HTML attributes → JSX attributes
    ↓ TransformedNodes[]
[Step 4: CSS Engine]  ──  Extract styles → CSS Modules
    ↓ CSSFiles[]
[Step 5: LLM] (optional)  ──  Name components, optimize
    ↓ EnhancedNodes[]
[Step 6: Generate]  ──  Write TSX/JSX + CSS files
    ↓
[Output Files]
```

### State Management

No runtime state management needed — this is a file-conversion tool.

Pipeline state is passed via `PipelineContext` object through each step.

## Scaling Considerations

| Scale | Architecture Adjustments |
| ----- | ------------------------ |
| 0-1 HTML files | Single-threaded sequential pipeline is fine |
| 1-100 HTML files | Batch processing with Promise.all for parallel file output |
| 100+ HTML files | Worker pool for parallel conversion, streaming output |

### Scaling Priorities

1. **First bottleneck:** Large HTML files with many nodes — optimize Cheerio traversal
2. **Second bottleneck:** LLM API calls — rate limiting, batch requests

## Anti-Patterns

### Anti-Pattern 1: Regex HTML Parsing

**What people do:** Use regex to extract HTML nodes/attributes.
**Why it's wrong:** HTML is not a regular language; edge cases with nested quotes, self-closing tags, etc.
**Do this instead:** Use a proper HTML parser (Cheerio, parse5, jsdom).

### Anti-Pattern 2: Class→className Only

**What people do:** Only convert `class` to `className` and call it done.
**Why it's wrong:** Misses `for`→`htmlFor`, `tabindex`→`tabIndex`, inline `style` attribute, SVG attributes.
**Do this instead:** Comprehensive attribute mapping covering all React-specific attribute differences.

### Anti-Pattern 3: Generating One Giant Component

**What people do:** Convert the entire HTML page into a single massive React component.
**Why it's wrong:** Unmaintainable, no reusability, defeats the purpose of React components.
**Do this instead:** Split into a component tree based on semantic HTML structure.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
| ------- | ------------------ | ----- |
| OpenAI API | REST SDK (optional) | User configures API key; for LLM naming pass |
| Anthropic API | REST SDK (optional) | Same pattern as OpenAI |
| Ollama | Local HTTP API (optional) | No API key needed; for local LLM |

### Internal Boundaries

| Boundary | Communication | Notes |
| -------- | ------------- | ----- |
| CLI ↔ Pipeline | Function call with config | Clean interface |
| Pipeline step → next step | PipelineContext object | Each step enriches context |
| Engine → Engine | Via PipelineContext only | No direct engine-to-engine calls |

## Sources

- [html-to-react-components architecture](https://github.com/roman01la/html-to-react-components/tree/master/lib) - JSdom + Babel based
- [Magic Patterns CSS extraction approach](https://www.magicpatterns.com/blog/any-website-to-react-component) - getComputedStyle optimization
- [Anima hybrid generation](https://www.animaapp.com/blog/product-updates/enhancing-reactjs-code-generation-with-llms/) - Rule-based + LLM two-pass

---
*Architecture research for: h2ui (HTML-to-React CLI)*
*Researched: 2026-05-21*