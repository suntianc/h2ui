import type { ComponentOutput, CSSFile } from '../../types/pipeline.js';
import { condenseProperties, cleanProperties } from './optimize.js';

/**
 * Convert a camelCase component name to a CSS-safe class name.
 * 'FeatureCard' → 'featureCard'
 */
function componentToClassName(name: string): string {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

/**
 * Generate CSS Module content from a set of properties.
 */
export function generateCSSModule(
  name: string,
  properties: Record<string, string>,
  composes?: string
): string {
  const cleaned = cleanProperties(condenseProperties(properties));
  const keys = Object.keys(cleaned);

  if (keys.length === 0 && !composes) return '';

  const className = componentToClassName(name);
  const lines = keys.map(prop => `  ${prop}: ${cleaned[prop]};`);
  if (composes) {
    lines.unshift(`  composes: ${composes};`);
  }

  return `.${className} {\n${lines.join('\n')}\n}\n`;
}

/**
 * Extract shared styles across multiple components.
 * Returns: { shared: CSSFile | null, updatedComponents: ComponentOutput[] }
 *
 * A declaration is "shared" if it appears with the same property+value in 2+ components.
 * Threshold: at least 3 shared declarations to create shared.module.css.
 */
export function extractSharedStyles(
  components: ComponentOutput[]
): { shared: CSSFile | null; updatedComponents: ComponentOutput[]; sharedComponents: Set<string> } {
  if (components.length < 2) {
    return { shared: null, updatedComponents: components, sharedComponents: new Set() };
  }

  // Collect all declarations with their component origins
  const declFrequency = new Map<string, string[]>();  // key → component names
  // key format: "property:value"

  for (const comp of components) {
    const props = comp.cssProperties || {};
    for (const [prop, value] of Object.entries(props)) {
      const key = `${prop}:${value}`;
      if (!declFrequency.has(key)) {
        declFrequency.set(key, []);
      }
      declFrequency.get(key)!.push(comp.name);
    }
  }

  // Find declarations used by 2+ components with the SAME value
  // Track all values per property to detect conflicts
  const propToData = new Map<string, { value: string; keys: Set<string>; components: Set<string> }>();

  for (const [key, comps] of declFrequency) {
    if (comps.length >= 2) {
      const colonIdx = key.indexOf(':');
      const prop = key.slice(0, colonIdx);
      const value = key.slice(colonIdx + 1);

      if (!propToData.has(prop)) {
        propToData.set(prop, { value, keys: new Set([key]), components: new Set(comps) });
      } else {
        const data = propToData.get(prop)!;
        if (data.value === value) {
          // Same value, accumulate
          data.keys.add(key);
          comps.forEach(c => data.components.add(c));
        } else {
          // Conflicting value for same property - mark as conflict
          data.value = '__CONFLICT__';
        }
      }
    }
  }

  // Only include properties where all shared occurrences have the same value
  const sharedDeclarations: Record<string, string> = {};
  const sharedKeys = new Set<string>();

  for (const [prop, data] of propToData) {
    if (data.value !== '__CONFLICT__') {
      sharedDeclarations[prop] = data.value;
      data.keys.forEach(k => sharedKeys.add(k));
    }
  }

  // Check threshold (at least 3 shared declarations)
  if (Object.keys(sharedDeclarations).length < 3) {
    return { shared: null, updatedComponents: components, sharedComponents: new Set() };
  }

  // Generate shared CSS Module
  const cssContent = generateCSSModule('Shared', sharedDeclarations);
  const sharedCSS: CSSFile = {
    name: 'shared',
    css: cssContent || '',
  };

  const sharedComponents = new Set<string>();

  // Remove shared declarations from individual components
  const updatedComponents = components.map(comp => {
    const remaining: Record<string, string> = {};
    let hasShared = false;
    for (const [prop, value] of Object.entries(comp.cssProperties || {})) {
      const key = `${prop}:${value}`;
      if (sharedKeys.has(key)) {
        hasShared = true;
      } else {
        remaining[prop] = value;
      }
    }
    if (hasShared) {
      sharedComponents.add(comp.name);
    }
    return { ...comp, cssProperties: remaining };
  });

  return { shared: sharedCSS, updatedComponents, sharedComponents };
}