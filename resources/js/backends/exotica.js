export const fetchImages = async (gameName, platform = '') => {
    console.log(`Searching Exotica for ${gameName} (${platform})`);

    try {
        const firstLetter = gameName.charAt(0).toUpperCase();
        const url = `https://www.exotica.org.uk/wiki/Amiga_Game_Box_Scans/${firstLetter}`;
        const resp = await Neutralino.os.execCommand(`curl -s "${url}"`);
        const doc = new DOMParser().parseFromString(resp.stdOut, 'text/html');

        let gamePageUrl = null;
        doc.querySelectorAll('.gallerybox').forEach(box => {
            const galleryText = box.querySelector('.gallerytext p')?.textContent.toLowerCase() || '';
            const href = box.querySelector('a.image')?.getAttribute('href') || '';
            if (galleryText.includes(gameName.toLowerCase()) || href.toLowerCase().includes(gameName.toLowerCase())) {
                gamePageUrl = `https://www.exotica.org.uk/${href}`;
            }
        });
        if (!gamePageUrl) return [];

        console.log("gamePageUrl: ", gamePageUrl);

        const gameResp = await Neutralino.os.execCommand(`curl -s "${gamePageUrl}"`);
        const gameDoc = new DOMParser().parseFromString(gameResp.stdOut, 'text/html');
        const imageUrl = gameDoc.querySelector('div.fullImageLink a')?.getAttribute('href');
        if (!imageUrl) return [];

        const parts = imageUrl.split('/');
        const dir = parts[3];
        const sub = parts[4];
        const fileUrl = `https://www.exotica.org.uk/mediawiki/files/${dir}/${sub}/${parts.pop()}`;
        return [{ url: fileUrl, source: 'Exotica' }];
    } catch (err) {
        console.error(`[Exotica] Error: ${err.message}`);
        return [];
    }
};
