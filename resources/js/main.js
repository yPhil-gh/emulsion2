async function initApp() {
    await Neutralino.init();

    const preferences = await loadPreferences();
    const appContainer = document.getElementById('neutralinoapp');
    appContainer.innerHTML = '<h1>Emulsion2 Platforms</h1>';

    const platformList = document.createElement('ul');

    // Display settings first
    const settingsItem = document.createElement('li');
    settingsItem.textContent = `SETTINGS (Index: ${preferences.settings.index})`;
    settingsItem.style.fontWeight = 'bold';
    platformList.appendChild(settingsItem);

    // Display all platforms from single source of truth
    PLATFORMS.forEach(platform => {
        if (preferences[platform.name]) {
            const platformData = preferences[platform.name];
            const listItem = document.createElement('li');
            listItem.textContent = `${platform.name.toUpperCase()} (Index: ${platformData.index}, Enabled: ${platformData.isEnabled})`;
            platformList.appendChild(listItem);
        }
    });

    appContainer.appendChild(platformList);

    Neutralino.events.on('windowClose', () => {
        Neutralino.app.exit();
    });
}

// Start the app
if (window.Neutralino) {
    initApp();
} else {
    window.addEventListener('neutralino-device-ready', initApp);
}
