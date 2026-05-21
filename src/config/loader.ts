import { cosmiconfig, defaultLoaders } from 'cosmiconfig';
import type { H2uiConfig } from '../types/config.js';

export interface LoadedConfig {
  config: Partial<H2uiConfig>;
  filepath: string | undefined;
}

const explorer = cosmiconfig('h2ui', {
  searchPlaces: [
    'package.json',
    '.h2uirc',
    '.h2uirc.json',
    '.config/h2uirc',
    '.config/h2uirc.json',
  ],
  loaders: {
    noExt: defaultLoaders['.json'],
  },
});

export async function loadConfig(): Promise<LoadedConfig> {
  const result = await explorer.search();

  if (!result) {
    return { config: {}, filepath: undefined };
  }

  return {
    config: (result.config as Partial<H2uiConfig>) ?? {},
    filepath: result.filepath,
  };
}