export const fetchImages = async (gameName, platform = '') => {
    console.log(`Searching MobyGames for ${gameName} (${platform})`);

    try {
        const searchUrl = `https://www.mobygames.com/search/?q=${encodeURIComponent(gameName)}`;

        // Use curl to avoid CORS
        const resp = await Neutralino.os.execCommand(`curl -s "${searchUrl}"`);
        const htmlText = resp.stdOut;

        console.log("resp: ", resp.stdOut);

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        console.log("doc: ", doc);

        const firstLink = doc.querySelector('#main table a[href]');
        console.log("firstLink: ", firstLink);
        if (!firstLink) return [];

        const href = firstLink.getAttribute('href');
        const coversUrl = href.startsWith('http')
            ? href
            : `https://www.mobygames.com${href}covers/${platform}`;

        const coversResp = await Neutralino.os.execCommand(`curl -s "${coversUrl}"`);
        const coversHtml = coversResp.stdOut;
        const coversDoc = parser.parseFromString(coversHtml, 'text/html');

        const imgs = Array.from(coversDoc.querySelectorAll('.img-holder img[src]'))
            .map(img => img.getAttribute('src'))
            .filter(Boolean)
            .map(url => url.startsWith('http') ? url : `https://www.mobygames.com${url}`);

        return imgs.map(url => ({ url, source: 'MobyGames' }));
    } catch (err) {
        console.error(`[MobyGames] Error: ${err.message}`);
        return [];
    }
};
