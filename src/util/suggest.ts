import fs from 'node:fs';
import path from 'node:path';

/**
 * Compute Levenshtein distance between two strings.
 * Pure function, no side effects.
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Use single-row optimization for space efficiency
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);

  for (let j = 0; j <= n; j++) {
    prev[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,       // deletion
        curr[j - 1] + 1,   // insertion
        prev[j - 1] + cost, // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

/**
 * Suggest similar filenames when the input file is not found.
 * Returns top 3 matches sorted by Levenshtein distance (ascending),
 * only including matches where score < basename.length * 0.6.
 */
export function suggestSimilarFiles(inputFile: string, directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const ext = path.extname(inputFile) || '.html';
  const inputBasename = path.basename(inputFile);

  let entries: string[];
  try {
    entries = fs.readdirSync(directory);
  } catch {
    return [];
  }

  // Filter to same extension and compute scores
  const scored = entries
    .filter((entry) => path.extname(entry) === ext)
    .map((entry) => ({
      name: entry,
      score: levenshtein(inputBasename, entry),
    }))
    .filter(({ name, score }) => score < inputBasename.length * 0.6)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return scored.map(({ name }) => path.join(directory, name));
}