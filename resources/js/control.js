function initSlideShow(platformToDisplay = 0) {
    console.log('Initializing slideshow control...');

    const slideshow = document.getElementById("slideshow");
    const slides = Array.from(slideshow.querySelectorAll('.slide'));
    const totalSlides = slides.length;

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

    function handleHomeKeyDown(event) {
        event.stopPropagation();

        switch (event.key) {
            case 'ArrowRight': nextSlide(); break;
            case 'ArrowLeft': prevSlide(); break;
            case 'Enter': activateCurrentSlide(); break;
            case 'Escape': returnToSlideshow(); break;
        }
    }

    function activateCurrentSlide() {
        const activeSlide = slides[currentIndex];
        const platformName = activeSlide.dataset.platform;

        console.log('Activating platform:', platformName);

        // For now, just log - we'll implement gallery navigation later
        console.log('Would open gallery for:', platformName);
    }

    function returnToSlideshow() {
        // Show slideshow, hide galleries
        document.getElementById('slideshow').style.display = 'flex';
        document.getElementById('galleries').style.display = 'none';
        document.getElementById('header').style.display = 'none';
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

// Export only what we need
window.initSlideShow = initSlideShow;
