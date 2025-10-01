import { LB } from './global.js';
import { loadPreferences } from './preferences.js';
import { buildGalleries } from './gallery-builder.js';
import { initSlideShow } from './slideshow.js';
import { getPlatformInfo, PLATFORMS } from './platforms.js';
import { mountAllGamesDir, setFooterSize, applyTheme } from './utils.js';

async function emulsify() {


    const cliArgs = await handleCliArgs();
    await Neutralino.init();


    console.log('🔧 Setting up game controller extension...');

    // Listen for extension ready event
    Neutralino.events.on('extensionReady', (evt) => {
        console.log('🚀 Extension ready:', evt.detail);
        if (evt.detail.id === 'gameControllerExt') {
            console.log('✅ GAME CONTROLLER EXTENSION IS READY!');
        }
    });

    // Listen for game controller events
    Neutralino.events.on('gameControllerEvent', (evt) => {
        console.log('🎮 Controller event received:', evt.detail);
        handleControllerEvent(evt.detail.event, evt.detail.data);
    });

    // Check extension stats
    try {
        const stats = await Neutralino.extensions.getStats();
        console.log('📊 Extension stats:', stats);

        // If our extension isn't loaded, try to start it
        if (!stats.loaded.includes('gameControllerExt')) {
            console.log('🔄 GameController extension not loaded, starting it...');
            // The extension should auto-start via config, but we can check
        }
    } catch (err) {
        console.log('Extension stats error:', err);
    }


    // // Listen for extension events
    // Neutralino.events.on('extensionReady', (evt) => {
    //     console.log('🚀 Extension ready event:', evt.detail);
    //     if (evt.detail.id === 'gameControllerExt') {
    //         console.log('✅ GameController extension is ready!');
    //     }
    // });

    // Neutralino.events.on('extensionDispatch', (evt) => {
    //     console.log('📨 Extension dispatch:', evt.detail);
    //     const { id, data } = evt.detail;

    //     if (id === 'gameControllerExt' && data.type === 'gamecontroller') {
    //         handleControllerEvent(data.data.event, data.data.data);
    //     }
    // });

    // // Test if extension is loaded
    // setTimeout(() => {
    //     Neutralino.extensions.getStats().then(stats => {
    //         console.log('📊 Extension stats:', stats);
    //     }).catch(err => {
    //         console.log('❌ Still cannot get stats:', err);
    //     });
    // }, 2000);


    // // Simple game controller listener
    // Neutralino.events.on("extensionDispatch", (event) => {
    //     console.log('🔧 Extension event received:', event.detail);

    //     const { event: eventName, data } = event.detail;

    //     if (eventName.startsWith('gamecontroller:')) {
    //         const controllerEvent = eventName.replace('gamecontroller:', '');
    //         console.log(`🎮 Game Controller: ${controllerEvent}`, data);

    //         if (controllerEvent === 'ready') {
    //             console.log('🎮✅ Game controller extension is ready!');
    //         }

    //         if (controllerEvent === 'button-down') {
    //             handleControllerInput(data.button, true);
    //         }

    //         if (controllerEvent === 'button-up') {
    //             handleControllerInput(data.button, false);
    //         }
    //     }
    // });

    if (PLATFORMS.some(p => p.name === cliArgs.autoSelect)) {
        LB.autoSelect = cliArgs.autoSelect;
    }

    const configPath = await Neutralino.os.getPath('config');
    LB.userDataPath = configPath + '/emulsion2';

    LB.prefsFilePath = LB.userDataPath + '/preferences.json';

    LB.playHistoryFilePath = LB.userDataPath + '/play-history.json';

    const coversPath = `${LB.userDataPath}/covers`;

    try {
        await Neutralino.server.mount('/covers', coversPath);
    } catch (err) {
        console.error('Failed to mount covers directory:', err);
    }

    LB.preferences = await loadPreferences();

    await mountAllGamesDir();

    console.log("LB.preferences: ", LB.preferences);

    LB.galleryNumOfCols = LB.preferences.settings.numberOfColumns;
    LB.recentlyPlayedPolicy = LB.preferences.settings.recentlyPlayedPolicy;
    LB.disabledPlatformsPolicy = LB.preferences.settings.disabledPlatformsPolicy;
    LB.theme = LB.preferences.settings.theme;
    LB.footerSize = LB.preferences.settings.footerSize;
    LB.homeMenuTheme = LB.preferences.settings.homeMenuTheme;

    LB.steamGridAPIKey = LB.preferences.settings.steamGridAPIKey;
    LB.giantBombAPIKey = LB.preferences.settings.giantBombAPIKey;

    setFooterSize(LB.footerSize);
    applyTheme(LB.theme);

    await buildGalleries(LB.preferences);

    buildSlideshow(LB.preferences);

    initSlideShow(LB.autoSelect || 0);

    showUI();

    Neutralino.events.on('windowClose', () => {
        Neutralino.app.exit();
    });
}


function setupGameControllerListener() {
    // Listen for ALL extension events
    Neutralino.events.on("extensionDispatch", (event) => {
        const { id, data } = event.detail;

        if (id === 'gameControllerExt') {
            console.log('🎮 Game controller event:', data.event, data.data);

            switch(data.event) {
            case 'ready':
                console.log('🎮 Game controller extension ready!');
                break;

            case 'controller-connected':
                console.log('🕹️ Controller connected:', data.data.name);
                // Update your UI
                break;

            case 'controller-disconnected':
                console.log('🕹️ Controller disconnected');
                // Update your UI
                break;

            case 'button-down':
                console.log('🎯 Button pressed:', data.data.button);
                handleControllerInput(data.data.button, true);
                break;

            case 'button-up':
                console.log('🎯 Button released:', data.data.button);
                handleControllerInput(data.data.button, false);
                break;

            case 'kill-combo-triggered':
                console.log('⚠️ Kill combo triggered!');
                break;
            }
        }
    });
}

function handleControllerInput(button, pressed) {
    console.log(`Button ${button} ${pressed ? 'pressed' : 'released'}`);

    // Map to your app actions
    const buttonMap = {
        'a': 'confirm',
        'b': 'back',
        'x': 'option1',
        'y': 'option2',
        'dpup': 'navigateUp',
        'dpdown': 'navigateDown',
        'dpleft': 'navigateLeft',
        'dpright': 'navigateRight'
    };

    if (buttonMap[button]) {
        console.log(`Action: ${buttonMap[button]} ${pressed ? 'start' : 'end'}`);
        // Add your actual navigation logic here
    }
}

async function handleCliArgs() {
    // Robustly split NL_ARGS on spaces and commas, trim each part
    const args = NL_ARGS || [];

    // Load package info once
    let pkg;
    try {
        const res = await fetch('package.json');
        pkg = await res.json();
    } catch (err) {
        console.error('Failed to load package.json', err);
    }

    // Help/version handling
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
${pkg.name} v${pkg.version}

Usage:
  ${pkg.name} [options]

Options:
  --kiosk                        Read-only / kids mode: No config / settings, disabled platforms hidden.
  --full-screen                  Start in full screen mode.
  --auto-select=[platform_name]  Auto-select [platform_name].
  --help, -h                     Show this help message.
  --version, -v                  Show Emulsion version

Platform names:
${PLATFORMS.map(p => p.name).join(' ')} settings recents

`);
        Neutralino.app.exit();
    }
    if (args.includes('--version') || args.includes('-v')) {
        console.log(`${pkg.name} v${pkg.version}`);
        Neutralino.app.exit();
    }

    // Parse all documented CLI options
    const cliArgs = {
        kiosk: args.includes('--kiosk'),
        fullScreen: args.includes('--full-screen'),
        autoSelect: false,
        help: args.includes('--help') || args.includes('-h'),
        version: args.includes('--version') || args.includes('-v'),
    };
    // --auto-select=[platform_name]
    const autoSelectArg = args.find(arg => arg.startsWith('--auto-select='));
    if (autoSelectArg) {
        cliArgs.autoSelect = autoSelectArg.split('=')[1];
    }

    return cliArgs;
}

function buildSlideshow(preferences) {
    const slideshow = document.getElementById("slideshow");
    if (!slideshow) {
        console.error('Slideshow element not found!');
        return;
    }

    slideshow.innerHTML = '';

    // Build slides in the correct order - settings first
    const settingsSlide = buildHomeSlide('settings', preferences);
    if (settingsSlide) {
        slideshow.appendChild(settingsSlide);
    }

    // Then all other platforms
    Object.keys(preferences).forEach(platformName => {
        if (platformName === 'settings') return;

        const slide = buildHomeSlide(platformName, preferences);
        if (slide) {
            slideshow.appendChild(slide);
        }
    });

    // Finally recents if enabled
    if (LB.recentlyPlayedPolicy === 'show') {
        // console.log("LB.recentlyPlayedPolicy: ", LB.recentlyPlayedPolicy);
        const recentsSlide = buildHomeSlide('recents', preferences);
        if (recentsSlide) {
            slideshow.appendChild(recentsSlide);
        }
    }

}

function buildHomeSlide(platformName, preferences) {
    const slide = document.createElement("div");
    slide.className = "slide";
    slide.id = platformName;

    // Use relative path for Neutralino (served from /resources)
    const bgImageUrl = `url("images/platforms/${platformName}.png")`;
    slide.style.backgroundImage = bgImageUrl;

    const slideContent = document.createElement("div");
    slideContent.className = "slide-content";

    const platformInfo = getPlatformInfo(platformName);
    slideContent.innerHTML = `<p class="vendor">${platformInfo.vendor}</p> <p class="name">${platformInfo.name}</p>`;

    slide.appendChild(slideContent);
    slide.setAttribute('data-name', platformName);
    slide.setAttribute('data-platform', platformName);

    // --- Special cases first ---
    if (platformName === 'recents') {
        slide.setAttribute('data-is-enabled', true);
        slide.setAttribute('data-index', PLATFORMS.length);
        return slide;
    }

    if (platformName === 'settings') {
        slide.setAttribute('data-is-enabled', true);
        slide.setAttribute('data-index', 0);
        return slide;
    }

    // --- Normal platform filtering ---
    const platformPrefs = preferences[platformName];
    slide.setAttribute('data-is-enabled', platformPrefs?.isEnabled);

    if ((LB.kioskMode || LB.disabledPlatformsPolicy === 'hide') && !platformPrefs?.isEnabled) {
        return null;
    }

    slide.setAttribute('data-index', platformPrefs.index);
    return slide;
}


function showUI() {

    const splash = document.getElementById('splash');
    if (splash) splash.style.display = 'none';

    const footer = document.getElementById('footer');
    if (footer) footer.style.display = 'flex';
}

emulsify(); // !!
