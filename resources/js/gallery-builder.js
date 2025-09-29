import { PLATFORMS } from './platforms.js';
import { openPlatformMenu } from './menu-forms.js';
import { LB } from './global.js';
import { getPlatformInfo } from './platforms.js';
import { launchGame, openGameMenu } from './gallery.js';

// gallery-builder.js (fixed & portable)

async function buildGalleries(preferences) {

    const galleriesContainer = document.getElementById('galleries');
    if (!galleriesContainer) {
        console.error('No #galleries container found');
        return;
    }
    galleriesContainer.innerHTML = '';

    LB.enabledPlatforms = [];
    let trueIndex = 0;

    // Build settings page first (always index 0 unless kiosk mode)
    const settingsPage = await buildSettingsPage(preferences, trueIndex);
    const settingsIncluded = !!settingsPage;
    if (settingsPage) {
        galleriesContainer.appendChild(settingsPage);
        trueIndex++;
    }

    // Build platform pages - iterate through PLATFORMS array (canonical order)
    for (const platform of PLATFORMS) {
        const platformPrefs = preferences?.[platform.name];

        // Only build page if platform has prefs and is enabled
        if (platformPrefs && platformPrefs.isEnabled) {
            const platformPage = await buildPlatformPage(platform.name, platformPrefs, trueIndex);
            if (platformPage) {
                galleriesContainer.appendChild(platformPage);
                LB.enabledPlatforms.push(platform.name);
                trueIndex++;
            }
        } else {
            // platform disabled or missing prefs => skip
        }
    }

    // Build recents page if user wants to show it
    if ((preferences?.settings?.recentlyPlayedPolicy || 'hide') === 'show') {
        const recentsPage = await buildRecentsPage(trueIndex);
        if (recentsPage) {
            galleriesContainer.appendChild(recentsPage);
            trueIndex++;
        }
    }

}

function buildSettingsPageContainer({ platform, index, vendor = '', displayName = '', imgSrc, onClick, isSpecial = false }) {
    const container = document.createElement('div');
    container.className = `game-container platform-container settings${isSpecial ? ' special' : ''}`;
    container.setAttribute('data-platform', platform);
    container.setAttribute('data-index', index);

    const info = document.createElement('div');
    info.className = 'platform-info';
    info.innerHTML = vendor || displayName
        ? `<span class="vendor">${vendor}</span><br><span class="name">${displayName}</span>`
        : `<span class="name">${displayName || platform}</span>`;

    const image = document.createElement('img');
    image.className = 'platform-image game-image';
    image.src = imgSrc;
    image.onerror = () => { image.src = 'images/platforms/settings.png'; };

    container.appendChild(info);
    container.appendChild(image);

    if (typeof onClick === 'function') {
        container.addEventListener('click', onClick);
    }

    return container;
}

async function buildSettingsPage(preferences, index) {
    if (LB.kioskMode) return null;

    const page = document.createElement('div');
    page.className = 'page';
    page.id = `page${index}`;
    page.setAttribute('data-index', index);
    page.setAttribute('data-platform', 'settings');

    const pageContent = document.createElement('div');
    pageContent.className = 'page-content';
    pageContent.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

    const settingsContainer = buildSettingsPageContainer({
        platform: 'settings',
        vendor: 'Emulsion',
        index: -1,
        displayName: 'Settings',
        imgSrc: 'images/platforms/settings.png',
        isSpecial: true,
        onClick: () => openPlatformMenu('settings')
    });
    pageContent.appendChild(settingsContainer);

    PLATFORMS.forEach((platform, i) => {
        const info = getPlatformInfo(platform.name);
        const platformContainer = buildSettingsPageContainer({
            platform: platform.name,
            index: i,
            vendor: info.vendor,
            displayName: info.name,
            imgSrc: `images/platforms/${platform.name}.png`,
            onClick: () => openPlatformMenu(platform.name)
        });
        pageContent.appendChild(platformContainer);
    });

    page.appendChild(pageContent);
    return page;
}

function incrementNbGames(platformName) {
    const platform = PLATFORMS.find(p => p.name === platformName);
    if (platform) {
        platform.nbGames++;
    } else {
        console.warn(`Platform not found: ${platformName}`);
    }
}

async function buildPlatformPage(platform, platformPrefs = {}, index) {
    const page = document.createElement('div');
    page.className = 'page';
    page.id = `page${index}`;
    page.setAttribute('data-index', index);
    page.setAttribute('data-platform', platform);
    page.style.display = 'flex';

    const pageContent = document.createElement('div');
    pageContent.className = 'page-content';
    pageContent.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

    // Ensure sensible defaults for extensions
    const extensions = (platformPrefs.extensions && platformPrefs.extensions.length > 0)
        ? platformPrefs.extensions
        : ['.zip'];

    // If no gamesDir, show informative message
    if (!platformPrefs.gamesDir) {
        const emptyMessage = createEmptyPlatformMessage(platformPrefs.gamesDir || '(not configured)');
        pageContent.appendChild(emptyMessage);
        page.appendChild(pageContent);
        return page;
    }

    let gameFiles = await scanForGameFiles(platformPrefs.gamesDir, extensions);

    if (!gameFiles || gameFiles.length === 0) {
        // No games found: display friendly message
        const emptyMessage = createEmptyPlatformMessage(platformPrefs.gamesDir);
        pageContent.appendChild(emptyMessage);
    } else {
        // Sort alphabetically, case-insensitive
        gameFiles.sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: 'base' })
        );

        for (let i = 0; i < gameFiles.length; i++) {
            try {
                const gameEntry = await buildGameContainer(platform, platformPrefs, gameFiles[i], i);
                pageContent.appendChild(gameEntry);
                incrementNbGames(platform);
            } catch (err) {
                console.error('Error creating game entry for', gameFiles[i], err);
            }
        }
    }

    document.getElementById('splash-loading-platform-name').textContent = getPlatformInfo(platform).name;

    page.appendChild(pageContent);
    return page;
}

async function loadRecentGames() {
    try {
        const content = await Neutralino.filesystem.readFile(LB.playHistoryFilePath);
        if (!content) return [];

        const recents = JSON.parse(content);

        // validate: must be array with required fields
        if (!Array.isArray(recents)) return [];

        return recents.map(r => ({
            gameName: r.gameName || 'Unknown',
            platform: r.platform || 'Unknown',
            fileName: r.fileName || '',
            filePath: r.filePath || '',
            emulator: r.emulator || '',
            emulatorArgs: r.emulatorArgs || '',
            date: r.date || new Date().toISOString()
        }));
    } catch (err) {
        // if file doesn’t exist or is malformed, return []
        console.warn("⚠️ No recent games found:", err.message);
        return [];
    }
}

async function buildRecentsPage(index) {
    const recents = await loadRecentGames();
    if (!recents || recents.length === 0) return null;

    const page = document.createElement('div');
    page.className = 'page';
    page.id = `page${index}`;
    page.setAttribute('data-index', index);
    page.setAttribute('data-platform', 'recents');

    const pageContent = document.createElement('div');
    pageContent.className = 'page-content';
    pageContent.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

    // Sort recents by date descending
    const sortedRecents = [...recents].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedRecents.forEach((recent, i) => {
        const gameContainer = document.createElement('div');
        gameContainer.className = 'game-container selected';

        // Build detailed title
        const titleParts = [
            recent.gameName,
            recent.platform,
            recent.emulator,
        ].filter(Boolean);
        gameContainer.title = `${titleParts.join(' ')}\nClick to launch with ${recent.emulator}`;

        // Set data attributes
        gameContainer.setAttribute('data-game-name', recent.gameName);
        gameContainer.setAttribute('data-platform', recent.platform);
        gameContainer.setAttribute('data-emulator', recent.emulator || '');
        gameContainer.setAttribute('data-emulator-args', recent.emulatorArgs || '');
        gameContainer.setAttribute('data-game-path', recent.filePath);
        gameContainer.setAttribute('data-index', i);

        // Image element
        const gameImage = document.createElement('img');
        gameImage.className = 'game-image';
        // Try all extensions (jpg, png, webp)
        const encodedName = encodeURIComponent(recent.gameName);
        gameImage.src = `/${recent.platform}/images/${encodedName}.jpg`; // fallback, can check png/webp if needed
        gameImage.onerror = () => { gameImage.src = 'images/missing.png'; };

        // Game label
        const gameLabel = document.createElement('div');
        gameLabel.className = 'game-label';
        gameLabel.textContent = recent.gameName;

        // Assemble container
        gameContainer.appendChild(gameImage);
        gameContainer.appendChild(gameLabel);
        pageContent.appendChild(gameContainer);
    });

    LB.nbOfRecents = sortedRecents.length;

    page.appendChild(pageContent);
    return page;
}

async function buildGameContainer(platform, platformPrefs, gameFilePath, index) {
    const gameContainer = document.createElement('div');
    gameContainer.className = 'game-container';

    // Get game info
    const gameInfo = getGameInfo(platform, gameFilePath, platformPrefs);

    // gameContainer.setAttribute('data-tooltip', `${gameInfo.cleanName}\n\nClick to launch with ${platformPrefs.emulator}`);

    gameContainer.setAttribute('data-game-name', gameInfo.fileNameWithoutExt);
    gameContainer.setAttribute('data-platform', platform);
    gameContainer.setAttribute('data-emulator', platformPrefs.emulator || '');
    gameContainer.setAttribute('data-emulator-args', platformPrefs.emulatorArgs || '');
    gameContainer.setAttribute('data-game-path', gameInfo.launchPath);
    gameContainer.setAttribute('data-index', index);

    const gameImage = document.createElement('img');
    gameImage.className = 'game-image';

    const basePath = `/${platform}/images/${encodeURIComponent(gameInfo.fileNameWithoutExt)}`;
    gameImage.src = `${basePath}.jpg`;

    gameImage.onerror = () => {
        if (gameImage.src.endsWith('.jpg')) {
            // Retry with PNG if JPG is missing
            gameImage.src = `${basePath}.png`;
        } else {
            // Fallback to default "missing" image
            gameImage.src = 'images/missing.png';
        }
    };

    const gameLabel = document.createElement('div');
    gameLabel.className = 'game-label';
    gameLabel.textContent = gameInfo.cleanName;
    // Create the tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.innerHTML = `
  <h4>${gameInfo.cleanName}</h4>
  Click to launch with <code>${platformPrefs.emulator || 'unknown'}</code>
`;

    // Append to your game container
    gameContainer.appendChild(tooltip);
    gameContainer.appendChild(gameImage);
    gameContainer.appendChild(gameLabel);

    gameContainer.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        openGameMenu(index);
    });

    gameContainer.addEventListener("click", () => {
        launchGame(gameContainer);
    });

    return gameContainer;
}

// Utility functions

async function scanForGameFiles(gamesDir, extensions) {
    if (!gamesDir) return [];

    try {
        const entries = await Neutralino.filesystem.readDirectory(gamesDir);

        // Neutralino returns objects with fields like { entry, path, type }
        return entries
            .filter(entry => entry && entry.type === "FILE" && (entry.entry || entry.path))
            .filter(entry => {
                const filename = (entry.entry || (entry.path && entry.path.split('/').pop()) || '').toString();
                if (!filename) return false;
                return extensions.some(ext => filename.toLowerCase().endsWith(ext.toLowerCase()));
            })
            .map(entry => {
                // prefer the full path if available
                return entry.path || `${gamesDir}/${entry.entry}`;
            });
    } catch (error) {
        console.error("Error scanning directory:", gamesDir, error);
        return [];
    }
}

function getGameInfo(platformName, gameFilePath, prefs) {
    let launchPath = gameFilePath;
    let fileName = (gameFilePath && gameFilePath.split('/').pop()) || '';
    let fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    let cleanName = cleanFileName(fileNameWithoutExt);

    // Platform-specific processing (placeholder)
    if (platformName === 'ps3') {
        // TODO: Implement PS3 SFO parsing for Neutralino
        launchPath = getEbootPath(gameFilePath);
    }

    return { cleanName, fileNameWithoutExt, launchPath };
}

// function getGameCoverPath(platformName, fileNameWithoutExt) {
//     const encodedFileName = encodeURIComponent(fileNameWithoutExt) + '.jpg';
//     return `/covers/${platformName}/${encodedFileName}`;
// }

function createEmptyPlatformMessage(gamesDir) {
    const message = document.createElement('div');
    message.className = 'empty-platform-message';
    // Let it span a couple columns for nicer layout; adjust in CSS if needed
    message.style.gridColumn = '1 / span 2';
    message.innerHTML = `
        <p><i class="fa fa-heartbeat fa-5x" aria-hidden="true"></i></p>
        <p>No game files found in</p>
        <p><code>${escapeHtml(gamesDir || '(not configured)')}</code></p>
    `;
    return message;
}

function cleanFileName(fileName) {
    // Replace underscores and many punctuation with spaces, collapse spaces, trim
    return (fileName || '')
        .replace(/[_\.\-]+/g, ' ')
        .replace(/[^a-zA-Z0-9 \u00C0-\u024F]/g, ' ') // allow unicode letters
        .replace(/\s+/g, ' ')
        .trim();
}

function getEbootPath(gameFile) {
    const idx = gameFile.lastIndexOf('/');
    const gameDir = idx !== -1 ? gameFile.substring(0, idx) : gameFile;
    return `${gameDir}/USRDIR/EBOOT.BIN`;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export { buildGalleries };
