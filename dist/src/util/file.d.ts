/**
 * Convert a filename to PascalCase component name.
 * Examples: chat.html → Chat, user-profile.html → UserProfile, index.html → Index
 */
export declare function toPascalCase(filename: string): string;
/**
 * Derive the output filename from the input path.
 * chat.html → Chat.tsx (or Chat.jsx if isTypescript is false)
 */
export declare function getOutputFilename(inputPath: string, isTypescript: boolean): string;
/**
 * Read file content as UTF-8 string.
 */
export declare function readFile(filePath: string): Promise<string>;
/**
 * Write content to a file, creating parent directories if needed.
 * Returns the absolute path of the written file.
 */
export declare function writeFile(outputPath: string, content: string): Promise<string>;
/**
 * Check if a file exists and is accessible.
 */
export declare function fileExists(filePath: string): Promise<boolean>;
//# sourceMappingURL=file.d.ts.map