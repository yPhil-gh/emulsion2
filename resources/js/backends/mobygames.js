export const fetchImages = async (gameName, platform = '') => {

    console.log(`\nSearching MobyGames for ${gameName} (${platform})`);

    try {
        const searchUrl = `https://www.mobygames.com/search/?q=${encodeURIComponent(gameName)}`;
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) return [];

        const searchHtml = await searchResponse.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(searchHtml, 'text/html');

        // Find first link inside the main table
        const firstLink = doc.querySelector('#main > table a[href]');
        if (!firstLink) return [];

        const firstHref = firstLink.getAttribute('href');

        // Build correct URL to covers page
        const coversPage = firstHref.startsWith('http')
            ? firstHref
            : `https://www.mobygames.com${firstHref}covers/${platform}`;

        const coversResponse = await fetch(coversPage);
        if (!coversResponse.ok) return [];

        const coversHtml = await coversResponse.text();
        const coversDoc = parser.parseFromString(coversHtml, 'text/html');

        const imgElements = coversDoc.querySelectorAll('.img-holder img[src]');
        const imgSources = Array.from(imgElements).map(img => {
            const src = img.getAttribute('src');
            return src ? (src.startsWith('http') ? src : `https://www.mobygames.com${src}`) : null;
        }).filter(Boolean);

        return imgSources.map(url => ({
            url,
            source: 'MobyGames'
        }));

    } catch (err) {
        console.error(`[MobyGames] Error: ${err.message}`);
        return [];
    }
};
