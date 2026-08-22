import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import ChoirArtwork from './ChoirArtwork';

export default function ChoirCarousel({ slides }) {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const timer = useRef(null);
    const count = slides.length;

    const go = useCallback(
        (next) => {
            setIndex((prev) => (next + count) % count);
        },
        [count],
    );

    const next = useCallback(() => go(index + 1), [go, index]);
    const prev = useCallback(() => go(index - 1), [go, index]);

    useEffect(() => {
        if (paused) return undefined;
        timer.current = setInterval(() => {
            setIndex((prev) => (prev + 1) % count);
        }, 5000);
        return () => clearInterval(timer.current);
    }, [paused, count]);

    // Pause when tab hidden
    useEffect(() => {
        const onVis = () => setPaused(document.hidden);
        document.addEventListener('visibilitychange', onVis);
        return () => document.removeEventListener('visibilitychange', onVis);
    }, []);

    return (
        <div
            className="relative h-full w-full overflow-hidden rounded-3xl shadow-2xl ring-1 ring-blue-100"
            role="region"
            aria-roledescription="carousel"
            aria-label="Choir photography"
        >
            {slides.map((slide, i) => (
                <div
                    key={slide.id}
                    className="absolute inset-0"
                    aria-hidden={i !== index}
                    style={{
                        opacity: i === index ? 1 : 0,
                        transition: 'opacity 1.2s ease-in-out',
                        zIndex: i === index ? 2 : 1,
                    }}
                >
                    <div
                        className="h-full w-full"
                        style={{
                            transform: i === index ? 'scale(1.03)' : 'scale(1.0)',
                            transition: 'transform 6s ease-out',
                        }}
                    >
                        <ChoirArtwork
                            variant={slide.art.variant}
                            seed={slide.art.seed}
                            className="h-full w-full"
                        />
                    </div>
                </div>
            ))}

            {/* gradient for legibility */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-950/40 via-transparent to-transparent" />

            {/* live caption */}
            <div className="pointer-events-none absolute left-5 top-5 hidden">
                <span aria-live="polite">{slides[index]?.caption}</span>
            </div>

            {/* Controls */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4 sm:p-5">
                <div className="flex items-center gap-2" role="tablist" aria-label="Choose slide">
                    {slides.map((s, i) => (
                        <button
                            key={s.id}
                            type="button"
                            role="tab"
                            aria-selected={i === index}
                            aria-label={`Go to slide ${i + 1}: ${s.caption}`}
                            onClick={() => {
                                setPaused(true);
                                setIndex(i);
                            }}
                            className={`h-2.5 rounded-full transition-all duration-300 ${
                                i === index
                                    ? 'w-7 bg-white'
                                    : 'w-2.5 bg-white/50 hover:bg-white/80'
                            }`}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setPaused(true);
                            prev();
                        }}
                        aria-label="Previous slide"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/30"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setPaused((p) => !p)}
                        aria-label={paused ? 'Resume automatic slideshow' : 'Pause slideshow'}
                        aria-pressed={paused}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/30"
                    >
                        {paused ? <Play size={16} /> : <Pause size={16} />}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setPaused(true);
                            next();
                        }}
                        aria-label="Next slide"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/30"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
