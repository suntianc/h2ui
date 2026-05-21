/**
 * Extract <style> tags from HTML head/body and convert to CSS Module files.
 * Returns array of CSSFiles named after their origin (e.g. 'global').
 */
export function extractStyleTags($, warnings) {
    const cssFiles = [];
    $('style').each((i, el) => {
        const cssContent = $(el).html() || '';
        if (!cssContent.trim())
            return;
        const name = i === 0 ? 'global' : `global-${i + 1}`;
        // Use the raw CSS content as-is (already valid CSS)
        const processedCSS = cssContent.trim();
        cssFiles.push({
            name,
            css: processedCSS,
        });
        warnings.push(`Extracted <style> tag ${i + 1} to ${name}.module.css`);
    });
    return cssFiles;
}
//# sourceMappingURL=style-tag.js.map