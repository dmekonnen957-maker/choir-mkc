import { useEffect, useState } from 'react';
import { BarChart3, Download, RefreshCw, Users, CalendarDays, Music2, Percent } from 'lucide-react';
import { api } from '../../axios';
import Alert from '../../components/ui/Alert';
import { useLanguage } from '../../context/LanguageContext';

const initialFilters = { choir_id: '', range: 'all', search: '' };

function Stat({ icon: Icon, label, value, tone }) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon size={19} /></div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1 text-3xl font-black text-slate-900">{value}</p>
    </div>;
}

export default function AdminReportsPage() {
    const { t } = useLanguage();
    const [filters, setFilters] = useState(initialFilters);
    const [meta, setMeta] = useState({ choirs: [], can_export: false });
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const [metaResponse, reportResponse] = await Promise.all([
                api.get('/admin/reports'),
                api.get(`/admin/reports/summary?${query.toString()}`),
            ]);
            setMeta(metaResponse.data?.data || { choirs: [], can_export: false });
            setReport(reportResponse.data?.data || null);
        } catch (loadError) {
            setError(loadError.message || t('reports.load_error', 'Unable to load reports.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [filters.choir_id, filters.range]);

    const updateFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }));

    const exportReport = async () => {
        const response = await api.get(`/admin/reports-export?${new URLSearchParams({ ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)), report_type: 'members' })}`, { responseType: 'blob' });
        const url = URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'choir-members-report.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const summary = report?.summary || {};
    const counts = report?.attendance?.counts || {};
    const members = report?.members?.items || [];

    return <div className="space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-blue-700"><BarChart3 size={16} /> {t('reports.title', 'Choir Intelligence & Reports').split(' ')[0]}</div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">{t('reports.title', 'Choir Intelligence & Reports')}</h1>
                <p className="mt-1 text-slate-500">{t('reports.subtitle', 'Attendance metrics, choir membership growth, worship archives, and activity insights.')}</p>
            </div>
            <div className="flex gap-2">
                <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm"><RefreshCw size={16} /> {t('common.refresh', 'Refresh')}</button>
                {meta.can_export && <button type="button" onClick={exportReport} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm"><Download size={16} /> {t('reports.export_members', 'Export Members CSV')}</button>}
            </div>
        </header>

        <section className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('common.choir', 'Choir')}
                <select value={filters.choir_id} onChange={(event) => updateFilter('choir_id', event.target.value)} className="mt-2 w-full rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-800">
                    <option value="">{t('header.all_choirs', 'All accessible choirs')}</option>
                    {meta.choirs.map((choir) => <option key={choir.id} value={choir.id}>{choir.name}</option>)}
                </select>
            </label>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('reports.date_range', 'Date Range')}
                <select value={filters.range} onChange={(event) => updateFilter('range', event.target.value)} className="mt-2 w-full rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-800">
                    <option value="all">{t('reports.range_all', 'All Time')}</option>
                    <option value="today">{t('reports.range_today', 'Today')}</option>
                    <option value="week">{t('reports.range_week', 'This Week')}</option>
                    <option value="month">{t('reports.range_month', 'This Month')}</option>
                    <option value="year">{t('reports.range_year', 'This Year')}</option>
                </select>
            </label>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('reports.find_member', 'Find Member')}
                <input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} onKeyDown={(event) => event.key === 'Enter' && load()} placeholder={t('common.name', 'Name')} className="mt-2 w-full rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-800" />
            </label>
        </section>

        {error && <Alert type="error">{error}</Alert>}
        {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500">{t('reports.loading', 'Loading choir intelligence...')}</div>
        ) : <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <Stat icon={Users} label={t('reports.members_stat', 'Members')} value={summary.total_members ?? 0} tone="bg-blue-50 text-blue-700" />
                <Stat icon={Users} label={t('reports.active_stat', 'Active Singers')} value={summary.active_members ?? 0} tone="bg-emerald-50 text-emerald-700" />
                <Stat icon={Percent} label={t('reports.attendance_stat', 'Attendance Rate')} value={`${summary.attendance_rate ?? 0}%`} tone="bg-amber-50 text-amber-700" />
                <Stat icon={CalendarDays} label={t('reports.performances_stat', 'Worship Events')} value={summary.total_performances ?? 0} tone="bg-violet-50 text-violet-700" />
                <Stat icon={Music2} label={t('reports.songs_stat', 'Songs Catalog')} value={summary.total_songs ?? 0} tone="bg-rose-50 text-rose-700" />
            </section>
            <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="font-black text-slate-900">{t('reports.attendance_mix', 'Attendance Mix')}</h2>
                    <div className="mt-5 space-y-3">
                        {['present', 'late', 'absent', 'excused'].map((status) => (
                            <div key={status} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
                                <span className="font-semibold capitalize text-slate-600">{t(`status.${status}`, status)}</span>
                                <span className="font-black text-slate-900">{counts[status] ?? 0}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-6">
                        <h2 className="font-black text-slate-900">{t('reports.member_attendance', 'Member Attendance Health')}</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-3">{t('reports.col_member', 'Member')}</th>
                                    <th className="px-6 py-3">{t('reports.col_choir', 'Choir')}</th>
                                    <th className="px-6 py-3">{t('reports.col_status', 'Status')}</th>
                                    <th className="px-6 py-3">{t('reports.col_rate', 'Attendance Rate')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {members.slice(0, 12).map((member) => (
                                    <tr key={member.id}>
                                        <td className="px-6 py-3 font-bold text-slate-800">{member.name}</td>
                                        <td className="px-6 py-3 text-slate-500">{member.choir || '—'}</td>
                                        <td className="px-6 py-3 capitalize text-slate-500">{member.status}</td>
                                        <td className="px-6 py-3 font-bold text-slate-800">{member.attendance_rate}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </>}
    </div>;
}
