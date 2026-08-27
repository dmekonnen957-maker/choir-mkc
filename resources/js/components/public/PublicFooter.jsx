import { Link } from 'react-router-dom';
import { Globe, Mail, Send } from 'lucide-react';
import Logo from '../../components/Logo';

const FOOTER_LINKS = [
    { label: 'Home', to: '/' },
    { label: 'Choirs', to: '/choirs' },
    { label: 'Songs', to: '/songs' },
    { label: 'Performances', to: '/performances' },
    { label: 'History', to: '/history' },
];

export default function PublicFooter() {
    const year = new Date().getFullYear();
    return (
        <footer className="bg-slate-950 text-slate-300">
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                <div className="grid gap-10 md:grid-cols-3">
                    <div>
                        <Link to="/" className="flex flex-col items-start gap-2.5">
                            <Logo size="sm" />
                            <span className="text-lg font-semibold text-white">CHOIR MKC</span>
                        </Link>
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
                            Connecting choirs, preserving music, and celebrating every voice in faithful
                            worship.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <a
                                href="#"
                                aria-label="Website"
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-200 transition-colors hover:bg-white/20"
                            >
                                <Globe size={18} />
                            </a>
                            <a
                                href="#"
                                aria-label="Email"
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-200 transition-colors hover:bg-white/20"
                            >
                                <Mail size={18} />
                            </a>
                            <a
                                href="#"
                                aria-label="Contact"
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-200 transition-colors hover:bg-white/20"
                            >
                                <Send size={18} />
                            </a>
                        </div>
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
                                        className="text-sm text-slate-400 transition-colors hover:text-white"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-400">
                            About CHOIR MKC
                        </h3>
                        <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
                            A warm community of church choirs dedicated to uplifting worship through song,
                            service, and shared faith.
                        </p>
                        <p className="mt-4 text-sm text-slate-400">
                            Contact us at{' '}
                            <a href="mailto:hello@choirmkc.com" className="text-blue-400 hover:text-blue-300">
                                hello@choirmkc.com
                            </a>
                        </p>
                    </div>
                </div>

                <div className="mt-12 border-t border-white/10 pt-6 text-sm text-slate-500 flex flex-col items-center md:items-start gap-2">
                    <span>© {year} CHOIR MKC. All rights reserved.</span>
                    <span className="text-blue-400">United in Voice. Connected in Faith.</span>
                </div>
            </div>
        </footer>
    );
}
