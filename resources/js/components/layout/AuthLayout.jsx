import { Link } from 'react-router-dom';
import Logo from '../Logo';

export default function AuthLayout({ children, title, subtitle }) {
    return (
        <div className="flex min-h-screen flex-col overflow-x-hidden bg-surface">
            <div className="flex items-center justify-between gap-2 px-4 py-4 sm:px-6 lg:px-8">
                <Link to="/" className="flex min-w-0 items-center gap-2.5">
                    <Logo size="md" className="shrink-0" />
                    <span className="truncate text-base font-bold tracking-wide text-ink-900 sm:text-lg hidden lg:block">
                        CHOIR MKC
                    </span>
                </Link>
                <Link
                    to="/"
                    className="shrink-0 text-sm font-medium text-ink-500 transition-colors hover:text-blue-700"
                >
                    Back to home
                </Link>
            </div>

            <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center">
                        {title && (
                            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
                                {title}
                            </h1>
                        )}
                        {subtitle && <p className="mt-2 text-sm text-ink-500">{subtitle}</p>}
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
