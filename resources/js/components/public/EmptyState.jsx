import { Music2 } from 'lucide-react';

export default function EmptyState({ icon: Icon = Music2, title, message, action = null }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                <Icon size={26} />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-slate-800">{title}</h3>
            {message && <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">{message}</p>}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}
