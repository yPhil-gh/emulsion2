import { openPlatformMenu } from './menu-forms.js';
import { LB } from './global.js';
import { initGallery, simulateKeyDown } from './gallery.js';

let slideshow;
let slides = [];
let totalSlides = 0;
let currentIndex = 0;
let isInit = true;

function updateSlideshow() {
    const angleIncrement = 360 / totalSlides;
    const radius = 90 * totalSlides;

    slides.forEach((slide, i) => {
        const angle = angleIncrement * (i - currentIndex);
        slide.style.setProperty('--angle', angle);
        slide.style.setProperty('--radius', radius);

        slide.classList.remove('active', 'prev-slide-flat', 'next-slide-flat', 'adjacent-flat');

        if (i === currentIndex) {
            slide.classList.add('active');
            LB.currentHomePlatform = slide.dataset.platform;
            if (LB.autoSelect && isInit) {
                simulateKeyDown('Enter');
                isInit = false;
            }
        } else if (i === (currentIndex - 1 + totalSlides) % totalSlides) {
            slide.classList.add('prev-slide-flat');
        } else if (i === (currentIndex + 1) % totalSlides) {
            slide.classList.add('next-slide-flat');
        } else {
            slide.classList.add('adjacent-flat');
        }
    });
}

function nextSlide() {
    currentIndex = (currentIndex + 1) % totalSlides;
    updateSlideshow();
}

function prevSlide() {
    currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    updateSlideshow();
}

function activateCurrentSlide() {
    const activeSlide = slides[currentIndex];
    const galleries = document.getElementById('galleries');
    const platformName = activeSlide.dataset.platform;
    const isPlatformEnabled = activeSlide.dataset.isEnabled === "true";

    document.getElementById('slideshow').style.display = 'none';
    document.getElementById('header').style.display = 'flex';
    window.removeEventListener('keydown', onHomeKeyDown);

    if (isPlatformEnabled) {
        galleries.style.display = 'flex';
        initGallery(null, platformName);
    } else {
        galleries.style.display = 'none';
        openPlatformMenu(platformName);
    }
}

function customConfirm(message, callback) {
    const modal = document.getElementById('customConfirmDialog');
    const okButton = document.getElementById('confirmOk');
    const cancelButton = document.getElementById('confirmCancel');
    const msgElem = document.getElementById('confirmMessage');

    msgElem.innerText = message;
    modal.style.display = 'flex';

    okButton.focus(); // Focus OK button

    const cleanup = () => {
        okButton.onclick = null;
        cancelButton.onclick = null;
        modal.style.display = 'none';
    };

    okButton.onclick = () => { cleanup(); callback(true); };
    cancelButton.onclick = () => { cleanup(); callback(false); };
}

export async function onHomeKeyDown(event) {
    event.stopPropagation();
    event.stopImmediatePropagation();

    switch (event.key) {
    case 'ArrowRight': nextSlide(); break;
    case 'ArrowLeft': prevSlide(); break;
    case 'Enter': activateCurrentSlide(); break;
    case 'i':
        openPlatformMenu(LB.currentHomePlatform);
        break;
    case 'a': console.log("onHomeKeyDown: "); break;
    case 'Escape':
        if (document.getElementById('slideshow').style.display === 'flex') {

            customConfirm("Really, quit?", (result) => {
                if (result) {
                    Neutralino.app.exit();
                } else {
                    console.success("Thattaboy");
                }
            });

        }
        break;
    }
}

function initSlideShow(platformToDisplay = 0) {
    slideshow = document.getElementById("slideshow");
    slides = Array.from(slideshow.querySelectorAll('.slide'));
    totalSlides = slides.length;

    slideshow.style.display = 'flex';
    document.getElementById('galleries').style.display = 'none';
    document.getElementById('header').style.display = 'none';

    currentIndex = 0;

    if (typeof platformToDisplay === 'string') {
        const foundIndex = slides.findIndex(s =>
            s.dataset.platform === platformToDisplay ||
            s.dataset.name === platformToDisplay
        );
        if (foundIndex !== -1) currentIndex = foundIndex;
    } else {
        const idx = slides.findIndex(s => Number(s.dataset.index) === Number(platformToDisplay));
        if (idx !== -1) currentIndex = idx;
    }

    slideshow.addEventListener('wheel', (event) => {
        event.preventDefault();
        event.deltaY > 0 ? nextSlide() : prevSlide();
    });

    slides.forEach((slide) => {
        slide.addEventListener('click', (event) => {
            event.stopPropagation();
            if (slide.classList.contains('active')) {
                activateCurrentSlide();
            }
        });

        slide.addEventListener("contextmenu", (event) => {
            event.preventDefault();
            console.log("event.currentTarget: ", event.currentTarget.dataset.platform);
            openPlatformMenu(event.currentTarget.dataset.platform);
        });

    });

    window.addEventListener('keydown', onHomeKeyDown);

    updateSlideshow();
}

function goToSlideshow(platformName) {
    console.log("goToSlideshow:", platformName);

    slideshow.style.display = 'flex';
    document.getElementById('galleries').style.display = 'none';
    document.getElementById('header').style.display = 'none';

    window.addEventListener('keydown', onHomeKeyDown);

    const foundIndex = slides.findIndex(s =>
        s.dataset.platform === platformName ||
        s.dataset.name === platformName
    );

    if (foundIndex !== -1) {
        currentIndex = foundIndex;
        updateSlideshow();
    } else {
        console.warn(`No slide found for platform: ${platformName}`);
    }
}

export {
    initSlideShow,
    goToSlideshow
};
