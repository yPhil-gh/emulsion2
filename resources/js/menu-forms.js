    // Store the last selected slideshow index for return
    if (typeof window.lastSlideshowIndex === 'undefined') window.lastSlideshowIndex = 0;
    const slides = document.querySelectorAll('.slide');
    for (let i = 0; i < slides.length; i++) {
        if (slides[i].dataset.platform === platformName) {
            window.lastSlideshowIndex = Number(slides[i].dataset.index);
            break;
        }
    }



window.isMenuOpen = false;
window.currentMenuPlatform = null;

function openPlatformMenu(platformName) {
    console.log('Opening menu for platform:', platformName);

    const menu = document.getElementById('menu');
    const header = document.getElementById('header');
    if (!menu || !header) {
        console.error('Menu or header DOM element missing.');
        return;
    }

    // Clear previous menu
    menu.innerHTML = '';

    // Ensure preferences are loaded
    if (!LB.preferences) {
        console.error('Preferences not loaded.');
        return;
    }

    // Build the appropriate menu
    if (platformName === 'settings') {
        menu.appendChild(buildPreferencesForm());
        const platformNameEl = header.querySelector('.platform-name');
        if (platformNameEl) platformNameEl.textContent = 'Settings';
    } else {
        menu.appendChild(buildPlatformForm(platformName));
        const platformInfo = getPlatformInfo(platformName);
        const platformNameEl = header.querySelector('.platform-name');
        if (platformNameEl) platformNameEl.textContent = `Configure ${platformInfo.name}`;
    }

    // Show menu and hide galleries
    menu.style.display = 'block';
    const galleries = document.getElementById('galleries');
    if (galleries) galleries.style.display = 'none';
    const prevLink = document.querySelector('#header .prev-link');
    if (prevLink) prevLink.style.opacity = 0;
    const nextLink = document.querySelector('#header .next-link');
    if (nextLink) nextLink.style.opacity = 0;

    // Update controls for menu mode
    updateControlsForMenu();

    // Set up menu keyboard handling
    window.removeEventListener('keydown', handleGalleryKeyDown);
    window.addEventListener('keydown', handleMenuKeyDown);

    window.isMenuOpen = true;
    window.currentMenuPlatform = platformName;
}

function closePlatformMenu() {
    console.log('Closing menu');

    const menu = document.getElementById('menu');
    const galleries = document.getElementById('galleries');

    // Hide menu and show galleries
    menu.style.display = 'none';
    menu.innerHTML = '';
    galleries.style.display = 'flex';
    document.querySelector('#header .prev-link').style.opacity = 1;
    document.querySelector('#header .next-link').style.opacity = 1;

    // Restore gallery controls
    updateControlsForGallery();

    // Restore gallery keyboard handling
    window.removeEventListener('keydown', handleMenuKeyDown);
    if (typeof handleGalleryKeyDown === 'function') {
        window.addEventListener('keydown', handleGalleryKeyDown);
    }

    // Update header for current gallery page
    if (typeof updateGalleryHeader === 'function') {
        updateGalleryHeader();
    }

    window.isMenuOpen = false;
    window.currentMenuPlatform = null;
}

function handleMenuKeyDown(event) {
    event.stopPropagation();

    switch (event.key) {
        case 'Escape':
            closePlatformMenu();
            // Restore slideshow view and activate last slide
            const slideshow = document.getElementById('slideshow');
            const galleries = document.getElementById('galleries');
            const header = document.getElementById('header');
            if (slideshow) slideshow.style.display = 'flex';
            if (galleries) galleries.style.display = 'none';
            if (header) header.style.display = 'none';
            if (typeof window.returnToSlideshow === 'function') {
                window.returnToSlideshow(window.lastSlideshowIndex);
            }
            break;
        case 'Enter':
            // Handle form submission if needed
            break;
        case 's':
            if (event.ctrlKey) {
                // Ctrl+S to save
                event.preventDefault();
                saveCurrentMenu();
            }
            break;
    }
}

function buildPreferencesForm() {
    const formContainer = document.createElement('div');
    formContainer.classList.add('platform-menu-container');

    // Platform image
    const platformMenuImageCtn = document.createElement('div');
    platformMenuImageCtn.classList.add('platform-menu-image-ctn');
    const platformMenuImage = document.createElement('img');
    platformMenuImage.src = 'images/platforms/settings.png';
    platformMenuImage.width = '250';
    platformMenuImageCtn.appendChild(platformMenuImage);

    // Number of columns
    const numberOfColumnsGroup = createFormGroup('numberOfColumns', 'Number of columns');
    const numberOfColumnsInput = document.createElement('input');
    numberOfColumnsInput.type = 'number';
    numberOfColumnsInput.min = '2';
    numberOfColumnsInput.max = '12';
    numberOfColumnsInput.value = LB.galleryNumOfCols || 6;
    numberOfColumnsInput.classList.add('input');
    numberOfColumnsGroup.appendChild(numberOfColumnsInput);

    // Theme selection
    const themeGroup = createFormGroup('theme', 'Theme');
    const themeSelect = document.createElement('select');
    themeSelect.classList.add('input');
    ['default', 'day', 'night'].forEach(theme => {
        const option = document.createElement('option');
        option.value = theme;
        option.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
        option.selected = (LB.preferences?.settings?.theme || 'default') === theme;
        themeSelect.appendChild(option);
    });
    themeGroup.appendChild(themeSelect);

    // Recently played policy
    const recentlyPlayedGroup = createFormGroup('recentlyPlayed', 'Recently Played');
    const recentlyPlayedSelect = document.createElement('select');
    recentlyPlayedSelect.classList.add('input');
    ['show', 'hide'].forEach(policy => {
        const option = document.createElement('option');
        option.value = policy;
        option.textContent = policy.charAt(0).toUpperCase() + policy.slice(1);
        option.selected = (LB.preferences?.settings?.recentlyPlayedPolicy || 'hide') === policy;
        recentlyPlayedSelect.appendChild(option);
    });
    recentlyPlayedGroup.appendChild(recentlyPlayedSelect);

    // API Keys
    const steamGridGroup = createFormGroup('steamGridAPI', 'SteamGrid API Key');
    const steamGridInput = document.createElement('input');
    steamGridInput.type = 'text';
    steamGridInput.value = LB.preferences?.settings?.steamGridAPIKey || '';
    steamGridInput.placeholder = 'Enter your SteamGrid API key';
    steamGridInput.classList.add('input');
    steamGridGroup.appendChild(steamGridInput);

    const giantBombGroup = createFormGroup('giantBombAPI', 'GiantBomb API Key');
    const giantBombInput = document.createElement('input');
    giantBombInput.type = 'text';
    giantBombInput.value = LB.preferences?.settings?.giantBombAPIKey || '';
    giantBombInput.placeholder = 'Enter your GiantBomb API key';
    giantBombInput.classList.add('input');
    giantBombGroup.appendChild(giantBombInput);

    // Buttons
    const buttonsContainer = createButtonsContainer();
    const saveButton = createButton('Save', async () => {
        try {
            const preferences = LB.preferences;
            preferences.settings.numberOfColumns = parseInt(numberOfColumnsInput.value, 10);
            preferences.settings.theme = themeSelect.value;
            preferences.settings.recentlyPlayedPolicy = recentlyPlayedSelect.value;
            preferences.settings.steamGridAPIKey = steamGridInput.value;
            preferences.settings.giantBombAPIKey = giantBombInput.value;

            await savePreferences(preferences);
            closePlatformMenu();
            // Optionally, trigger a UI refresh if needed
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    });

    const cancelButton = createButton('Cancel', () => {
        closePlatformMenu();
    });

    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(saveButton);

    // Assemble form
    formContainer.appendChild(platformMenuImageCtn);
    formContainer.appendChild(numberOfColumnsGroup);
    formContainer.appendChild(themeGroup);
    formContainer.appendChild(recentlyPlayedGroup);
    formContainer.appendChild(steamGridGroup);
    formContainer.appendChild(giantBombGroup);
    formContainer.appendChild(buttonsContainer);

    return formContainer;
}

function buildPlatformForm(platformName) {
    const formContainer = document.createElement('div');
    formContainer.classList.add('platform-menu-container');

    const platformInfo = getPlatformInfo(platformName);
    const platformPrefs = LB.preferences[platformName] || {};

    // Platform image
    const platformMenuImageCtn = document.createElement('div');
    platformMenuImageCtn.classList.add('platform-menu-image-ctn');
    const platformMenuImage = document.createElement('img');
    platformMenuImage.src = `images/platforms/${platformName}.png`;
    platformMenuImage.width = '250';
    platformMenuImage.onerror = () => { platformMenuImage.src = 'images/missing.png'; };
    platformMenuImageCtn.appendChild(platformMenuImage);

    // Platform status
    const statusGroup = createFormGroup('status', `${platformInfo.name} Status`);
    const statusCheckbox = document.createElement('input');
    statusCheckbox.type = 'checkbox';
    statusCheckbox.checked = platformPrefs.isEnabled || false;
    statusCheckbox.classList.add('checkbox');
    const statusLabel = document.createElement('label');
    statusLabel.textContent = 'Platform enabled';
    statusLabel.classList.add('checkbox-label');
    statusLabel.prepend(statusCheckbox);
    statusGroup.appendChild(statusLabel);

    // Games directory
    const gamesDirGroup = createFormGroup('gamesDir', 'Games Directory');
    const gamesDirInput = document.createElement('input');
    gamesDirInput.type = 'text';
    gamesDirInput.value = platformPrefs.gamesDir || '';
    gamesDirInput.placeholder = `Path to your ${platformInfo.name} games`;
    gamesDirInput.classList.add('input');
    gamesDirGroup.appendChild(gamesDirInput);

    // Emulator
    const emulatorGroup = createFormGroup('emulator', 'Emulator');
    const emulatorInput = document.createElement('input');
    emulatorInput.type = 'text';
    emulatorInput.value = platformPrefs.emulator || '';
    emulatorInput.placeholder = `Emulator command for ${platformInfo.name}`;
    emulatorInput.classList.add('input');
    emulatorGroup.appendChild(emulatorInput);

    // Emulator arguments
    const argsGroup = createFormGroup('emulatorArgs', 'Emulator Arguments');
    const argsInput = document.createElement('input');
    argsInput.type = 'text';
    argsInput.value = platformPrefs.emulatorArgs || '';
    argsInput.placeholder = 'Optional emulator arguments';
    argsInput.classList.add('input');
    argsGroup.appendChild(argsInput);

    // Extensions
    const extensionsGroup = createFormGroup('extensions', 'File Extensions');
    const extensionsInput = document.createElement('input');
    extensionsInput.type = 'text';
    extensionsInput.value = (platformPrefs.extensions || []).join(', ');
    extensionsInput.placeholder = '.zip, .iso, .bin';
    extensionsInput.classList.add('input');
    extensionsGroup.appendChild(extensionsInput);

    // Buttons
    const buttonsContainer = createButtonsContainer();
    const saveButton = createButton('Save', async () => {
        if (!gamesDirInput.value.trim()) {
            alert('Please enter a games directory');
            return;
        }
        if (!emulatorInput.value.trim()) {
            alert('Please enter an emulator');
            return;
        }

        try {
            const preferences = LB.preferences;
            if (!preferences[platformName]) {
                preferences[platformName] = {};
            }

            const extensions = extensionsInput.value
                .split(',')
                .map(ext => ext.trim())
                .filter(ext => ext.length > 0)
                .map(ext => ext.startsWith('.') ? ext : '.' + ext);

            preferences[platformName] = {
                isEnabled: statusCheckbox.checked,
                gamesDir: gamesDirInput.value.trim(),
                emulator: emulatorInput.value.trim(),
                emulatorArgs: argsInput.value.trim(),
                extensions: extensions.length > 0 ? extensions : ['.zip'],
                index: preferences[platformName].index || 0
            };

            await savePreferences(preferences);
            closePlatformMenu();
            // Optionally, trigger a UI refresh if needed
        } catch (error) {
            console.error('Failed to save platform preferences:', error);
        }
    });

    const cancelButton = createButton('Cancel', () => {
        closePlatformMenu();
    });

    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(saveButton);

    // Assemble form
    formContainer.appendChild(platformMenuImageCtn);
    formContainer.appendChild(statusGroup);
    formContainer.appendChild(gamesDirGroup);
    formContainer.appendChild(emulatorGroup);
    formContainer.appendChild(argsGroup);
    formContainer.appendChild(extensionsGroup);
    formContainer.appendChild(buttonsContainer);

    return formContainer;
}

// Utility functions
function createFormGroup(id, labelText) {
    const group = document.createElement('div');
    group.classList.add('form-group');
    
    const label = document.createElement('label');
    label.textContent = labelText;
    label.setAttribute('for', id);
    group.appendChild(label);
    
    return group;
}

function createButton(text, clickHandler) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = text;
    button.classList.add('button');
    button.addEventListener('click', clickHandler);
    return button;
}

function createButtonsContainer() {
    const container = document.createElement('div');
    container.classList.add('cancel-save-buttons');
    return container;
}

function updateControlsForMenu() {
    const controls = document.getElementById('controls');
    controls.innerHTML = `
        <div class="control-item">
            <img class="icon" src="images/controls/button-dpad-ew.png" alt="Navigate">
            <span>Navigate</span>
        </div>
        <div class="control-item">
            <img class="icon" src="images/controls/button-south.png" alt="Select">
            <span>Select</span>
        </div>
        <div class="control-item">
            <img class="icon" src="images/controls/button-east.png" alt="Back">
            <span>Back</span>
        </div>
    `;
}

function updateControlsForGallery() {
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
        <div id="east" class="control-item" title="Back">
            <img id="east-icon" class="icon" src="images/controls/button-east.png" alt="Button - East">
            <span>Exit</span>
        </div>
    `;
}

async function saveCurrentMenu() {
    if (!window.currentMenuPlatform) return;

    try {
        const preferences = await loadPreferences();
        await savePreferences(preferences);
        location.reload();
    } catch (error) {
        console.error('Error saving menu preferences:', error);
    }
}


// Export functions to global scope
window.openPlatformMenu = openPlatformMenu;
window.closePlatformMenu = closePlatformMenu;
window.buildPreferencesForm = buildPreferencesForm;
window.buildPlatformForm = buildPlatformForm;
