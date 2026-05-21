export interface WarningCollector {
  warnings: string[];
  add(message: string): void;
  clear(): void;
  hasWarnings(): boolean;
}

export function createWarningCollector(): WarningCollector {
  return {
    warnings: [],
    add(message: string): void {
      this.warnings.push(message);
    },
    clear(): void {
      this.warnings = [];
    },
    hasWarnings(): boolean {
      return this.warnings.length > 0;
    },
  };
}