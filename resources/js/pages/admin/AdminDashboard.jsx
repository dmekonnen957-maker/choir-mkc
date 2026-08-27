import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Music2, Mic2, CalendarDays, Building2, Activity, ChevronRight } from 'lucide-react';
import { api } from '../../axios';
import Card from '../../components/ui/Card';
import StatCard from '../../components/member/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import Logo from '../../components/Logo';

function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminDashboard() {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/dashboard')
            .then((res) => setData(res.data.data))
            .catch(() => setError('Failed to load dashboard data.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <LoadingSpinner text="Loading dashboard..." />
            </div>
        );
    }

    if (error) {
        return <Alert variant="error" className="mt-6">{error}</Alert>;
    }

    const counts = data.counts || {};
    const choirs = data.choirs_overview || [];
    const upcoming = data.upcoming_performances || [];
    const activity = data.recent_activity || [];

    return (
        <div className="space-y-8">
            <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <Logo size="lg" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-ink-900">CHOIR MKC</h1>
                        <p className="text-sm text-ink-500">Administration Portal</p>
                    </div>
                </div>
                <p className="text-sm text-ink-500">
                    Overview of your choir community and recent activity.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard icon={Building2} label="Choirs" value={counts.choirs ?? 0} hint="Total choirs" />
                <StatCard icon={Users} label="Members" value={counts.members ?? 0} hint="Across all choirs" accent="sky" />
                <StatCard icon={Music2} label="Songs" value={counts.songs ?? 0} hint="In the library" accent="indigo" />
                <StatCard icon={Mic2} label="Lyrics" value={counts.lyrics ?? 0} hint="Recorded" accent="violet" />
                <StatCard icon={CalendarDays} label="Performances" value={counts.performances ?? 0} hint="Scheduled events" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-ink-900">Active Choirs</h2>
                        <Link
                            to="/admin/choirs"
                            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            Manage <ChevronRight size={16} />
                        </Link>
                    </div>
                    {choirs.length === 0 ? (
                        <p className="py-6 text-center text-sm text-ink-400">No active choirs yet.</p>
                    ) : (
                        <div className="divide-y divide-blue-50">
                            {choirs.map((choir) => (
                                <Link
                                    key={choir.id}
                                    to={`/admin/choirs/${choir.id}`}
                                    className="flex items-center justify-between py-3 transition hover:bg-canvas/60"
                                >
                                    <div>
                                        <p className="font-medium text-ink-900">{choir.name}</p>
                                        <p className="text-xs text-ink-400">
                                            {choir.member_count} members · {choir.songs_count} songs · {choir.performances_count} performances
                                        </p>
                                    </div>
                                    <ChevronRight size={18} className="text-ink-300" />
                                </Link>
                            ))}
                        </div>
                    )}
                </Card>

                <Card>
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink-900">
                        <CalendarDays size={18} className="text-blue-500" /> Upcoming
                    </h2>
                    {upcoming.length === 0 ? (
                        <p className="py-6 text-center text-sm text-ink-400">No upcoming performances.</p>
                    ) : (
                        <ul className="space-y-3">
                            {upcoming.map((p) => (
                                <li key={p.id} className="rounded-xl border border-blue-50 bg-canvas p-3">
                                    <p className="text-sm font-medium text-ink-900">{p.title}</p>
                                    <p className="text-xs text-ink-500">
                                        {p.choir?.name ? `${p.choir.name} · ` : ''}
                                        {formatDate(p.date)}
                                        {p.start_time ? ` · ${p.start_time}` : ''}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>

            <Card>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink-900">
                    <Activity size={18} className="text-blue-500" /> Recent Activity
                </h2>
                {activity.length === 0 ? (
                    <p className="py-6 text-center text-sm text-ink-400">No recent activity.</p>
                ) : (
                    <ul className="divide-y divide-blue-50">
                        {activity.map((a) => (
                            <li key={a.id} className="flex items-center justify-between py-2.5">
                                <p className="text-sm text-ink-700">
                                    <span className="font-medium text-ink-900">{a.user_name || 'System'}</span>{' '}
                                    {a.action}
                                </p>
                                <span className="text-xs text-ink-400">{formatDate(a.created_at)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
}
