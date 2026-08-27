import { useState, useEffect } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { Menu, X, LogIn, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../Logo';

const NAV_ITEMS = [
    { label: 'Home', to: '/' },
    { label: 'Choirs', to: '/choirs' },
    { label: 'Songs', to: '/songs' },
    { label: 'Performances', to: '/performances' },
    { label: 'History', to: '/history' },
];

function navClass({ isActive }) {
    return [
        'text-sm font-medium transition-colors',
        isActive
            ? 'text-blue-700 relative after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-blue-600'
            : 'text-ink-600 hover:text-blue-700',
    ].join(' ');
}

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const { isAuthenticated, role } = useAuth();
    const location = useLocation();

    const dashboardPath = role === 'admin'
        ? '/admin/dashboard'
        : role === 'team_leader'
            ? '/team-leader/dashboard'
            : '/member/dashboard';

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    return (
        <header
            className={`sticky top-0 z-50 transition-all duration-300 ${
                scrolled
                    ? 'border-b border-blue-100 bg-white/90 shadow-sm backdrop-blur'
                    : 'border-b border-transparent bg-white/0'
            }`}
        >
            <nav
                className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8"
                aria-label="Primary"
            >
                <Link
                    to="/"
                    className="flex items-center gap-2.5 rounded-lg focus-visible:outline-blue-600"
                >
                    <Logo size="md" className="shrink-0" />
                    <span className="text-lg font-semibold tracking-tight text-blue-900 hidden lg:block">
                        CHOIR MKC
                    </span>
                </Link>

                <div className="hidden items-center gap-8 lg:flex">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={navClass}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </div>

                <div className="hidden items-center gap-3 lg:flex">
                    {isAuthenticated ? (
                        <Link
                            to={dashboardPath}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-800"
                        >
                            <LayoutDashboard size={16} />
                            Dashboard
                        </Link>
                    ) : (
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-800 focus-visible:outline-blue-600"
                        >
                            <LogIn size={16} />
                            Sign In
                        </Link>
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
                <div className="border-t border-blue-100 bg-white lg:hidden">
                    <div className="space-y-1 px-4 py-4">
                        {NAV_ITEMS.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === '/'}
                                className={({ isActive }) =>
                                    [
                                        'block rounded-lg px-3 py-2.5 text-sm font-medium',
                                        isActive ? 'bg-blue-50 text-blue-700' : 'text-ink-700 hover:bg-blue-50',
                                    ].join(' ')
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                        <div className="mt-3 border-t border-blue-100 pt-4">
                            {isAuthenticated ? (
                                <Link
                                    to={dashboardPath}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white"
                                >
                                    <LayoutDashboard size={16} />
                                    Dashboard
                                </Link>
                            ) : (
                                <Link
                                    to="/login"
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white"
                                >
                                    <LogIn size={16} />
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
