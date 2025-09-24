

let preferencesFilePath = '';

async function getPreferencesPath() {
    const configPath = await Neutralino.os.getPath('config');
    preferencesFilePath = configPath + '/emulsion2/preferences.json'; // CHANGED to emulsion2
}

async function fileExists(path) {
    try {
        await Neutralino.filesystem.readFile(path);
        return true;
    } catch (error) {
        return false;
    }
}

async function directoryExists(path) {
    try {
        await Neutralino.filesystem.readDirectory(path);
        return true;
    } catch (error) {
        return false;
    }
}

async function loadPreferences() {
    await getPreferencesPath();

    try {
        const fileExistsResult = await fileExists(preferencesFilePath);

        if (fileExistsResult) {
            const preferencesFileContent = await Neutralino.filesystem.readFile(preferencesFilePath);

            try {
                const preferences = JSON.parse(preferencesFileContent);

                if (!validatePreferences(preferences)) {
                    console.error('Invalid preferences structure');
                    return await createDefaultPreferences();
                }

                console.log('Loaded preferences:', preferences);
                return preferences;
            } catch (parseError) {
                console.error('Invalid JSON in preferences file:', parseError);
                return await createDefaultPreferences();
            }
        } else {
            console.log('No preferences file found, creating default');
            return await createDefaultPreferences();
        }
    } catch (error) {
        console.error('Error loading preferences:', error);
        return await createDefaultPreferences();
    }
}

function validatePreferences(preferences) {
    if (!preferences.settings) return false;
    if (typeof preferences.settings.index !== 'number') return false;
    if (typeof preferences.settings.numberOfColumns !== 'number') return false;
    if (typeof preferences.settings.footerSize !== 'string') return false;
    if (typeof preferences.settings.homeMenuTheme !== 'string') return false;
    if (typeof preferences.settings.disabledPlatformsPolicy !== 'string') return false;
    if (typeof preferences.settings.recentlyPlayedPolicy !== 'string') return false;
    if (typeof preferences.settings.theme !== 'string') return false;
    if (typeof preferences.settings.steamGridAPIKey !== 'string') return false;
    if (typeof preferences.settings.giantBombAPIKey !== 'string') return false;

    for (const platform of PLATFORMS) {
        if (preferences[platform.name]) {
            const platformPrefs = preferences[platform.name];
            if (typeof platformPrefs.isEnabled !== 'boolean') return false;
            if (typeof platformPrefs.index !== 'number') return false;
            if (typeof platformPrefs.gamesDir !== 'string') return false;
            if (typeof platformPrefs.emulator !== 'string') return false;
            if (typeof platformPrefs.emulatorArgs !== 'string') return false;
            if (!Array.isArray(platformPrefs.extensions)) return false;
        }
    }

    return true;
}

async function createDefaultPreferences() {
    const defaultPreferences = {
        settings: {
            index: 0,
            numberOfColumns: 6,
            footerSize: "medium",
            homeMenuTheme: "flat",
            disabledPlatformsPolicy: "show",
            recentlyPlayedPolicy: "hide",
            theme: "default",
            steamGridAPIKey: "",
            giantBombAPIKey: ""
        }
    };

    PLATFORMS.forEach((platform, index) => {
        defaultPreferences[platform.name] = {
            isEnabled: false,
            index: index + 1,
            gamesDir: "",
            emulator: "",
            emulatorArgs: "",
            extensions: platform.extensions
        };
    });

    await savePreferences(defaultPreferences);
    return defaultPreferences;
}

async function savePreferences(preferences) {
    try {
        const configPath = await Neutralino.os.getPath('config');
        const emulsion2Dir = configPath + '/emulsion2'; // CHANGED to emulsion2

        const dirExists = await directoryExists(emulsion2Dir);

        if (!dirExists) {
            await Neutralino.filesystem.createDirectory(emulsion2Dir);
        }

        await Neutralino.filesystem.writeFile(preferencesFilePath, JSON.stringify(preferences, null, 2));
        console.log('Preferences saved to:', preferencesFilePath);
        return true;
    } catch (error) {
        console.error('Error saving preferences:', error);
        return false;
    }
}

async function updatePreference(platformName, key, value) {
    console.log("updatePreference:", platformName, key, value);

    try {
        // 1. Load current preferences
        const preferences = await loadPreferences();

        if (!preferences[platformName]) {
            console.error(`Platform ${platformName} not found in preferences`);
            return false;
        }

        // 2. Check if value actually changed
        if (preferences[platformName][key] === value) {
            console.log("No changes detected, skipping save");
            return false;
        }

        // 3. Update in-memory
        preferences[platformName][key] = value;

        // 4. Save back to disk
        await savePreferences(preferences);

        // 5. Notify user
        const notifications = document.getElementById('notifications');
        const notification = document.getElementById('notification');

        if (notification && notifications) {
            notification.textContent = 'Preferences saved successfully';
            notifications.style.opacity = 1;

            setTimeout(() => {
                notifications.style.opacity = 0;
            }, 3000);
        }

        console.log(`${platformName}.${key} updated to:`, value);
        return true;
    } catch (error) {
        console.error('Error updating preference:', error);
        return false;
    }
}
