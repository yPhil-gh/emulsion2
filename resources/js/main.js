import { LB } from './global.js';
import { loadPreferences } from './preferences.js';
import { buildGalleries } from './gallery-builder.js';
import { initSlideShow } from './control.js';
import { getPlatformInfo, PLATFORMS } from './platforms.js';
import { mountAllGamesDir, setFooterSize, applyTheme } from './utils.js';

async function initApp() {

    const cliArgs = await handleCliArgs();
    await Neutralino.init();

    console.log("cliArgs: ", cliArgs.autoSelect);

    if (PLATFORMS.some(p => p.name === cliArgs.autoSelect)) {
        console.log("cliArgs.autoSelect is valid! ", cliArgs.autoSelect);
    }

    const configPath = await Neutralino.os.getPath('config');
    LB.userDataPath = configPath + '/emulsion2';

    // Mount the covers directory
    const coversPath = `${LB.userDataPath}/covers`;
    try {
        await Neutralino.server.mount('/covers', coversPath);
    } catch (err) {
        console.error('Failed to mount covers directory:', err);
    }

    // Set paths

    // Load preferences and store in LB.preferences
    LB.preferences = await loadPreferences();

    await mountAllGamesDir();

    console.log("LB.preferences: ", LB.preferences);

    // Set basic preferences from LB.preferences
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

    // Build the carousel slides using the EXACT same logic as your original
    buildSlideshow(LB.preferences);

    // Initialize slideshow controls (no need to pass preferences parameter now)
    initSlideShow(0);

    showMainInterface();

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

    console.log("args: ", args);

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
    console.log("autoSelectArg: ", autoSelectArg);
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

    // Count total platforms for recents index
    LB.totalNumberOfPlatforms = Object.keys(preferences).length - 1; // exclude settings

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

    slide.setAttribute('data-platform', platformName);
    slide.setAttribute('data-is-enabled', preferences[platformName].isEnabled);

    slide.appendChild(slideContent);

    if (platformName === 'recents') {
        slide.setAttribute('data-index', LB.totalNumberOfPlatforms);
        return slide;
    }

    // Apply the same filtering logic as your original
    if (platformName !== 'settings' &&
        ((LB.kioskMode || LB.disabledPlatformsPolicy === 'hide') && !preferences[platformName]?.isEnabled)) {
        return null;
    }

    slide.setAttribute('data-index', preferences[platformName].index);
    slide.setAttribute('data-name', platformName);

    return slide;
}

function showMainInterface() {

    console.info("SHOWMAININTERFACE!");

    const splash = document.getElementById('splash');
    if (splash) splash.style.display = 'none';

    // const header = document.getElementById('header');
    // if (header) header.style.display = 'flex';

    const footer = document.getElementById('footer');
    if (footer) footer.style.display = 'flex';
}

// Start the app
initApp();
