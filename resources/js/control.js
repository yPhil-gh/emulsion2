function initSlideShow(platformToDisplay = 0) {
    console.log('Initializing slideshow control...');

    const slideshow = document.getElementById("slideshow");
    const slides = Array.from(slideshow.querySelectorAll('.slide'));
    const totalSlides = slides.length;

    // Set initial display states
    slideshow.style.display = 'flex';
    document.getElementById('galleries').style.display = 'none';
    document.getElementById('header').style.display = 'none';

    let currentIndex = slides.findIndex(s =>
        Number(s.dataset.index) === Number(platformToDisplay)
    ) || 0;

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

        console.log('Activating platform:', activePlatformName, 'at index:', activeGalleryIndex);

        // Switch to gallery view
        document.getElementById('slideshow').style.display = 'none';
        document.getElementById('galleries').style.display = 'flex';
        document.getElementById('header').style.display = 'flex';
        window.removeEventListener('keydown', handleHomeKeyDown);

        // Initialize the gallery
        if (activePlatformName === 'recents') {
            initGallery(LB.totalNumberOfPlatforms);
        } else if (LB.enabledPlatforms.includes(activePlatformName)) {
            if (activePlatformName === 'settings' && LB.kioskMode) return;
            initGallery(activeGalleryIndex);
        } else {
            initGallery(0, activePlatformName);
        }
    }

    function returnToSlideshow() {
        // Switch back to slideshow view
        document.getElementById('slideshow').style.display = 'flex';
        document.getElementById('galleries').style.display = 'none';
        document.getElementById('header').style.display = 'none';
        window.addEventListener('keydown', handleHomeKeyDown);
        updateSlideshow();
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

    console.log('Slideshow control initialized with', totalSlides, 'slides');
}

// Gallery function (placeholder for now)
function initGallery(galleryIndex, platformName = null) {
    console.log('Opening gallery:', galleryIndex, 'for platform:', platformName);
    // This will be implemented later
}

window.initSlideShow = initSlideShow;
window.initGallery = initGallery;
window.returnToSlideshow = returnToSlideshow;
