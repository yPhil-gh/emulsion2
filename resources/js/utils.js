function setFooterSize(size) {
    const footer = document.getElementById('footer');
    if (footer) {
        footer.className = `footer-${size}`;
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

function initSlideShow(startIndex) {
    // Basic slideshow initialization
    const slides = document.querySelectorAll('.home-slide');
    if (slides.length > 0) {
        slides.forEach((slide, index) => {
            slide.style.display = index === startIndex ? 'block' : 'none';
        });
    }
}

// Simple error fallback for game covers
async function getGameCoverPath(platformName, gameName) {
    const coverPath = `${LB.userDataPath}/covers/${platformName}/${gameName}.png`;

    try {
        const exists = await fileExists(coverPath);
        return exists ? coverPath : 'images/missing.png';
    } catch (error) {
        return 'images/missing.png';
    }
}
