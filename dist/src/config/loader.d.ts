import type { H2uiConfig } from '../types/config.js';
export interface LoadedConfig {
    config: Partial<H2uiConfig>;
    filepath: string | undefined;
}
export declare function loadConfig(): Promise<LoadedConfig>;
//# sourceMappingURL=loader.d.ts.map