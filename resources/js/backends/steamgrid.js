export const fetchImages = async (gameName, APIKey) => {
    if (!APIKey) return [];

    try {
        // Search games
        const searchUrl = `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(gameName)}`;
        const searchResp = await fetch(searchUrl, {
            headers: { Authorization: `Bearer ${APIKey}` }
        });
        if (!searchResp.ok) return [];

        const searchData = await searchResp.json();
        if (!searchData.data?.length) return [];

        // Take the first matching game
        const gameId = searchData.data[0].id;

        // Get grids for that game
        const gridsUrl = `https://www.steamgriddb.com/api/v2/grids/game/${gameId}`;
        const gridsResp = await fetch(gridsUrl, {
            headers: { Authorization: `Bearer ${APIKey}` }
        });
        if (!gridsResp.ok) return [];

        const gridsData = await gridsResp.json();
        return gridsData.data.map(img => ({
            url: img.url,
            source: 'SteamGridDB'
        }));

    } catch (err) {
        console.error(`[SteamGridDB] Error: ${err.message}`);
        return [];
    }
};
