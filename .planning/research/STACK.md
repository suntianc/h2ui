# Stack Research

**Domain:** HTML-to-React Component Conversion CLI Tool
**Researched:** 2026-05-21
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
| ---------- | ------- | ------- | --------------- |
| Node.js | 22 LTS | Runtime | CLI tooling standard, npm ecosystem, async/await |
| TypeScript | 5.x | Language | Type safety for AST manipulation and code generation |
| Cheerio | 1.x | HTML AST Parsing | 27.6k GitHub stars, jQuery-like API, fast, CSS selectors built-in |
| commander | 12.x | CLI framework | Standard for Node.js CLI tools, simple API, help generation |
| Prettier | 3.x | Code formatting | Industry standard JS/TSX formatter, essential for generated code |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
| ------- | ------- | -------- | ----------- |
| jsdom | 25.x | Full DOM environment | For CSS computed style extraction (when style context matters) |
| css-tree | 2.x | CSS AST parsing/manipulation | For extracting and transforming CSS from `<style>` tags |
| postcss | 8.x | CSS transformation | For optimizing/minifying extracted CSS |
| chalk | 5.x | Terminal colors | CLI output styling |
| ora | 8.x | Terminal spinners | Progress indicators during conversion |
| openai | 4.x | LLM integration | Configurable provider for AI-powered component naming |
| inquirer | 10.x | Interactive prompts | For config setup, user prompts in CLI |

### Development Tools

| Tool | Purpose | Notes |
| ---- | ------- | ----- |
| vitest | Testing | Fast, Vite-native, good for snapshot testing generated code |
| tsx | Dev runner | TypeScript execution without build step |
| pnpm | Package manager | Fast, disk-efficient |
| changesets | Versioning | Standard for npm publish workflow |

## Installation

```bash
# Core
npm install cheerio commander prettier css-tree

# Supporting
npm install chalk ora

# LLM integration (optional - user configures which provider)
npm install openai @anthropic-ai/sdk

# Dev dependencies
npm install -D vitest tsx typescript
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
| ----------- | ----------- | ----------------------- |
| Cheerio | parse5 | When you need lower-level DOM spec compliance (Cheerio is simpler) |
| Cheerio | jsdom | Only if you need full browser API (jsdom is heavy for CLI) |
| commander | yargs | When you need complex nested subcommands (commander is simpler) |
| Prettier | dprint | When speed matters more (dprint 10x faster, but less flexible) |
| css-tree | postcss-selector-parser | Only if you only need selector parsing (css-tree does full CSS) |

## What NOT to Use

| Avoid | Why | Use Instead |
| ----- | --- | ----------- |
| Babel AST for HTML | Babel is for JS/TS, not HTML. Overly complex for HTML parsing | Cheerio for HTML |
| htmlparser2 | Lower-level, no jQuery-like API | Cheerio |
| regex-based HTML parsing | HTML is not a regular language, regex breaks on edge cases | Cheerio / proper parser |
| `dangerouslySetInnerHTML` | All generated code should avoid this anti-pattern | Proper JSX conversion |

## Stack Patterns by Variant

**If performance-critical (large HTML files):**
- Use Cheerio with `parse5` backend for raw speed
- Skip Prettier formatting, output raw but correct code
- Use streaming input rather than reading entire file

**If LLM-heavy (AI-first conversion):**
- Use jsdom to provide complete DOM context to LLM
- Include `@langchain/core` for provider-agnostic LLM calls
- Consider structured output (JSON mode) for deterministic component extraction

## Version Compatibility

| Package | Compatible With | Notes |
| ------- | --------------- | ----- |
| cheerio@1.x | Node.js 18+ | Stable API |
| commander@12.x | Node.js 18+ | ESM/CJS dual support |
| prettier@3.x | Node.js 18+ | Async API required |
| css-tree@2.x | Node.js 18+ | ESM-only |

## Sources

- [Cheerio (27.6k stars)](https://github.com/cheeriojs/cheerio) - jQuery-like HTML parser
- [html-to-react-components (2.2k stars)](https://github.com/roman01la/html-to-react-components) - Existing HTML-to-React CLI with `data-component` approach
- [react-from-html](https://github.com/measuredco/react-from-html) - Runtime HTML-to-React hydration
- [Magic Patterns - Converting websites to React](https://www.magicpatterns.com/blog/any-website-to-react-component) - CSS extraction techniques with `getComputedStyle`
- [Anima - LLM-enhanced code generation](https://www.animaapp.com/blog/product-updates/enhancing-reactjs-code-generation-with-llms/) - Hybrid rule-based + LLM approach
- Commander.js docs - CLI framework standards

---
*Stack research for: h2ui (HTML-to-React CLI)*
*Researched: 2026-05-21*