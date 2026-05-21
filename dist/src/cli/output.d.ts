import type { ComponentNode } from '../types/pipeline.js';
export declare function showBanner(): void;
export declare function showSuccess(path: string): void;
export declare function showWarning(msg: string): void;
export declare function showError(msg: string): void;
export declare function showWarningSummary(warnings: string[]): void;
/**
 * Display component tree in console using Unicode box-drawing characters.
 * Shows hierarchy, component names, and reuse counts.
 */
export declare function showComponentTree(root: ComponentNode): void;
//# sourceMappingURL=output.d.ts.map