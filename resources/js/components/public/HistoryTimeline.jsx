import Reveal from '../ui/Reveal';
import CoverImage from './CoverImage';

export default function HistoryTimeline({ items = [] }) {
    if (items.length === 0) return null;
    return (
        <div className="relative mx-auto max-w-3xl pl-8">
            <div className="absolute bottom-2 left-[15px] top-2 w-px bg-gradient-to-b from-blue-300 via-blue-100 to-transparent" />
            <ul className="space-y-10">
                {items.map((item, i) => (
                    <Reveal key={`${item.year}-${i}`} as="li" className="relative">
                        <span className="absolute -left-8 top-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-blue-700 text-xs font-bold text-white shadow">
                            {String(item.year).slice(-2)}
                        </span>
                        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                            <span className="text-2xl font-bold tracking-tight text-blue-700">
                                {item.year}
                            </span>
                            <h3 className="mt-1 text-lg font-semibold text-slate-900">{item.title}</h3>
                            {item.image && (
                                <div className="mt-3 aspect-[16/9] w-full overflow-hidden rounded-2xl">
                                    <CoverImage src={item.image} label={item.title} className="h-full w-full" />
                                </div>
                            )}
                            {item.description && (
                                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                                    {item.description}
                                </p>
                            )}
                        </div>
                    </Reveal>
                ))}
            </ul>
        </div>
    );
}
