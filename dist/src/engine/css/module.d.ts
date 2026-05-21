import type { ComponentOutput, CSSFile } from '../../types/pipeline.js';
/**
 * Generate CSS Module content from a set of properties.
 */
export declare function generateCSSModule(name: string, properties: Record<string, string>): string;
/**
 * Extract shared styles across multiple components.
 * Returns: { shared: CSSFile | null, updatedComponents: ComponentOutput[] }
 *
 * A declaration is "shared" if it appears with the same property+value in 2+ components.
 * Threshold: at least 3 shared declarations to create shared.module.css.
 */
export declare function extractSharedStyles(components: ComponentOutput[]): {
    shared: CSSFile | null;
    updatedComponents: ComponentOutput[];
};
//# sourceMappingURL=module.d.ts.map