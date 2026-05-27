# h2ui

`h2ui` is a high-efficiency CLI tool that converts static HTML pages into modular, reusable **React** (TSX/JSX) or **Vue 3** (SFC) component trees using pure rule-based analysis.

Powered by **AST parsing + semantic analysis**, it automatically splits flat HTML into a sensible component hierarchy, extracts and deduplicates CSS styles, and provides a hot-reloading browser preview server out-of-the-box.

Chinese Documentation: [README_zh.md](./README_zh.md)

---

## Motivation

In the workflow of **Idea (Text) ➔ Design (HTML) ➔ Development (React/Vue)**:
- AI models excel at generating single-file high-fidelity HTML designs from text ideas.
- However, letting LLMs directly write modular production component code often fails due to token limits, fragmentation, and styling standards violations.

`h2ui` serves as the bridging compiler. It takes a single high-fidelity HTML design and compiles it deterministically into production-ready components with clean CSS Modules, ensuring 100% rendering fidelity without the risks of pure-AI code generation.

---

## Features

- **Smart Component Splitting**: Automatically identifies semantic boundaries in your HTML (like `header`, `nav`, `main`, `footer`, and repeated list items), builds a nested component hierarchy, and writes separate component files.
- **Multi-Framework Output**: Supports both **React** (TSX/JSX) and **Vue 3** (Single-File Components with `<template>`, `<script setup>`, `<style scoped>`).
- **Batch Processing**: Convert multiple HTML files at once using glob patterns with configurable concurrency.
- **Zero-Config Style Extraction & Isolation**:
  - **CSS Modules**: Generates a `.module.css` for each component by default and binds `className`, providing absolute style encapsulation.
  - **Shared Style Deduplication**: Identifies identical inline style declarations across components and deduplicates them into `shared.module.css`, inherited via CSS Modules `composes` rule.
  - **Global Styles Preservation**: Extracts global styles within `<style>` tags to a standard `global.css` and imports it in the root component.
  - **Vue Scoped Styles**: For Vue 3 output, generates `<style scoped>` blocks with component-specific CSS.
- **External Resource Inclusion**: Automatically parses external stylesheets, Web Fonts (e.g., Google Fonts), or icons from original HTML `<head>` link tags and restores them in the preview environment.
- **Hot-Reloading Preview Server**: A built-in dev server powered by Vite. When you modify generated component code, the browser preview reloads instantly.

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
> If installed globally or running via `npx`, use the executable command `h2ui`. If you are developing locally, replace `h2ui` with `node dist/bin/h2ui.js`.

### 1. Initialize Configuration Scaffold (`init`)

Generates a `.h2uirc` configuration file to define your default preferences.

```bash
h2ui init [--force]
```

**Scaffold config template (`.h2uirc`)**:
```json
{
  "_comment": "h2ui configuration file.",
  "out": "./h2ui_output/",
  "typescript": true,
  "strict": false,
  "split": true,
  "cssMode": "module"
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
| `framework` | `string` | `react` | Target framework: `react` or `vue3` |

### 2. Convert HTML to Components (`convert`)

Converts a static HTML file to React TSX/JSX or Vue 3 SFC components:

```bash
h2ui convert <path-to-html-file> [options]
```

**Available Options:**
* `--out <directory>`: Output directory for the generated components (default: `./h2ui_output/`).
* `--type <tsx|jsx>`: Output file extension, either `tsx` or `jsx` (default: `tsx`). Only applies to React output.
* `--framework <react|vue3>`: Target framework (default: `react`).
* `--no-split`: Disable component splitting and generate a single large component file.
* `--strict`: Strict mode; treats all warnings as errors and halts execution.

**Examples:**
```bash
# Convert to React TSX
h2ui convert input.html --out ./components

# Convert to Vue 3 SFC
h2ui convert input.html --framework vue3 --out ./components

# Convert as single JSX file without splitting
h2ui convert page.html --type jsx --no-split
```

### 3. Batch Convert (`batch`)

Convert multiple HTML files using glob patterns:

```bash
h2ui batch "<glob-pattern>" [options]
```

**Available Options:**
* `--out <directory>`: Output directory (default: `./h2ui_output/`).
* `--concurrency <number>`: Number of files to process in parallel (default: `1`, max: `4`).
* `--no-split`: Disable component splitting.
* `--strict`: Promote all warnings to errors.

**Examples:**
```bash
# Convert all HTML files in a directory
h2ui batch "src/**/*.html"

# Convert with 4-way parallelism
h2ui batch "pages/*.html" --out ./components --concurrency 4
```

### 4. Live Preview (`preview`)

Starts the local Vite-powered preview server with live reload:

```bash
h2ui preview [options]
```

**Available Options:**
* `-o, --out <dir>`: Output directory to watch and sync (default: `./h2ui_output`).
* `-p, --port <port>`: Port to run the preview server on (default: `5173`).

**Example:**
```bash
h2ui preview --out ./components --port 3000
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
3. **Shared Styles Inheritance (React)**:
   Shared declarations across components are extracted into `.shared` in `shared.module.css` and composed in component-level CSS Module files:
   ```css
   .featureCard {
     composes: shared from './shared.module.css';
     /* component-specific non-shared styles */
     background: blue;
   }
   ```
4. **Vue Scoped Styles (Vue 3)**:
   Each Vue SFC component includes a `<style scoped>` block with component-specific CSS, ensuring style isolation without CSS Modules.

---

## Testing

To run the Vitest unit tests:

```bash
npm test
```
