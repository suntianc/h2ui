import type { CheerioAPI } from 'cheerio';
import type { LLMConfig } from './config.js';
export interface ConvertOptions {
    out: string;
    typescript: boolean;
    strict: boolean;
    split: boolean;
    cssMode: 'module' | 'scoped' | 'inline' | 'global';
    /** LLM review configuration per D-10 */
    llm?: LLMConfig;
}
export interface PipelineContext {
    html: string;
    filePath: string;
    $?: CheerioAPI;
    code?: string;
    outputPath?: string;
    warnings: string[];
    errors: string[];
    options: ConvertOptions;
    componentTree?: ComponentNode;
    repeatedPatterns?: Map<string, import('domhandler').Element[]>;
    components?: ComponentOutput[];
    cssFiles?: CSSFile[];
    llmResult?: {
        approved: boolean;
        boundary_changes: Array<{
            component_id: string;
            action: 'confirm' | 'reject' | 'modify';
            reason: string;
        }>;
        naming_suggestions: Array<{
            original: string;
            suggested: string;
            rationale: string;
        }>;
        cleanup_hints: string[];
        _fallback?: boolean | null;
    };
}
export interface PipelineStep {
    name: string;
    run(ctx: PipelineContext): Promise<PipelineContext>;
}
/** A node in the component tree */
export interface ComponentNode {
    name: string;
    tag: string;
    element: import('domhandler').Element;
    children: ComponentNode[];
    isRepeated: boolean;
    repeatCount?: number;
    cssProperties: Record<string, string>;
}
/** Per-component code output */
export interface ComponentOutput {
    name: string;
    code: string;
    cssProperties: Record<string, string>;
}
/** Generated CSS file */
export interface CSSFile {
    name: string;
    css: string;
}
/** Result of the split step */
export interface SplitResult {
    root: ComponentNode;
    flatList: ComponentNode[];
}
//# sourceMappingURL=pipeline.d.ts.map