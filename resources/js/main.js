


window.LB = {
    enabledPlatforms: [],
    galleryNumOfCols: 6,
    baseDir: '/resources',
    userDataPath: '',
    totalNumberOfPlatforms: 0,
    kioskMode: false,
    disabledPlatformsPolicy: 'show',
    preferences: null // Add preferences to LB object
};

async function initApp() {
    await Neutralino.init();

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

    // Set basic preferences from LB.preferences
    LB.galleryNumOfCols = LB.preferences.settings.numberOfColumns;
    LB.recentlyPlayedPolicy = LB.preferences.settings.recentlyPlayedPolicy;
    LB.disabledPlatformsPolicy = LB.preferences.settings.disabledPlatformsPolicy;
    LB.theme = LB.preferences.settings.theme;

    applyTheme(LB.theme);

    await buildGalleries(LB.preferences);

    // Build the carousel slides using the EXACT same logic as your original
    buildSlideshow(LB.preferences);

    // Initialize slideshow controls (no need to pass preferences parameter now)
    initSlideShow(0);

    // Show main interface
    showMainInterface();

    Neutralino.events.on('windowClose', () => {
        Neutralino.app.exit();
    });
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
    slide.setAttribute('data-is-enabled', preferences[platformName].isEnabled);

    return slide;
}

function getPlatformInfo(platformName) {
    // Find platform info from PLATFORMS array
    const platform = PLATFORMS.find(p => p.name === platformName);
    if (platform) {
        return { vendor: platform.vendor, name: platform.displayName };
    }

    // Fallback for settings and recents
    if (platformName === 'settings') {
        return { vendor: 'Emulsion', name: 'Settings' };
    }
    if (platformName === 'recents') {
        return { vendor: 'Emulsion', name: 'Recents' };
    }

    // Final fallback
    return { vendor: platformName, name: platformName };
}

function showMainInterface() {
    // Hide the Neutralino default app container
    const neutralinoApp = document.getElementById('neutralinoapp');
    if (neutralinoApp) neutralinoApp.style.display = 'none';

    // Hide the splash screen
    const splash = document.getElementById('splash');
    if (splash) splash.style.display = 'none';

    // Show the main emulsion interface
    const main = document.getElementById('main');
    if (main) main.style.display = 'flex';

    const header = document.getElementById('header');
    if (header) header.style.display = 'flex';

    const footer = document.getElementById('footer');
    if (footer) footer.style.display = 'flex';
}

// Start the app
if (window.Neutralino) {
    initApp();

} else {
    document.addEventListener('NeutralinoLoaded', initApp);
}
