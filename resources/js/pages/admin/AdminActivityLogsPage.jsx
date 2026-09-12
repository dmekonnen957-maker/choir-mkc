import { useCallback, useEffect, useState } from 'react';
import {
    Activity,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    Edit3,
    FilePlus2,
    Filter,
    Search,
    Settings2,
    Trash2,
    UserRound,
    X,
} from 'lucide-react';
import { api } from '../../axios';

const ACTIONS = [
    { value: 'created', label: 'Created' },
    { value: 'updated', label: 'Updated' },
    { value: 'deleted', label: 'Deleted' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
];

const MODULES = ['Song', 'Member', 'Performance', 'Choir', 'Attendance', 'Setting', 'User', 'Role', 'Permission'];

const ACTION_ICONS = {
    created: FilePlus2,
    updated: Edit3,
    deleted: Trash2,
    approved: CheckCircle2,
    rejected: CircleAlert,
};

const initialFilters = { search: '', user_id: '', action: '', module: '', from: '', to: '' };

function activityIcon(action) {
    const value = String(action || '').toLowerCase();
    const key = Object.keys(ACTION_ICONS).find((name) => value.includes(name));
    return ACTION_ICONS[key] || Settings2;
}

function formatDateTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
}

function initials(name) {
    return (name || '?').split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export default function AdminActivityLogsPage() {
    const [filters, setFilters] = useState(initialFilters);
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/admin/users', { params: { per_page: 100, status: 'approved' } })
            .then((response) => setUsers(response.data?.data?.items || []))
            .catch(() => setUsers([]));
    }, []);

    const loadLogs = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/admin/audit-logs', {
                params: { ...filters, page, per_page: 20 },
            });
            const data = response.data?.data || {};
            setLogs(data.items || []);
            setPagination(data.pagination || { current_page: 1, last_page: 1, total: 0 });
        } catch (loadError) {
            setError(loadError.message || 'Unable to load activity logs.');
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, [filters, page]);

    useEffect(() => { loadLogs(); }, [loadLogs]);

    const updateFilter = (name, value) => {
        setFilters((current) => ({ ...current, [name]: value }));
        setPage(1);
    };

    const clearFilters = () => {
        setFilters(initialFilters);
        setPage(1);
    };

    const hasFilters = Object.values(filters).some(Boolean);

    return (
        <div className="space-y-6">
            <header>
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-blue-700">
                    <Activity size={16} /> System activity
                </div>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Activity Logs</h1>
                <p className="mt-1 text-slate-500">Track important actions and changes made in the system.</p>
            </header>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <label className="relative block lg:col-span-2">
                        <span className="sr-only">Search activity</span>
                        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Search activity" className="w-full rounded-xl border-slate-200 py-2.5 pl-10 text-sm focus:border-blue-500 focus:ring-blue-100" />
                    </label>
                    <select value={filters.user_id} onChange={(event) => updateFilter('user_id', event.target.value)} aria-label="Filter by user" className="rounded-xl border-slate-200 text-sm text-slate-700 focus:border-blue-500 focus:ring-blue-100">
                        <option value="">All users</option>
                        {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </select>
                    <select value={filters.action} onChange={(event) => updateFilter('action', event.target.value)} aria-label="Filter by action" className="rounded-xl border-slate-200 text-sm text-slate-700 focus:border-blue-500 focus:ring-blue-100">
                        <option value="">All actions</option>
                        {ACTIONS.map((action) => <option key={action.value} value={action.value}>{action.label}</option>)}
                    </select>
                    <select value={filters.module} onChange={(event) => updateFilter('module', event.target.value)} aria-label="Filter by module" className="rounded-xl border-slate-200 text-sm text-slate-700 focus:border-blue-500 focus:ring-blue-100">
                        <option value="">All modules</option>
                        {MODULES.map((module) => <option key={module} value={module}>{module}</option>)}
                    </select>
                    <label><span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">From</span><input type="date" value={filters.from} onChange={(event) => updateFilter('from', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm text-slate-700 focus:border-blue-500 focus:ring-blue-100" /></label>
                    <label><span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">To</span><input type="date" value={filters.to} onChange={(event) => updateFilter('to', event.target.value)} className="w-full rounded-xl border-slate-200 text-sm text-slate-700 focus:border-blue-500 focus:ring-blue-100" /></label>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500"><Filter size={14} /> {pagination.total || 0} activities</span>
                    {hasFilters && <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-700"><X size={14} /> Clear Filters</button>}
                </div>
            </section>

            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-[780px] w-full text-left">
                        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Module</th><th className="px-5 py-3">Description</th><th className="px-5 py-3">Date &amp; Time</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? <tr><td colSpan="5" className="px-5 py-12 text-center text-sm font-semibold text-slate-500">Loading activity...</td></tr> : logs.length === 0 ? <tr><td colSpan="5" className="px-5 py-16 text-center"><Activity size={30} className="mx-auto text-slate-300" /><h2 className="mt-3 text-base font-black text-slate-800">No activity yet</h2><p className="mt-1 text-sm text-slate-500">System activities will appear here when users perform actions.</p></td></tr> : logs.map((log) => {
                                const Icon = activityIcon(log.action);
                                return <tr key={log.id} className="transition hover:bg-slate-50/80"><td className="px-5 py-3"><div className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-700">{initials(log.user?.name)}</span><div><p className="text-sm font-bold text-slate-800">{log.user?.name || 'System'}</p><p className="text-xs text-slate-400">{log.user?.email || 'Automated action'}</p></div></div></td><td className="px-5 py-3"><span className="inline-flex items-center gap-1.5 text-sm font-semibold capitalize text-slate-700"><Icon size={15} className="text-blue-600" />{log.action_label || log.action || 'Activity'}</span></td><td className="px-5 py-3 text-sm font-semibold text-slate-600">{log.module || 'System'}</td><td className="px-5 py-3 text-sm text-slate-600">{log.description || 'System activity recorded'}</td><td className="whitespace-nowrap px-5 py-3 text-sm text-slate-500"><div className="flex items-center gap-1.5"><CalendarDays size={14} className="text-slate-400" />{formatDateTime(log.created_at)}</div></td></tr>;
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            {pagination.last_page > 1 && <div className="flex flex-wrap items-center justify-center gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40"><ChevronLeft size={15} /> Previous</button><span className="px-3 text-xs font-bold text-slate-500">Page {pagination.current_page} of {pagination.last_page}</span><button type="button" onClick={() => setPage((current) => Math.min(pagination.last_page, current + 1))} disabled={page >= pagination.last_page} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40">Next <ChevronRight size={15} /></button></div>}
        </div>
    );
}
