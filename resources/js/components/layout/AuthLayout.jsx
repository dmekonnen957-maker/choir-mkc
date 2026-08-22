import { Link } from 'react-router-dom';
import { Music } from 'lucide-react';

export default function AuthLayout({ children, title, subtitle }) {
    return (
        <div className="flex min-h-screen flex-col overflow-x-hidden bg-surface">
            <div className="flex items-center justify-between gap-2 px-4 py-4 sm:px-6 lg:px-8">
                <Link to="/" className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                        <Music size={20} />
                    </span>
                    <span className="truncate text-base font-bold tracking-wide text-ink-900 sm:text-lg">
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
