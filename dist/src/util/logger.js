export function createWarningCollector() {
    return {
        warnings: [],
        add(message) {
            this.warnings.push(message);
        },
        clear() {
            this.warnings = [];
        },
        hasWarnings() {
            return this.warnings.length > 0;
        },
    };
}
//# sourceMappingURL=logger.js.map