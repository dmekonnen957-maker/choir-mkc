import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Music2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const CAROUSEL_SLIDES = [
    {
        src: '/images/p1.jpg',
        alt: 'Choir members worshiping with joy',
        caption: 'Yeka Meserete Kristos Choir Worship',
    },
    {
        src: '/images/p2.jpg',
        alt: 'Sanctuary cross and prayer worship',
        caption: 'Sacred worship and reverence',
    },
    {
        src: '/images/p3.jpg',
        alt: 'Live worship concert and Jesus banner',
        caption: 'United voices praising Jesus',
    },
];

const AUTO_SLIDE_INTERVAL = 5500;

export default function HeroCarousel() {
    const { t } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const containerRef = useRef(null);
    const touchStartX = useRef(null);
    const touchEndX = useRef(null);

    const totalSlides = CAROUSEL_SLIDES.length;

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, [totalSlides]);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    }, [totalSlides]);

    // Auto-advance slideshow when not paused
    useEffect(() => {
        if (isPaused) return;
        const timer = setInterval(nextSlide, AUTO_SLIDE_INTERVAL);
        return () => clearInterval(timer);
    }, [isPaused, nextSlide]);

    // Preload images
    useEffect(() => {
        CAROUSEL_SLIDES.forEach(({ src }) => {
            const img = new Image();
            img.src = src;
        });
    }, []);

    // Touch gesture support for mobile swiping
    const handleTouchStart = (e) => {
        touchStartX.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;
        const distance = touchStartX.current - touchEndX.current;
        const minSwipeDistance = 50;
        if (distance > minSwipeDistance) {
            nextSlide();
        } else if (distance < -minSwipeDistance) {
            prevSlide();
        }
        touchStartX.current = null;
        touchEndX.current = null;
    };

    return (
        <section
            ref={containerRef}
            className="relative w-full min-h-[580px] sm:min-h-[640px] lg:min-h-[720px] overflow-hidden bg-slate-950 text-white flex items-center justify-center select-none"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            aria-label="Choir Homepage Carousel"
            role="region"
            aria-roledescription="carousel"
        >
            {/* Horizontal sliding track */}
            <div
                className="absolute inset-0 flex h-full w-full transition-transform duration-700 ease-out"
                style={{
                    transform: `translateX(-${currentIndex * 100}%)`,
                }}
            >
                {CAROUSEL_SLIDES.map((slide, index) => (
                    <div
                        key={slide.src}
                        className="relative h-full w-full shrink-0 overflow-hidden"
                        aria-hidden={index !== currentIndex}
                    >
                        <img
                            src={slide.src}
                            alt={slide.alt}
                            className="h-full w-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out"
                            loading={index === 0 ? 'eager' : 'lazy'}
                        />
                    </div>
                ))}
            </div>

            {/* Dark overlay gradients for text legibility and cinematic atmosphere */}
            <div className="pointer-events-none absolute inset-0 bg-black/55 backdrop-blur-[0.5px]" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/60" />

            {/* Centered Overlay Content */}
            <div className="relative z-20 mx-auto flex max-w-5xl flex-col items-center px-4 py-16 text-center sm:px-6 lg:px-8">
                {/* Official Church Badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/95 backdrop-blur-md shadow-sm sm:text-sm animate-fade-in">
                    <Music2 size={16} className="text-blue-400" />
                    <span>{t('hero.ministry')}</span>
                </div>

                {/* Bold Centered Main Heading: Official Church & Choir Name */}
                <h1 className="mt-6 max-w-4xl text-3xl font-black uppercase tracking-tight text-white drop-shadow-md sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
                    {t('brand.choirName')}
                </h1>

                {/* Subtitle / Church description */}
                <p className="mt-5 max-w-2xl text-sm font-medium leading-relaxed text-slate-200 sm:text-lg drop-shadow">
                    {t('hero.subtitle')}
                </p>

                {/* Action Buttons */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                    {/* Primary Action: Explore songs / መዘምራንን ይፈልጉ */}
                    <Link
                        to="/songs"
                        className="inline-flex items-center gap-2.5 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-extrabold uppercase tracking-wider text-white shadow-xl shadow-blue-900/40 transition-all duration-200 hover:bg-blue-500 hover:shadow-blue-700/50 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-blue-400"
                    >
                        <Music2 size={17} />
                        <span>{t('hero.exploreSongs')}</span>
                        <ArrowRight size={18} />
                    </Link>

                    {/* Secondary Action: View Performances / ትርኢትን ይመልከቱ */}
                    <Link
                        to="/performances"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20 hover:border-white/50 hover:scale-[1.02]"
                    >
                        <span>{t('hero.viewPerformances')}</span>
                    </Link>
                </div>

                {/* Scripture verse banner */}
                <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 sm:text-xs">
                    {t('hero.verse')}
                </p>
            </div>

            {/* Left / Right Arrow Controls */}
            <button
                type="button"
                onClick={prevSlide}
                aria-label={t('hero.prevImage')}
                className="absolute left-3 sm:left-6 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-all hover:bg-blue-600 hover:border-blue-500 hover:scale-110 active:scale-95"
            >
                <ChevronLeft size={24} />
            </button>
            <button
                type="button"
                onClick={nextSlide}
                aria-label={t('hero.nextImage')}
                className="absolute right-3 sm:right-6 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-all hover:bg-blue-600 hover:border-blue-500 hover:scale-110 active:scale-95"
            >
                <ChevronRight size={24} />
            </button>

            {/* Bottom Pagination Dots (3 dots) */}
            <div
                className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-black/40 px-4 py-2 backdrop-blur-md border border-white/10"
                role="tablist"
                aria-label="Carousel navigation"
            >
                {CAROUSEL_SLIDES.map((slide, idx) => (
                    <button
                        key={slide.src}
                        type="button"
                        role="tab"
                        aria-selected={idx === currentIndex}
                        aria-label={`Go to slide ${idx + 1}`}
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                            idx === currentIndex
                                ? 'w-8 bg-blue-500 shadow-md shadow-blue-500/50'
                                : 'w-2.5 bg-white/50 hover:bg-white/90'
                        }`}
                    />
                ))}
            </div>
        </section>
    );
}
