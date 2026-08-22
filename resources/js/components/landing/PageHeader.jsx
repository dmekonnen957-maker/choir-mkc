import Reveal from '../ui/Reveal';

export default function PageHeader({ eyebrow, title, subtitle, children }) {
    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 pb-12 pt-14 sm:pb-16 sm:pt-20">
            <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <Reveal>
                    {eyebrow && (
                        <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-300">
                            <span className="h-px w-6 bg-blue-400" />
                            {eyebrow}
                        </span>
                    )}
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-blue-100">
                            {subtitle}
                        </p>
                    )}
                    {children}
                </Reveal>
            </div>
        </section>
    );
}
