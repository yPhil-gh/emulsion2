// src/js/backends/steamgrid.js
export const fetchImages = async (gameName, APIKey) => {
    if (!APIKey) {
        console.warn('[SteamGridDB] API key missing, backend disabled.');
        return [];
    }

    try {
        // 1️⃣ Search games
        const searchUrl = `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(gameName)}`;
        const searchResp = await Neutralino.os.execCommand(`curl -s -H "Authorization: Bearer ${APIKey}" "${searchUrl}"`);
        const searchData = JSON.parse(searchResp.stdOut);
        if (!searchData.data?.length) return [];

        // 2️⃣ Take the first matching game
        const gameId = searchData.data[0].id;

        // 3️⃣ Get grids for that game
        const gridsUrl = `https://www.steamgriddb.com/api/v2/grids/game/${gameId}`;
        const gridsResp = await Neutralino.os.execCommand(`curl -s -H "Authorization: Bearer ${APIKey}" "${gridsUrl}"`);
        const gridsData = JSON.parse(gridsResp.stdOut);

        return gridsData.data.map(img => ({
            url: img.url,
            source: 'SteamGridDB'
        }));

    } catch (err) {
        console.error(`[SteamGridDB] Error: ${err.message}`);
        return [];
    }
};
