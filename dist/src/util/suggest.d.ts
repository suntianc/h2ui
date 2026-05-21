/**
 * Compute Levenshtein distance between two strings.
 * Pure function, no side effects.
 */
export declare function levenshtein(a: string, b: string): number;
/**
 * Suggest similar filenames when the input file is not found.
 * Returns top 3 matches sorted by Levenshtein distance (ascending),
 * only including matches where score < basename.length * 0.6.
 */
export declare function suggestSimilarFiles(inputFile: string, directory: string): string[];
//# sourceMappingURL=suggest.d.ts.map