import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, ArrowRight } from 'lucide-react';
import CoverImage from './CoverImage';

const DEFAULT_SLIDES = [
    {
        id: 1,
        title: "YEKA MKC CHOIR IS SO MUCH MORE THAN JUST A CHOIR",
        subtitle: "United in Voice. Connected in Faith.",
        ctaText: "EXPLORE OUR CHOIRS",
        ctaLink: "/choirs",
        badge: "Yeka MKC Ministry",
    },
    {
        id: 2,
        title: "DISCOVER SONGS & WORSHIP MUSIC",
        subtitle: "Listen to our collection, access lyrics, and sing along.",
        ctaText: "DISCOVER SONGS",
        ctaLink: "/songs",
        badge: "Music & Media",
    },
    {
        id: 3,
        title: "UPCOMING PERFORMANCES & EVENTS",
        subtitle: "Join us in our weekly gatherings and seasonal concerts.",
        ctaText: "VIEW PERFORMANCES",
        ctaLink: "/performances",
        badge: "Live Worship",
    },
];

export default function HeroSection({ featuredChoir = null, choirs = [] }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Merge backend choir data or fallback slides
    const slides = choirs.length > 0
        ? choirs.map((choir, idx) => ({
            id: choir.id || idx,
            title: choir.name ? `${choir.name.toUpperCase()} AT YEKA MKC` : DEFAULT_SLIDES[idx % 3].title,
            subtitle: choir.description || DEFAULT_SLIDES[idx % 3].subtitle,
            ctaText: "EXPLORE CHOIR",
            ctaLink: `/choirs/${choir.id || ''}`,
            badge: "Worship Team",
            image: choir.logo_path || choir.cover_path,
        }))
        : DEFAULT_SLIDES;

    const handleNext = useCallback(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, [slides.length]);

    const handlePrev = useCallback(() => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
    }, [slides.length]);

    // Auto-scroll carousel every 6 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            handleNext();
        }, 6000);
        return () => clearInterval(timer);
    }, [handleNext]);

    const getSlideIndex = (offset) => {
        return (currentIndex + offset + slides.length) % slides.length;
    };

    const prevSlide = slides[getSlideIndex(-1)];
    const currentSlide = slides[currentIndex];
    const nextSlide = slides[getSlideIndex(1)];

    return (
        <section className="relative overflow-hidden bg-slate-50/60 py-8 lg:py-12">
            {/* Main Carousel Wrapper */}
            <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
                <div className="relative flex items-center justify-center gap-4 lg:gap-6">

                    {/* Left Peek Preview Card */}
                    <div
                        onClick={handlePrev}
                        className="hidden md:block w-1/12 lg:w-1/6 shrink-0 cursor-pointer overflow-hidden rounded-[2.5rem] opacity-40 transition-all duration-500 hover:opacity-70 h-[380px] lg:h-[480px] relative shadow-md"
                    >
                        <CoverImage
                            src={prevSlide.image || featuredChoir?.logo_path}
                            label={prevSlide.title}
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/40" />
                    </div>

                    {/* Center Featured Slide */}
                    <div className="relative w-full lg:w-4/6 shrink-0 overflow-hidden rounded-[2.5rem] shadow-2xl h-[420px] sm:h-[480px] lg:h-[520px] bg-slate-900">
                        {/* Slide Background Image */}
                        <div className="absolute inset-0">
                            <CoverImage
                                src={currentSlide.image || featuredChoir?.logo_path}
                                label={currentSlide.title}
                                className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-105"
                            />
                            {/* Dark Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-black/20" />
                        </div>

                        {/* Content Overlay */}
                        <div className="relative z-10 flex h-full flex-col items-center justify-center p-6 text-center sm:p-10 lg:p-14">
                            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-600/30 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-blue-300 backdrop-blur-md border border-blue-400/30">
                                {currentSlide.badge}
                            </span>

                            <h1 className="max-w-3xl text-2xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl lg:leading-tight">
                                {currentSlide.title}
                            </h1>

                            <p className="mt-3 max-w-xl text-sm font-medium text-slate-200 sm:text-base lg:text-lg">
                                {currentSlide.subtitle}
                            </p>

                            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                                <Link
                                    to={currentSlide.ctaLink}
                                    className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-8 py-3.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-cyan-500/30 transition-all duration-200 hover:bg-cyan-400 hover:scale-105 active:scale-95"
                                >
                                    <Play size={16} className="fill-current" />
                                    {currentSlide.ctaText}
                                </Link>
                                <Link
                                    to="/songs"
                                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white backdrop-blur-md border border-white/20 transition-all duration-200 hover:bg-white/20"
                                >
                                    Discover Songs
                                    <ArrowRight size={16} />
                                </Link>
                            </div>

                            {/* Carousel Indicators */}
                            <div className="absolute bottom-6 flex items-center justify-center gap-2.5">
                                {slides.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIndex(idx)}
                                        aria-label={`Go to slide ${idx + 1}`}
                                        className={`h-2.5 rounded-full transition-all duration-300 ${currentIndex === idx
                                                ? 'w-8 bg-cyan-400'
                                                : 'w-2.5 bg-white/40 hover:bg-white/70'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Navigation Arrows */}
                        <button
                            onClick={handlePrev}
                            aria-label="Previous slide"
                            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2.5 text-white/80 backdrop-blur-md border border-white/10 transition-colors hover:bg-black/60 hover:text-white"
                        >
                            <ChevronLeft size={22} />
                        </button>
                        <button
                            onClick={handleNext}
                            aria-label="Next slide"
                            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2.5 text-white/80 backdrop-blur-md border border-white/10 transition-colors hover:bg-black/60 hover:text-white"
                        >
                            <ChevronRight size={22} />
                        </button>
                    </div>

                    {/* Right Peek Preview Card */}
                    <div
                        onClick={handleNext}
                        className="hidden md:block w-1/12 lg:w-1/6 shrink-0 cursor-pointer overflow-hidden rounded-[2.5rem] opacity-40 transition-all duration-500 hover:opacity-70 h-[380px] lg:h-[480px] relative shadow-md"
                    >
                        <CoverImage
                            src={nextSlide.image || featuredChoir?.logo_path}
                            label={nextSlide.title}
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/40" />
                    </div>

                </div>
            </div>
        </section>
    );
}