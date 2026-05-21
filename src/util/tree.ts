import type { ComponentNode } from '../types/pipeline.js';

/**
 * Flatten a component tree into a flat list (top-down).
 */
export function flattenTree(node: ComponentNode): ComponentNode[] {
  return [node, ...node.children.flatMap(flattenTree)];
}
