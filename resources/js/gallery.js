import { openPlatformMenu } from './menu-forms.js';
import { getPlatformInfo } from './platforms.js';
import { cleanFileName } from './utils.js';
import { LB } from './global.js';
import { getAllCoverImageUrls } from './backends.js';
import { goToSlideshow } from './control.js';

// Global gallery state
let currentGalleryPageIndex = 0;
let currentGameIndex = 0;
let gameContainers = [];
let galleryPages = [];

function initGallery(galleryIndex, platformName = null) {
    console.log('Initializing gallery:', galleryIndex, 'for platform:', platformName);

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

    updateGallery();
    // setupGalleryEvents();

    window.currentMenuPlatform = platformName;

    // Update header
    updateGalleryHeader();

    window.addEventListener('keydown', handleGalleryKeyDown);

    // updateFooterForGallery();
}

function updateGallery() {

    document.getElementById('galleries').style.display = 'flex';

    console.info("UPDATEGALLERY: ");
    // Hide all pages
    galleryPages.forEach(page => {
        page.style.display = 'none';
    });

    // Show current page
    const currentPage = galleryPages[currentGalleryPageIndex];

    if (currentPage) {
        currentPage.style.display = 'block';

        // Get game containers for current page
        gameContainers = Array.from(currentPage.querySelectorAll('.game-container'));

        // ...existing code...

        // Update selection
        updateGameSelection();

        // Scroll to selected game
        if (gameContainers[currentGameIndex]) {
            gameContainers[currentGameIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    updateGalleryHeader();
}

function updateFooterForGallery() {
    console.log("updateControlsForGallery: ");
    const controls = document.getElementById('controls');
    controls.innerHTML = `
        <div id="dpad" class="control-item">
            <img id="dpad-icon" class="icon" src="images/controls/button-dpad-ew.png" alt="Dpad">
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
        <div id="east" class="control-item back hover" title="Back">
            <img id="east-icon" class="icon" src="images/controls/button-east.png" alt="Button - East">
            <span>Exit</span>
        </div>
    `;
    controls.querySelector(".back").addEventListener("click", goToSlideshow(window.currentMenuPlatform));

}

function updateGameSelection() {
    gameContainers.forEach((container, index) => {
        container.classList.toggle('selected', index === currentGameIndex);
    });
}

function updateGalleryHeader() {

    const currentPage = galleryPages[currentGalleryPageIndex];
    if (!currentPage) return;

    const platformName = currentPage.getAttribute('data-platform');
    const platformInfo = getPlatformInfo(platformName);
    const header = document.getElementById('header');

    header.querySelector(".next-link").addEventListener("click", nextPage);
    header.querySelector(".prev-link").addEventListener("click", prevPage);

    // Update platform name
    const platformNameEl = header.querySelector('.platform-name');
    if (platformNameEl) {
        platformNameEl.textContent = platformInfo.name;
    }

    // Update item count
    const itemNumberEl = header.querySelector('.item-number');
    const itemTypeEl = header.querySelector('.item-type');
    if (itemNumberEl && itemTypeEl) {
        const count = platformName === 'settings' ? gameContainers.length - 1 : gameContainers.length;
        const itemType = platformName === 'settings' ? 'platform' : 'game';

        itemNumberEl.textContent = count;
        itemTypeEl.textContent = count === 1 ? itemType : `${itemType}s`;
    }

    // Update platform image
    const platformImageEl = header.querySelector('.platform-image');
    if (platformImageEl) {
        platformImageEl.style.backgroundImage = `url('images/platforms/${platformName}.png')`;
    }
}

function setupGalleryEvents() {

    console.info("SETUPGALLERYEVENTS");

    // Remove existing listeners
    window.removeEventListener('keydown', handleGalleryKeyDown);

    // Add new listeners
    window.addEventListener('keydown', handleGalleryKeyDown);

    // Setup game container clicks
    // gameContainers.forEach((container, index) => {
    //     container.onclick = null; // Remove previous handlers
    //     container.onclick = () => {
    //         if (container.classList.contains('empty-platform-game-container')) return;

    //         if (currentGalleryPageIndex === 0) { // Settings page
    //             setupGalleryEvents(container.getAttribute('data-platform'));
    //         } else {
    //             launchGame(container);
    //         }
    //     };

    // });
}

async function ensureDirectory(path) {
    try {
        await Neutralino.filesystem.createDirectory(path);
    } catch (err) {
        // Ignore "already exists" error
        if (!err.message.includes('EEXIST')) {
            console.error("Failed to create directory:", path, err);
            throw err;
        }
    }
}

async function downloadImage(imgSrc, platform, gameName) {
    try {
        // Mounted covers path
        const destPath = `${LB.userDataPath}/covers/${platform}/${gameName}.jpg`;

        // NOTE: Don't call createDirectory inside mounted folder

        // Use curl to download the image (bypasses CORS)
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

    // Save the chosen image
    const savedPath = await downloadImage(img.src, platformName, gameName);
    if (!savedPath) return;

    // Use mounted path directly
    const mountedUrl = `/covers/${platformName}/${gameName}.jpg?t=${Date.now()}`;

    // Update gallery image immediately
    const galleryContainer = document.querySelector(
        `.game-container[data-platform="${platformName}"][data-game-name="${gameName}"]`
    );
    if (galleryContainer) {
        const galleryImg = galleryContainer.querySelector('img');
        if (galleryImg) {
            galleryImg.src = mountedUrl;
        }
    }

    // Close menu and refresh gallery
    document.getElementById('menu').innerHTML = '';
    const currentPage = galleryPages[currentGalleryPageIndex];
    if (currentPage) {
        gameContainers = Array.from(currentPage.querySelectorAll('.game-container'));
    }
    updateGallery();
}

export function handleGalleryKeyDown(event) {

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
        if (selected.classList.contains('menu-game-container')) {
            selectMenuImage(selected);
            console.log("selectMenuImage: ");
        } else {
            activateCurrentGame();
        }
        break;

    case 'Escape':
        console.info("Escape!", window.isGameMenuOpen, window.currentMenuPlatform);

        if (window.isGameMenuOpen) {
            closeGameMenu();
            initGallery(null, window.currentMenuPlatform);
        } else {
            goToSlideshow(window.currentMenuPlatform);
        }

        break;
    case 'i': if (!LB.kioskMode) openGameMenu(currentGameIndex); break;
    }

    updateGameSelection();
}

// Navigation functions
function nextGame() {
    if (gameContainers.length === 0) return;
    console.log("gameContainers: ", gameContainers);
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
    console.info("scrollToCurrentGame: ");
    if (gameContainers[currentGameIndex]) {
        gameContainers[currentGameIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}

function activateCurrentGame() {
    if (gameContainers.length === 0) return;

    const selectedGame = gameContainers[currentGameIndex];
    if (selectedGame.classList.contains('empty-platform-game-container')) return;

    if (document.getElementById('galleries').style.display !== 'none') {
        console.error(`Nearly launched a game (${selectedGame}), investigate that`);
        return;
    }

    if (currentGalleryPageIndex === 0) { // Settings
        openPlatformMenu(selectedGame.getAttribute('data-platform'));
    } else {
        launchGame(selectedGame);
    }
}

async function launchGame(gameContainer) {
    const gameName = gameContainer.dataset.gameName;
    const gamePath = gameContainer.dataset.gamePath;
    const emulator = gameContainer.dataset.emulator;
    const emulatorArgs = gameContainer.dataset.emulatorArgs || '';

    const command = `${emulator} ${emulatorArgs} "${gamePath}"`;
    console.log('Launching game:', gameName);
    console.log('Command:', command);

    try {
        // execCommand is async; capture stdout/stderr in callback
        await Neutralino.os.execCommand(command, (output) => {
            console.log('Command output:', output);
        });
    } catch (err) {
        console.error('execCommand failed:', err);
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
    const gameMenuContainer = document.createElement('div');
    gameMenuContainer.classList.add('page-content');
    gameMenuContainer.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

    const currentImageContainer = document.createElement('div');
    currentImageContainer.classList.add('menu-game-container');
    currentImageContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';

    const currentImage = document.createElement('img');
    currentImage.src = image.src;
    currentImage.className = 'current-image';
    currentImage.alt = 'Current game image';

    const gameLabel = document.createElement('div');
    gameLabel.classList.add('game-label');
    // gameLabel.textContent = 'Current Image';

    const manualBtn = createManualSelectButton(gameName, platformName, currentImage);

    gameLabel.appendChild(manualBtn);

    currentImageContainer.appendChild(currentImage);
    currentImageContainer.appendChild(gameLabel);

    gameMenuContainer.appendChild(currentImageContainer);

    const dummyGameContainer = document.createElement('div');
    dummyGameContainer.classList.add('menu-game-container', 'dummy-game-container');
    dummyGameContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';
    dummyGameContainer.innerHTML = `Searching...`;

    gameMenuContainer.appendChild(dummyGameContainer);

    return gameMenuContainer;
}

async function populateGameMenu(gameMenuContainer, gameName, platformName) {
    const dummyContainer = gameMenuContainer.querySelector('.dummy-game-container');

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
    } else {
        dummyContainer.remove();

        urls.forEach(({ url, source }) => {
            const img = new Image();
            img.src = url;
            img.title = `${gameName}\n\n- Found on ${source}\n- Click to download and save`;
            img.classList.add('game-image');
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.3s ease-in';

            const container = document.createElement('div');
            container.classList.add('menu-game-container');

            container.setAttribute('data-platform-name', platformName);
            container.setAttribute('data-game-name', gameName);

            container.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';
            container.appendChild(img);
            gameMenuContainer.appendChild(container);

            img.onload = () => requestAnimationFrame(() => { img.style.opacity = '1'; });
            img.onerror = () => console.warn('Failed to load image:', url);
        });
    }
}

async function openGameMenu(index) {
    console.log('Opening context menu');
    console.log("index: ", index);
    const container = gameContainers[index];
    const gameImage = container.querySelector('img');
    const gameName = container.dataset.gameName;
    const menuContainer = document.getElementById('menu');
    const galleries = document.getElementById('galleries');
    console.log("gameName: ", gameName);
    const platformName = container.dataset.platform;
    const gameMenuContainer = buildGameMenu(gameName, gameImage, platformName);
    menuContainer.appendChild(gameMenuContainer);
    await populateGameMenu(gameMenuContainer, gameName, platformName);
    window.currentMenuPlatform = platformName;
    document.querySelector('header .platform-name').textContent = cleanFileName(gameName);
    document.querySelector('header .item-type').textContent = '';
    document.querySelector('header .item-number').textContent = '';
    galleries.style.display = 'none';
    window.isGameMenuOpen = true;
    gameContainers = Array.from(document.querySelectorAll('.menu-game-container'));
}

async function closeGameMenu() {

    const menu = document.getElementById('menu');
    if (menu) {
        menu.style.display = 'none';
        menu.innerHTML = '';
    }

}

export {
    initGallery,
    updateGalleryHeader
};
