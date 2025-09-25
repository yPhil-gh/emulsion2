export const fetchImages = async (gameName, platform = '') => {
    console.log(`Searching Wikipedia for ${gameName} (${platform})`);

    try {
        const firstLetter = gameName.charAt(0).toUpperCase();
        const categoryUrl = `https://en.wikipedia.org/w/index.php?title=Category:Amiga_game_covers&from=${firstLetter}`;

        const searchResp = await fetch(categoryUrl);
        if (!searchResp.ok) return [];

        const searchHtml = await searchResp.text();
        const doc = new DOMParser().parseFromString(searchHtml, "text/html");

        const baseGameName = gameName
            .replace(/\s*v?\d+\.\d+.*$/i, '')
            .toLowerCase();

        // Search category links
        let gamePagePath = null;
        const links = Array.from(doc.querySelectorAll('div.mw-category-group a'));
        for (const link of links) {
            const href = link.getAttribute('href') || '';
            const title = link.getAttribute('title') || '';
            const normalized = href
                .replace('/wiki/File:', '')
                .replace(/_Coverart\.png$/i, '')
                .replace(/_/g, ' ')
                .toLowerCase();

            if (normalized.includes(baseGameName) || title.toLowerCase().includes(baseGameName)) {
                gamePagePath = href;
                break;
            }
        }

        if (!gamePagePath) return [];

        const gamePageUrl = `https://en.wikipedia.org${gamePagePath}`;
        const gamePageResp = await fetch(gamePageUrl);
        if (!gamePageResp.ok) return [];

        const gamePageHtml = await gamePageResp.text();
        const gameDoc = new DOMParser().parseFromString(gamePageHtml, "text/html");

        const imgSources = Array.from(gameDoc.querySelectorAll('div.fullImageLink a'))
            .map(a => {
                const href = a.getAttribute('href');
                if (!href) return null;
                return href.startsWith('//') ? `https:${href}` : href;
            })
            .filter(Boolean);

        return imgSources.map(url => ({
            url,
            source: 'Wikipedia'
        }));

    } catch (err) {
        console.error(`[Wikipedia] Error: ${err.message}`);
        return [];
    }
};
