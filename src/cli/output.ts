export function showBanner(): void {
  console.log('h2ui v1.0.0 — HTML to React Component Converter');
  console.log('');
}

export function showSuccess(path: string): void {
  console.log(`\x1b[32m✓\x1b[0m Wrote: ${path}`);
}

export function showWarning(msg: string): void {
  console.warn(`\x1b[33m⚠\x1b[0m ${msg}`);
}

export function showError(msg: string): void {
  console.error(`\x1b[31m✗\x1b[0m ${msg}`);
}

export function showWarningSummary(warnings: string[]): void {
  if (warnings.length > 0) {
    console.log(`\nWarnings (${warnings.length}):`);
    warnings.forEach(w => console.warn(`  \x1b[33m⚠\x1b[0m ${w}`));
  }
}