// import fetch from 'node-fetch';
// import { parse } from 'node-html-parser';

export const fetchImages = async (gameName, platform = '') => {
    console.log(`\n[Exotica Backend] Searching for ${gameName} (${platform})`);

    try {
        const firstLetter = gameName.charAt(0).toUpperCase();
        const exoticaUrl = `https://www.exotica.org.uk/wiki/Amiga_Game_Box_Scans/${firstLetter}`;

        const searchResp = await fetch(exoticaUrl);
        if (!searchResp.ok) return [];

        const htmlText = await searchResp.text();
        const root = parse(htmlText);

        let gamePageUrl = null;
        const galleryBoxes = root.querySelectorAll('.gallerybox');

        for (const box of galleryBoxes) {
            const galleryText = box.querySelector('.gallerytext p')?.text?.trim().toLowerCase() || '';
            const href = box.querySelector('a.image')?.getAttribute('href') || '';
            if (galleryText.includes(gameName.toLowerCase()) || href.toLowerCase().includes(gameName.toLowerCase())) {
                gamePageUrl = `https://www.exotica.org.uk/${href}`;
                break;
            }
        }

        if (!gamePageUrl) return [];

        const gamePageResp = await fetch(gamePageUrl);
        if (!gamePageResp.ok) return [];

        const gameHtml = await gamePageResp.text();
        const gameDoc = parse(gameHtml);

        const imageUrl = gameDoc.querySelector('div.fullImageLink a')?.getAttribute('href');
        if (!imageUrl) return [];

        const parts = imageUrl.split('/');
        const directory = parts[3];
        const subdirectory = parts[4];
        const filesUrl = `https://www.exotica.org.uk/mediawiki/files/${directory}/${subdirectory}/`;
        const fileName = filesUrl + parts.pop();

        return [{ url: fileName, source: 'Exotica' }];

    } catch (err) {
        console.error(`[Exotica Backend] Error: ${err.message}`);
        return [];
    }
};
