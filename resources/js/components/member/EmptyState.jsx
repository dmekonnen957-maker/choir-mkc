import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, message, className = '' }) {
    return (
        <div
            className={`flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-canvas px-6 py-10 text-center ${className}`}
        >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                <Icon size={22} />
            </div>
            <p className="text-sm font-semibold text-ink-800">{title}</p>
            {message && <p className="mt-1 max-w-sm text-sm text-ink-500">{message}</p>}
        </div>
    );
}
