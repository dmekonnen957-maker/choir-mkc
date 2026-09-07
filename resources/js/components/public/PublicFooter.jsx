import { Globe, Mail, Send } from 'lucide-react';

export default function PublicFooter() {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    {/* Contact Info */}
                    <div className="flex items-center gap-2">
                        <a
                            href="mailto:contact@ykamkc.org"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 transition-colors hover:text-blue-400"
                        >
                            <Mail size={15} />
                            contact@ykamkc.org
                        </a>
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center gap-2">
                        <a
                            href="#"
                            aria-label="Website"
                            title="Website"
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition-all hover:bg-blue-600 hover:text-white"
                        >
                            <Globe size={15} />
                        </a>
                        <a
                            href="mailto:contact@ykamkc.org"
                            aria-label="Email"
                            title="Email Us"
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition-all hover:bg-blue-600 hover:text-white"
                        >
                            <Mail size={15} />
                        </a>
                        <a
                            href="https://t.me"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Telegram"
                            title="Telegram Channel"
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition-all hover:bg-blue-600 hover:text-white"
                        >
                            <Send size={15} />
                        </a>
                    </div>

                    {/* Copyright Line */}
                    <div className="text-xs text-slate-500">
                        © {year} YKA M.K.C CHOIR. All rights reserved.
                    </div>
                </div>
            </div>
        </footer>
    );
}
