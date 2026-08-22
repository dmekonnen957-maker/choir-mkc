import PageHeader from '../components/landing/PageHeader';
import Timeline from '../components/landing/Timeline';
import ChoirArtwork from '../components/landing/ChoirArtwork';
import Reveal from '../components/ui/Reveal';
import DemoBadge from '../components/ui/DemoBadge';
import { historyMilestones } from '../data/landingData';

export default function HistoryPage() {
    return (
        <>
            <PageHeader
                eyebrow="Heritage"
                title="Our History"
                subtitle="The story of CHOIR MKC — from a small gathering of singers to a united digital archive."
            />
            <section className="bg-surface py-12 sm:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                        <p className="max-w-2xl text-lg leading-relaxed text-ink-600">
                            CHOIR MKC began with a simple dream: to lift every voice together in
                            worship. Over the decades, that dream grew into multiple choirs, a
                            living archive of songs, and a platform that preserves each choir’s
                            journey for the generations that follow.
                        </p>
                        <DemoBadge />
                    </div>

                    <div className="mt-12 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
                        <Timeline milestones={historyMilestones} />

                        <div className="space-y-4">
                            <Reveal direction="right" className="overflow-hidden rounded-3xl shadow-md ring-1 ring-blue-100">
                                <ChoirArtwork variant="stage" seed={7} className="aspect-[4/3] w-full" label="Choir history" />
                            </Reveal>
                            <Reveal direction="right" delay={120} className="overflow-hidden rounded-3xl shadow-md ring-1 ring-blue-100">
                                <ChoirArtwork variant="rows" seed={19} className="aspect-[4/3] w-full" label="Choir history" />
                            </Reveal>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
