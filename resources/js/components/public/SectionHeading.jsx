export default function SectionHeading({ eyebrow, title, subtitle, align = 'center', className = '' }) {
    const alignment = align === 'center' ? 'items-center text-center' : 'items-start text-left';
    return (
        <div className={`flex flex-col ${alignment} ${className}`}>
            {eyebrow && (
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                    {eyebrow}
                </span>
            )}
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
            {subtitle && (
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-500">{subtitle}</p>
            )}
        </div>
    );
}
