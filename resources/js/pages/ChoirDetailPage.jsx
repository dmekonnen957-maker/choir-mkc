import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Users,
    Music2,
    CalendarDays,
    Images,
    Megaphone,
    Info,
    ArrowLeft,
    MapPin,
    Clock,
} from 'lucide-react';
import CoverImage from '../components/public/CoverImage';
import SongCard from '../components/public/SongCard';
import PerformanceCard from '../components/public/PerformanceCard';
import Reveal from '../components/ui/Reveal';
import EmptyState from '../components/public/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
    fetchChoir,
    fetchChoirSongs,
    fetchChoirPerformances,
    fetchChoirMembers,
    fetchChoirGallery,
    fetchChoirAnnouncements,
    imageUrl,
    isUpcoming,
    formatDate,
} from '../lib/publicApi';

const TABS = [
    { key: 'overview', label: 'Overview', icon: Info },
    { key: 'songs', label: 'Songs', icon: Music2 },
    { key: 'performances', label: 'Performances', icon: CalendarDays },
    { key: 'gallery', label: 'Gallery', icon: Images },
    { key: 'members', label: 'Members', icon: Users },
    { key: 'announcements', label: 'Announcements', icon: Megaphone },
];

export default function ChoirDetailPage() {
    const { id } = useParams();
    const [choir, setChoir] = useState(null);
    const [data, setData] = useState({ songs: [], performances: [], members: [], gallery: [], announcements: [] });
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('overview');

    useEffect(() => {
        let active = true;
        setLoading(true);
        Promise.all([
            fetchChoir(id),
            fetchChoirSongs(id),
            fetchChoirPerformances(id),
            fetchChoirMembers(id),
            fetchChoirGallery(id),
            fetchChoirAnnouncements(id),
        ])
            .then(([c, s, p, m, g, a]) => {
                if (!active) return;
                setChoir(c);
                setData({ songs: s, performances: p, members: m, gallery: g, announcements: a });
            })
            .catch(() => {})
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center bg-white">
                <LoadingSpinner text="Loading choir..." />
            </div>
        );
    }

    if (!choir) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-24">
                <EmptyState
                    icon={Users}
                    title="This choir could not be found."
                    message="It may be private or no longer available."
                    action={
                        <Link
                            to="/choirs"
                            className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white"
                        >
                            <ArrowLeft size={16} /> Back to Choirs
                        </Link>
                    }
                />
            </div>
        );
    }

    const upcoming = data.performances.filter((p) => isUpcoming(p.date));

    return (
        <div className="bg-white">
            {/* HERO */}
            <section className="relative">
                <div className="h-64 w-full overflow-hidden sm:h-80">
                    <CoverImage src={choir.logo_path} label={choir.name} className="h-full w-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-950/85 via-blue-900/40 to-transparent" />
                </div>
                <div className="mx-auto -mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="rounded-[2rem] border border-slate-100 bg-white p-7 shadow-xl sm:p-9">
                        <Link
                            to="/choirs"
                            className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-700"
                        >
                            <ArrowLeft size={16} /> All Choirs
                        </Link>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            {choir.name}
                        </h1>
                        {choir.church_name && (
                            <p className="mt-1 text-sm text-slate-500">{choir.church_name}</p>
                        )}
                        {choir.description && (
                            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">
                                {choir.description}
                            </p>
                        )}
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Stat icon={Users} value={choir.member_count ?? 0} label="Members" />
                            <Stat icon={Music2} value={choir.songs_count ?? data.songs.length} label="Songs" />
                            <Stat
                                icon={CalendarDays}
                                value={choir.performances_count ?? data.performances.length}
                                label="Performances"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* TABS */}
            <div className="sticky top-[72px] z-40 mt-8 border-b border-slate-200 bg-white/85 backdrop-blur">
                <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
                    {TABS.map((t) => {
                        const Icon = t.icon;
                        const count =
                            data[t.key]?.length ??
                            (t.key === 'overview' ? null : 0);
                        return (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setTab(t.key)}
                                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3.5 text-sm font-medium transition-colors ${
                                    tab === t.key
                                        ? 'border-blue-700 text-blue-700'
                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <Icon size={16} />
                                {t.label}
                                {count !== null && (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                {tab === 'overview' && (
                    <OverviewTab choir={choir} data={data} upcoming={upcoming} />
                )}
                {tab === 'songs' && (
                    <GridEmpty
                        items={data.songs}
                        icon={Music2}
                        emptyTitle="No songs published yet."
                        emptyMsg="This choir has not shared songs publicly."
                        gridClass="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {(s) => (
                            <Reveal key={s.id}>
                                <SongCard song={s} />
                            </Reveal>
                        )}
                    </GridEmpty>
                )}
                {tab === 'performances' && (
                    <div className="space-y-10">
                        <SubHeading title={`Upcoming (${upcoming.length})`} />
                        <GridEmpty
                            items={upcoming}
                            icon={CalendarDays}
                            emptyTitle="No upcoming performances."
                            emptyMsg="Check back soon for the next gathering."
                            gridClass="grid gap-8 lg:grid-cols-2"
                        >
                            {(p) => (
                                <Reveal key={p.id}>
                                    <PerformanceCard performance={p} variant="upcoming" />
                                </Reveal>
                            )}
                        </GridEmpty>
                        <SubHeading title="Past Performances" />
                        <GridEmpty
                            items={data.performances.filter((p) => !isUpcoming(p.date))}
                            icon={CalendarDays}
                            emptyTitle="No past performances recorded."
                            gridClass="grid gap-4"
                        >
                            {(p) => (
                                <Reveal key={p.id}>
                                    <PerformanceCard performance={p} variant="past" />
                                </Reveal>
                            )}
                        </GridEmpty>
                    </div>
                )}
                {tab === 'gallery' && (
                    <GridEmpty
                        items={data.gallery}
                        icon={Images}
                        emptyTitle="No gallery photos yet."
                        emptyMsg="Moments from this choir will appear here."
                        gridClass="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
                    >
                        {(g) => (
                            <Reveal key={g.id}>
                                <GalleryItem item={g} />
                            </Reveal>
                        )}
                    </GridEmpty>
                )}
                {tab === 'members' && (
                    <GridEmpty
                        items={data.members}
                        icon={Users}
                        emptyTitle="No members are publicly listed."
                        emptyMsg="Member profiles for this choir are private."
                        gridClass="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {(m) => (
                            <Reveal key={m.id}>
                                <MemberItem member={m} />
                            </Reveal>
                        )}
                    </GridEmpty>
                )}
                {tab === 'announcements' && (
                    <GridEmpty
                        items={data.announcements}
                        icon={Megaphone}
                        emptyTitle="No announcements yet."
                        emptyMsg="Updates from this choir will appear here."
                        gridClass="grid gap-6 lg:grid-cols-2"
                    >
                        {(a) => (
                            <Reveal key={a.id}>
                                <AnnouncementItem announcement={a} />
                            </Reveal>
                        )}
                    </GridEmpty>
                )}
            </section>
        </div>
    );
}

function Stat({ icon: Icon, value, label }) {
    return (
        <div className="flex items-center gap-3 rounded-2xl bg-blue-50 px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Icon size={18} />
            </span>
            <div>
                <p className="text-lg font-bold leading-none text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
            </div>
        </div>
    );
}

function SubHeading({ title }) {
    return <h3 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h3>;
}

function GridEmpty({ items, icon: Icon, emptyTitle, emptyMsg, gridClass, children }) {
    if (!items || items.length === 0) {
        return <EmptyState icon={Icon} title={emptyTitle} message={emptyMsg} />;
    }
    return <div className={gridClass}>{items.map((it) => children(it))}</div>;
}

function OverviewTab({ choir, data, upcoming }) {
    const leader = choir.team_leader;
    return (
        <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <SubHeading title="About this Choir" />
                <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
                    {choir.description || 'A vibrant part of the EKA MKC Choirs and Worship Teams community.'}
                </p>

                {upcoming.length > 0 && (
                    <div className="mt-10">
                        <SubHeading title="Next Performance" />
                        <div className="mt-4 grid gap-8 lg:grid-cols-2">
                            {upcoming.slice(0, 2).map((p) => (
                                <PerformanceCard key={p.id} performance={p} variant="upcoming" />
                            ))}
                        </div>
                    </div>
                )}

                {data.songs.length > 0 && (
                    <div className="mt-10">
                        <div className="flex items-center justify-between">
                            <SubHeading title="Latest Songs" />
                            <button
                                type="button"
                                onClick={() => setTab('songs')}
                                className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                            >
                                View all
                            </button>
                        </div>
                        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {data.songs.slice(0, 3).map((s) => (
                                <SongCard key={s.id} song={s} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <aside className="space-y-6">
                {leader && (
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                            Choir Leader
                        </p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{leader.name}</p>
                        <p className="text-sm text-slate-500">{leader.email}</p>
                    </div>
                )}
                {data.announcements.length > 0 && (
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                            Latest Announcement
                        </p>
                        <p className="mt-2 text-base font-semibold text-slate-900">
                            {data.announcements[0].title}
                        </p>
                        <p className="mt-2 line-clamp-3 text-sm text-slate-500">
                            {data.announcements[0].content}
                        </p>
                    </div>
                )}
            </aside>
        </div>
    );
}

function GalleryItem({ item }) {
    const isVideo = item.media_type === 'video';
    return (
        <div className="group overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
            <div className="aspect-square w-full overflow-hidden">
                {isVideo ? (
                    <video
                        src={imageUrl(item.media_path)}
                        controls
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
                        <CoverImage src={item.media_path} label={item.title} className="h-full w-full" />
                    </div>
                )}
            </div>
            {item.title && (
                <p className="px-3 py-2 text-xs font-medium text-slate-600">{item.title}</p>
            )}
        </div>
    );
}

function MemberItem({ member }) {
    const name = member.full_name || member.first_name || member.name || 'Member';
    return (
        <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full">
                <CoverImage src={member.photo_path} label={name} className="h-full w-full" />
            </div>
            <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{name}</p>
                {member.role_title && (
                    <p className="truncate text-sm text-blue-600">{member.role_title}</p>
                )}
                {member.voice_section?.name && (
                    <p className="truncate text-xs text-slate-400">{member.voice_section.name}</p>
                )}
            </div>
        </div>
    );
}

function AnnouncementItem({ announcement }) {
    return (
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            {announcement.image_path && (
                <div className="mb-4 aspect-[16/9] w-full overflow-hidden rounded-2xl">
                    <CoverImage
                        src={announcement.image_path}
                        label={announcement.title}
                        className="h-full w-full"
                    />
                </div>
            )}
            <p className="text-xs font-medium text-slate-400">
                {announcement.published_at
                    ? formatDate(announcement.published_at)
                    : formatDate(announcement.created_at)}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">{announcement.title}</h3>
            <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-slate-500">
                {announcement.content}
            </p>
        </div>
    );
}
