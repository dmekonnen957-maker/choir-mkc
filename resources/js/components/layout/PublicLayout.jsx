import { Outlet } from 'react-router-dom';
import Navbar from '../navigation/Navbar';
import { Music, Globe, Mail, Send } from 'lucide-react';

const FOOTER_LINKS = [
    { label: 'Home', target: 'home' },
    { label: 'About', target: 'about' },
    { label: 'Choirs', target: 'choirs' },
    { label: 'Songs', target: 'songs' },
    { label: 'Performances', target: 'performances' },
    { label: 'Contact', target: 'contact' },
];

function scrollToSection(target) {
    const el = document.getElementById(target);
    if (el) {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
}

export default function PublicLayout() {
    const year = new Date().getFullYear();

    return (
        <div className="flex min-h-screen flex-col bg-surface">
            <Navbar />
            <main className="flex-1">
                <Outlet />
            </main>

            <footer id="contact" className="scroll-mt-24 border-t border-ink-100 bg-navy-900 text-navy-100">
                <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                    <div className="grid gap-10 md:grid-cols-3">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-gold-400">
                                    <Music size={20} />
                                </span>
                                <span className="text-lg font-semibold text-white">
                                    CHOIR <span className="text-gold-400">MKC</span>
                                </span>
                            </div>
                            <p className="mt-4 max-w-sm text-sm leading-relaxed text-navy-200">
                                A multi-choir management and digital archive platform — bringing
                                multiple choirs together to organize members, songs, rehearsals,
                                performances and musical history.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-gold-400">
                                Explore
                            </h3>
                            <ul className="mt-4 space-y-2.5">
                                {FOOTER_LINKS.map((link) => (
                                    <li key={link.target}>
                                        <button
                                            type="button"
                                            onClick={() => scrollToSection(link.target)}
                                            className="text-sm text-navy-200 transition-colors hover:text-white"
                                        >
                                            {link.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-gold-400">
                                Get Started
                            </h3>
                            <ul className="mt-4 space-y-2.5 text-sm text-navy-200">
                                <li>
                                    <a href="/login" className="transition-colors hover:text-white">
                                        Login
                                    </a>
                                </li>
                                <li>
                                    <a href="/register" className="transition-colors hover:text-white">
                                        Register
                                    </a>
                                </li>
                            </ul>
                            <div className="mt-6 flex gap-3">
                                <a
                                    href="#"
                                    aria-label="Website"
                                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-navy-100 transition-colors hover:bg-white/20"
                                >
                                    <Globe size={18} />
                                </a>
                                <a
                                    href="#"
                                    aria-label="Email"
                                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-navy-100 transition-colors hover:bg-white/20"
                                >
                                    <Mail size={18} />
                                </a>
                                <a
                                    href="#"
                                    aria-label="Contact"
                                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-navy-100 transition-colors hover:bg-white/20"
                                >
                                    <Send size={18} />
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 border-t border-white/10 pt-6 text-sm text-navy-300">
                        © {year} CHOIR MKC. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
