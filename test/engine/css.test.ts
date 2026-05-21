import { describe, it, expect } from 'vitest';
import { parseInlineStyleToRecord, isInheritable } from '../../src/engine/css/extract.js';
import { generateCSSModule, extractSharedStyles } from '../../src/engine/css/module.js';
import { condenseProperties } from '../../src/engine/css/optimize.js';

describe('CSS style parsing', () => {
  it('parses inline style string into non-inheritable properties', () => {
    const result = parseInlineStyleToRecord('color: red; background: blue; display: flex;');
    // color is inheritable, should be excluded
    expect(result.color).toBeUndefined();
    expect(result.background).toBe('blue');
    expect(result.display).toBe('flex');
  });

  it('handles empty style strings', () => {
    expect(parseInlineStyleToRecord('')).toEqual({});
    expect(parseInlineStyleToRecord('  ')).toEqual({});
  });

  it('handles vendor-prefixed properties', () => {
    const result = parseInlineStyleToRecord('-webkit-border-radius: 4px; display: flex');
    expect(result['-webkit-border-radius']).toBe('4px');
    expect(result.display).toBe('flex');
  });
});

describe('CSS property classification', () => {
  it('marks color as inheritable', () => {
    expect(isInheritable('color')).toBe(true);
  });

  it('marks font-size as inheritable', () => {
    expect(isInheritable('font-size')).toBe(true);
  });

  it('marks display as non-inheritable', () => {
    expect(isInheritable('display')).toBe(false);
  });

  it('marks background as non-inheritable', () => {
    expect(isInheritable('background')).toBe(false);
  });
});

describe('CSS shorthand condensation', () => {
  it('condenses 4-value padding', () => {
    const result = condenseProperties({
      'padding-top': '10px',
      'padding-right': '20px',
      'padding-bottom': '10px',
      'padding-left': '20px',
    });
    expect(result.padding).toBe('10px 20px');
    expect(result['padding-top']).toBeUndefined();
  });

  it('condenses uniform padding', () => {
    const result = condenseProperties({
      'padding-top': '10px',
      'padding-right': '10px',
      'padding-bottom': '10px',
      'padding-left': '10px',
    });
    expect(result.padding).toBe('10px');
  });

  it('condenses 3-value padding (left=right)', () => {
    const result = condenseProperties({
      'padding-top': '10px',
      'padding-right': '20px',
      'padding-bottom': '30px',
      'padding-left': '20px',
    });
    expect(result.padding).toBe('10px 20px 30px');
  });

  it('condenses 2-value padding (top=bottom)', () => {
    const result = condenseProperties({
      'padding-top': '10px',
      'padding-right': '20px',
      'padding-bottom': '10px',
      'padding-left': '20px',
    });
    expect(result.padding).toBe('10px 20px');
  });
});

describe('CSS Module generation', () => {
  it('generates valid CSS Module string', () => {
    const css = generateCSSModule('Header', {
      background: 'blue',
      display: 'flex',
    });
    expect(css).toContain('.header {');
    expect(css).toContain('background: blue;');
    expect(css).toContain('display: flex;');
  });

  it('returns empty for no properties', () => {
    expect(generateCSSModule('Empty', {})).toBe('');
  });
});

describe('shared style extraction', () => {
  it('extracts declarations used by 2+ components when threshold met', () => {
    const components = [
      {
        name: 'Header',
        code: '',
        cssProperties: {
          display: 'flex',
          background: 'blue',
          padding: '10px',
        },
      },
      {
        name: 'Footer',
        code: '',
        cssProperties: {
          display: 'flex',
          color: 'white',
          padding: '10px',
        },
      },
      {
        name: 'Sidebar',
        code: '',
        cssProperties: {
          display: 'flex',
          background: 'gray',
          padding: '10px',
        },
      },
    ];

    const { shared, updatedComponents } = extractSharedStyles(components);

    // display: flex appears in 3 components, padding: 10px appears in 3 components
    // Only 2 shared declaration keys, but threshold is 3, so...
    // Actually we need at least 3 shared DECLARATION TYPES (unique property:value)
    // display:flex and padding:10px = only 2 shared types → below threshold of 3

    // Add one more shared property
    const componentsWithMoreShared = [
      {
        name: 'Header',
        code: '',
        cssProperties: {
          display: 'flex',
          background: 'blue',
          padding: '10px',
          margin: '0',
        },
      },
      {
        name: 'Footer',
        code: '',
        cssProperties: {
          display: 'flex',
          color: 'white',
          padding: '10px',
          margin: '0',
        },
      },
    ];

    const result = extractSharedStyles(componentsWithMoreShared);
    expect(result.shared).not.toBeNull();
    expect(result.shared!.css).toContain('display: flex;');
    expect(result.shared!.css).toContain('padding: 10px;');
    // Header should still have background (unique to it)
    expect(result.updatedComponents[0].cssProperties.background).toBe('blue');
  });

  it('returns null for single component', () => {
    const components = [
      { name: 'Single', code: '', cssProperties: { display: 'flex' } },
    ];

    const { shared } = extractSharedStyles(components);
    expect(shared).toBeNull();
  });
});