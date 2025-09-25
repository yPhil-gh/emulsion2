export const fetchImages = async (gameName, platform = '') => {
    console.log(`\nSearching Exotica for ${gameName} (${platform})`);

    try {
        const firstLetter = gameName.charAt(0).toUpperCase();
        const exoticaUrl = `https://www.exotica.org.uk/wiki/Amiga_Game_Box_Scans/${firstLetter}`;

        // Fetch the Exotica page
        const searchResponse = await fetch(exoticaUrl);
        if (!searchResponse.ok) return [];

        const htmlText = await searchResponse.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        let gamePageUrl = null;

        // Search gallery boxes
        const galleryBoxes = doc.querySelectorAll('.gallerybox');
        galleryBoxes.forEach(box => {
            const galleryText = box.querySelector('.gallerytext p')?.textContent?.trim().toLowerCase() || '';
            const href = box.querySelector('a.image')?.getAttribute('href') || '';

            if (galleryText.includes(gameName.toLowerCase()) || href.toLowerCase().includes(gameName.toLowerCase())) {
                gamePageUrl = `https://www.exotica.org.uk/${href}`;
            }
        });

        if (!gamePageUrl) {
            console.error(`[Exotica] No results found for "${gameName}" (${platform})`);
            return [];
        }

        const gamePageResponse = await fetch(gamePageUrl);
        if (!gamePageResponse.ok) return [];

        const gamePageHtml = await gamePageResponse.text();
        const gameDoc = parser.parseFromString(gamePageHtml, 'text/html');

        const imageUrl = gameDoc.querySelector('div.fullImageLink a')?.getAttribute('href');
        if (!imageUrl) {
            console.error(`[Exotica] No image found for "${gameName}" (${platform})`);
            return [];
        }

        const parts = imageUrl.split('/');
        const directory = parts[3];
        const subdirectory = parts[4];
        const filesUrl = `https://www.exotica.org.uk/mediawiki/files/${directory}/${subdirectory}/`;
        const fileName = filesUrl + parts.pop();

        return [{
            url: fileName,
            source: 'Exotica'
        }];

    } catch (err) {
        console.error(`[Exotica] Error: ${err.message}`);
        return [];
    }
};
