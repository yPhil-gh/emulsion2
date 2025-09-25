import { cleanFileName } from '../utils.js';

export const fetchImages = async (gameName) => {

    try {
        const sanitizedName = cleanFileName(gameName);

        // Search pages containing the game name
        const searchUrl = new URL('https://en.wikipedia.org/w/api.php');
        searchUrl.searchParams.set('action', 'query');
        searchUrl.searchParams.set('format', 'json');
        searchUrl.searchParams.set('origin', '*');
        searchUrl.searchParams.set('list', 'search');
        searchUrl.searchParams.set('srsearch', sanitizedName);
        searchUrl.searchParams.set('srlimit', '10');

        const searchResp = await fetch(searchUrl.toString());
        if (!searchResp.ok) return [];
        const searchData = await searchResp.json();

        const pageTitles = (searchData.query?.search || [])
            .map(p => p.title);

        if (!pageTitles.length) return [];

        const fileTitles = [];

        // For each page, get its images
        for (const title of pageTitles) {
            const imagesUrl = new URL('https://en.wikipedia.org/w/api.php');
            imagesUrl.searchParams.set('action', 'query');
            imagesUrl.searchParams.set('format', 'json');
            imagesUrl.searchParams.set('origin', '*');
            imagesUrl.searchParams.set('titles', title);
            imagesUrl.searchParams.set('prop', 'images');
            imagesUrl.searchParams.set('imlimit', 'max');

            const resp = await fetch(imagesUrl.toString());
            if (!resp.ok) continue;

            const data = await resp.json();
            const pages = Object.values(data.query.pages || {});
            for (const page of pages) {
                const imgs = page.images || [];
                for (const img of imgs) {
                    const t = img.title?.toLowerCase();
                    if (t && (t.includes('cover') || t.includes('box') || t.includes('case'))) {
                        fileTitles.push(img.title);
                    }
                }
            }
        }

        if (!fileTitles.length) return [];

        // 3️⃣ Fetch the actual image URLs
        const images = [];
        for (const fileTitle of fileTitles) {
            const infoUrl = new URL('https://en.wikipedia.org/w/api.php');
            infoUrl.searchParams.set('action', 'query');
            infoUrl.searchParams.set('format', 'json');
            infoUrl.searchParams.set('origin', '*');
            infoUrl.searchParams.set('titles', fileTitle);
            infoUrl.searchParams.set('prop', 'imageinfo');
            infoUrl.searchParams.set('iiprop', 'url');

            const infoResp = await fetch(infoUrl.toString());
            if (!infoResp.ok) continue;
            const infoData = await infoResp.json();
            const page = Object.values(infoData.query.pages)[0];
            const url = page?.imageinfo?.[0]?.url;
            if (url) images.push({ url, source: 'Wikipedia' });
        }

        return images;

    } catch (err) {
        console.error(`[Wikipedia] Error: ${err.message}`);
        return [];
    }
};
