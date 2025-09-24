window.isMenuOpen = false;
window.currentMenuPlatform = null;

function openPlatformMenu(platformName) {
    console.log('Opening menu for platform:', platformName);

    const menu = document.getElementById('menu');
    if (!menu) {
        console.error('Menu DOM element missing.');
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
    } else {
        menu.appendChild(buildPlatformForm(platformName));
    }

    // Show menu
    menu.style.display = 'block';

    // Update controls for menu mode
    updateControlsForMenu();

    // Keyboard handling
    window.removeEventListener('keydown', handleGalleryKeyDown);
    window.addEventListener('keydown', handleMenuKeyDown);

    window.isMenuOpen = true;
    window.currentMenuPlatform = platformName;
}

function closePlatformMenu() {
    console.log('Closing menu');

    const menu = document.getElementById('menu');
    if (menu) {
        menu.style.display = 'none';
        menu.innerHTML = '';
    }

    // Restore slideshow state
    if (typeof window.goToSlideshow === 'function') {
        window.goToSlideshow(window.currentMenuPlatform);
    }

    // Restore controls
    updateControlsForGallery();

    // Restore gallery keyboard handling
    window.removeEventListener('keydown', handleMenuKeyDown);
    if (typeof handleGalleryKeyDown === 'function') {
        window.addEventListener('keydown', handleGalleryKeyDown);
    }

    window.isMenuOpen = false;
    window.currentMenuPlatform = null;
}

function handleMenuKeyDown(event) {
    event.stopPropagation();

    switch (event.key) {
        case 'Escape':
            closePlatformMenu();
            break;
        case 'Enter':
            // Handle form submission if needed
            break;
        case 's':
            if (event.ctrlKey) {
                event.preventDefault();
                saveCurrentMenu();
            }
            break;
    }
}

function buildPreferencesForm() {
    const form = document.createElement('form');
    form.className = 'menu-form';

    const preferences = LB.preferences || {};

    // Example: theme selector
    const themeGroup = createFormGroup('theme', 'Theme');
    const themeInput = document.createElement('input');
    themeInput.type = 'text';
    themeInput.value = preferences.theme || 'default';
    themeGroup.appendChild(themeInput);
    form.appendChild(themeGroup);

    const buttons = createButtonsContainer();
    const saveBtn = createButton('Save', async () => {
        preferences.theme = themeInput.value;
        await savePreferences(preferences);
        closePlatformMenu();
    });
    buttons.appendChild(saveBtn);

    const cancelBtn = createButton('Cancel', closePlatformMenu);
    buttons.appendChild(cancelBtn);

    form.appendChild(buttons);

    return form;
}

function buildPlatformForm(platformName) {
    const formContainer = document.createElement('div');
    formContainer.classList.add('platform-menu-container');

    const platformInfo = getPlatformInfo(platformName);
    console.info("BUILDPLATFORMFORM: ", platformInfo);
    const platformPrefs = LB.preferences[platformName] || {};

    // Platform image
    const platformMenuImageCtn = document.createElement('div');
    platformMenuImageCtn.classList.add('platform-menu-image-ctn');

    const platformMenuImage = document.createElement('img');
    platformMenuImage.src = `images/platforms/${platformName}.png`;
    platformMenuImage.width = 250;
    platformMenuImage.onerror = () => {
        platformMenuImage.src = 'images/missing.png';
    };

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
                  .map(ext => (ext.startsWith('.') ? ext : '.' + ext));

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


function createFormGroup(id, labelText) {
    const group = document.createElement('div');
    group.className = 'form-group';

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;

    group.appendChild(label);
    return group;
}

function createButton(text, clickHandler) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = text;
    button.addEventListener('click', clickHandler);
    return button;
}

function createButtonsContainer() {
    const container = document.createElement('div');
    container.className = 'form-buttons';
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
        closePlatformMenu();
    } catch (error) {
        console.error('Error saving menu preferences:', error);
    }
}

// Export to global
window.openPlatformMenu = openPlatformMenu;
window.closePlatformMenu = closePlatformMenu;
window.buildPreferencesForm = buildPreferencesForm;
window.buildPlatformForm = buildPlatformForm;
