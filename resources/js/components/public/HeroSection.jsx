import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Music2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const HERO_IMAGES = [
    { src: '/images/p1.jpg', alt: 'Yeka M.K.C choir performing indoors' },
    { src: '/images/p2.jpg', alt: 'Yeka M.K.C choir rehearsing outdoors' },
    { src: '/images/p3.jpg', alt: 'Yeka M.K.C choir community gathering' },
];

const DISPLAY_TIME = 3000;
const FADE_TIME = 1000;
const HERO_VERSE = 'LET EVERYTHING THAT HAS BREATH PRAISE THE LORD. PRAISE THE LORD! - PSALM 150:6';

export default function HeroSection() {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = useCallback(() => {
        setCurrentIndex((index) => (index + 1) % HERO_IMAGES.length);
    }, []);

    const previousSlide = useCallback(() => {
        setCurrentIndex((index) => (index - 1 + HERO_IMAGES.length) % HERO_IMAGES.length);
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(nextSlide, DISPLAY_TIME + FADE_TIME);
        return () => window.clearTimeout(timer);
    }, [currentIndex, nextSlide]);

    useEffect(() => {
        HERO_IMAGES.forEach(({ src }) => {
            const image = new Image();
            image.src = src;
        });
    }, []);

    return (
        <section className="relative min-h-[100svh] overflow-hidden bg-slate-950 text-white" aria-label="Yeka M.K.C choir hero">
            <div className="absolute inset-0 bg-black/50">
                {HERO_IMAGES.map((image, index) => (
                    <img
                        key={image.src}
                        src={image.src}
                        alt={image.alt}
                        aria-hidden={index !== currentIndex}
                        className={`absolute inset-0 h-full w-full object-cover transition-opacity ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
                        style={{ transitionDuration: `${FADE_TIME}ms` }}
                    />
                ))}
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-black/70" />
            </div>

            <div className="relative z-10 flex min-h-[100svh] items-center justify-center px-6 py-24 text-center sm:px-10">
                <div className="max-w-4xl">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-white sm:text-sm">Yeka M.K.C Ministry</p>
                    <h1 className="mt-5 text-4xl font-black uppercase tracking-[0.02em] text-white sm:text-6xl lg:text-7xl">
                        Yeka Meserete Kristos
                    </h1>
                    <p className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-7 tracking-[0.03em] text-white sm:text-lg">
                        Discover Ethiopian choir songs, worship music, and performances united by faith and community.
                    </p>
                    <p className="mx-auto mt-4 max-w-2xl text-[11px] font-semibold uppercase leading-6 tracking-[0.16em] text-white/90 sm:text-xs">
                        {HERO_VERSE}
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <Link to="/songs" className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-600">
                            <Music2 size={17} /> DISCOVER SONGS <ArrowRight size={16} />
                        </Link>
                        <Link to="/performances" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20">
                            View Performances <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>

            <button type="button" onClick={previousSlide} aria-label="Previous hero image" className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white backdrop-blur-md transition hover:bg-black/45 sm:left-8">
                <ChevronLeft size={21} />
            </button>
            <button type="button" onClick={nextSlide} aria-label="Next hero image" className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white backdrop-blur-md transition hover:bg-black/45 sm:right-8">
                <ChevronRight size={21} />
            </button>

            <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2" aria-label="Hero image selection">
                {HERO_IMAGES.map((image, index) => (
                    <button
                        key={image.src}
                        type="button"
                        onClick={() => setCurrentIndex(index)}
                        aria-label={`Show hero image ${index + 1}`}
                        className={`h-2 rounded-full transition-all duration-300 ${currentIndex === index ? 'w-8 bg-cyan-300' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                    />
                ))}
            </div>
        </section>
    );
}
