import { Link } from 'react-router-dom';
import { Music } from 'lucide-react';

export default function AuthLayout({ children, title, subtitle }) {
    return (
        <div className="flex min-h-screen flex-col bg-surface">
            <div className="flex items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
                <Link to="/" className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-gold-400">
                        <Music size={20} />
                    </span>
                    <span className="text-lg font-semibold tracking-tight text-navy-900">
                        CHOIR <span className="text-gold-600">MKC</span>
                    </span>
                </Link>
                <Link
                    to="/"
                    className="text-sm font-medium text-ink-500 transition-colors hover:text-navy-900"
                >
                    Back to home
                </Link>
            </div>

            <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center">
                        {title && (
                            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
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
