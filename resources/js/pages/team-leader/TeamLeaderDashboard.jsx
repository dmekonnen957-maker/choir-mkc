import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    CalendarDays,
    CalendarClock,
    CheckCircle2,
    ListMusic,
    Users,
    Music,
    Building2,
    ChevronRight,
    MapPin,
} from 'lucide-react';
import { api } from '../../axios';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/member/StatCard';
import EmptyState from '../../components/member/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
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

export default function TeamLeaderDashboard() {
    const { user, primaryChoir } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;
        api
            .get('/team-leader/dashboard')
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
        return <EmptyState icon={Building2} title="Could not load dashboard" message={error} />;
    }

    if (!data?.has_choir) {
        return (
            <div className="space-y-6">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <Logo size="lg" />
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-ink-900">CHOIR MKC</h1>
                            <p className="text-sm text-ink-500">Team Leader Portal</p>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-ink-900">
                        Welcome back, {user?.name}
                    </h1>
                    <p className="mt-1 text-ink-500">You are not assigned to a choir yet.</p>
                </div>
                <EmptyState
                    icon={Building2}
                    title="No choir assigned"
                    message="Once an administrator assigns you to a choir, your team management features will appear here."
                />
            </div>
        );
    }

    const { choir, stats, next_performance, next_rehearsal, my_performances, upcoming_rehearsals } = data;
    const attendance = stats.attendance;

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-4 mb-4">
                    <Logo size="lg" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-ink-900">CHOIR MKC</h1>
                        <p className="text-sm text-ink-500">Team Leader Portal</p>
                    </div>
                </div>
                <p className="text-sm text-ink-500">
                    Welcome back, <span className="font-semibold text-ink-900">{user?.name}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={Building2}
                    label="Choir Members"
                    value={stats.members}
                    hint="Total members"
                />
                <StatCard
                    icon={CalendarDays}
                    label="Upcoming Performances"
                    value={stats.upcoming_performances}
                    hint="Scheduled ahead"
                    accent="sky"
                />
                <StatCard
                    icon={CalendarClock}
                    label="Upcoming Rehearsals"
                    value={stats.upcoming_rehearsals}
                    hint="Scheduled ahead"
                    accent="indigo"
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Attendance Rate"
                    value={attendance.has_records ? `${Math.round((attendance.present / (attendance.present + attendance.absent + attendance.late || 1)) * 100)}%` : 'N/A'}
                    hint={
                        attendance.has_records
                            ? `${attendance.present} present · ${attendance.absent} absent`
                            : 'No records yet'
                    }
                    accent="violet"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-ink-900">Upcoming Performance</h2>
                        <Link
                            to="/team-leader/performances"
                            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            Manage <ChevronRight size={16} />
                        </Link>
                    </div>
                    {next_performance ? (
                        <div className="space-y-3">
                            <p className="text-base font-semibold text-ink-800">
                                {next_performance.title}
                            </p>
                            <dl className="space-y-1.5 text-sm text-ink-600">
                                <div className="flex items-center gap-2">
                                    <Building2 size={15} className="text-blue-500" /> {choir.name}
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarDays size={15} className="text-blue-500" />
                                    {formatDate(next_performance.date)}
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarClock size={15} className="text-blue-500" />
                                    {formatTime(next_performance.start_time)}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={15} className="text-blue-500" />
                                    {next_performance.venue || next_performance.location || 'TBD'}
                                </div>
                            </dl>
                            <Link
                                to={`/performances/${next_performance.id}`}
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900"
                            >
                                View Performance <ChevronRight size={16} />
                            </Link>
                        </div>
                    ) : (
                        <p className="text-sm text-ink-500">No upcoming performances.</p>
                    )}
                </Card>

                <Card>
                    <h2 className="mb-4 text-lg font-semibold text-ink-900">Next Rehearsal</h2>
                    {next_rehearsal ? (
                        <div className="space-y-1.5 text-sm text-ink-600">
                            <p className="text-base font-semibold text-ink-800">
                                {next_rehearsal.title}
                            </p>
                            <div className="flex items-center gap-2">
                                <CalendarClock size={15} className="text-blue-500" />
                                {formatDate(next_rehearsal.date)}
                            </div>
                            <div className="flex items-center gap-2">
                                <CalendarClock size={15} className="text-blue-500" />
                                {formatTime(next_rehearsal.start_time)}
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={15} className="text-blue-500" />
                                {next_rehearsal.location || 'TBD'}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-ink-500">No upcoming rehearsals.</p>
                    )}
                </Card>
            </div>

            <Card>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-ink-900">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Link
                        to="/team-leader/choir"
                        className="flex flex-col items-center gap-2 rounded-xl border border-blue-100 bg-canvas p-4 text-center hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                        <Users size={24} className="text-blue-600" />
                        <span className="text-sm font-semibold text-ink-900">Manage Members</span>
                    </Link>
                    <Link
                        to="/team-leader/performances"
                        className="flex flex-col items-center gap-2 rounded-xl border border-blue-100 bg-canvas p-4 text-center hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                        <CalendarDays size={24} className="text-blue-600" />
                        <span className="text-sm font-semibold text-ink-900">Performances</span>
                    </Link>
                    <Link
                        to="/team-leader/rehearsals"
                        className="flex flex-col items-center gap-2 rounded-xl border border-blue-100 bg-canvas p-4 text-center hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                        <CalendarClock size={24} className="text-blue-600" />
                        <span className="text-sm font-semibold text-ink-900">Rehearsals</span>
                    </Link>
                    <Link
                        to="/team-leader/attendance"
                        className="flex flex-col items-center gap-2 rounded-xl border border-blue-100 bg-canvas p-4 text-center hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                        <CheckCircle2 size={24} className="text-blue-600" />
                        <span className="text-sm font-semibold text-ink-900">Attendance</span>
                    </Link>
                </div>
            </Card>
        </div>
    );
}