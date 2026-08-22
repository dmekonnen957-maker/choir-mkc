export default function StatCard({ icon: Icon, label, value, hint, accent = 'blue' }) {
    const accents = {
        blue: 'bg-blue-50 text-blue-600',
        sky: 'bg-blue-100 text-blue-700',
        indigo: 'bg-blue-100 text-blue-800',
    };

    return (
        <div className="rounded-2xl border border-blue-100 bg-canvas p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink-500">{label}</p>
                {Icon && (
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accents[accent]}`}>
                        <Icon size={18} />
                    </span>
                )}
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-ink-900">{value}</p>
            {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
        </div>
    );
}
