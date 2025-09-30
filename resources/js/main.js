import { LB } from './global.js';
import { loadPreferences } from './preferences.js';
import { buildGalleries } from './gallery-builder.js';
import { initSlideShow } from './slideshow.js';
import { getPlatformInfo, PLATFORMS } from './platforms.js';
import { mountAllGamesDir, setFooterSize, applyTheme } from './utils.js';
import { initSDL, initGameControllerChromiumAPI } from './gamecontroller.js';

async function emulsify() {

    initSDL();

    const cliArgs = await handleCliArgs();
    await Neutralino.init();

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

// function getArgValue(args, flag) {
//     // Finds --flag or --flag=value, returns value or true/false
//     const found = args.find(arg => arg === flag || arg.startsWith(flag + '='));
//     if (!found) return false;
//     if (found === flag) return true;
//     return found.split('=')[1];
// }

// async function handleCliArgs() {
//     const args = NL_ARGS || [];

//     return {
//         open: getArgValue(args, '--open'),
//         kiosk: args.includes('--kiosk'),
//         fullScreen: args.includes('--full-screen'),
//         autoSelect: getArgValue(args, '--auto-select'),
//         help: args.includes('--help') || args.includes('-h'),
//         version: args.includes('--version') || args.includes('-v'),
//         // add more flags as needed
//     };
// }

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
