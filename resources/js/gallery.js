// Global gallery state
let currentGalleryPageIndex = 0;
let currentGameIndex = 0;
let gameContainers = [];
let galleryPages = [];

function initGallery(galleryIndex, platformName = null) {
    console.log('Initializing gallery:', galleryIndex, 'for platform:', platformName);

    const galleries = document.getElementById('galleries');
    galleryPages = Array.from(galleries.querySelectorAll('.page'));

    // Find the target page
    let targetPageIndex = galleryIndex;
    if (platformName) {
        targetPageIndex = galleryPages.findIndex(page =>
            page.getAttribute('data-platform') === platformName
        );
    }

    currentGalleryPageIndex = Math.max(0, targetPageIndex);
    currentGameIndex = 0;

    updateGallery();
    setupGalleryEvents();

    // Update header
    updateGalleryHeader();
}

function updateGallery() {
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
    // Remove existing listeners
    window.removeEventListener('keydown', handleGalleryKeyDown);

    // Add new listeners
    window.addEventListener('keydown', handleGalleryKeyDown);

    // Setup game container clicks
    gameContainers.forEach((container, index) => {
        container.onclick = null; // Remove previous handlers
        container.onclick = () => {
            if (container.classList.contains('empty-platform-game-container')) return;

            if (currentGalleryPageIndex === 0) { // Settings page
                openSettingsMenu(container.getAttribute('data-platform'));
            } else {
                launchGame(container);
            }
        };

        container.oncontextmenu = (e) => {
            e.preventDefault();
            if (!container.classList.contains('empty-platform-game-container')) {
                openGameContextMenu(container, index);
            }
        };
    });
}

function handleGalleryKeyDown(event) {
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

        case 'ArrowUp':
            moveGameRow(-1);
            break;

        case 'ArrowDown':
            moveGameRow(1);
            break;

        case 'PageUp':
            moveGameRow(-10);
            break;

        case 'PageDown':
            moveGameRow(10);
            break;

        case 'Home':
            selectGame(0);
            break;

        case 'End':
            selectGame(gameContainers.length - 1);
            break;

        case 'Enter':
            activateCurrentGame();
            break;

        case 'Escape':
            returnToSlideshow();
            break;

        case 'i':
            if (!LB.kioskMode) openContextMenu();
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
}

function activateCurrentGame() {
    if (gameContainers.length === 0) return;

    const selectedGame = gameContainers[currentGameIndex];
    if (selectedGame.classList.contains('empty-platform-game-container')) return;

    if (currentGalleryPageIndex === 0) { // Settings
        openSettingsMenu(selectedGame.getAttribute('data-platform'));
    } else {
        launchGame(selectedGame);
    }
}

// Placeholder functions for game actions
function launchGame(gameContainer) {
    console.log('Launching game:', gameContainer.getAttribute('data-game-name'));
    const command = gameContainer.getAttribute('data-command');
    console.log('Command:', command);

    // TODO: Implement game launching with Neutralino
    // Neutralino.os.execCommand(command);
}

function openSettingsMenu(platformName) {
    console.log('Opening settings for:', platformName);
    // TODO: Implement settings menu
}

function openGameContextMenu(gameContainer, index) {
    console.log('Opening context menu for game:', index);
    // TODO: Implement context menu
}

function openContextMenu() {
    console.log('Opening context menu');
    // TODO: Implement general context menu
}

function returnToSlideshow() {
    window.removeEventListener('keydown', handleGalleryKeyDown);
    window.initSlideShow(currentGalleryPageIndex);
}

// Utility function
function getPlatformInfo(platformName) {
    const platform = PLATFORMS.find(p => p.name === platformName);
    if (platform) {
        return { vendor: platform.vendor, name: platform.displayName };
    }
    return { vendor: platformName, name: platformName };
}

// Export functions
window.initGallery = initGallery;
window.returnToSlideshow = returnToSlideshow;
