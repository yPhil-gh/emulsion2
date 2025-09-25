import { openPlatformMenu } from './menu-forms.js';
import { LB } from './global.js';
import { initGallery } from './gallery.js';

function initSlideShow(platformToDisplay = 0) {

    const slideshow = document.getElementById("slideshow");
    const slides = Array.from(slideshow.querySelectorAll('.slide'));
    const totalSlides = slides.length;

    // Use LB.preferences instead of local parameter
    const preferences = LB.preferences;

    // Set initial display states
    slideshow.style.display = 'flex';
    document.getElementById('galleries').style.display = 'none';
    document.getElementById('header').style.display = 'none';

    // Default index
    let currentIndex = 0;

    if (typeof platformToDisplay === 'string') {
        // Lookup by name
        const foundIndex = slides.findIndex(s =>
            s.dataset.platform === platformToDisplay ||
            s.dataset.name === platformToDisplay
        );
        if (foundIndex !== -1) {
            currentIndex = foundIndex;
        }
    } else {
        // Fallback to numeric index
        const idx = slides.findIndex(s => Number(s.dataset.index) === Number(platformToDisplay));
        if (idx !== -1) {
            currentIndex = idx;
        }
    }

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
        const activePlatformName = activeSlide.dataset.platform;
        const activeGalleryIndex = Number(activeSlide.dataset.index);

        // Switch to appropriate view
        document.getElementById('slideshow').style.display = 'none';
        document.getElementById('header').style.display = 'flex';
        window.removeEventListener('keydown', handleHomeKeyDown);

        // Check if this platform needs configuration (using LB.preferences)
        if (platformNeedsConfiguration(activePlatformName, LB.preferences)) {
            // Open configuration menu for unconfigured platform
            document.getElementById('galleries').style.display = 'none';
            openPlatformMenu(activePlatformName);
        } else if (activePlatformName === 'recents') {
            // Open recents gallery
            document.getElementById('galleries').style.display = 'flex';
            initGallery(null, 'recents');  // pass NAME
        } else if (activePlatformName === 'settings') {
            // Show the first gallery page (settings gallery)
            document.getElementById('galleries').style.display = 'flex';
            initGallery(null, 'settings');  // pass NAME
        } else {
            // Open configured platform gallery by NAME
            document.getElementById('galleries').style.display = 'flex';
            initGallery(null, activePlatformName);  // pass NAME
        }
    }


    function handleHomeKeyDown(event) {
        event.stopPropagation();

        switch (event.key) {
            case 'ArrowRight': nextSlide(); break;
            case 'ArrowLeft': prevSlide(); break;
            case 'Enter': activateCurrentSlide(); break;
            case 'Escape':
                // Only handle ESC if we're in slideshow mode
                if (document.getElementById('slideshow').style.display === 'flex') {
                    Neutralino.app.exit();
                }
                break;
        }
    }

    // Event listeners
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

    // Initial setup
    updateSlideshow();

    // Expose helper so it can be used project-wide
    window.goToSlideshow = function (platformName) {

        slideshow.style.display = 'flex';
        document.getElementById('galleries').style.display = 'none';
        document.getElementById('header').style.display = 'none';

        window.addEventListener('keydown', handleHomeKeyDown);

        const slides = Array.from(slideshow.querySelectorAll('.slide'));
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
    };
}

// Simple function to check if a platform needs configuration
function platformNeedsConfiguration(platformName, preferences) {
    if (platformName === 'settings') return false;

    const platformPrefs = preferences[platformName];
    return !platformPrefs || !platformPrefs.gamesDir || !platformPrefs.emulator;
}

export {
    initSlideShow
};

