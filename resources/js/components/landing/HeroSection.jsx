import { Link } from 'react-router-dom';
import { Music, ArrowRight, Mic2 } from 'lucide-react';
import ChoirCarousel from './ChoirCarousel';
import { heroSlides } from '../../data/landingData';

export default function HeroSection() {
    return (
        <section
            id="home"
            className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white"
        >
            <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8 lg:pb-28 lg:pt-16">
                {/* LEFT — text */}
                <div className="animate-fade-up">
                    <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3.5 py-1.5 text-sm font-medium text-blue-700 shadow-sm">
                        <Music size={16} className="text-blue-500" />
                        A digital home for choirs
                    </span>

                    <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-blue-900 sm:text-5xl lg:text-[3.4rem]">
                        Where Every Voice
                        <br />
                        <span className="text-gradient-blue">Tells a Story</span>
                    </h1>

                    <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-600">
                        Discover the choirs, songs, performances, and history that bring our
                        voices together.
                    </p>

                    <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                        <Link
                            to="/choirs"
                            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-700/30 focus-visible:outline-blue-600"
                        >
                            Explore Choirs
                            <ArrowRight
                                size={18}
                                className="transition-transform group-hover:translate-x-1"
                            />
                        </Link>
                        <Link
                            to="/performances"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-6 py-3.5 text-base font-semibold text-blue-800 transition-colors hover:bg-blue-50 focus-visible:outline-blue-600"
                        >
                            <Mic2 size={18} className="text-blue-500" />
                            View Performances
                        </Link>
                    </div>

                    <dl className="mt-12 grid max-w-md grid-cols-3 gap-6">
                        {[
                            ['12+', 'Years of song'],
                            ['3', 'Choirs united'],
                            ['100s', 'Songs preserved'],
                        ].map(([stat, label]) => (
                            <div key={label}>
                                <dt className="text-2xl font-semibold text-blue-900">{stat}</dt>
                                <dd className="mt-1 text-sm text-ink-500">{label}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                {/* RIGHT — carousel + floating card */}
                <div className="relative h-[420px] w-full sm:h-[480px] lg:h-[560px]">
                    <ChoirCarousel slides={heroSlides} />

                    <div className="animate-float-soft absolute -bottom-6 left-4 right-4 z-10 sm:left-6 sm:right-auto sm:max-w-xs">
                        <div className="rounded-2xl border border-blue-100 bg-white/95 p-5 shadow-xl backdrop-blur">
                            <div className="flex items-center gap-2 text-blue-700">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                                    <Mic2 size={16} />
                                </span>
                                <span className="text-sm font-semibold">United in Song</span>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-ink-600">
                                Every voice becomes part of something greater.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
