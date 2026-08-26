import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import CoverImage from './CoverImage';

export default function HeroSection({ featuredChoir = null }) {
    return (
        <section className="relative overflow-hidden bg-white">
            <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />

            <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-28 lg:px-8">
                <div className="animate-fade-in">
                    <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 ring-1 ring-inset ring-blue-100">
                        Choir MKC
                    </span>
                    <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl lg:leading-tight">
                        United in Voice.
                        <br />
                        <span className="bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                            Connected in Faith.
                        </span>
                    </h1>
                    <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
                        Discover the choirs, songs, and performances that bring our community together in
                        worship. Listen to our music, follow our journey, and join us in song.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-4">
                        <Link
                            to="/choirs"
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-800 hover:shadow-md focus-visible:outline-blue-600"
                        >
                            <Play size={18} />
                            Explore Our Choirs
                        </Link>
                        <Link
                            to="/songs"
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition-all hover:border-blue-300 hover:text-blue-700"
                        >
                            Discover Songs
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>

                <div className="animate-fade-in">
                    <div className="relative">
                        <div className="aspect-[4/3] w-full overflow-hidden rounded-[2.5rem] border border-slate-100 bg-slate-50 shadow-xl">
                            <CoverImage
                                src={featuredChoir?.logo_path}
                                label={featuredChoir?.name || 'Choir MKC'}
                                className="h-full w-full"
                            />
                        </div>
                        <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-lg sm:block">
                            <p className="text-2xl font-bold text-blue-700">{featuredChoir ? '♪' : '♪'}</p>
                            <p className="text-xs font-medium text-slate-500">Voices in harmony</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
