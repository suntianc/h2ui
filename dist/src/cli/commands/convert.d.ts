import type { H2uiConfig } from '../../types/config.js';
export declare function convertCommand(file: string, options: {
    out?: string;
    typescript?: boolean;
    strict?: boolean;
    split?: boolean;
    llm?: boolean;
    llmProvider?: string;
    llmModel?: string;
    llmMode?: string;
}, configFile?: Partial<H2uiConfig>): Promise<void>;
//# sourceMappingURL=convert.d.ts.map