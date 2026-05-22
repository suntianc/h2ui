# h2ui

`h2ui` is an efficient command-line interface (CLI) tool designed to seamlessly convert high-fidelity static HTML pages into modular, highly reusable React component trees (supporting both TSX/JSX).

Built on a hybrid architecture of **"Static Rule Analysis (AST Parsing) + LLM Semantic Augmentation"**, it not only splits flat HTML into a sensible component hierarchy but also extracts and merges CSS styles, providing a hot-reloading browser preview server out-of-the-box.

Chinese Documentation: [README_zh.md](./README_zh.md)

---

## Motivation

In the workflow of **Idea (Text) ➔ Design (HTML) ➔ Development (React)**:
- High-capability models excel at generating single-file high-fidelity HTML designs from text ideas.
- However, letting generalist LLMs directly write modular production React code often fails due to token limits, fragmentation, and styling standards violations.

`h2ui` serves as the bridging compiler. It takes a single high-fidelity HTML design and compiles it deterministically into production-ready React components with clean CSS Modules, ensuring 100% rendering fidelity without the risks of pure-AI code generation.

---

## Features

- **Smart Component Splitting**: Automatically identifies semantic boundaries in your HTML (like `header`, `nav`, `main`, `footer`, and repeated list items), builds a nested component hierarchy, and writes separate React component files.
- **Zero-Config Style Extraction & Isolation**:
  - **CSS Modules**: Generates a `.module.css` for each component by default and binds `className`, providing absolute style encapsulation.
  - **Shared Style Deduplication (Shared CSS)**: Identifies identical inline style declarations across components and deduplicates them into `shared.module.css`, which is inherited via CSS Modules `composes` rule in individual components to eliminate redundancy.
  - **Global Styles Preservation**: Extracts global styles within `<style>` tags to a standard `global.css` and imports it in the root component, preventing selectors from being hashed and broken.
- **External Resource Inclusion**: Automatically parses external stylesheets, Web Fonts (e.g., Google Fonts), or icons from original HTML `<head>` link tags and restores them in the preview environment.
- **Hot-Reloading Preview Server**: A built-in dev server powered by Vite. When you modify generated component code, the browser preview reloads instantly.
- **LLM Semantic Refinements**: Uses configurable LLMs to intelligently name split components (e.g. `Header`, `FeatureCard`) and clean up redundant DOM structures or event handlers.

---

## Installation

Install globally via npm:

```bash
npm install -g h2ui-cli
```

Or run directly without installation using `npx`:

```bash
npx h2ui-cli convert <path-to-html-file>
```

For local development setup, install dependencies and build:

```bash
npm install
npm run build
```

---

## Command Line Interface (CLI) Guide

> [!NOTE]
> If installed globally or running via `npx`, use the executable command `h2ui-cli`. If you are developing locally, replace `h2ui-cli` with `node dist/bin/h2ui.js`.

### 1. Initialize Configuration Scaffold (`init`)

Generates a `.h2uirc` configuration file to define your default preferences.

```bash
h2ui-cli init [--force]
```

**Scaffold config template (`.h2uirc`)**:
```json
{
  "_comment": "h2ui configuration file. Full config options: https://github.com/suntianc/h2ui",
  "out": "./h2ui_output/",
  "typescript": true,
  "strict": false,
  "split": true,
  "cssMode": "module",
  "llm": {
    "_comment": "LLM configuration (optional, omit to disable LLM)",
    "provider": "openai",
    "model": "gpt-4o-mini",
    "mode": "auto",
    "baseURL": "https://api.openai.com/v1",
    "apiKey": "your-api-key-here"
  }
}
```

**Complete configuration with all options:**

```json
{
  "out": "./components_output/",
  "typescript": true,
  "strict": false,
  "split": true,
  "cssMode": "module",
  "llm": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "mode": "auto",
    "baseURL": "https://api.openai.com/v1",
    "apiKey": "sk-..."
  }
}
```

**Configuration options explained:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `out` | `string` | `./h2ui_output/` | Output directory for generated components |
| `typescript` | `boolean` | `true` | Generate `.tsx` files (false for `.jsx`) |
| `strict` | `boolean` | `false` | Treat all warnings as errors, halt execution |
| `split` | `boolean` | `true` | Split HTML into component tree (false = single file) |
| `cssMode` | `string` | `module` | CSS output mode: `module`, `scoped`, `inline`, `global` |
| `llm` | `object` | — | LLM configuration (omit to disable LLM features) |

**LLM Configuration:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `llm.provider` | `string` | `openai` | LLM provider: `openai`, `anthropic`, `ollama` |
| `llm.model` | `string` | `gpt-4o-mini` | Model name (provider-specific) |
| `llm.mode` | `string` | `auto` | LLM behavior: `off` (disable), `auto` (smart), `always` (force) |
| `llm.baseURL` | `string` | — | Custom API endpoint (for Ollama or OpenAI-compatible APIs) |
| `llm.apiKey` | `string` | — | API key (or set via `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` env) |

**Provider-specific models:**

| Provider | Default Model | Other Options |
|----------|---------------|---------------|
| `openai` | `gpt-4o-mini` | `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo` |
| `anthropic` | `claude-3-5-haiku-latest` | `claude-3-5-sonnet-latest`, `claude-3-opus-latest` |
| `ollama` | `llama3` | Any model available in your Ollama instance |

**Usage notes:**

- API keys can also be set via environment variables: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- `mode: "auto"` enables LLM only when it improves naming (recommended)
- `mode: "always"` forces LLM on every conversion
- `mode: "off"` completely disables LLM features
- For local Ollama, set `baseURL` to your Ollama server URL (e.g., `http://localhost:11434/v1`)

### 2. Convert HTML to React (`convert`)

Converts a static HTML file to React TSX/JSX components:

```bash
h2ui-cli convert <path-to-html-file> [options]
```

**Available Options:**
* `--out <directory>`: Output directory for the generated components (default: `./h2ui_output/`).
* `--type <tsx|jsx>`: Output file extension, either `tsx` or `jsx` (default: `tsx`).
* `--no-split`: Disable component splitting and generate a single large component file.
* `--strict`: Strict mode; treats all warnings as errors and halts execution.
* `--llm <on|off>`: Enables/disables LLM semantic optimizations (default: `on`).

**Example:**
```bash
h2ui-cli convert input.html --out ./components --llm on
```

### 3. Live Preview (`preview`)

Starts the local Vite-powered preview server with live reload:

```bash
h2ui-cli preview [options]
```

**Available Options:**
* `-o, --out <dir>`: Output directory to watch and sync (default: `./h2ui_output`).
* `-p, --port <port>`: Port to run the preview server on (default: `5173`).

**Example:**
```bash
h2ui-cli preview --out ./components --port 3000
```
Open `http://localhost:3000` in your browser to view your converted component tree live.

---

## CSS Styling and Inheritance Specification

To ensure production-ready code quality, `h2ui` outputs styling under the following specifications:

1. **Global Stylesheets**:
   Global `<style>` tags are written to `global.css` and imported globally in the root component:
   ```tsx
   import './global.css';
   ```
2. **External CDNs & Web Fonts**:
   Any external web resource links from the original HTML `<head>` are dynamically injected into the head of the preview `index.html`.
3. **Shared Styles Inheritance**:
   Shared declarations across components are extracted into `.shared` in `shared.module.css` and composed in component-level CSS Module files:
   ```css
   .featureCard {
     composes: shared from './shared.module.css';
     /* component-specific non-shared styles */
     background: blue;
   }
   ```
   If all styles for a component are shared, a CSS module file containing only the `composes` rule will still be generated to keep import statement valid.

---

## Testing

To run the Vitest unit tests:

```bash
npm test
```
