import { cosmiconfig, defaultLoaders } from 'cosmiconfig';
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
export async function loadConfig() {
    const result = await explorer.search();
    if (!result) {
        return { config: {}, filepath: undefined };
    }
    return {
        config: result.config ?? {},
        filepath: result.filepath,
    };
}
//# sourceMappingURL=loader.js.map