function setFooterSize(size) {
    console.log("size: ", size);
    const footer = document.getElementById('footer');
    if (footer) {
        footer.className = `footer-${size}`;
    }
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

const updateControls = function(controlId, icon, text, state = '') {
    const control = document.getElementById(controlId);
    if (!control) return;

    if (icon && icon !== 'same') {
        const iconEl = control.querySelector('.icon');
        if (iconEl) iconEl.src = `images/controls/${icon}.png`;
    }

    if (text && text !== 'same') {
        const textEl = control.querySelector('span');
        if (textEl) textEl.innerHTML = text;
    }

    control.className = `control-item ${state}`;
};

const getSelectedGame = function(containers, index) {
    return containers[index] || containers[0];
};


function applyTheme(theme) {
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

window.applyTheme = applyTheme;
window.setFooterSize = setFooterSize;
