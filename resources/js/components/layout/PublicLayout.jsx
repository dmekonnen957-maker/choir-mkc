import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from '../navigation/Navbar';
import { Music, Globe, Mail, Send } from 'lucide-react';

const FOOTER_LINKS = [
    { label: 'Home', to: '/' },
    { label: 'Choirs', to: '/choirs' },
    { label: 'Songs', to: '/songs' },
    { label: 'Performances', to: '/performances' },
    { label: 'History', to: '/history' },
];

export default function PublicLayout() {
    const location = useLocation();
    const year = new Date().getFullYear();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
    }, [location.pathname]);

    return (
        <div className="flex min-h-screen flex-col bg-surface">
            <Navbar />
            <main key={location.pathname} className="flex-1 animate-fade-in">
                <Outlet />
            </main>

            <footer id="contact" className="bg-blue-950 text-blue-100">
                <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                    <div className="grid gap-10 md:grid-cols-3">
                        <div>
                            <Link to="/" className="flex items-center gap-2.5">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-blue-300">
                                    <Music size={20} />
                                </span>
                                <span className="text-lg font-semibold text-white">
                                    CHOIR <span className="text-blue-400">MKC</span>
                                </span>
                            </Link>
                            <p className="mt-4 max-w-sm text-sm leading-relaxed text-blue-200">
                                Connecting choirs, preserving music, and celebrating every voice.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-400">
                                Explore
                            </h3>
                            <ul className="mt-4 space-y-2.5">
                                {FOOTER_LINKS.map((link) => (
                                    <li key={link.to}>
                                        <Link
                                            to={link.to}
                                            className="text-sm text-blue-200 transition-colors hover:text-white"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-400">
                                Account
                            </h3>
                            <ul className="mt-4 space-y-2.5 text-sm text-blue-200">
                                <li>
                                    <Link to="/login" className="transition-colors hover:text-white">
                                        Sign In
                                    </Link>
                                </li>
                            </ul>
                            <div className="mt-6 flex gap-3">
                                <a href="#" aria-label="Website" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-blue-100 transition-colors hover:bg-white/20">
                                    <Globe size={18} />
                                </a>
                                <a href="#" aria-label="Email" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-blue-100 transition-colors hover:bg-white/20">
                                    <Mail size={18} />
                                </a>
                                <a href="#" aria-label="Contact" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-blue-100 transition-colors hover:bg-white/20">
                                    <Send size={18} />
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 border-t border-white/10 pt-6 text-sm text-blue-300">
                        © {year} CHOIR MKC. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
