export function showBanner() {
    console.log('h2ui v1.0.0 — HTML to React Component Converter');
    console.log('');
}
export function showSuccess(path) {
    console.log(`\x1b[32m✓\x1b[0m Wrote: ${path}`);
}
export function showWarning(msg) {
    console.warn(`\x1b[33m⚠\x1b[0m ${msg}`);
}
export function showError(msg) {
    console.error(`\x1b[31m✗\x1b[0m ${msg}`);
}
export function showWarningSummary(warnings) {
    if (warnings.length > 0) {
        console.log(`\nWarnings (${warnings.length}):`);
        warnings.forEach(w => console.warn(`  \x1b[33m⚠\x1b[0m ${w}`));
    }
}
/**
 * Display component tree in console using Unicode box-drawing characters.
 * Shows hierarchy, component names, and reuse counts.
 */
export function showComponentTree(root) {
    const lines = renderTree(root, true);
    console.log('\n' + lines.join('\n') + '\n');
}
function renderTree(node, isRoot, prefix = '', isLast = true) {
    const result = [];
    if (isRoot) {
        result.push(`📦 ${node.name}`);
        node.children.forEach((child, i) => {
            const last = i === node.children.length - 1;
            result.push(...renderTree(child, false, '', last));
        });
        return result;
    }
    const connector = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';
    let label = node.name;
    if (node.isRepeated && node.repeatCount && node.repeatCount > 0) {
        label += `  ← reused ${node.repeatCount}x`;
    }
    result.push(`${prefix}${connector}${label}`);
    node.children.forEach((child, i) => {
        const last = i === node.children.length - 1;
        result.push(...renderTree(child, false, `${prefix}${childPrefix}`, last));
    });
    return result;
}
//# sourceMappingURL=output.js.map