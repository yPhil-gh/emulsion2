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
