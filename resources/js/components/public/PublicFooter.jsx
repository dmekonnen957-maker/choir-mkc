import { Link } from 'react-router-dom';
import { Mail, Globe, Send, Music2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Logo from '../../components/Logo';

export default function PublicFooter() {
    const year = new Date().getFullYear();
    const { t, isAmharic } = useLanguage();

    return (
        <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
                    {/* Brand & Description */}
                    <div className="md:col-span-5 space-y-4">
                        <div className="flex items-center gap-2.5">
                            <Logo size="md" className="shrink-0 brightness-110" />
                            <span className="text-lg font-black tracking-tight text-white">
                                {isAmharic ? (
                                    t('brand.choirName')
                                ) : (
                                    <>
                                        {t('brand.choirPrimary')} <span className="text-blue-400">M.K.C</span>{' '}
                                        {t('brand.choirSuffix')}
                                    </>
                                )}
                            </span>
                        </div>
                        <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                            {t('footer.tagline')}
                        </p>
                    </div>

                    {/* Quick Navigation Links */}
                    <div className="md:col-span-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
                            {t('footer.quickLinks')}
                        </h4>
                        <ul className="space-y-2.5 text-sm">
                            <li>
                                <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                                    {t('nav.home')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/songs" className="text-slate-400 hover:text-white transition-colors">
                                    {t('nav.songs')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/performances" className="text-slate-400 hover:text-white transition-colors">
                                    {t('nav.performances')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-slate-400 hover:text-white transition-colors">
                                    {t('nav.about')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" className="text-slate-400 hover:text-white transition-colors">
                                    {t('nav.login')} / {t('nav.register')}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact & Community */}
                    <div className="md:col-span-3 space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                            {t('footer.contact')}
                        </h4>
                        <p className="text-xs text-slate-400">
                            Addis Ababa, ኢትዮጵያ · የካ መሰረተ ክርስቶስ ቤተክርስትያት
                        </p>
                        <div className="flex items-center gap-2">
                            <a
                                href="mailto:contact@ykamkc.org"
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition-all hover:bg-blue-600 hover:text-white"
                                title={t('footer.emailUs')}
                                aria-label={t('footer.emailUs')}
                            >
                                <Mail size={15} />
                            </a>
                            <a
                                href="#"
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition-all hover:bg-blue-600 hover:text-white"
                                title={t('footer.website')}
                                aria-label={t('footer.website')}
                            >
                                <Globe size={15} />
                            </a>
                            <a
                                href="https://t.me"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition-all hover:bg-blue-600 hover:text-white"
                                title={t('footer.telegramChannel')}
                                aria-label={t('footer.telegram')}
                            >
                                <Send size={15} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Copyright */}
                <div className="mt-10 border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                    <p>© {year} {t('brand.choirName')} Music Platform. {t('footer.rights')}</p>
                    <p className="flex items-center gap-1.5">
                        <Music2 size={13} className="text-blue-500" /> {t('hero.subtitle')}
                    </p>
                </div>
            </div>
        </footer>
    );
}

