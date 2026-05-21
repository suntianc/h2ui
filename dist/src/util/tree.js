/**
 * Flatten a component tree into a flat list (top-down).
 */
export function flattenTree(node) {
    return [node, ...node.children.flatMap(flattenTree)];
}
//# sourceMappingURL=tree.js.map