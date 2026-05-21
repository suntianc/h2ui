import { isSemanticTag, tagToComponentName, getMeaningfulClasses, hasDistinctPattern } from './semantic.js';
import { findRepeatedPatterns } from './signature.js';
import { showComponentTree } from '../../cli/output.js';
import { flattenTree } from '../../util/tree.js';
/**
 * Build a component tree by recursively walking DOM children.
 * Non-semantic children are merged into the parent.
 */
function buildComponentTree($, el, depth, repeatedPatterns) {
    const tag = el.tagName.toLowerCase();
    // Skip non-element nodes
    if (!tag || tag === 'script' || tag === 'style' || tag === 'html') {
        return null;
    }
    const classes = getMeaningfulClasses($, el);
    const name = tagToComponentName(tag, classes);
    // Check if this element is part of a repeated pattern
    const pattern = repeatedPatterns.find(p => p.elements.includes(el));
    const isRepeated = !!pattern;
    // Process children
    const childElements = $(el).contents().toArray()
        .filter((c) => c.type === 'tag');
    const children = [];
    if (isSemanticTag(el) || depth === 0 || hasDistinctPattern($, el)) {
        // This is a split point — recurse into children
        for (const child of childElements) {
            const childNode = buildComponentTree($, child, depth + 1, repeatedPatterns);
            if (childNode) {
                children.push(childNode);
            }
        }
    }
    else {
        // Non-semantic — merge direct semantic children, skip non-semantic
        for (const child of childElements) {
            if (isSemanticTag(child)) {
                const childNode = buildComponentTree($, child, depth + 1, repeatedPatterns);
                if (childNode) {
                    children.push(childNode);
                }
            }
            // Non-semantic children at depth > 0 are merged (their content flows into parent JSX)
        }
    }
    const node = {
        name,
        tag,
        element: el,
        children,
        isRepeated,
        repeatCount: isRepeated ? pattern.count : undefined,
        cssProperties: {},
    };
    return node;
}
export const splitStep = {
    name: 'split',
    async run(ctx) {
        const newCtx = { ...ctx, warnings: [...ctx.warnings], errors: [...ctx.errors] };
        if (!ctx.$) {
            newCtx.errors.push('Cannot split: no parsed AST available');
            return newCtx;
        }
        try {
            const $ = ctx.$;
            const body = $('body');
            const bodyEl = body[0];
            if (!bodyEl) {
                newCtx.warnings.push('No <body> tag found — skipping component splitting');
                return { ...newCtx, componentTree: undefined };
            }
            // Find repeated patterns first
            const repeatedPatterns = findRepeatedPatterns($, bodyEl, undefined, newCtx.warnings);
            // Build component tree
            const root = buildComponentTree($, bodyEl, 0, repeatedPatterns);
            if (!root) {
                newCtx.warnings.push('Could not build component tree — skipping split');
                return newCtx;
            }
            // Name the root component from filename
            const filename = ctx.filePath;
            const { toPascalCase } = await import('../../util/file.js');
            root.name = toPascalCase(filename);
            const flatList = flattenTree(root);
            // Display tree in console
            showComponentTree(root);
            return {
                ...newCtx,
                componentTree: root,
                // Store repeated patterns as serialized data for PipelineContext
                repeatedPatterns: repeatedPatterns.length > 0
                    ? new Map(repeatedPatterns.map(p => [p.signature, p.elements]))
                    : undefined,
            };
        }
        catch (err) {
            newCtx.errors.push(`Split error: ${err.message}`);
            return newCtx;
        }
    },
};
//# sourceMappingURL=index.js.map