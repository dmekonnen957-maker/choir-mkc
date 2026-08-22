import Reveal from '../ui/Reveal';

export default function SectionHeading({
    eyebrow,
    title,
    subtitle,
    align = 'center',
    className = '',
}) {
    const alignment =
        align === 'left' ? 'items-start text-left' : 'items-center text-center';
    return (
        <Reveal className={`flex flex-col ${alignment} ${className}`}>
            {eyebrow && (
                <span className="mb-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                    <span className="h-px w-6 bg-blue-300" />
                    {eyebrow}
                </span>
            )}
            <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-blue-900 sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
                {title}
            </h2>
            {subtitle && (
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-600 sm:text-lg">
                    {subtitle}
                </p>
            )}
        </Reveal>
    );
}
