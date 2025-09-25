export const fetchImages = async (gameName, apiKey, platform = '') => {
    if (!apiKey) {
        console.warn("GiantBomb backend disabled: no API key provided.");
        return [];
    }

    try {
        const searchUrl = `https://www.giantbomb.com/api/search/?api_key=${apiKey}&format=json&query=${encodeURIComponent(gameName)}&resources=game`;

        // Run HTTP request on OS level to avoid CORS
        const resp = await Neutralino.os.execCommand(`curl -s "${searchUrl}"`);
        const data = JSON.parse(resp.stdOut);

        if (!data.results?.length) {
            console.warn(`[GiantBomb] No results for: ${gameName}`);
            return [];
        }

        const imgSources = data.results
            .map(result => result.image?.super_url)
            .filter(url => !!url);

        if (!imgSources.length) {
            console.warn(`[GiantBomb] No images found for: ${gameName}`);
        }

        return imgSources.map(url => ({
            url,
            source: 'GiantBomb'
        }));

    } catch (err) {
        console.error(`[GiantBomb] Error: ${err.message}`);
        return [];
    }
};
