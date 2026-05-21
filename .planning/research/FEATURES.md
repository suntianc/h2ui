# Feature Research

**Domain:** HTML-to-React Component Conversion CLI Tool
**Researched:** 2026-05-21
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
| ------- | ------------ | ---------- | ----- |
| CLI input using file path | Primary interaction mode | LOW | `h2ui input.html` |
| HTML → JSX attribute conversion | Core purpose | MEDIUM | class→className, style→object, etc. |
| Output component files to disk | Expected CLI behavior | LOW | Write to output directory |
| Support for TSX output | Modern React standard | MEDIUM | TypeScript prop interfaces |
| Basic error handling / validation | Any CLI tool needs this | LOW | Invalid HTML, missing file |
| --help / --version flags | CLI convention | LOW | Standard commander behavior |
| Config file support | Expected for tool customization | MEDIUM | .h2uirc or package.json config |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
| ------- | ----------------- | ---------- | ----- |
| **Automatic component splitting** | Unlike html-to-react-components (needs manual `data-component` markers), h2ui auto-detects semantic boundaries | HIGH | Core differentiator |
| **CSS extraction → CSS Modules** | Produces production-ready style files, not just inline styles | HIGH | Another key differentiator |
| **Hybrid rules + LLM** | Rule engine handles structure; LLM handles naming & cleanup | MEDIUM | More reliable than pure-LLM approaches |
| **Configurable LLM provider** | Bring your own API key (OpenAI, Anthropic, Ollama) | MEDIUM | User freedom |
| **Interactive preview mode** | Show component tree before writing files | MEDIUM | Developer confidence |
| **Inline style → CSS Module extraction** | Extract inline styles to proper style files | HIGH | Differentiator over simple class→className tools |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
| ------- | ------------- | --------------- | ----------- |
| WYSIWYG preview | "See what it looks like" | Bloat for CLI tool; belongs in separate tool | CLI-only; preview via browser if needed |
| Two-way sync (HTML ↔ React) | "Edit and re-export" | Huge complexity, fragile mapping | One-way conversion; re-run on new HTML |
| Full website scraping | "Convert any URL" | Rate limits, dynamic content, CORS | User provides local HTML file |
| Pure-LLM conversion | "AI does everything" | Unreliable, expensive, inconsistent | Hybrid: rules for structure, LLM for naming |
| Image/base64 extraction | "Convert embedded images" | Binary handling, path resolution | Leave image refs as-is; user manages assets |

## Feature Dependencies

```
Automatic Component Splitting
    └──requires──> HTML AST Parsing (Cheerio)
    └──requires──> Semantic Tag Detection (header/nav/section/footer)

CSS Extraction
    └──requires──> CSS Parsing (css-tree)
    └──requires──> Style-to-CSS-Module Mapping

Hybrid Rules + LLM
    └──requires──> Rule-based Component Splitting
    └──requires──> LLM Provider Interface
    └──enhances──> Component Naming
    └──enhances──> Prop Detection

TSX Output
    └──requires──> TypeScript Code Generation
    └──requires──> Prop Type Inference
```

### Dependency Notes

- **Automatic Component Splitting requires HTML AST Parsing:** Without a parsed AST, you can't detect nested component boundaries
- **CSS Extraction requires CSS Parsing:** Inline styles need css-tree to convert to CSS Module format
- **Hybrid approach requires Rule-based splitting first:** LLM works on top of structured output, not raw HTML

## MVP Definition

### Launch With (v1)

- [x] CLI file input (`h2ui input.html`)
- [x] HTML attribute → JSX conversion
- [x] Output component files to disk
- [x] TSX/JSX output option
- [x] Basic semantic component splitting (header/nav/section/footer/main/article)
- [x] Inline style → CSS Module extraction
- [x] --help / --version
- [x] Error handling for invalid input

### Add After Validation (v1.x)

- [ ] LLM integration for naming and optimization
- [ ] Config file support (.h2uirc)
- [ ] Interactive preview mode
- [ ] Configurable output directory

### Future Consideration (v2+)

- [ ] Multi-framework support (Vue, Svelte, Solid)
- [ ] Batch HTML file conversion
- [ ] Watch mode (auto-convert on file change)
- [ ] Tailwind CSS class inference
- [ ] Plugin system for custom component targets

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
| ------- | ---------- | ------------------ | -------- |
| CLI file input | HIGH | LOW | P1 |
| HTML→JSX conversion | HIGH | MEDIUM | P1 |
| Output files to disk | HIGH | LOW | P1 |
| Semantic component splitting | HIGH | HIGH | P1 |
| CSS extraction (inline→Module) | HIGH | HIGH | P1 |
| TSX/TS output option | HIGH | MEDIUM | P1 |
| --help / --version | MEDIUM | LOW | P1 |
| LLM integration | MEDIUM | MEDIUM | P2 |
| Config file | MEDIUM | MEDIUM | P2 |
| Interactive preview | LOW | MEDIUM | P2 |
| Multi-framework | MEDIUM | HIGH | P2+ |

## Competitor Feature Analysis

| Feature | html-to-react-components | Magic Patterns | h2ui (planned) |
| ------- | ----------------------- | -------------- | --------------- |
| Manual component markers | Yes (`data-component`) | No | **No — auto split** |
| CLI tool | Yes | No (Chrome ext) | **Yes** |
| CSS extraction | No | Inline styles only | **CSS Modules** |
| LLM integration | No | Yes (optional pass) | **Hybrid approach** |
| TypeScript output | Yes (v3+) | Yes | **Yes** |
| Auto component naming | Uses marker name | LLM | **Rules + LLM** |
| Multi-framework | React only | React only | **React first, extensible** |

## Sources

- [roman01la/html-to-react-components](https://github.com/roman01la/html-to-react-components) - Existing CLI tool, 2.2k stars
- [Magic Patterns - Website to React Component](https://www.magicpatterns.com/blog/any-website-to-react-component) - Chrome extension approach
- [Anima - LLM Code Generation](https://www.animaapp.com/blog/product-updates/enhancing-reactjs-code-generation-with-llms/) - Hybrid rule + LLM approach
- [html-to-react-components REPL](https://roman01la.github.io/html-to-react-components/repl/) - Online demo

---
*Feature research for: h2ui (HTML-to-React CLI)*
*Researched: 2026-05-21*