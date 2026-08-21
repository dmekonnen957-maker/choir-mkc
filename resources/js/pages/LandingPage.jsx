import { Link } from 'react-router-dom';
import {
    Music,
    Users,
    Library,
    CalendarClock,
    ClipboardCheck,
    Mic,
    BellRing,
    Globe,
    Building2,
    ArrowRight,
    Check,
    Sparkles,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

function HeroVisual() {
    return (
        <div className="relative overflow-hidden rounded-3xl border border-navy-800 bg-navy-900 p-8 shadow-xl">
            <div
                className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold-500/20 blur-3xl"
                aria-hidden="true"
            />
            <svg className="absolute inset-0 h-full w-full opacity-10" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((i) => (
                    <line
                        key={i}
                        x1="0"
                        y1={i * 36}
                        x2="100%"
                        y2={i * 36}
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-gold-200"
                    />
                ))}
            </svg>

            <div className="relative flex items-center justify-center py-6">
                <span className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/5 text-gold-300 animate-fade-in">
                    <Music size={56} />
                </span>
            </div>

            <div className="relative mt-2 grid grid-cols-7 gap-2" aria-hidden="true">
                {Array.from({ length: 42 }).map((_, i) => (
                    <span
                        key={i}
                        className="mx-auto h-3 w-3 rounded-full bg-navy-300/40"
                    />
                ))}
            </div>

            <div className="relative mt-6 flex items-center justify-center gap-3 text-gold-300/80">
                <Music size={18} className="animate-fade-up" />
                <Music size={22} className="animate-fade-up [animation-delay:120ms]" />
                <Music size={26} className="animate-fade-up [animation-delay:240ms]" />
                <Music size={22} className="animate-fade-up [animation-delay:360ms]" />
                <Music size={18} className="animate-fade-up [animation-delay:480ms]" />
            </div>
        </div>
    );
}

const ABOUT_CARDS = [
    {
        icon: Users,
        title: 'Multi-Choir Management',
        text: 'Coordinate several choirs and their leadership from a single connected system.',
    },
    {
        icon: Library,
        title: 'Song & Lyrics Archive',
        text: 'Preserve every song, lyric, arrangement and piece of musical history in one place.',
    },
    {
        icon: CalendarClock,
        title: 'Performance Scheduling',
        text: 'Plan services and concerts, then share schedules with members and the public.',
    },
    {
        icon: ClipboardCheck,
        title: 'Attendance Tracking',
        text: 'Record participation at rehearsals and performances with simple tools.',
    },
];

const FEATURES = [
    { icon: Building2, title: 'Choir Management', text: 'Manage multiple choirs and their leaders.' },
    { icon: Users, title: 'Member Management', text: 'Organize members, voice sections and participation.' },
    { icon: Library, title: 'Song Library', text: 'Store songs, lyrics, files and song history.' },
    { icon: CalendarClock, title: 'Rehearsals', text: 'Plan rehearsals and organize songs.' },
    { icon: ClipboardCheck, title: 'Attendance', text: 'Track attendance and participation.' },
    { icon: Mic, title: 'Performances', text: 'Schedule performances and manage participants.' },
    { icon: BellRing, title: 'Notifications', text: 'Keep members informed about upcoming events.' },
    { icon: Globe, title: 'Public Archive', text: 'Let the public discover approved songs and performances.' },
];

const ARCHIVE_ITEMS = [
    'Lyrics',
    'Composers',
    'Arrangers',
    'Song history',
    'Practice files',
    'Performance history',
];

const CHOIRS = ['Choir A', 'Choir B', 'Choir C', 'Choir D'];

export default function LandingPage() {
    return (
        <div>
            {/* HERO */}
            <section
                id="home"
                className="scroll-mt-20 relative overflow-hidden bg-gradient-to-b from-navy-50 to-surface"
            >
                <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-24 lg:px-8">
                    <div className="animate-fade-up">
                        <span className="inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-3 py-1 text-xs font-medium text-gold-800">
                            <Sparkles size={14} />
                            Multi-Choir Management & Digital Archive
                        </span>
                        <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-navy-900 sm:text-5xl">
                            One Platform. Many Voices.{' '}
                            <span className="text-gold-600">One Purpose.</span>
                        </h1>
                        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-600">
                            CHOIR MKC brings multiple choirs together to manage members, songs,
                            rehearsals, performances, attendance, and musical history in one
                            connected platform.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button to="/login" variant="gold" size="lg">
                                Sign In
                                <ArrowRight size={18} />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() =>
                                    document
                                        .getElementById('choirs')
                                        ?.scrollIntoView({ behavior: 'smooth' })
                                }
                            >
                                Explore Choirs
                            </Button>
                        </div>
                    </div>
                    <div className="animate-fade-in [animation-delay:200ms]">
                        <HeroVisual />
                    </div>
                </div>
            </section>

            {/* ABOUT */}
            <section id="about" className="scroll-mt-24 bg-surface py-20 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-semibold tracking-tight text-navy-900">
                            Connecting Choirs Through Music
                        </h2>
                        <p className="mt-4 text-ink-600">
                            CHOIR MKC is designed to help multiple choirs organize their ministry,
                            preserve their musical history, coordinate rehearsals and performances,
                            and share selected content with the public.
                        </p>
                    </div>
                    <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {ABOUT_CARDS.map((card) => (
                            <Card key={card.title} hover>
                                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                                    <card.icon size={24} />
                                </span>
                                <h3 className="mt-5 text-lg font-semibold text-navy-900">
                                    {card.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                                    {card.text}
                                </p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="bg-navy-50/60 py-20 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-semibold tracking-tight text-navy-900">
                            Everything Your Choir Needs
                        </h2>
                        <p className="mt-4 text-ink-600">
                            From membership to the stage, CHOIR MKC brings your music ministry
                            together.
                        </p>
                    </div>
                    <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {FEATURES.map((feature) => (
                            <Card key={feature.title} hover className="flex flex-col">
                                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
                                    <feature.icon size={22} />
                                </span>
                                <h3 className="mt-4 font-semibold text-navy-900">
                                    {feature.title}
                                </h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                                    {feature.text}
                                </p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* MULTI-CHOIR */}
            <section id="choirs" className="scroll-mt-24 bg-surface py-20 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-semibold tracking-tight text-navy-900">
                            One Platform Designed for Many Choirs
                        </h2>
                        <p className="mt-4 text-ink-600">
                            Each choir connects to CHOIR MKC while keeping its own members, songs
                            and history private to its leaders.
                        </p>
                    </div>
                    <div className="mx-auto mt-14 max-w-3xl">
                        <Card className="relative">
                            <div className="grid gap-6 sm:grid-cols-2">
                                {CHOIRS.map((choir) => (
                                    <div
                                        key={choir}
                                        className="flex items-center justify-between rounded-xl border border-ink-100 bg-navy-50/50 px-5 py-4"
                                    >
                                        <span className="font-medium text-navy-900">{choir}</span>
                                        <span className="h-2.5 w-2.5 rounded-full bg-gold-400" />
                                    </div>
                                ))}
                            </div>
                            <div className="my-6 flex items-center justify-center">
                                <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-300 to-transparent" />
                            </div>
                            <div className="flex items-center justify-center">
                                <span className="rounded-2xl bg-navy-900 px-6 py-4 text-lg font-semibold text-white shadow-md">
                                    CHOIR <span className="text-gold-400">MKC</span>
                                </span>
                            </div>
                            <p className="mt-6 text-center text-xs text-ink-400">
                                Illustrative placeholders — your choirs connect here.
                            </p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* SONG ARCHIVE */}
            <section id="songs" className="scroll-mt-24 bg-navy-50/60 py-20 sm:py-24">
                <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
                    <div>
                        <h2 className="text-3xl font-semibold tracking-tight text-navy-900">
                            Preserve Every Song
                        </h2>
                        <p className="mt-4 text-ink-600">
                            Choirs can build a living archive of their repertoire, capturing the
                            details that matter for generations to come.
                        </p>
                        <ul className="mt-6 space-y-3">
                            {ARCHIVE_ITEMS.map((item) => (
                                <li key={item} className="flex items-center gap-3 text-ink-700">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                        <Check size={14} />
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <div className="mt-8">
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-sm font-medium text-navy-700 hover:text-navy-900"
                            >
                                Sign in to browse your choir&apos;s song archive
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                    <Card hover className="bg-canvas">
                        <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                                <Library size={22} />
                            </span>
                            <div>
                                <p className="font-semibold text-navy-900">Song & Lyrics Archive</p>
                                <p className="text-sm text-ink-500">Secure, searchable, shared</p>
                            </div>
                        </div>
                        <div className="mt-6 space-y-3">
                            {['Amazing Grace', 'Hallelujah Chorus', 'How Great Thou Art'].map(
                                (song) => (
                                    <div
                                        key={song}
                                        className="flex items-center justify-between rounded-lg border border-ink-100 px-4 py-3"
                                    >
                                        <span className="text-sm font-medium text-ink-700">
                                            {song}
                                        </span>
                                        <span className="text-xs text-ink-400">Sample</span>
                                    </div>
                                ),
                            )}
                        </div>
                    </Card>
                </div>
            </section>

            {/* PERFORMANCES */}
            <section id="performances" className="scroll-mt-24 bg-surface py-20 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-semibold tracking-tight text-navy-900">
                            Never Miss a Performance
                        </h2>
                        <p className="mt-4 text-ink-600">
                            Share upcoming services and concerts so your community can plan to
                            attend.
                        </p>
                    </div>
                    <div className="mx-auto mt-12 max-w-md">
                        <Card className="bg-canvas">
                            <span className="inline-flex items-center rounded-full bg-gold-100 px-2.5 py-1 text-xs font-medium text-gold-800">
                                Sample preview
                            </span>
                            <h3 className="mt-3 text-xl font-semibold text-navy-900">
                                Sunday Worship
                            </h3>
                            <dl className="mt-4 space-y-2 text-sm text-ink-600">
                                <div className="flex justify-between">
                                    <dt>Date</dt>
                                    <dd className="font-medium text-ink-800">Sun, 10:00 AM</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt>Venue</dt>
                                    <dd className="font-medium text-ink-800">Main Sanctuary</dd>
                                </div>
                            </dl>
                            <Link
                                to="/login"
                                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-navy-700 hover:text-navy-900"
                            >
                                See all performances
                                <ArrowRight size={16} />
                            </Link>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-navy-900 py-20 sm:py-24">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-semibold tracking-tight text-white">
                        Bring Your Choir Into One Connected Platform
                    </h2>
                    <p className="mt-4 text-navy-200">
                        Create an account to get started, or sign in to your existing workspace.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <Button to="/register" variant="gold" size="lg">
                            Create Account
                        </Button>
                        <Button
                            to="/login"
                            size="lg"
                            className="border border-white/20 bg-transparent text-white hover:bg-white/10"
                        >
                            Sign In
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
