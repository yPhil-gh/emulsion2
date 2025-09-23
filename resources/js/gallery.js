async function buildGalleries(preferences) {
    const galleriesContainer = document.getElementById('galleries');
    galleriesContainer.innerHTML = '';

    const platforms = Object.keys(preferences);

    // PAGE 0: Settings (always first)
    const settingsPage = await buildSettingsPage(preferences.settings, 0, platforms);
    if (settingsPage) {
        galleriesContainer.appendChild(settingsPage);
    }

    // PAGES 1-N: Enabled platforms
    let pageIndex = 1;
    for (const platformName of platforms) {
        if (platformName === 'settings') continue;

        const platformPrefs = preferences[platformName];
        if (platformPrefs.isEnabled) {
            const platformPage = await buildPlatformPage(platformName, platformPrefs, pageIndex);
            if (platformPage) {
                galleriesContainer.appendChild(platformPage);
                pageIndex++;
            }
        }
    }

    // LAST PAGE: Recents (if enabled)
    if (LB.recentlyPlayedPolicy === 'show') {
        const recentsPage = await buildRecentsPage(pageIndex);
        if (recentsPage) {
            galleriesContainer.appendChild(recentsPage);
            platforms.push("recents");
        }
    }

    return platforms;
}

async function buildSettingsPage(settingsPrefs, pageIndex, platforms) {
    if (LB.kioskMode) return null;

    const page = document.createElement('div');
    page.className = 'page';
    page.id = `page-settings`;
    page.setAttribute('data-index', pageIndex);
    page.setAttribute('data-platform', 'settings');

    const pageContent = document.createElement('div');
    pageContent.className = 'page-content';
    pageContent.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

    // Create platform selection entries
    platforms.forEach((platformName, i) => {
        if (platformName === 'settings') return;

        const platformContainer = document.createElement('div');
        platformContainer.className = 'game-container platform-container';
        platformContainer.setAttribute('data-platform', platformName);
        platformContainer.setAttribute('data-index', i);

        const platformInfo = getPlatformInfo(platformName);

        const platformNameElement = document.createElement('div');
        platformNameElement.className = 'platform-info';
        platformNameElement.innerHTML = `
            <span class="vendor">${platformInfo.vendor}</span><br>
            <span class="name">${platformInfo.name}</span>
        `;

        const platformImage = document.createElement('img');
        platformImage.className = 'platform-image';
        platformImage.src = `images/platforms/${platformName}.png`;
        platformImage.onerror = () => { platformImage.src = 'images/platforms/default.png'; };

        platformContainer.appendChild(platformNameElement);
        platformContainer.appendChild(platformImage);
        pageContent.appendChild(platformContainer);
    });

    page.appendChild(pageContent);
    return page;
}

async function buildPlatformPage(platformName, platformPrefs, pageIndex) {
    const page = document.createElement('div');
    page.className = 'page';
    page.id = `page-${platformName}`;
    page.setAttribute('data-index', pageIndex);
    page.setAttribute('data-platform', platformName);

    const pageContent = document.createElement('div');
    pageContent.className = 'page-content';
    pageContent.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

    // Scan for game files
    const gameFiles = await scanDirectory(platformPrefs.gamesDir, platformPrefs.extensions);

    if (gameFiles.length === 0) {
        // No games found message
        const emptyMessage = createEmptyPlatformMessage(platformPrefs.gamesDir);
        pageContent.appendChild(emptyMessage);
    } else {
        // Create game containers
        for (let i = 0; i < gameFiles.length; i++) {
            const gameContainer = await createGameContainer(platformName, platformPrefs, gameFiles[i], i);
            pageContent.appendChild(gameContainer);
        }
    }

    page.appendChild(pageContent);
    return page;
}

async function buildRecentsPage(pageIndex) {
    const recents = await loadRecentGames();
    if (!recents || recents.length === 0) return null;

    const sortedRecents = [...recents].sort((a, b) => new Date(b.date) - new Date(a.date));

    const page = document.createElement('div');
    page.className = 'page';
    page.id = 'page-recents';
    page.setAttribute('data-index', pageIndex);
    page.setAttribute('data-platform', 'recents');

    const pageContent = document.createElement('div');
    pageContent.className = 'page-content';
    pageContent.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

    sortedRecents.forEach((recent, i) => {
        const gameContainer = createRecentGameContainer(recent, i);
        pageContent.appendChild(gameContainer);
    });

    page.appendChild(pageContent);
    return page;
}

async function createGameContainer(platformName, platformPrefs, gameFilePath, index) {
    const gameContainer = document.createElement('div');
    gameContainer.className = 'game-container';

    // Get game info
    const gameInfo = await getGameInfo(platformName, gameFilePath, platformPrefs);

    gameContainer.title = `${gameInfo.cleanName}\n\nClick to launch with ${platformPrefs.emulator}`;
    gameContainer.setAttribute('data-game-name', gameInfo.fileNameWithoutExt);
    gameContainer.setAttribute('data-platform', platformName);
    gameContainer.setAttribute('data-command', buildGameCommand(platformPrefs.emulator, platformPrefs.emulatorArgs, gameInfo.launchPath));
    gameContainer.setAttribute('data-index', index);

    const gameImage = document.createElement('img');
    gameImage.className = 'game-image';
    gameImage.src = await getGameCoverPath(platformName, gameInfo.fileNameWithoutExt);
    gameImage.onerror = () => { gameImage.src = 'images/missing.png'; };

    const gameLabel = document.createElement('div');
    gameLabel.className = 'game-label';
    gameLabel.textContent = gameInfo.cleanName;

    gameContainer.appendChild(gameImage);
    gameContainer.appendChild(gameLabel);

    return gameContainer;
}

function createRecentGameContainer(recent, index) {
    const gameContainer = document.createElement('div');
    gameContainer.className = 'game-container recent-game';

    const date = new Date(recent.date);
    gameContainer.title = `${recent.gameName} (${recent.platform}) - Last played on ${date.toLocaleString()}`;

    gameContainer.setAttribute('data-game-name', recent.fileName);
    gameContainer.setAttribute('data-platform', recent.platform);
    gameContainer.setAttribute('data-index', index);

    const gameImage = document.createElement('img');
    gameImage.className = 'game-image';
    gameImage.src = getGameCoverPath(recent.platform, recent.fileName);
    gameImage.onerror = () => { gameImage.src = 'images/missing.png'; };

    const gameLabel = document.createElement('div');
    gameLabel.className = 'game-label';
    gameLabel.textContent = recent.gameName;

    gameContainer.appendChild(gameImage);
    gameContainer.appendChild(gameLabel);

    return gameContainer;
}
