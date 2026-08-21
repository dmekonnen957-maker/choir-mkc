import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Music, Menu, X, LogIn, UserPlus, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
    { label: 'Home', target: 'home' },
    { label: 'About', target: 'about' },
    { label: 'Choirs', target: 'choirs' },
    { label: 'Songs', target: 'songs' },
    { label: 'Performances', target: 'performances' },
    { label: 'Contact', target: 'contact' },
];

function scrollToSection(target) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = document.getElementById(target);
    if (el) {
        el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
}

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    const handleNav = useCallback(
        (target) => {
            setOpen(false);
            if (location.pathname !== '/') {
                navigate('/');
                setTimeout(() => scrollToSection(target), 80);
            } else {
                scrollToSection(target);
            }
        },
        [location.pathname, navigate],
    );

    return (
        <header
            className={`sticky top-0 z-50 transition-colors duration-300 ${
                scrolled
                    ? 'border-b border-ink-100 bg-canvas/90 backdrop-blur'
                    : 'bg-transparent'
            }`}
        >
            <nav
                className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8"
                aria-label="Primary"
            >
                <button
                    type="button"
                    onClick={() => handleNav('home')}
                    className="flex items-center gap-2.5 focus-visible:outline-gold-500"
                >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-gold-400">
                        <Music size={20} />
                    </span>
                    <span className="text-lg font-semibold tracking-tight text-navy-900">
                        CHOIR <span className="text-gold-600">MKC</span>
                    </span>
                </button>

                <div className="hidden items-center gap-8 lg:flex">
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.target}
                            type="button"
                            onClick={() => handleNav(item.target)}
                            className="text-sm font-medium text-ink-600 transition-colors hover:text-navy-900"
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="hidden items-center gap-3 lg:flex">
                    {isAuthenticated ? (
                        <Link
                            to="/app"
                            className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800"
                        >
                            <LayoutDashboard size={16} />
                            Workspace
                        </Link>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-navy-800 transition-colors hover:bg-navy-50"
                            >
                                <LogIn size={16} />
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-gold-400"
                            >
                                <UserPlus size={16} />
                                Register
                            </Link>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-lg p-2 text-ink-700 lg:hidden"
                    aria-label={open ? 'Close menu' : 'Open menu'}
                    aria-expanded={open}
                    onClick={() => setOpen((o) => !o)}
                >
                    {open ? <X size={24} /> : <Menu size={24} />}
                </button>
            </nav>

            {open && (
                <div className="border-t border-ink-100 bg-canvas lg:hidden">
                    <div className="space-y-1 px-4 py-4">
                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.target}
                                type="button"
                                onClick={() => handleNav(item.target)}
                                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink-700 hover:bg-navy-50"
                            >
                                {item.label}
                            </button>
                        ))}
                        <div className="mt-3 flex flex-col gap-2 border-t border-ink-100 pt-4">
                            {isAuthenticated ? (
                                <Link
                                    to="/app"
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white"
                                >
                                    <LayoutDashboard size={16} />
                                    Workspace
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-navy-200 px-4 py-2.5 text-sm font-medium text-navy-800 hover:bg-navy-50"
                                    >
                                        <LogIn size={16} />
                                        Login
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-medium text-navy-950 hover:bg-gold-400"
                                    >
                                        <UserPlus size={16} />
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
