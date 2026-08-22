export default function DemoBadge({ className = '' }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700 ${className}`}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Demo content
        </span>
    );
}
