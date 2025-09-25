export const fetchImages = async (gameName, platform = '') => {
    console.log(`Searching UVList for ${gameName} (${platform})`);

    try {
        const searchUrl = `https://www.uvlist.net/globalsearch/?t=${encodeURIComponent(gameName)}`;
        const searchResp = await fetch(searchUrl);
        if (!searchResp.ok) return [];

        const html = await searchResp.text();
        const doc = new DOMParser().parseFromString(html, "text/html");

        // Find the first matching row
        const row = Array.from(doc.querySelectorAll('tr'))
            .find(tr => tr.querySelector(`span.badge-companies.${getCompanyClass(platform)}`) &&
                        tr.querySelector(`a`)?.textContent.includes(gameName));

        if (!row) return [];

        const href = row.querySelector('a')?.getAttribute('href');
        if (!href) return [];

        const gameUrl = `https://www.uvlist.net${href}`;
        const gameResp = await fetch(gameUrl);
        if (!gameResp.ok) return [];

        const gameHtml = await gameResp.text();
        const gameDoc = new DOMParser().parseFromString(gameHtml, "text/html");

        const imgs = Array.from(gameDoc.querySelectorAll('div.col_gold1 img[data-background-image]'));
        const imgSources = imgs.length > 0
            ? imgs.map(el => el.getAttribute('data-background-image'))
            : [gameDoc.querySelector('div.mainImage img')?.getAttribute('src')].filter(Boolean);

        return imgSources.map(url => ({
            url: url.startsWith('http') ? url : `https://www.uvlist.net${url}`,
            source: 'UVList'
        }));

    } catch (err) {
        console.error(`[UVList] Error: ${err.message}`);
        return [];
    }
};

function getCompanyClass(platform) {
    switch (platform) {
        case 'pcengine': return 'comp_nec';
        case 'gamecube': return 'comp_ninte';
        case 'dreamcast': return 'comp_sega';
        default: return 'comp_ninte';
    }
}
