import { generateCSSModule, extractSharedStyles } from './module.js';
import { extractStyleTags } from './style-tag.js';
export const cssStep = {
    name: 'css',
    async run(ctx) {
        const newCtx = { ...ctx, warnings: [...ctx.warnings], errors: [...ctx.errors] };
        if (!ctx.components || ctx.components.length === 0) {
            // No multi-component output — nothing to do
            return newCtx;
        }
        try {
            const cssFiles = [];
            // Step 1: Extract style tags from HTML
            if (ctx.$) {
                const styleTagFiles = extractStyleTags(ctx.$, newCtx.warnings);
                cssFiles.push(...styleTagFiles);
            }
            // Step 2: CSS properties already set on components during convert step
            // (extractCssProperties in convert.ts sets cssProperties per component)
            // Step 3: Extract shared styles across components
            const { shared, updatedComponents } = extractSharedStyles(ctx.components);
            // Step 4: Generate CSS Module content for each component
            for (const comp of updatedComponents) {
                const css = generateCSSModule(comp.name, comp.cssProperties);
                if (css) {
                    cssFiles.push({ name: comp.name, css });
                }
            }
            // Step 5: Add shared CSS if any
            if (shared && shared.css) {
                cssFiles.push(shared);
                newCtx.warnings.push(`Created shared.module.css with deduplicated declarations`);
            }
            return { ...newCtx, components: updatedComponents, cssFiles };
        }
        catch (err) {
            newCtx.errors.push(`CSS extraction error: ${err.message}`);
            return newCtx;
        }
    },
};
//# sourceMappingURL=index.js.map