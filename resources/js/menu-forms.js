import { updatePreference } from './preferences.js';
import { setFooterSize, applyTheme, selectGalleryPageByPlatform } from './utils.js';
import { getPlatformInfo } from './platforms.js';
import { onGalleryKeyDown, updateHeader, downloadImage } from './gallery.js';
import { LB } from './global.js';
import { initSlideShow, onHomeKeyDown } from './slideshow.js';
import { getAllCoverImageUrls } from './backends.js';

window.isMenuOpen = false;
LB.currentPlatformName = null;

export function openPlatformMenu(platformName) {

    console.log("openPlatformMenu: ");

    const menu = document.getElementById('menu');
    menu.innerHTML = '';

    // Build the appropriate menu
    if (platformName === 'settings') {
        menu.appendChild(buildPreferencesForm());
    } else {
        menu.appendChild(buildPlatformForm(platformName));
    }

    menu.style.display = 'flex';

    // Update controls for menu mode
    updateFooterForMenu();

    // Keyboard handling
    window.removeEventListener('keydown', onHomeKeyDown);
    window.removeEventListener('keydown', onGalleryKeyDown);
    window.addEventListener('keydown', onMenuKeyDown);

    window.isMenuOpen = true;
    LB.currentPlatformName = platformName;
    updateHeader(platformName);
}

function closePlatformMenu() {

    const menu = document.getElementById('menu');
    if (menu) {
        menu.style.display = 'none';
        menu.innerHTML = '';
    }

    // Restore slideshow state
    initSlideShow(LB.currentPlatformName);

    // Restore gallery keyboard handling
    window.removeEventListener('keydown', onMenuKeyDown);
    if (typeof onGalleryKeyDown === 'function') {
        window.addEventListener('keydown', onGalleryKeyDown);
    }

    window.isMenuOpen = false;
    LB.currentPlatformName = null;
}

function onMenuKeyDown(event) {
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
        }
        break;
    }
}

function buildPrefsFormItem(name, iconName, type, description, shortDescription, value, onChangeFct) {

    let input;
    const group = document.createElement('div');

    const radios = [];

    if (typeof type === 'object') {
        const types = type;

        const inputCtn = document.createElement('div');
        inputCtn.classList.add('input-ctn');

        const radiosContainer = document.createElement('div');
        radiosContainer.classList.add('radio-container');

        types.forEach((type, index) => {

            const label = document.createElement('label');

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = name;
            radio.value = type;
            radio.checked = type === value;

            const radioBox = document.createElement('div');
            radioBox.classList.add('radio-box');
            radioBox.textContent = type;

            if (index === types.length - 1) {
                radioBox.classList.add('last');
            }

            radios.push(radio);

            const text = document.createTextNode(type.charAt(0).toUpperCase() + type.slice(1));

            radio.addEventListener('change', () => {
                if (radio.checked && onChangeFct) onChangeFct(type);
            });

            label.appendChild(radio);
            label.appendChild(radioBox);
            radiosContainer.appendChild(label);

        });

        inputCtn.appendChild(radiosContainer);

        input = inputCtn;

    } else if (type === 'menu') {

    } else {

        input = document.createElement('input');
        input.type = type;
        input.id = name;
        input.name = name;
        input.min = '2';
        input.max = '12';
        input.placeholder = description;

        input.classList.add('input');
        input.value = value;

    }

    const icon = document.createElement('div');
    icon.classList.add('form-icon');
    icon.innerHTML = `<i class="form-icon fa fa-2x fa-${iconName}" aria-hidden="true"></i>`;

    const label = document.createElement('label');
    label.textContent = shortDescription;

    const SubLabel = document.createElement('label');
    SubLabel.id = 'num-cols-sub-label';
    SubLabel.classList.add('sub-label');

    const ctn = document.createElement('div');
    ctn.classList.add('dual-ctn');

    ctn.appendChild(icon);
    ctn.appendChild(input);

    group.appendChild(label);
    group.appendChild(ctn);

    return { group, input, radios };
}

function buildPreferencesForm() {
    // Container
    const formContainer = document.createElement('div');
    formContainer.classList.add('platform-menu-container');

    // Image
    const platformMenuImageCtn = document.createElement('div');
    platformMenuImageCtn.classList.add('platform-menu-image-ctn');
    const platformMenuImage = document.createElement('img');
    platformMenuImage.src = `images/platforms/settings.png`;
    platformMenuImage.title = `Emulsion version ${LB.versionNumber}`;
    platformMenuImage.width = 250;
    platformMenuImageCtn.appendChild(platformMenuImage);
    formContainer.appendChild(platformMenuImageCtn);

    // Rows / inputs
    const formItems = [
        buildPrefsFormItem('numberOfColumns', 'th', 'number', 'The number of columns in each platform gallery', 'Number of columns', LB.galleryNumOfCols),
        buildPrefsFormItem('footerSize', 'arrows', ['small', 'medium', 'big'], '', 'Footer menu size', LB.footerSize, setFooterSize),
        buildPrefsFormItem('homeMenuTheme', 'arrows-h', ['flat', '3D'], '', 'Home menu style', LB.homeMenuTheme),
        buildPrefsFormItem('theme', 'eyedropper', ['default', 'day', 'night'], '', 'Emulsion Theme', LB.theme, applyTheme),
        buildPrefsFormItem('disabledPlatformsPolicy', 'check-square-o', ['show', 'hide'], '', 'Disabled Platforms', LB.disabledPlatformsPolicy),
        buildPrefsFormItem('recentlyPlayedPolicy', 'clock-o', ['show', 'hide'], '', 'Recently Played', LB.recentlyPlayedPolicy),
        buildPrefsFormItem('steamGridAPIKey', 'steam-square', 'text', 'Your SteamGrid API Key', 'SteamGrid API Key', LB.steamGridAPIKey || ''),
        buildPrefsFormItem('giantBombAPIKey', 'bomb', 'text', 'Your GiantBomb API Key', 'GiantBomb API Key', LB.giantBombAPIKey || '')
    ];

    formItems.forEach(item => formContainer.appendChild(item.group));

    // Buttons
    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.classList.add('button');
    saveButton.textContent = 'Save';

    const aboutButton = document.createElement('button');
    aboutButton.type = 'button';
    aboutButton.className = 'button';
    aboutButton.textContent = 'About';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.classList.add('is-info', 'button');
    cancelButton.textContent = 'Cancel';

    const formContainerButtons = document.createElement('div');
    formContainerButtons.classList.add('cancel-save-buttons');
    formContainerButtons.append(cancelButton, aboutButton, saveButton);
    formContainer.appendChild(formContainerButtons);

    // Spacer
    const formContainerVSpacerDiv = document.createElement('div');
    formContainerVSpacerDiv.classList.add('spacer-div');
    formContainer.appendChild(formContainerVSpacerDiv);

    cancelButton.addEventListener('click', () => {
        initSlideShow(LB.currentPlatformName);
    });

    aboutButton.addEventListener('click', async () => {
        showAbout();
    });

    saveButton.addEventListener('click', async () => {
        try {
            // --- Collect new values ---
            let numberOfColumns = parseInt(formItems[0].input.value, 10);
            if (numberOfColumns < 2) numberOfColumns = 2;
            else if (numberOfColumns > 12) numberOfColumns = 12;

            const newPrefs = {
                numberOfColumns,
                footerSize: formItems[1].radios.find(r => r.checked)?.value,
                homeMenuTheme: formItems[2].radios.find(r => r.checked)?.value,
                theme: formItems[3].radios.find(r => r.checked)?.value,
                disabledPlatformsPolicy: formItems[4].radios.find(r => r.checked)?.value,
                recentlyPlayedPolicy: formItems[5].radios.find(r => r.checked)?.value,
                steamGridAPIKey: formItems[6].input.value,
                giantBombAPIKey: formItems[7].input.value
            };

            // --- Save preferences ---
            await updatePreference('settings', 'numberOfColumns', newPrefs.numberOfColumns);
            await updatePreference('settings', 'footerSize', newPrefs.footerSize);
            await updatePreference('settings', 'homeMenuTheme', newPrefs.homeMenuTheme);
            await updatePreference('settings', 'theme', newPrefs.theme);
            await updatePreference('settings', 'disabledPlatformsPolicy', newPrefs.disabledPlatformsPolicy);
            await updatePreference('settings', 'recentlyPlayedPolicy', newPrefs.recentlyPlayedPolicy);
            await updatePreference('settings', 'steamGridAPIKey', newPrefs.steamGridAPIKey);
            await updatePreference('settings', 'giantBombAPIKey', newPrefs.giantBombAPIKey);

            // --- Detect changes except homeMenuTheme and theme ---
            const somethingImportantChanged =
                  newPrefs.numberOfColumns !== LB.galleryNumOfCols ||
                  newPrefs.disabledPlatformsPolicy !== LB.disabledPlatformsPolicy ||
                  newPrefs.recentlyPlayedPolicy !== LB.recentlyPlayedPolicy ||
                  newPrefs.steamGridAPIKey !== (LB.steamGridAPIKey || '') ||
                  newPrefs.giantBombAPIKey !== (LB.giantBombAPIKey || '');

            // --- Update LB to reflect changes ---
            Object.assign(LB, {
                galleryNumOfCols: newPrefs.numberOfColumns,
                footerSize: newPrefs.footerSize,
                homeMenuTheme: newPrefs.homeMenuTheme,
                theme: newPrefs.theme,
                disabledPlatformsPolicy: newPrefs.disabledPlatformsPolicy,
                recentlyPlayedPolicy: newPrefs.recentlyPlayedPolicy,
                steamGridAPIKey: newPrefs.steamGridAPIKey,
                giantBombAPIKey: newPrefs.giantBombAPIKey
            });

            if (somethingImportantChanged) {
                window.location.reload();
            } else {
                initSlideShow(LB.currentPlatformName);
            }

        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    });


    return formContainer;

}

async function showAbout() {
    const currentVersion = NL_APP_VERSION;

  let latestVersion = 'Error fetching latest';
  try {
    const response = await fetch('https://api.github.com/repos/yPhil-gh/Emulsion/releases/latest');
    const data = await response.json();
      latestVersion = data.tag_name.replace(/^v/, ''); // strip "v"
  } catch (err) {
    console.error('Failed to fetch GitHub release:', err);
  }

  openAboutModal(currentVersion, latestVersion);
}

function compareVersions(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const na = pa[i] || 0;
        const nb = pb[i] || 0;
        if (na > nb) return 1;
        if (na < nb) return -1;
    }
    return 0;
}

function openAboutModal(currentVersion, latestVersion) {

    const upToDate = document.getElementById('aboutUpToDate');
    const updateAvailable = document.getElementById('aboutUpdateAvailable');

    document.getElementById('aboutCurrentVersion').textContent = currentVersion;
    document.getElementById('aboutLatestVersion').textContent = latestVersion;

    if (latestVersion) {
        const cmp = compareVersions(currentVersion, latestVersion);
        if (cmp < 0){
            upToDate.style.display = 'none';
            updateAvailable.style.display = 'block';
        } else {
            upToDate.style.display = 'block';
            updateAvailable.style.display = 'none';
        }
    }

    document.getElementById('aboutModal').style.display = 'flex';

    // Wire buttons
    document.getElementById('aboutDonateBtn').onclick = () => {
        Neutralino.os.open('https://yphil.gitlab.io/ext/support.html');
    };
    document.getElementById('aboutUpgradeBtn').onclick = () => {
        Neutralino.os.open('https://github.com/yPhil-gh/Emulsion/releases');
    };
    document.getElementById('aboutCloseBtn').onclick = closeAboutModal;

    // Optional: trap Escape key
    document.addEventListener('keydown', aboutKeyDown, true);
}

function closeAboutModal() {
    const modal = document.getElementById('aboutModal');
    modal.style.display = 'none';
    document.removeEventListener('keydown', aboutKeyDown, true);
}

function aboutKeyDown(event) {
    event.stopPropagation();
    if(event.key === 'Escape') {
        closeAboutModal();
    }
}

function buildPlatformForm(platformName) {

    const formContainer = document.createElement('div');
    formContainer.classList.add('platform-menu-container');

    const platformMenuImageCtn = document.createElement('div');
    platformMenuImageCtn.classList.add('platform-menu-image-ctn');
    const platformMenuImage = document.createElement('img');
    platformMenuImage.src = `images/platforms/${platformName}.png`;
    platformMenuImage.width = '250';

    platformMenuImageCtn.appendChild(platformMenuImage);

    const statusCheckBox = document.createElement('input');
    statusCheckBox.type = 'checkbox';
    statusCheckBox.id = 'input-platform-toggle-checkbox';
    statusCheckBox.classList.add('checkbox');

    const statusLabel = document.createElement('label');
    statusLabel.classList.add('checkbox');
    statusLabel.id = 'form-status-label';

    const statusLabelPlatormName = document.createElement('span');
    statusLabelPlatormName.id = 'form-status-label-platform-name';

    const platformInfo = getPlatformInfo(platformName);

    statusLabelPlatormName.innerHTML = `${platformInfo.name} is&nbsp;`;

    const statusLabelPlatormStatus = document.createElement('span');
    statusLabelPlatormStatus.id = 'form-status-label-platform-status';

    statusLabel.appendChild(statusCheckBox);
    statusLabel.appendChild(statusLabelPlatormName);
    statusLabel.appendChild(statusLabelPlatormStatus);

    const gamesDirGroup = document.createElement('div');

    const gamesDirInput = document.createElement('input');
    gamesDirInput.type = 'text';
    gamesDirInput.classList.add('input');
    gamesDirInput.placeholder = `Your ${platformInfo.name} games directory`;

    const gamesDirLabel = document.createElement('label');
    gamesDirLabel.textContent = 'Games directory';

    const gamesDirSubLabel = document.createElement('span');
    gamesDirSubLabel.id = 'games-dir-sub-label';
    gamesDirSubLabel.classList.add('sub-label');

    const gamesDirButton = document.createElement('button');
    gamesDirButton.classList.add('button', 'button-browse', 'info');
    gamesDirButton.textContent = 'Browse';

    const gamesDirCtn = document.createElement('div');
    gamesDirCtn.classList.add('dual-ctn');

    const gamesDirIcon = document.createElement('div');
    gamesDirIcon.classList.add('form-icon');
    gamesDirIcon.innerHTML = '<i class="form-icon fa fa-2x fa-folder-open-o" aria-hidden="true"></i>';

    gamesDirCtn.appendChild(gamesDirIcon);
    gamesDirCtn.appendChild(gamesDirInput);
    gamesDirCtn.appendChild(gamesDirButton);

    gamesDirLabel.appendChild(gamesDirSubLabel);
    gamesDirGroup.appendChild(gamesDirLabel);
    gamesDirGroup.appendChild(gamesDirCtn);

    const emulatorGroup = document.createElement('div');

    const emulatorIcon = document.createElement('div');
    emulatorIcon.classList.add('form-icon');
    emulatorIcon.innerHTML = '<i class="form-icon fa fa-2x fa-gamepad" aria-hidden="true"></i>';

    const emulatorInputLabel = document.createElement('label');
    emulatorInputLabel.textContent = "Emulator";

    const emulatorSubLabel = document.createElement('span');
    emulatorSubLabel.id = 'emulator-sub-label';
    emulatorSubLabel.classList.add('sub-label');

    const emulatorInput = document.createElement('input');
    emulatorInput.type = 'text';
    emulatorInput.classList.add('input');
    emulatorInput.placeholder = `Your ${platformInfo.name} emulator`;

    const emulatorCtn = document.createElement('div');
    emulatorCtn.classList.add('dual-ctn');

    const emulatorButton = document.createElement('button');
    emulatorButton.classList.add('button', 'button-browse');
    emulatorButton.textContent = 'Browse';

    emulatorCtn.appendChild(emulatorIcon);
    emulatorCtn.appendChild(emulatorInput);
    emulatorCtn.appendChild(emulatorButton);

    emulatorInputLabel.appendChild(emulatorSubLabel);
    emulatorGroup.appendChild(emulatorInputLabel);
    emulatorGroup.appendChild(emulatorCtn);

    const batchGroup = document.createElement('div');

    const batchIcon = document.createElement('div');
    batchIcon.classList.add('form-icon');
    batchIcon.innerHTML = '<i class="form-icon fa fa-2x fa-file-image-o" aria-hidden="true"></i>';

    const batchInputLabel = document.createElement('label');
    batchInputLabel.textContent = "Get all cover images";

    const batchSubLabel = document.createElement('span');
    batchSubLabel.id = 'batch-sub-label';
    batchSubLabel.classList.add('sub-label');

    const batchInput = createProgressBar();
    // batchInput.type = 'text';
    batchInput.classList.add('input');
    // batchInput.placeholder = `Your ${platformInfo.name} batch`;

    const batchCtn = document.createElement('div');
    batchCtn.classList.add('dual-ctn');

    const batchButton = document.createElement('button');
    batchButton.classList.add('button', 'button-browse');
    batchButton.textContent = 'Go';

    batchButton.addEventListener('click', _batchButtonClick);

    batchCtn.appendChild(batchIcon);
    batchCtn.appendChild(batchInput);
    batchCtn.appendChild(batchButton);

    batchInputLabel.appendChild(batchSubLabel);
    batchGroup.appendChild(batchInputLabel);
    batchGroup.appendChild(batchCtn);

    // ======== NEW EXTENSIONS SECTION ========
    const extensionsGroup = document.createElement('div');

    // Label
    const extensionsLabel = document.createElement('label');
    extensionsLabel.textContent = 'File Extensions';

    // Container for icon + inputs
    const extensionsCtn = document.createElement('div');
    extensionsCtn.classList.add('dual-ctn');

    // Icon
    const extensionsIcon = document.createElement('div');
    extensionsIcon.classList.add('form-icon');
    extensionsIcon.innerHTML = '<i class="form-icon fa fa-2x fa-file-archive-o" aria-hidden="true"></i>';

    // Inputs wrapper
    const extensionsInputsContainer = document.createElement('div');
    extensionsInputsContainer.classList.add('extensions-inputs-container');

    // Helper to enable/disable the “+” button based on row count
    function updateAddExtensionBtn() {
        // Count only the input rows (total children minus the add button itself)
        const rowCount = extensionsInputsContainer.children.length - 1;
        addExtensionBtn.disabled = rowCount >= 3;
        addExtensionBtn.style.opacity = addExtensionBtn.disabled ? '0.5' : '1';
    }

    // Create the “Select +” button wired to add a new row
    const addExtensionBtn = document.createElement('button');
    addExtensionBtn.classList.add('button', 'small');
    addExtensionBtn.innerHTML = '<i class="form-icon emulator-args-icon fa fa-plus" aria-hidden="true"></i>';
    addExtensionBtn.addEventListener('click', () => {
        // Guard so we never exceed 3
        if (extensionsInputsContainer.children.length - 1 < 3) {
            const newRow = _createExtensionInputRow('', false);
            // Insert before the button
            extensionsInputsContainer.insertBefore(newRow, addExtensionBtn);
            updateAddExtensionBtn();
        }
    });

    try {
        const extensions = LB.preferences[platformName]?.extensions || ['.iso'];
        extensions.forEach((ext, index) => {
            const inputRow = _createExtensionInputRow(ext, index === 0);
            extensionsInputsContainer.appendChild(inputRow);
        });
        // Finally append the add button and update its state
        extensionsInputsContainer.appendChild(addExtensionBtn);
        updateAddExtensionBtn();
    } catch (err) {
        console.error(err);
    }

    // Assemble the full group
    extensionsCtn.appendChild(extensionsIcon);
    extensionsCtn.appendChild(extensionsInputsContainer);
    extensionsGroup.appendChild(extensionsLabel);
    extensionsGroup.appendChild(extensionsCtn);
    // ======== END EXTENSIONS SECTION ========

    const emulatorArgsGroup = document.createElement('div');

    const emulatorArgsCtn = document.createElement('div');
    emulatorArgsCtn.classList.add('dual-ctn');

    const emulatorArgsIcon = document.createElement('div');
    emulatorArgsIcon.classList.add('form-icon');
    emulatorArgsIcon.innerHTML = '<i class="form-icon emulator-args-icon fa fa-2x fa-rocket" aria-hidden="true"></i>';

    const emulatorArgsLabel = document.createElement('label');
    emulatorArgsLabel.textContent = 'Emulator Arguments';

    const emulatorArgsInput = document.createElement('input');
    emulatorArgsInput.classList.add('input');
    emulatorArgsInput.type = 'text';
    emulatorArgsInput.placeholder = `Your ${platformInfo.name} emulator arguments`;

    emulatorArgsCtn.appendChild(emulatorArgsIcon);
    emulatorArgsCtn.appendChild(emulatorArgsInput);
    emulatorArgsGroup.appendChild(emulatorArgsLabel);
    emulatorArgsGroup.appendChild(emulatorArgsCtn);

    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.classList.add('button');
    saveButton.textContent = 'Save';

    const helpButton = document.createElement('button');
    helpButton.type = 'button';
    helpButton.classList.add('button');
    helpButton.textContent = 'Help';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.classList.add('button');
    cancelButton.textContent = 'Cancel';

    try {
        gamesDirInput.value = LB.preferences[platformName]?.gamesDir ?? '';
    } catch (err) {
        console.error('Failed to get gamesDir preference:', err);
    }

    try {
        emulatorInput.value = LB.preferences[platformName]?.emulator ?? '';
    } catch (err) {
        console.error('Failed to get emulator preference:', err);
    }

    try {
        emulatorArgsInput.value = LB.preferences[platformName]?.emulatorArgs ?? '';
    } catch (err) {
        console.error('Failed to get emulatorArgs preference:', err);
    }

    gamesDirButton.addEventListener('click', _gamesDirButtonClick);
    emulatorButton.addEventListener('click', _emulatorButtonClick);

    async function _gamesDirButtonClick(event) {
        event.stopPropagation();
        try {
            const result = await Neutralino.os.showFolderDialog('Select Games Directory');
            if (result && result.length > 0) {
                gamesDirInput.value = result;
            }
        } catch (err) {
            console.error('Failed to select directory:', err);
        }
    }

    async function _emulatorButtonClick(event) {
        event.stopPropagation();
        try {
            const result = await Neutralino.os.showOpenDialog('Select Emulator', {
                filters: [{ name: 'Executables', extensions: ['exe', 'bat', 'sh', '*'] }],
                multiple: false
            });
            if (result && result.length > 0) {
                emulatorInput.value = result;
            }
        } catch (err) {
            console.error('Failed to select file:', err);
        }
    }

    formContainer.appendChild(platformMenuImageCtn);
    formContainer.appendChild(statusLabel);
    formContainer.appendChild(gamesDirGroup);
    formContainer.appendChild(emulatorGroup);
    formContainer.appendChild(batchGroup);
    formContainer.appendChild(extensionsGroup);
    formContainer.appendChild(emulatorArgsGroup);

    const formContainerButtons = document.createElement('div');
    formContainerButtons.classList.add('cancel-save-buttons');
    formContainerButtons.appendChild(cancelButton);
    formContainerButtons.appendChild(helpButton);
    formContainerButtons.appendChild(saveButton);

    try {
        const value = LB.preferences[platformName]?.isEnabled ?? false;
        statusCheckBox.checked = value;
        statusLabelPlatormStatus.textContent = value ? 'On' : 'Off';
        statusLabelPlatormStatus.classList.add(value ? 'on' : 'off');
    } catch (err) {
        console.error('Failed to get platform preference:', err);
    }

    statusCheckBox.addEventListener('change', (event) => {
        const isNotEnablable = !gamesDirInput.value || !emulatorInput.value;
        const isEnabling = statusCheckBox.checked;

        gamesDirSubLabel.textContent = '';
        emulatorSubLabel.textContent = '';

        if (isEnabling) {
            if (!gamesDirInput.value) {
                gamesDirSubLabel.textContent = 'Please enter a game directory';
            }
            if (!emulatorInput.value) {
                emulatorSubLabel.textContent = 'Please enter an emulator (name or path)';
            }
        }

        if (isEnabling && isNotEnablable) {
            event.preventDefault();
            statusCheckBox.checked = false;
            console.error("Cannot enable platform - missing requirements");
        }
        else {
            // Only modify classes and text if requirements are met
            statusLabelPlatormStatus.classList.remove('on', 'off');
            statusLabelPlatormStatus.textContent = statusCheckBox.checked ? 'On' : 'Off';
            statusLabelPlatormStatus.classList.add(statusCheckBox.checked ? 'on' : 'off');
        }
    });

    cancelButton.addEventListener('click', _cancelButtonClick);

    helpButton.addEventListener('click', () => {
        Neutralino.os.open('https://gitlab.com/yphil/emulsion/-/blob/master/README.md#usage');
    });

    saveButton.addEventListener('click', _saveButtonClick);

    function _cancelButtonClick(event) {

        const escapeKeyEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            keyCode: 27,
            code: 'Escape', // The physical key on the keyboard
            which: 27,     // Same as keyCode
            bubbles: true
        });

        document.dispatchEvent(escapeKeyEvent);
    }

    async function _batchButtonClick(event) {
        console.log("Batch download started");

        const platformName = LB.currentPlatformName;
        console.log("platformName: ", platformName);

        const platformPrefs = LB.preferences[platformName];
        if (!platformPrefs || !platformPrefs.gamesDir) {
            gamesDirSubLabel.textContent = 'This field cannot be empty';
            return;
        }

        const page = document.querySelector(`#galleries .page[data-platform="${platformName}"]`);
        if (!page) return console.error("Platform page not found");

        const games = page.querySelectorAll(".game-container[data-image-missing]");
        if (!games.length) return console.warn("No games in this page");

        if (!platformPrefs.isEnabled) {
            alert(platformPrefs.isEnabled);
        }

        for (let i = 0; i < games.length; i++) {
            setProgress(i + 1, games.length);

            const gameContainer = games[i];
            const gameName = gameContainer.dataset.gameName;

            try {
                const urls = await getAllCoverImageUrls(gameName, platformName, {
                    steamGridAPIKey: LB.steamGridAPIKey,
                    giantBombAPIKey: LB.giantBombAPIKey
                });

                if (!urls.length) {
                    progressText.textContent = `Not Found ${gameName}`;
                    console.warn(`No image found for ${gameName}`);
                    continue;
                }

                const url = typeof urls[0] === 'string' ? urls[0] : urls[0]?.url;
                if (!url) continue;

                const savedPath = await downloadImage(url, platformName, gameName, platformPrefs.gamesDir);
                const progressText = document.getElementById("progress-text");
                if (savedPath) {
                    const extension = savedPath.split('.').pop();
                    const path = `/${platformName}/images/${encodeURIComponent(gameName)}.${extension}?t=${Date.now()}`;
                    const imgEl = gameContainer.querySelector("img");
                    if (imgEl) imgEl.src = path;
                    progressText.textContent = `Found ${gameName}`;
                } else {
                    progressText.textContent = `Not Found ${gameName}`;
                }

            } catch (err) {
                console.error(`❌ Failed batch for ${gameName}:`, err);
            }
        }

        console.log("✅ Batch download finished");
    }


    async function _saveButtonClick(event) {

        if (!gamesDirInput.value) {
            gamesDirSubLabel.textContent = 'This field cannot be empty';
            return;
        }

        gamesDirSubLabel.textContent = '';

        if (!emulatorInput.value) {
            emulatorSubLabel.textContent = 'This field cannot be empty';
            return;
        }

        emulatorSubLabel.textContent = '';

        // Process extensions
        const extensions = Array.from(extensionsInputsContainer.querySelectorAll('input'))
              .map(input => {
                  let val = input.value.trim().toLowerCase();
                  if (!val.startsWith('.')) val = '.' + val;
                  return val.replace(/[^a-z0-9.]/gi, '');
              })
              .filter(ext => ext.length > 1);  // Filter out empty/. only

        try {
            await updatePreference(platformName, 'isEnabled', statusCheckBox.checked);
            await updatePreference(platformName, 'gamesDir', gamesDirInput.value);
            await updatePreference(platformName, 'emulator', emulatorInput.value);
            await updatePreference(platformName, 'extensions', extensions);
            await updatePreference(platformName, 'emulatorArgs', emulatorArgsInput.value);
            window.location.reload();
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

    function createProgressBar() {
        let container = document.getElementById("progress-container");
        if (!container) {
            // Outer container
            container = document.createElement("div");
            container.id = "progress-container";

            // Inner fill
            const fill = document.createElement("div");
            fill.id = "progress-fill";
            fill.class = "progress-fill";

            // Inner text
            const text = document.createElement("div");
            text.id = "progress-text";

            container.appendChild(fill);
            container.appendChild(text);

            // Prepend it somewhere sensible
            document.body.prepend(container);
        }

        return container;
    }

    // Helper to update progress
    function setProgress(current, total) {
        const fill = document.getElementById("progress-fill");
        if (fill && total > 0) {
            fill.style.width = `${(current / total) * 100}%`;
        }
    }


        // EXTENSION INPUT ROW CREATOR
    function _createExtensionInputRow(value, isFirst) {
        const row = document.createElement('div');
        row.classList.add('extension-input-row');

        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.placeholder = '.ext';
        input.classList.add('input', 'small');

        // Auto-format on blur
        input.addEventListener('blur', () => {
            let val = input.value.trim().toLowerCase();
            if (!val.startsWith('.')) val = '.' + val;
            input.value = val.replace(/[^a-z0-9.]/gi, '');
        });

        if (!isFirst) {
            const removeBtn = document.createElement('button');
            removeBtn.classList.add('button', 'small', 'danger');
            removeBtn.innerHTML = '<i class="form-icon emulator-args-icon fa fa-remove" aria-hidden="true"></i>';
            removeBtn.addEventListener('click', () => row.remove());
            row.appendChild(removeBtn);
        }

        row.appendChild(input);
        return row;
    }

    const dummyHeightDiv = document.createElement('div');
    dummyHeightDiv.className = 'dummyHeightDiv';

    formContainer.appendChild(formContainerButtons);

    formContainer.appendChild(dummyHeightDiv);

    return formContainer;
}

function updateFooterForMenu() {
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
        <div class="control-item back hover">
            <img class="icon" src="images/controls/button-east.png" alt="Back">
            <span>Back</span>
        </div>
    `;
    controls.querySelector(".back").addEventListener("click", closePlatformMenu);

}
