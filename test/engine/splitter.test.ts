import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { isSemanticTag, tagToComponentName } from '../../src/engine/splitter/semantic.js';
import { findRepeatedPatterns } from '../../src/engine/splitter/signature.js';

describe('semantic tag detection', () => {
  it('identifies semantic tags', () => {
    const $ = cheerio.load('<header></header>');
    const el = $('header')[0] as any;
    expect(isSemanticTag(el)).toBe(true);
  });

  it('rejects non-semantic tags', () => {
    const $ = cheerio.load('<div></div>');
    const el = $('div')[0] as any;
    expect(isSemanticTag(el)).toBe(false);
  });

  it('generates component names from tags', () => {
    expect(tagToComponentName('header', [])).toBe('Header');
    expect(tagToComponentName('nav', [])).toBe('Navigation');
    expect(tagToComponentName('footer', [])).toBe('Footer');
  });

  it('includes class in component name', () => {
    expect(tagToComponentName('section', ['features'])).toBe('FeaturesSection');
  });
});

describe('repeated pattern detection', () => {
  it('detects duplicate card structures', () => {
    const html = `<!DOCTYPE html><html><body>
      <div class="product-grid">
        <div class="card" style="border: 1px solid #ddd;">
          <h3>Product 1</h3>
          <p>$19.99</p>
        </div>
        <div class="card" style="border: 1px solid #ddd;">
          <h3>Product 2</h3>
          <p>$29.99</p>
        </div>
        <div class="card" style="border: 1px solid #ddd;">
          <h3>Product 3</h3>
          <p>$39.99</p>
        </div>
      </div>
    </body></html>`;

    const $ = cheerio.load(html);
    const body = $('body')[0] as any;
    const warnings: string[] = [];
    const patterns = findRepeatedPatterns($, body, undefined, warnings);

    expect(patterns.length).toBeGreaterThanOrEqual(1);
    expect(patterns[0].count).toBeGreaterThanOrEqual(3);
    expect(['Card', 'Card']).toContain(patterns[0].componentName);
  });

  it('returns empty for unique structures', () => {
    const html = `<!DOCTYPE html><html><body>
      <header><h1>Title</h1></header>
      <main><p>Content</p></main>
      <footer><p>Footer</p></footer>
    </body></html>`;

    const $ = cheerio.load(html);
    const body = $('body')[0] as any;
    const warnings: string[] = [];
    const patterns = findRepeatedPatterns($, body, undefined, warnings);

    expect(patterns.length).toBe(0);
  });
});