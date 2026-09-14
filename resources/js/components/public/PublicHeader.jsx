import { useState, useEffect } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { Menu, X, LogIn, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSelector from '../ui/LanguageSelector';
import Logo from '../../components/Logo';

const NAV_ITEMS = [
    { labelKey: 'nav.home', to: '/' },
    { labelKey: 'nav.songs', to: '/songs' },
    { labelKey: 'nav.performances', to: '/performances' },
    { labelKey: 'nav.about', to: '/about' },
];

function navClass({ isActive }) {
    return [
        'text-sm font-medium transition-colors',
        isActive
            ? 'text-blue-700'
            : 'text-slate-600 hover:text-blue-700',
    ].join(' ');
}

export default function PublicHeader() {
    const [open, setOpen] = useState(false);
    const { isAuthenticated, role } = useAuth();
    const { t, isAmharic } = useLanguage();
    const location = useLocation();

    const dashboardPath =
        role === 'admin'
            ? '/admin/dashboard'
            : role === 'team_leader'
                ? '/team-leader/dashboard'
                : '/member/dashboard';

    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    return (
        <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 shadow-sm backdrop-blur-md">
            <nav
                className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"
                aria-label="Primary"
            >
                <Link to="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-blue-600">
                    <Logo size="md" className="shrink-0" />
                    <span className="text-lg font-black tracking-tight text-slate-900 hidden sm:block">
                        {isAmharic ? (
                            t('brand.choirName')
                        ) : (
                            <>
                                {t('brand.choirPrimary')} <span className="text-blue-600">M.K.C</span>{' '}
                                {t('brand.choirSuffix')}
                            </>
                        )}
                    </span>
                </Link>

                <div className="hidden items-center gap-9 lg:flex">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={navClass}
                        >
                            {t(item.labelKey)}
                        </NavLink>
                    ))}
                </div>

                <div className="hidden items-center gap-3 lg:flex">
                    <LanguageSelector />
                    {isAuthenticated ? (
                        <Link
                            to={dashboardPath}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 focus-visible:outline-blue-600"
                        >
                            <LayoutDashboard size={16} />
                            {t('nav.dashboard')}
                        </Link>
                    ) : (
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 focus-visible:outline-blue-600"
                        >
                            <LogIn size={16} />
                            {t('nav.login')}
                        </Link>
                    )}
                </div>

                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-lg p-2 text-slate-700 lg:hidden"
                    aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
                    aria-expanded={open}
                    onClick={() => setOpen((o) => !o)}
                >
                    {open ? <X size={24} /> : <Menu size={24} />}
                </button>
            </nav>

            {open && (
                <div className="border-t border-slate-200/70 bg-white lg:hidden">
                    <div className="space-y-1 px-4 py-4">
                        {NAV_ITEMS.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === '/'}
                                className={({ isActive }) =>
                                    [
                                        'block rounded-xl px-3 py-2.5 text-sm font-medium',
                                        isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-blue-50',
                                    ].join(' ')
                                }
                            >
                                {t(item.labelKey)}
                            </NavLink>
                        ))}
                        <div className="mt-3 border-t border-slate-100 pt-4">
                            <div className="mb-3">
                                <LanguageSelector />
                            </div>
                            {isAuthenticated ? (
                                <Link
                                    to={dashboardPath}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white"
                                >
                                    <LayoutDashboard size={16} />
                                    {t('nav.dashboard')}
                                </Link>
                            ) : (
                                <Link
                                    to="/login"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white"
                                >
                                    <LogIn size={16} />
                                    {t('nav.login')}
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}