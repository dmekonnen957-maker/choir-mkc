import { Mic2, CalendarDays } from 'lucide-react';
import Reveal from '../ui/Reveal';

function scrollToId(id) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

export default function FinalCTA() {
    return (
        <section className="bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 py-20 sm:py-28">
            <div className="pointer-events-none absolute" aria-hidden />
            <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                <Reveal>
                    <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                        Discover the Voices Behind the Music
                    </h2>
                    <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-blue-100">
                        Explore our choirs, follow upcoming performances, and read the songs that
                        have shaped our story.
                    </p>
                    <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => scrollToId('choirs')}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-blue-900 shadow-lg transition-transform hover:-translate-y-0.5"
                        >
                            <Mic2 size={18} className="text-blue-600" />
                            Explore Choirs
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToId('performances')}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
                        >
                            <CalendarDays size={18} />
                            View Performances
                        </button>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
