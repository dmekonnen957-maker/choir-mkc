import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    CalendarDays,
    CalendarClock,
    CheckCircle2,
    ListMusic,
    MapPin,
    Clock,
    ArrowRight,
    Church,
} from 'lucide-react';
import { api } from '../../axios';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import StatCard from '../../components/member/StatCard';
import EmptyState from '../../components/member/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Logo from '../../components/Logo';

function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function formatTime(value) {
    if (!value) return '';
    const [h, m] = value.split(':');
    const hour = parseInt(h, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${m ?? '00'} ${period}`;
}

export default function MemberDashboard() {
    const { user, primaryChoir } = useAuth();
    const { theme } = useTheme();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;
        api
            .get('/member/dashboard')
            .then((res) => {
                if (active) setData(res.data.data);
            })
            .catch((err) => {
                if (active) setError(err.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size={36} />
            </div>
        );
    }

    if (error) {
        return <EmptyState icon={Church} title="Could not load dashboard" message={error} />;
    }

    if (!data?.has_choir) {
        return (
            <div className="space-y-6">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <Logo size="lg" />
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-ink-900">CHOIR MKC</h1>
                            <p className="text-sm text-ink-500">Member Portal</p>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-ink-900">
                        Welcome back, {user?.name}
                    </h1>
                    <p className="mt-1 text-ink-500">You are not assigned to a choir yet.</p>
                </div>
                <EmptyState
                    icon={Church}
                    title="No choir assigned"
                    message="Once an administrator assigns you to a choir, your schedule, performances and attendance will appear here."
                />
            </div>
        );
    }

    const { choir, stats, next_performance, next_rehearsal, my_performances } = data;
    const attendance = stats.attendance;

    const cardStyle = { borderColor: `var(--theme-border)` };

    return (
        <div className="space-y-8">
            <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <Logo size="lg" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-ink-900">CHOIR MKC</h1>
                        <p className="text-sm text-ink-500">Member Portal</p>
                    </div>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-ink-900">
                        Welcome back, {user?.name}
                    </h1>
                    <p className="mt-1 flex items-center gap-2 text-ink-500">
                        <Church size={16} style={{ color: 'var(--theme-primary)' }} />
                        <span className="font-medium" style={{ color: 'var(--theme-primary)' }}>{choir.name}</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={CalendarDays}
                    label="Upcoming Performances"
                    value={stats.upcoming_performances}
                    hint="Scheduled ahead"
                />
                <StatCard
                    icon={CalendarClock}
                    label="Upcoming Rehearsals"
                    value={stats.upcoming_rehearsals}
                    hint="Scheduled ahead"
                    accent="sky"
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Attendance"
                    value={attendance.present}
                    hint={
                        attendance.has_records
                            ? `${attendance.absent} absent · ${attendance.late} late`
                            : 'No records yet'
                    }
                    accent="indigo"
                />
                <StatCard
                    icon={ListMusic}
                    label="My Performances"
                    value={stats.my_performances}
                    hint="You are scheduled"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <section style={cardStyle} className="rounded-2xl bg-canvas p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-ink-900">Upcoming Performance</h2>
                    {next_performance ? (
                        <div className="mt-4 space-y-3">
                            <p className="text-base font-semibold text-ink-800">
                                {next_performance.title}
                            </p>
                            <dl className="space-y-1.5 text-sm text-ink-600">
                                <div className="flex items-center gap-2">
                                    <Church size={15} style={{ color: 'var(--theme-primary)' }} /> {choir.name}
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarDays size={15} style={{ color: 'var(--theme-primary)' }} />
                                    {formatDate(next_performance.date)}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={15} style={{ color: 'var(--theme-primary)' }} />
                                    {formatTime(next_performance.start_time)}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={15} style={{ color: 'var(--theme-primary)' }} />
                                    {next_performance.venue || next_performance.location || 'TBD'}
                                </div>
                            </dl>
                            <Link
                                to={`/performances/${next_performance.id}`}
                                className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
                                style={{ color: 'var(--theme-primary)' }}
                            >
                                View Performance <ArrowRight size={16} />
                            </Link>
                        </div>
                    ) : (
                        <p className="mt-4 text-sm text-ink-500">No upcoming performances.</p>
                    )}
                </section>

                <section style={cardStyle} className="rounded-2xl bg-canvas p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-ink-900">Next Rehearsal</h2>
                    {next_rehearsal ? (
                        <div className="mt-4 space-y-1.5 text-sm text-ink-600">
                            <p className="text-base font-semibold text-ink-800">
                                {next_rehearsal.title}
                            </p>
                            <div className="flex items-center gap-2">
                                <CalendarClock size={15} style={{ color: 'var(--theme-primary)' }} />
                                {formatDate(next_rehearsal.date)}
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={15} style={{ color: 'var(--theme-primary)' }} />
                                {formatTime(next_rehearsal.start_time)}
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={15} style={{ color: 'var(--theme-primary)' }} />
                                {next_rehearsal.location || 'TBD'}
                            </div>
                        </div>
                    ) : (
                        <p className="mt-4 text-sm text-ink-500">No upcoming rehearsals.</p>
                    )}
                </section>
            </div>

            <section style={cardStyle} className="rounded-2xl bg-canvas p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-ink-900">My Performances</h2>
                {my_performances && my_performances.length > 0 ? (
                    <ul className="mt-4 divide-y" style={{ borderColor: 'var(--theme-border)' }}>
                        {my_performances.map((p) => (
                            <li key={p.id} className="flex items-center justify-between py-3">
                                <div>
                                    <p className="text-sm font-semibold text-ink-800">{p.title}</p>
                                    <p className="text-xs text-ink-500">
                                        {formatDate(p.date)} · {formatTime(p.start_time)}
                                    </p>
                                </div>
                                <Link
                                    to={`/performances/${p.id}`}
                                    className="text-sm font-medium hover:underline"
                                    style={{ color: 'var(--theme-primary)' }}
                                >
                                    View
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-4 text-sm text-ink-500">No performance participation yet.</p>
                )}
            </section>
        </div>
    );
}
