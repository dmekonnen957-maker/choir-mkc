import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Reveal from '../ui/Reveal';
import ChoirArtwork from './ChoirArtwork';

export default function Timeline({ milestones = [], title }) {
    const [openId, setOpenId] = useState(milestones[0]?.id ?? null);

    return (
        <div className="relative">
            <div
                className="absolute bottom-2 left-[19px] top-2 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-100 sm:left-1/2 sm:-translate-x-1/2"
                aria-hidden
            />
            <div className="space-y-6">
                {milestones.map((m, i) => {
                    const isOpen = openId === m.id;
                    return (
                        <Reveal
                            key={m.id}
                            direction={i % 2 === 0 ? 'left' : 'right'}
                            className="relative"
                        >
                            <div className="flex items-start gap-5 sm:justify-center">
                                <span className="z-10 mt-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-md ring-4 ring-white">
                                    {String(m.year).slice(-2)}
                                </span>
                                <div
                                    className={`w-full rounded-2xl border bg-white p-5 shadow-sm transition-all sm:w-[calc(50%-2.5rem)] ${
                                        isOpen ? 'border-blue-200 shadow-lg' : 'border-blue-100 hover:border-blue-200'
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setOpenId(isOpen ? null : m.id)}
                                        aria-expanded={isOpen}
                                        className="flex w-full items-center justify-between gap-3 text-left"
                                    >
                                        <span>
                                            <span className="block text-xs font-semibold uppercase tracking-wide text-blue-500">
                                                {m.year}
                                            </span>
                                            <span className="mt-0.5 block text-lg font-semibold text-blue-900">
                                                {m.title}
                                            </span>
                                        </span>
                                        <ChevronDown
                                            size={20}
                                            className={`shrink-0 text-blue-400 transition-transform duration-300 ${
                                                isOpen ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </button>
                                    {isOpen && (
                                        <div className="mt-4 animate-fade-in">
                                            <p className="text-sm leading-relaxed text-ink-600">
                                                {m.description}
                                            </p>
                                            <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-blue-100">
                                                <ChoirArtwork
                                                    variant={i % 2 === 0 ? 'stage' : 'rows'}
                                                    seed={(m.id ?? i) * 7 + 3}
                                                    className="aspect-[16/7] w-full"
                                                    label={`${m.year} — ${m.title}`}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Reveal>
                    );
                })}
            </div>
        </div>
    );
}
