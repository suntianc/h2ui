export interface WarningCollector {
    warnings: string[];
    add(message: string): void;
    clear(): void;
    hasWarnings(): boolean;
}
export declare function createWarningCollector(): WarningCollector;
//# sourceMappingURL=logger.d.ts.map