import { LB } from './global.js';
import { PLATFORMS } from './platforms.js';

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

    try {
        const fileExistsResult = await fileExists(LB.prefsFilePath);

        if (fileExistsResult) {
            const preferencesFileContent = await Neutralino.filesystem.readFile(LB.prefsFilePath);

            try {
                const preferences = JSON.parse(preferencesFileContent);

                if (!validatePreferences(preferences)) {
                    console.error('Invalid preferences structure');
                    return await createDefaultPreferences();
                }

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
            isEnabled: true,
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

        const dirExists = await directoryExists(LB.userDataPath);

        if (!dirExists) {
            await Neutralino.filesystem.createDirectory(LB.userDataPath);
        }

        await Neutralino.filesystem.writeFile(LB.prefsFilePath, JSON.stringify(preferences, null, 2));
        console.log('Preferences saved to:', LB.prefsFilePath);
        return true;
    } catch (error) {
        console.error('Error saving preferences:', error);
        return false;
    }
}

async function updatePreference(platformName, key, value) {

    console.log("platformName, key, value: ", platformName, key, value);

    try {
        const preferences = await loadPreferences();

        if (!preferences[platformName]) {
            console.error(`Platform ${platformName} not found in preferences`);
            return false;
        }

        if (preferences[platformName][key] === value) {
            console.log("No changes detected, skipping save");
            return false;
        }

        preferences[platformName][key] = value;

        await savePreferences(preferences);

        console.log(`${platformName}.${key} updated to:`, value);
        return true;
    } catch (error) {
        console.error('Error updating preference:', error);
        return false;
    }
}

export async function savePlayHistory(entry) {
    try {
        // Read existing file
        let history = [];
        try {
            const content = await Neutralino.filesystem.readFile(LB.playHistoryFilePath);
            history = JSON.parse(content);
        } catch (err) {
            // File may not exist yet → ignore
            history = [];
        }

        // Append new entry
        history.push(entry);

        // Write back
        await Neutralino.filesystem.writeFile(
            LB.playHistoryFilePath,
            JSON.stringify(history, null, 2)
        );

        console.log(`📜 Saved play history: ${entry.gameName}`);
    } catch (err) {
        console.error("❌ Failed to save play history:", err);
    }
}

export {
    loadPreferences,
    savePreferences,
    updatePreference
};
