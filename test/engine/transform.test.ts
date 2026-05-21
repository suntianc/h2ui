import { describe, it, expect } from 'vitest';
import { mapAttribute } from '../../src/engine/transform/attributes.js';

describe('Attribute Mapping', () => {
  it('JSX-01: class → className', () => {
    const result = mapAttribute('class', 'container');
    expect(result.name).toBe('className');
    expect(result.value).toBe('container');
  });

  it('JSX-02: for → htmlFor', () => {
    const result = mapAttribute('for', 'email');
    expect(result.name).toBe('htmlFor');
    expect(result.value).toBe('email');
  });

  it('JSX-03: boolean attribute disabled with no value → true', () => {
    // When attribute is present but has no value (disabled), should be true
    const result = mapAttribute('disabled', '');
    expect(result.name).toBe('disabled');
    expect(result.value).toBe(true);
  });

  it('JSX-04: boolean attribute disabled="false" → false', () => {
    // CR-01 fix: disabled="false" should be boolean false, not true
    const result = mapAttribute('disabled', 'false');
    expect(result.name).toBe('disabled');
    expect(result.value).toBe(false);
  });

  it('JSX-05: boolean attribute disabled="true" → true', () => {
    const result = mapAttribute('disabled', 'true');
    expect(result.name).toBe('disabled');
    expect(result.value).toBe(true);
  });

  it('JSX-06: boolean attribute checked (no value)', () => {
    const result = mapAttribute('checked', '');
    expect(result.name).toBe('checked');
    expect(result.value).toBe(true);
  });

  it('JSX-07: readonly attribute renamed correctly', () => {
    const result = mapAttribute('readonly', 'readonly');
    expect(result.name).toBe('readOnly');
    expect(result.value).toBe(true);
  });

  it('JSX-08: event handlers onClick → onClick', () => {
    const result = mapAttribute('onclick', 'handleClick');
    expect(result.name).toBe('onClick');
    expect(result.value).toBe('handleClick');
  });

  it('JSX-09: hyphenated attrs stroke-width → strokeWidth', () => {
    const result = mapAttribute('stroke-width', '2px');
    expect(result.name).toBe('strokeWidth');
    expect(result.value).toBe('2px');
  });

  it('JSX-10: data-* attributes kept as-is', () => {
    const result = mapAttribute('data-testid', 'my-input');
    expect(result.name).toBe('data-testid');
    expect(result.value).toBe('my-input');
  });

  it('JSX-11: aria-* attributes kept as-is', () => {
    const result = mapAttribute('aria-label', 'Close');
    expect(result.name).toBe('aria-label');
    expect(result.value).toBe('Close');
  });

  it('JSX-12: tabindex → tabIndex', () => {
    const result = mapAttribute('tabindex', '0');
    expect(result.name).toBe('tabIndex');
    expect(result.value).toBe('0');
  });

  it('JSX-13: maxlength → maxLength', () => {
    const result = mapAttribute('maxlength', '50');
    expect(result.name).toBe('maxLength');
    expect(result.value).toBe('50');
  });

  it('JSX-14: unknown attribute gets warning', () => {
    const result = mapAttribute('someunknown', 'value');
    expect(result.name).toBe('someunknown');
    expect(result.value).toBe('value');
    expect(result.warning).toBeDefined();
    expect(result.warning).toContain('Unknown HTML attribute');
  });

  it('JSX-15: standard attribute passed through without warning', () => {
    const result = mapAttribute('id', 'main');
    expect(result.name).toBe('id');
    expect(result.value).toBe('main');
    expect(result.warning).toBeUndefined();
  });
});

describe('Style Conversion', () => {
  it('parses CSS string to React style object', async () => {
    const { parseInlineStyle } = await import('../../src/engine/transform/style.js');
    const result = parseInlineStyle('color: red; font-size: 14px');
    expect(result).toEqual({ color: 'red', fontSize: '14px' });
  });

  it('handles vendor prefixes', async () => {
    const { parseInlineStyle } = await import('../../src/engine/transform/style.js');
    const result = parseInlineStyle('-webkit-transform: rotate(45deg)');
    expect(result).toEqual({ WebkitTransform: 'rotate(45deg)' });
  });

  it('handles empty style', async () => {
    const { parseInlineStyle } = await import('../../src/engine/transform/style.js');
    const result = parseInlineStyle('');
    expect(result).toEqual({});
  });
});