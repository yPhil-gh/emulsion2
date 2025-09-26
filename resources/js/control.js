import { openPlatformMenu } from './menu-forms.js';
import { LB } from './global.js';
import { initGallery } from './gallery.js';

let slideshow;
let slides = [];
let totalSlides = 0;
let currentIndex = 0;

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
    window.removeEventListener('keydown', handleHomeKeyDown);

    if (isPlatformEnabled) {
        galleries.style.display = 'flex';
        initGallery(null, platformName);
    } else {
        galleries.style.display = 'none';
        openPlatformMenu(platformName);
    }
}

function handleHomeKeyDown(event) {
    event.stopPropagation();

    switch (event.key) {
        case 'ArrowRight': nextSlide(); break;
        case 'ArrowLeft': prevSlide(); break;
        case 'Enter': activateCurrentSlide(); break;
        case 'Escape':
            if (document.getElementById('slideshow').style.display === 'flex') {
                Neutralino.app.exit();
            }
            break;
    }
}

function initSlideShow(platformToDisplay = 0) {
    slideshow = document.getElementById("slideshow");
    slides = Array.from(slideshow.querySelectorAll('.slide'));
    totalSlides = slides.length;

    const preferences = LB.preferences;

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
    });

    window.addEventListener('keydown', handleHomeKeyDown);

    updateSlideshow();
}

function goToSlideshow(platformName) {
    console.log("goToSlideshow:", platformName);

    slideshow.style.display = 'flex';
    document.getElementById('galleries').style.display = 'none';
    document.getElementById('header').style.display = 'none';

    window.addEventListener('keydown', handleHomeKeyDown);

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
