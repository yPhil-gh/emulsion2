import { openPlatformMenu } from './menu-forms.js';
import { getPlatformInfo, PLATFORMS } from './platforms.js';
import { cleanFileName } from './utils.js';
import { LB } from './global.js';
import { getAllCoverImageUrls } from './backends.js';
import { initSlideShow } from './slideshow.js';

// Global gallery state
let currentGalleryPageIndex = 0;
let currentGameIndex = 0;
let gameContainers = [];
let galleryPages = [];

export function initGallery(galleryIndex, platformName = null) {

    const galleries = document.getElementById('galleries');
    galleryPages = Array.from(galleries.querySelectorAll('.page'));

    // Determine target page index
    let targetPageIndex = galleryIndex;

    if (platformName) {
        const foundIndex = galleryPages.findIndex(page =>
            page.getAttribute('data-platform') === platformName
        );
        if (foundIndex !== -1) {
            targetPageIndex = foundIndex;
        } else {
            console.warn(`Gallery page not found for platform: ${platformName}, falling back to index ${galleryIndex}`);
        }
    }

    currentGalleryPageIndex = Math.max(0, targetPageIndex);
    currentGameIndex = 0;

    // setupGalleryEvents();

    window.addEventListener('keydown', onGalleryKeyDown);
    galleries.addEventListener('wheel', onGalleryWheel);

    updateGallery();
}

function updateGallery() {

    document.getElementById('galleries').style.display = 'flex';
    document.getElementById('menu').style.display = 'none';

    galleryPages.forEach(page => {
        page.style.display = 'none';
    });

    const currentPage = galleryPages[currentGalleryPageIndex];

    if (currentPage) {
        window.currentPlatformName = currentPage.dataset.platform;
        currentPage.style.display = 'block';

        gameContainers = Array.from(currentPage.querySelectorAll('.game-container'));

        updateGameSelection();

        if (gameContainers[currentGameIndex]) {
            gameContainers[currentGameIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    updateHeader(currentPage.dataset.platform);
    updateFooterForGallery();
}

function updateFooterForGallery() {
    const controls = document.getElementById('controls');
    controls.innerHTML = `
        <div id="dpad" class="control-item">
            <img id="dpad-icon" class="icon" src="images/controls/button-dpad-nesw.png" alt="Dpad">
            <span>Browse</span>
        </div>
        <div id="shoulders" class="control-item">
            <img id="shoulders-icon" class="icon" src="images/controls/button-shoulders.png" alt="Shoulders">
            <span>Browse</span>
        </div>
        <div id="south" class="control-item">
            <img id="south-icon" class="icon" src="images/controls/button-south.png" alt="Button - South">
            <span>Select</span>
        </div>
        <div id="west" class="control-item">
            <img id="west-icon" class="icon" src="images/controls/button-west.png" alt="Button - West">
            <span>Config</span>
        </div>
        <div class="control-item back hover" title="Back">
            <img id="east-icon" class="icon" src="images/controls/button-east.png" alt="Button - East">
            <span>Exit</span>
        </div>
    `;
    controls.querySelector(".back").addEventListener("click", () => initSlideShow(window.currentPlatformName));

}

function updateGameSelection() {
    gameContainers.forEach((container, index) => {
        container.classList.toggle('selected', index === currentGameIndex);
    });
}

function getNbGames(platformName) {
  const platform = PLATFORMS.find(p => p.name === platformName);
  return platform ? (platform.nbGames || 0) : 0;
}

export function updateHeader(platformName, gameName) {

    const header = document.getElementById('header');

    if (gameName) {
        header.querySelector('.platform-name').textContent = gameName;
        header.querySelector('.item-number').textContent = '0';
        header.querySelector('.item-type').textContent = 'images';
    } else {

        const platformInfo = getPlatformInfo(platformName);

        const platform = PLATFORMS.find(p => p.name === platformName);
        const nbGames = platform ? platform.nbGames : 0;

        const count = platformName === 'settings' ? PLATFORMS.length : nbGames;
        const itemType = platformName === 'settings' ? 'platform' : 'game';

        header.querySelector(".next-link").addEventListener("click", nextPage);
        header.querySelector(".prev-link").addEventListener("click", prevPage);

        header.querySelector('.platform-name').textContent = platformInfo.name;

        header.querySelector('.item-number').textContent = count;
        header.querySelector('.item-type').textContent = (count <= 1) ? itemType : `${itemType}s`;
    }

    header.querySelector('.platform-image').style.backgroundImage = `url('images/platforms/${platformName}.png')`;
}

async function downloadImage(imgSrc, platform, gameName) {
    try {

        const extension = imgSrc.split('.').pop();
        const imagesDir = `${LB.preferences[platform].gamesDir}/images`;
        const destPath = `${imagesDir}/${gameName}.${extension}`;

        try {
            await Neutralino.filesystem.createDirectory(imagesDir, { recursive: true });
        } catch (err) {
            console.log("createDirectory: ", err);
        }

        // Use curl to download
        const command = `curl -L "${imgSrc}" -o "${destPath}"`;
        const result = await Neutralino.os.execCommand(command);
        if (result.exitCode !== 0) {
            console.error("curl failed:", result.stdErr);
            return null;
        }

        console.log(`✅ Saved cover: ${destPath}`);
        return destPath;
    } catch (err) {
        console.error("❌ downloadImage failed:", err);
        return null;
    }
}

async function selectMenuImage(selectedMenuContainer) {
    const img = selectedMenuContainer.querySelector('img.game-image');
    if (!img) return;

    const gameName = selectedMenuContainer.dataset.gameName;
    const platformName = selectedMenuContainer.dataset.platformName;

    const savedPath = await downloadImage(img.src, platformName, gameName);
    if (!savedPath) return;

    const extension = savedPath.split('.').pop();

    const path = `/${platformName}/images/${encodeURIComponent(gameName)}.${extension}?t=${Date.now()}`;

    const galleryContainer = document.querySelector(`.game-container[data-platform="${platformName}"][data-game-name="${gameName}"]`);

    if (galleryContainer) {
        galleryContainer.querySelector('img').src = path;
        galleryContainer.classList.add('selected');
    }

    document.getElementById('menu').innerHTML = '';
    const currentPage = galleryPages[currentGalleryPageIndex];
    if (currentPage) {
        gameContainers = Array.from(currentPage.querySelectorAll('.game-container'));
    }
    updateGallery();
}

function onGalleryWheel(event) {
    event.preventDefault();
    if (event.shiftKey) {
        if (event.deltaY > 0) {
            nextPage();
        } else if (event.deltaY < 0) {
            prevPage();
        }
    } else {
        if (event.deltaY > 0) {
            simulateKeyDown('ArrowDown');
        } else if (event.deltaY < 0) {
            simulateKeyDown('ArrowUp');
        }
    }
}

export function simulateKeyDown(key) {
    const keyCode = key === 'ArrowDown' ? 40 : 38;
    const keyboardEvent = new KeyboardEvent('keydown', {
        key,
        code: key,
        keyCode,
        which: keyCode,
        bubbles: true
    });
    document.dispatchEvent(keyboardEvent);
}

export function onGalleryKeyDown(event) {
    event.stopPropagation();

    switch (event.key) {
    case 'ArrowRight':
        if (event.shiftKey) nextPage();
        else nextGame();
        break;

    case 'ArrowLeft':
        if (event.shiftKey) prevPage();
        else prevGame();
        break;

    case 'ArrowUp': moveGameRow(-1); break;
    case 'ArrowDown': moveGameRow(1); break;
    case 'PageUp': moveGameRow(-10); break;
    case 'PageDown': moveGameRow(10); break;
    case 'Home': selectGame(0); break;
    case 'End': selectGame(gameContainers.length - 1); break;

    case 'Enter':
        const selected = gameContainers[currentGameIndex];
        // Add safety checks
        if (selected && selected.classList) {
            if (selected.classList.contains('menu-game-container')) {
                selectMenuImage(selected);
            } else {
                activateCurrentGame();
            }
        }
        break;

    case 'Escape':
        if (window.isGameMenuOpen) {
            closeGameMenu();
            initGallery(null, window.currentPlatformName);
        } else {
            initSlideShow(window.currentPlatformName);
        }
        break;

    case 'i':
        if (!LB.kioskMode && gameContainers[currentGameIndex]) {
            openGameMenu(currentGameIndex);
        }
        break;
    }

    updateGameSelection();
}

// Navigation functions
function nextGame() {
    if (gameContainers.length === 0) return;
    currentGameIndex = (currentGameIndex + 1) % gameContainers.length;
    scrollToCurrentGame();
}

function prevGame() {
    if (gameContainers.length === 0) return;
    currentGameIndex = (currentGameIndex - 1 + gameContainers.length) % gameContainers.length;
    scrollToCurrentGame();
}

function nextPage() {
    currentGalleryPageIndex = (currentGalleryPageIndex + 1) % galleryPages.length;
    currentGameIndex = 0;
    updateGallery();
}

function prevPage() {
    currentGalleryPageIndex = (currentGalleryPageIndex - 1 + galleryPages.length) % galleryPages.length;
    currentGameIndex = 0;
    updateGallery();
}

function moveGameRow(rows) {
    if (gameContainers.length === 0) return;

    const col = currentGameIndex % LB.galleryNumOfCols;
    const currentRow = Math.floor(currentGameIndex / LB.galleryNumOfCols);
    const newRow = Math.max(0, Math.min(currentRow + rows,
        Math.floor((gameContainers.length - 1) / LB.galleryNumOfCols)));

    currentGameIndex = Math.min(newRow * LB.galleryNumOfCols + col, gameContainers.length - 1);
    scrollToCurrentGame();
}

function selectGame(index) {
    if (gameContainers.length === 0) return;
    currentGameIndex = Math.max(0, Math.min(index, gameContainers.length - 1));
    scrollToCurrentGame();
}

function scrollToCurrentGame() {
    if (gameContainers[currentGameIndex]) {
        gameContainers[currentGameIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
    LB.currentGameIndex = currentGameIndex;
}

function explodeGameContainer(gameContainer) {
    const numParticles = 12;
    const container = document.body;
    const rect = gameContainer.getBoundingClientRect();
    const colors = ['#FF3B3B', '#FF8C00', '#FFD700', '#32CD32', '#1E90FF', '#8A2BE2'];

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'explosion-particle';

        // Random size
        const size = 15 + Math.random() * 25;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        // Random starting offset
        const offsetXStart = (Math.random() - 0.5) * 30; // spread at spawn
        const offsetYStart = (Math.random() - 0.5) * 30;
        particle.style.setProperty('--x-start', offsetXStart + 'px');
        particle.style.setProperty('--y-start', offsetYStart + 'px');
        particle.style.setProperty('--rotation', `${-360 + Math.random() * 720}deg`);

        // Position relative to viewport
        particle.style.left = (rect.left + rect.width / 2 - size / 2) + 'px';
        particle.style.top = (rect.top + rect.height / 2 - size / 2) + 'px';

        // Random direction/distance
        const angle = Math.random() * 2 * Math.PI;
        const distance = 120 + Math.random() * 80; // was 80 + Math.random() * 100

        particle.style.setProperty('--x', Math.cos(angle) * distance + 'px');
        particle.style.setProperty('--y', Math.sin(angle) * distance + 'px');

        // Random scale
        particle.style.setProperty('--scale', 1.5 + Math.random() * 1.5);

        // Faster particles
        particle.style.animationDuration = (0.8 + Math.random() * 0.4) + 's';

        particle.addEventListener('animationend', () => particle.remove());

        fragment.appendChild(particle);
    }

    container.appendChild(fragment);
}

function activateCurrentGame() {
    if (gameContainers.length === 0) return;

    const selectedGame = gameContainers[currentGameIndex];
    if (selectedGame.classList.contains('empty-platform-game-container')) return;

    if (document.getElementById('galleries').style.display === 'none') {
        console.error(`Nearly launched a game (${selectedGame}), investigate that`);
        return;
    }

    if (currentGalleryPageIndex === 0) { // Settings
        openPlatformMenu(selectedGame.getAttribute('data-platform'));
    } else {
        launchGame(selectedGame);
    }
}

export async function launchGame(gameContainer) {
    explodeGameContainer(gameContainer);

    const fileName = gameContainer.dataset.fileName;
    const filePath = gameContainer.dataset.gamePath;
    const gameName = gameContainer.dataset.gameName;
    const emulator = gameContainer.dataset.emulator;
    const emulatorArgs = gameContainer.dataset.emulatorArgs || '';
    const platform = gameContainer.dataset.platform;

    const entry = {
        fileName,
        filePath,
        gameName,
        emulator,
        emulatorArgs,
        platform,
        date: new Date().toISOString()
    };

    const command = `${emulator} ${emulatorArgs} "${filePath}"`;

    try {
        // Launch game
        await Neutralino.os.execCommand(command);

        // Save play history
        await savePlayHistory(entry);
    } catch (err) {
        console.error("execCommand failed:", err);
    }
}

async function savePlayHistory(entry) {
    try {
        let history = [];
        try {
            const content = await Neutralino.filesystem.readFile(LB.playHistoryFilePath);
            history = JSON.parse(content);
        } catch {
            history = []; // file missing or empty
        }

        // Remove existing entry with same gameName + platform
        history = history.filter(item =>
            !(item.gameName === entry.gameName && item.platform === entry.platform)
        );

        // Add new entry
        history.push(entry);

        await Neutralino.filesystem.writeFile(
            LB.playHistoryFilePath,
            JSON.stringify(history, null, 2)
        );

        console.log(`📜 Play history updated: ${entry.gameName} [${entry.platform}]`);
    } catch (err) {
        console.error("❌ Failed to save play history:", err);
    }
}


function createManualSelectButton(gameName, platformName, imgElem) {
    const btn = document.createElement('button');
    btn.classList.add('button');
    btn.title = 'Select image';
    btn.innerHTML = '<i class="fa fa-plus" aria-hidden="true"></i>';

    btn.addEventListener('click', async e => {
        e.stopPropagation();

        // Ask the main process to show a file picker
        // const srcPath = await ipcRenderer.invoke('pick-image');

        const srcPath = await Neutralino.os.showOpenDialog('Select Image', {
            filters: [{ name: 'Executables', extensions: ['png', 'jpg', 'webp', '*'] }],
            multiple: false
        });
        if (!srcPath) return;  // user cancelled

        // Destination in user data covers folder
        const destPath = path.join(
            LB.userDataPath,
            'covers',
            platformName,
            `${gameName}.jpg`
        );

        // Update the img element to the new file (with cache‐bust)
        imgElem.src = `file://${destPath}?${Date.now()}`;

        // Tell main to copy the file
        const ok = await ipcRenderer.invoke('save-cover', srcPath, destPath);
        console.log(ok
                    ? `Cover saved to ${destPath}`
                    : 'Failed to save cover');
    });

    return btn;
}

function buildGameMenu(gameName, image, platformName) {
    const pageContent = document.createElement('div');
    pageContent.classList.add('page-content');
    pageContent.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

    const menuGameContainer = document.createElement('div');
    menuGameContainer.classList.add('menu-game-container');
    menuGameContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';

    const currentImage = document.createElement('img');
    currentImage.src = image.src;
    currentImage.className = 'current-image';
    currentImage.alt = 'Current game image';

    const gameLabel = document.createElement('div');
    gameLabel.classList.add('game-label');
    // gameLabel.textContent = 'Current Image';

    const manualBtn = createManualSelectButton(gameName, platformName, currentImage);

    gameLabel.appendChild(manualBtn);

    menuGameContainer.appendChild(currentImage);
    menuGameContainer.appendChild(gameLabel);

    const dummyGameContainer = document.createElement('div');
    dummyGameContainer.classList.add('menu-game-container', 'dummy-game-container');
    dummyGameContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';
    dummyGameContainer.innerHTML = `Searching...`;

    pageContent.appendChild(menuGameContainer);
    pageContent.appendChild(dummyGameContainer);

    return pageContent;
}

async function populateGameMenu(gameMenuContainer, gameName, platformName) {
    const dummyContainer = gameMenuContainer.querySelector('.dummy-game-container');

    const header = document.getElementById('header');

    const itemNumberSpan = header.querySelector('.item-number'); // 🔑
    let nbImgs = 0;

    const urls = await getAllCoverImageUrls(gameName, platformName, {
        steamGridAPIKey: LB.steamGridAPIKey,
        giantBombAPIKey: LB.giantBombAPIKey
    });

    if (urls.length === 0) {
        dummyContainer.textContent = '';
        const iconP = document.createElement('p');
        iconP.innerHTML = `<i class="fa fa-binoculars fa-5x" aria-hidden="true"></i>`;
        const msgP  = document.createElement('p');
        msgP.textContent = `No cover art found`;
        dummyContainer.append(iconP, msgP);
        dummyContainer.style.gridColumn = `2 / calc(${LB.galleryNumOfCols} + 1)`;
        dummyContainer.style.animation = 'unset';
        if(itemNumberSpan) itemNumberSpan.textContent = "0";
    } else {
        dummyContainer.remove();

        const sourcesMeta = {
            steamgriddb: { name: "SteamGridDB", icon: "fa-steam-square" },
            giantbomb:   { name: "Giant Bomb",    icon: "fa-bomb" },
            wikipedia:   { name: "Wikipedia",     icon: "fa-wikipedia-w" }
        };

        urls.forEach(({ url, source }) => {
            const img = new Image();
            img.src = url;
            img.title = `${gameName}\n\n- Found on ${sourcesMeta[source]?.name}\n- Click to download and save`;
            img.classList.add('game-image');
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.3s ease-in';

            const container = document.createElement('div');
            container.classList.add('menu-game-container');
            container.setAttribute('data-platform-name', platformName);
            container.setAttribute('data-game-name', gameName);
            container.style.position = 'relative';
            container.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';

            // Add the image
            container.appendChild(img);

            // Add FA icon overlay
            const icon = document.createElement('i');
            icon.classList.add('fa', 'fa-2x', sourcesMeta[source]?.icon);
            icon.title = `Found on ${sourcesMeta[source]?.name}`;
            icon.style.position = 'absolute';
            icon.style.bottom = '8px';
            icon.style.right = '8px';
            icon.style.fontSize = '1.5rem';
            icon.style.color = 'white';
            icon.style.textShadow = '0 0 5px rgba(0,0,0,0.7)';

            container.appendChild(icon);

            gameMenuContainer.appendChild(container);

            container.addEventListener("click", () => {
                selectMenuImage(container);
            });

            img.onload = () => {
                requestAnimationFrame(() => { img.style.opacity = '1'; });
                nbImgs++;
                if (itemNumberSpan) itemNumberSpan.textContent = nbImgs;
            };

            img.onerror = () => console.warn('Failed to load image:', url);
        });
    }
}


export async function openGameMenu(index) {
    const container = gameContainers[index];
    const gameImage = container.querySelector('img');
    const gameName = container.dataset.gameName;
    const menu = document.getElementById('menu');
    const galleries = document.getElementById('galleries');
    const platformName = container.dataset.platform;
    const gameMenu = buildGameMenu(gameName, gameImage, platformName);
    menu.appendChild(gameMenu);
    galleries.style.display = 'none';
    menu.style.display = 'flex';
    updateHeader(platformName, gameName);
    await populateGameMenu(gameMenu, gameName, platformName);
    window.currentPlatformName = platformName;
    window.isGameMenuOpen = true;
    gameContainers = Array.from(document.querySelectorAll('.menu-game-container'));
}

async function closeGameMenu() {
    const menu = document.getElementById('menu');
    menu.style.display = 'none';
    menu.innerHTML = '';
}
