import { LB } from './global.js';

export function setFooterSize(size) {
    console.log("size: ", size);
    const footer = document.getElementById('footer');
    if (footer) {
        footer.className = `footer-${size}`;
    }
}

export function applyTheme(theme) {
    console.log("APPLYTHEME!!! ");
    const body = document.querySelector('body');
    const menu = document.getElementById('menu');

    const bgPath = `images/themes/${theme}/background.png`;
    const bgImageUrl = `url("${bgPath}")`;

    body.style.backgroundImage = bgImageUrl;
    menu.style.backgroundImage = bgImageUrl;

    menu.style.transition = 'filter 1s';
    menu.style.filter = 'opacity(0.5)';

    body.classList.remove('theme-day', 'theme-night', 'theme-default');
    body.classList.add(`theme-${theme}`);

    menu.style.transition = 'filter 1s, color 1s';
    menu.style.filter = 'opacity(0.5)';

    setTimeout(() => {
        menu.style.backgroundImage = bgImageUrl;
        menu.style.filter = 'opacity(1)';
    }, 100);
}


function safeFileName(fileName) {

    const illegalRe = /[\/\?<>\\:\*\|"]/g;
    const controlRe = /[\x00-\x1f\x80-\x9f]/g;
    const reservedRe = /^\.+$/;
    const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
    const windowsTrailingRe = /[\. ]+$/;

    return fileName
        .replace(/[\s]/g, '_') // Replace spaces with underscores
        .replace(illegalRe, '') // Remove invalid characters
        .replace(controlRe, '') // Remove control characters
        .replace(reservedRe, '') // Remove trailing dots
        .replace(/^\s+|\s+$/g, '') || 'default_filename'; // Prevent empty names
}

// Uppercase ALPHANUMER1C
const PREDEFINED_TITLES = {
    VRALLY2:        'V-Rally 2',
    WIPEOUT2097:    'WipEout 2097',
    WIPEOUT3:       'WipEout 3',
    WIPEOUTFUSION:  'WipEout Fusion',
    PROJECTXSE:     'ProjectX SE',
    SONIC3COMPLETE: 'Sonic 3 Complete',
    NHL94:          'NHL 94',
};

function stripExtensions(fileName) {
    if (!fileName || typeof fileName !== 'string') return fileName;

    let base = fileName;
    for (let i = 0; i < 2; i++) {
        const lastDot = base.lastIndexOf('.');
        if (lastDot <= 0) break; // stop if no more extension
        base = base.substring(0, lastDot);
    }
    return base;
}

export function cleanFileName(fileName) {
    // 1) Base part before underscore
    const raw = fileName.split('_')[0];

    // 2) Remove all trailing "(…)" or "[…]"
    const noParens = raw.replace(/\s*[\(\[].*?[\)\]]/g, '');

    // 3) Split into [core, subtitle] on first " - "
    const [corePart, subtitlePart] = noParens.split(/\s-\s(.+)$/);

    // 4) Build lookup key from corePart: remove non-alphanumerics, uppercase
    const key = corePart.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    // 5) If exception exists, return it + suffix (if any)
    if (PREDEFINED_TITLES[key]) {
        return subtitlePart
            ? `${PREDEFINED_TITLES[key]} - ${subtitlePart}`   // preserve subtitle
            : PREDEFINED_TITLES[key];
    }

    // 6) Fallback to your original pipeline on the full raw filename
    let s = _removeAfterUnderscore(fileName);
    s = _splitSpecial(s);
    s = _splitCamelCase(s);
    s = _splitAcronym(s);
    s = _removeParens(s);
    s = _removeBrackets(s);
    s = _moveTrailingArticleToFront(s);

    return _titleCase(s);
}

function _removeAfterUnderscore(s) {
    return s.split('_')[0];
}

function _splitSpecial(s) {
    return s.replace(/(\d+[A-Z])(?=[A-Z][a-z])/g, '$1 ');
}

function _splitCamelCase(s) {
    return s.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function _splitAcronym(s) {
    return s.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

function _removeParens(s) {
    return s.replace(/\s*\(.*?\)/g, '');
}

function _removeBrackets(s) {
    return s.replace(/\s*\[.*?\]/g, '');
}

function _moveTrailingArticleToFront(s) {
    // Matches "... , The" (case-insensitive), end of string
    const m = s.match(/^(.*?),\s*(The|An|A)$/i);
    if (m) {
        // Capitalize the article properly and prepend
        const art = m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase();
        return `${art} ${m[1].trim()}`;
    }
    return s;
}

function _titleCase(s) {
    return s
        .split(/\s+/)
        .map(word => {
            // If it's all digits or ALL-CAP (or contains digits), leave as-is
            if (/^[0-9]+$/.test(word) || /^[A-Z0-9]+$/.test(word)) {
                return word;
            }
            // Otherwise, uppercase first letter, lowercase the rest
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
}

async function directoryExists(path) {
    try {
        await Neutralino.filesystem.readDirectory(path);
        return true;
    } catch (error) {
        return false;
    }
}

async function fileExists(path, platform) {
    try {
        await Neutralino.filesystem.readFile(path);
        return true;
    } catch (error) {
        return false;
    }
}

export async function getGameImagePath(platform, gameName) {
    const extensions = ['png', 'jpg', 'jpeg', 'webp'];

    for (const ext of extensions) {
        // Check with real filesystem path (checking the mounted dir fails)
        const fsPath = `${LB.preferences[platform].gamesDir}/images/${gameName}.${ext}`;
        if (await fileExists(fsPath, platform)) {
            // Return HTTP path
            return `/${platform}/images/${encodeURIComponent(gameName)}.${ext}`;
        }
    }
    return null;
}

async function mountDir(platform, path) {
    try {
        await Neutralino.server.mount(`/${platform}`, path);
    } catch (err) {
        console.error('Failed to mount covers directory:', err);
    }
}

function getEnabledPlatforms() {
    const enabled = [];
    for (const [platform, config] of Object.entries(LB.preferences)) {
        if (config.isEnabled && config.gamesDir) {
            enabled.push({ platform, gamesDir: config.gamesDir });
        }
    }
    return enabled;
}

export async function mountAllGamesDir() {
    const enabledPlatforms = getEnabledPlatforms();

    for (const { platform, gamesDir } of enabledPlatforms) {
        await mountDir(platform, gamesDir);
        console.log(`Mounted ${platform}: ${gamesDir}`);
    }
}

