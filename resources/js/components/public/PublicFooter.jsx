import { Link } from 'react-router-dom';
import { Mail, Globe, Send, Music2 } from 'lucide-react';
import Logo from '../../components/Logo';

export default function PublicFooter() {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
                    {/* Brand & Description */}
                    <div className="md:col-span-5 space-y-4">
                        <div className="flex items-center gap-2.5">
                            <Logo size="md" className="shrink-0 brightness-110" />
                            <span className="text-lg font-black tracking-tight text-white">
                                <span>YEKA</span> <span className="text-blue-400">M.K.C</span> CHOIR
                            </span>
                        </div>
                        <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                            Discover Ethiopian choir songs, performances, melodies, and sacred worship music from Yeka Meserete Kristos Church worship ministries.
                        </p>
                    </div>

                    {/* Quick Navigation Links */}
                    <div className="md:col-span-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
                            Platform Navigation
                        </h4>
                        <ul className="space-y-2.5 text-sm">
                            <li>
                                <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link to="/songs" className="text-slate-400 hover:text-white transition-colors">
                                    Songs
                                </Link>
                            </li>
                            <li>
                                <Link to="/performances" className="text-slate-400 hover:text-white transition-colors">
                                    Performances
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-slate-400 hover:text-white transition-colors">
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" className="text-slate-400 hover:text-white transition-colors">
                                    Login / Sign In
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact & Community */}
                    <div className="md:col-span-3 space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                            Connect With Us
                        </h4>
                        <p className="text-xs text-slate-400">
                            Addis Ababa, Ethiopia · Yeka Meserete Kristos Church
                        </p>
                        <div className="flex items-center gap-2">
                            <a
                                href="mailto:contact@ykamkc.org"
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition-all hover:bg-blue-600 hover:text-white"
                                title="Email Us"
                                aria-label="Email Us"
                            >
                                <Mail size={15} />
                            </a>
                            <a
                                href="#"
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition-all hover:bg-blue-600 hover:text-white"
                                title="Website"
                                aria-label="Website"
                            >
                                <Globe size={15} />
                            </a>
                            <a
                                href="https://t.me"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition-all hover:bg-blue-600 hover:text-white"
                                title="Telegram Channel"
                                aria-label="Telegram"
                            >
                                <Send size={15} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Copyright */}
                <div className="mt-10 border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                    <p>© {year} Yeka M.K.C Choir Music Platform. All rights reserved.</p>
                    <p className="flex items-center gap-1.5">
                        <Music2 size={13} className="text-blue-500" /> Preserving and sharing Ethiopian choir worship music
                    </p>
                </div>
            </div>
        </footer>
    );
}

