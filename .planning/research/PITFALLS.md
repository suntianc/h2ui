# Pitfalls Research

**Domain:** HTML-to-React Component Conversion CLI Tool
**Researched:** 2026-05-21
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Over-relying on LLM for structural conversion

**What goes wrong:**
Using AI for everything produces unreliable, inconsistent, and expensive output. The LLM might hallucinate non-existent HTML structures, drop content, or produce React code that doesn't match the original HTML layout.

**Why it happens:**
LLMs are great at semantics but terrible at precision. Asking an LLM to convert a complex HTML page to React is asking it to do something it's not reliable at — exact structural transformation.

**How to avoid:**
Use a **hybrid approach**: Rule engine handles ALL structural conversion (attributes, nesting, component boundaries) — deterministic and correct every time. LLM is limited to naming components and optional cleanup/optimization suggestions.

**Warning signs:**
- Generated components missing sections or content
- Inconsistent naming across runs
- High token usage with uncertain output quality

**Phase to address:**
Phase 1 — core architecture must use rule-based structural conversion from day one.

---

### Pitfall 2: Naive CSS extraction (too many properties)

**What goes wrong:**
When extracting computed styles, including every CSS property (including inherited, default, and cascade values) produces gigantic, unreadable component code. Magic Patterns reported initial output had 200+ CSS properties per element.

**Why it happens:**
Using `getComputedStyle` returns the final computed value for ALL properties, not just the ones the developer explicitly set. Without filtering, every element gets hundreds of redundant style declarations.

**How to avoid:**
Only extract explicitly set CSS properties (from `<style>` tags or inline styles). Filter out inherited styles (properties that match parent). Condense to shorthand properties (padding, margin, border). Deduplicate shared styles to a top-level style block.

**Warning signs:**
- CSS output has 50+ properties per element
- Components are 3x larger than the original HTML
- Every element has `box-sizing: border-box` explicitly set

**Phase to address:**
Phase 1 — CSS engine must be built with explicit-property-only extraction from the start.

---

### Pitfall 3: Treating all HTML as flat (no component splitting)

**What goes wrong:**
Converting the entire HTML page to a single React component defeats the purpose of component-based architecture. Users get one massive file with no reusability.

**Why it happens:**
It's the simplest approach — take HTML, convert attributes, output one file. No analysis of document structure needed.

**How to avoid:**
Analyze the HTML AST for semantic sectioning elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`). Extract repeated patterns (e.g., multiple `<div class="card">` elements) as reusable components. Build a component tree with proper parent-child imports.

**Warning signs:**
- Output is one large file
- Repeated HTML patterns are duplicated in output
- No `import` statements between generated components

**Phase to address:**
Phase 1 — component splitting is a core differentiator; must be built from the start.

---

### Pitfall 4: Broken HTML attribute conversion

**What goes wrong:**
Simple `class` → `className` is not enough. Many HTML attributes have different JSX names: `for` → `htmlFor`, `tabindex` → `tabIndex`, `maxlength` → `maxLength`, etc. SVG attributes have their own mapping (e.g., `stroke-width` → `strokeWidth`).

**Why it happens:**
Developers focus on the common cases and miss edge cases. Inline `style` strings also need conversion from CSS string → React style object.

**How to avoid:**
Maintain a complete HTML-to-JSX attribute mapping table covering all standard HTML and SVG attributes. Use a library like `html-attributes-to-react` or build a comprehensive mapping. For inline `style`, parse CSS property strings and convert to camelCase.

**Warning signs:**
- React warnings about unknown DOM attributes
- Inline styles not rendering correctly
- SVG elements broken in output

**Phase to address:**
Phase 1 — attribute mapping engine.

---

### Pitfall 5: Not handling self-closing tags and void elements

**What goes wrong:**
HTML self-closing tags (`<br>`, `<img>`, `<input>`) are valid in HTML5 but need to be explicitly self-closing in JSX (`<br />`). React will warn or fail on unclosed tags.

**Why it happens:**
HTML5 parsers are lenient; JSX is strict. The difference between `<img src="...">` (valid HTML) and `<img src="..." />` (required JSX) is subtle but critical.

**How to avoid:**
Maintain a list of void elements (br, hr, img, input, link, meta, etc.) and ensure they're rendered with self-closing syntax in JSX output. Use React's `isVoidElement` list or maintain your own.

**Warning signs:**
- React console warnings about unclosed tags
- Components fail to compile

**Phase to address:**
Phase 1 — basic JSX output generation.

### Pitfall 6: LLM rate limiting and cost surprises

**What goes wrong:**
If LLM integration is baked into every conversion, users hit API rate limits, unexpected costs, or dependency on external services for the tool to work at all.

**Why it happens:**
LLM APIs charge per token and have rate limits. Large HTML pages consume many tokens. Without proper design, every invocation of h2ui costs money and might fail under rate limits.

**How to avoid:**
Make LLM integration **optional**, with a clear opt-in. Implement token estimation and cost warnings before LLM calls. Support local providers (Ollama) that don't require payment. Cache LLM results. Always work without LLM as a fallback.

**Warning signs:**
- User reports unexpected API charges
- Tool fails when LLM API is unavailable
- Slow conversion times due to API latency

**Phase to address:**
Phase 2 — LLM integration is intentionally deferred until core pipeline works without it.

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
| -------- | ----------------- | -------------- | --------------- |
| Regex parsing HTML | Fast to implement | Breaks on edge cases, unmaintainable | Never |
| Single-file output | Simple code | No reusability, defeats component model | Never |
| Manual attribute list (incomplete) | Quick initial implementation | Gradual bug reports for missing conversions | Only if using comprehensive library |
| Hardcoded output format | No config needed | Users can't customize | v1 only, make configurable in v1.x |
| Inline all styles | Simple extraction | Bloated components, no reusability | Never — CSS Modules from day one |

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
| ------- | ------------- | -------------- |
| Over-relying on LLM | HIGH | Rewrite pipeline to use rule-based for structure; keep LLM for naming only |
| Naive CSS extraction | MEDIUM | Add CSS filtering step to deduplicate, remove inherited, condense shorthand |
| Flat HTML (no splitting) | HIGH | Add component splitting step; restructure pipeline |
| Broken attribute conversion | LOW | Expand attribute mapping table; add tests for each attribute type |
| Self-closing tag issues | LOW | Add void element handling to generator |

## Sources

- [Magic Patterns - CSS extraction challenges](https://www.magicpatterns.com/blog/any-website-to-react-component) - Documented the 200+ property problem
- [Anima - LLM degradation with scope](https://www.animaapp.com/blog/product-updates/enhancing-reactjs-code-generation-with-llms/) - "asking for too many things at once degrades results exponentially"
- [html-to-react-components source](https://github.com/roman01la/html-to-react-components) - Existing attribute mapping and component splitting approach
- React docs on DOM differences - Complete HTML attribute → JSX mapping reference

---
*Pitfalls research for: h2ui (HTML-to-React CLI)*
*Researched: 2026-05-21*