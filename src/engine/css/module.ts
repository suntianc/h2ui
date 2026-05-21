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
  properties: Record<string, string>
): string {
  const cleaned = cleanProperties(condenseProperties(properties));
  const keys = Object.keys(cleaned);

  if (keys.length === 0) return '';

  const className = componentToClassName(name);
  const lines = keys.map(prop => `  ${prop}: ${cleaned[prop]};`);

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
): { shared: CSSFile | null; updatedComponents: ComponentOutput[] } {
  if (components.length < 2) {
    return { shared: null, updatedComponents: components };
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

  // Find declarations used by 2+ components
  const sharedDeclarations: Record<string, string> = {};
  const sharedKeys = new Set<string>();

  for (const [key, comps] of declFrequency) {
    if (comps.length >= 2) {
      const colonIdx = key.indexOf(':');
      const prop = key.slice(0, colonIdx);
      const value = key.slice(colonIdx + 1);
      sharedDeclarations[prop] = value;
      sharedKeys.add(key);
    }
  }

  // Check threshold (at least 3 shared declarations)
  if (Object.keys(sharedDeclarations).length < 3) {
    return { shared: null, updatedComponents: components };
  }

  // Generate shared CSS Module
  const cssContent = generateCSSModule('Shared', sharedDeclarations);
  const sharedCSS: CSSFile = {
    name: 'shared',
    css: cssContent || '',
  };

  // Remove shared declarations from individual components
  const updatedComponents = components.map(comp => {
    const remaining: Record<string, string> = {};
    for (const [prop, value] of Object.entries(comp.cssProperties || {})) {
      const key = `${prop}:${value}`;
      if (!sharedKeys.has(key)) {
        remaining[prop] = value;
      }
    }
    return { ...comp, cssProperties: remaining };
  });

  return { shared: sharedCSS, updatedComponents };
}

/**
 * Get the import statement for a component's CSS Module.
 */
export function getCSSModuleImport(componentName: string, hasStyles: boolean): string {
  if (!hasStyles) return '';
  return `import styles from './${componentName}.module.css';\n`;
}

/**
 * Get the CSS Module class name usage for a component.
 */
export function getClassNameBinding(componentName: string, hasStyles: boolean): string {
  if (!hasStyles) return '';
  const className = componentToClassName(componentName);
  return `className={styles.${className}}`;
}