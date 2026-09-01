import { useState, useEffect, useCallback } from 'react';
import {
    CalendarDays,
    MapPin,
    Clock,
    Plus,
    Pencil,
    Trash2,
    ChevronRight,
    Search,
    RefreshCw,
    Music2,
    Users,
    Calendar,
    ArrowLeft,
    X,
    Check,
    AlertTriangle,
    Sparkles,
    CalendarClock,
} from 'lucide-react';
import { api } from '../../axios';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Input from '../../components/ui/Input';

/* ─────────────────────── helpers ─────────────────────── */

function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const [y, m, d] = dateStr.split('-');
        return new Date(+y, +m - 1, +d).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    try {
        const [h, min] = timeStr.split(':');
        const hour = parseInt(h, 10);
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 === 0 ? 12 : hour % 12;
        return `${hour12}:${min ?? '00'} ${period}`;
    } catch {
        return timeStr;
    }
}

function isUpcoming(dateStr) {
    if (!dateStr) return false;
    const [y, m, d] = dateStr.split('-');
    const perf = new Date(+y, +m - 1, +d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return perf >= today;
}

const EMPTY_FORM = {
    title: '',
    date: '',
    start_time: '',
    location: '',
    description: '',
    status: 'scheduled',
};

/* ─────────────────────── sub-components ─────────────────────── */

function StatusBadge({ status }) {
    const map = {
        scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
        completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
        postponed: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${
                map[status] || 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
        >
            {status}
        </span>
    );
}

function PerformanceCard({ performance, onEdit, onDelete, onView }) {
    const upcoming = isUpcoming(performance.date);
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md hover:-translate-y-0.5">
            {/* Coloured top strip */}
            <div
                className={`h-1.5 w-full ${
                    upcoming
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                        : 'bg-gradient-to-r from-slate-300 to-slate-400'
                }`}
            />
            <div className="p-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <StatusBadge status={performance.status} />
                            {upcoming && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                                    <Sparkles size={10} /> Upcoming
                                </span>
                            )}
                        </div>
                        <h3
                            onClick={() => onView(performance)}
                            className="cursor-pointer text-base font-bold text-slate-900 hover:text-blue-700 truncate transition-colors"
                        >
                            {performance.title}
                        </h3>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onEdit(performance)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            title="Edit performance"
                        >
                            <Pencil size={15} />
                        </button>
                        <button
                            onClick={() => onDelete(performance)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Delete performance"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                </div>

                {/* Meta info */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-blue-400 shrink-0" />
                        {formatDate(performance.date)}
                    </span>
                    {performance.start_time && (
                        <span className="flex items-center gap-1.5">
                            <Clock size={13} className="text-blue-400 shrink-0" />
                            {formatTime(performance.start_time)}
                        </span>
                    )}
                    {performance.location && (
                        <span className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-blue-400 shrink-0" />
                            <span className="truncate">{performance.location}</span>
                        </span>
                    )}
                    {performance.choir?.name && (
                        <span className="flex items-center gap-1.5">
                            <Music2 size={13} className="text-blue-400 shrink-0" />
                            <span className="truncate">{performance.choir.name}</span>
                        </span>
                    )}
                </div>

                {/* Description snippet */}
                {performance.description && (
                    <p className="mt-3 line-clamp-2 text-xs text-slate-400">
                        {performance.description}
                    </p>
                )}

                {/* View link */}
                <button
                    onClick={() => onView(performance)}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                    View Details <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}

/* ─────────────────────── Performance Form Modal ─────────────────────── */

function PerformanceFormModal({ open, onClose, onSaved, initial, choirs }) {
    const isEdit = !!initial?.id;
    const [form, setForm] = useState(EMPTY_FORM);
    const [choirId, setChoirId] = useState('');
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open) {
            if (initial) {
                setForm({
                    title: initial.title || '',
                    date: initial.date || '',
                    start_time: initial.start_time || '',
                    location: initial.location || '',
                    description: initial.description || '',
                    status: initial.status || 'scheduled',
                });
                setChoirId(initial.choir_id?.toString() || initial.choir?.id?.toString() || '');
            } else {
                setForm(EMPTY_FORM);
                setChoirId(choirs[0]?.id?.toString() || '');
            }
            setErrors({});
        }
    }, [open, initial, choirs]);

    const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!choirId) {
            setErrors({ choir_id: 'Please select a choir.' });
            return;
        }
        setSaving(true);
        setErrors({});
        try {
            if (isEdit) {
                await api.put(`/choirs/${choirId}/performances/${initial.id}`, form);
            } else {
                await api.post(`/choirs/${choirId}/performances`, form);
            }
            onSaved();
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) {
                setErrors(data.errors);
            } else {
                setErrors({ general: data?.message || 'Failed to save performance.' });
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={isEdit ? 'Edit Performance' : 'New Performance'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {errors.general && <Alert variant="error">{errors.general}</Alert>}

                {/* Choir */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Choir / Ministry Team <span className="text-rose-500">*</span>
                    </label>
                    <select
                        value={choirId}
                        onChange={(e) => setChoirId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                        disabled={isEdit}
                    >
                        <option value="">Select choir…</option>
                        {choirs.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    {errors.choir_id && (
                        <p className="mt-1 text-xs text-rose-600">{errors.choir_id}</p>
                    )}
                </div>

                {/* Title */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Performance Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        value={form.title}
                        onChange={(e) => set('title', e.target.value)}
                        placeholder="e.g. Sunday Worship Concert"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                    />
                    {errors.title && (
                        <p className="mt-1 text-xs text-rose-600">{errors.title}</p>
                    )}
                </div>

                {/* Date & Start Time */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Date <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="date"
                            required
                            value={form.date}
                            onChange={(e) => set('date', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                        />
                        {errors.date && (
                            <p className="mt-1 text-xs text-rose-600">{errors.date}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Start Time
                        </label>
                        <input
                            type="time"
                            value={form.start_time}
                            onChange={(e) => set('start_time', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                        />
                    </div>
                </div>

                {/* Location */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Location / Venue
                    </label>
                    <input
                        type="text"
                        value={form.location}
                        onChange={(e) => set('location', e.target.value)}
                        placeholder="e.g. Main Sanctuary, EKA MKC"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                    />
                </div>

                {/* Status */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Status
                    </label>
                    <select
                        value={form.status}
                        onChange={(e) => set('status', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                    >
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="postponed">Postponed</option>
                    </select>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Description
                    </label>
                    <textarea
                        rows={3}
                        value={form.description}
                        onChange={(e) => set('description', e.target.value)}
                        placeholder="Brief description of the performance…"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none resize-none"
                    />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                    <Button variant="outline" size="sm" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit" loading={saving}>
                        {isEdit ? 'Save Changes' : 'Create Performance'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

/* ─────────────────────── Detail Drawer ─────────────────────── */

function PerformanceDetail({ performance, onBack, onEdit, onDelete }) {
    if (!performance) return null;
    const upcoming = isUpcoming(performance.date);

    return (
        <div className="space-y-6">
            {/* Back */}
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
                <ArrowLeft size={16} /> Back to Performances
            </button>

            {/* Hero card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div
                    className={`h-2 ${
                        upcoming
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                            : 'bg-gradient-to-r from-slate-300 to-slate-400'
                    }`}
                />
                <div className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <StatusBadge status={performance.status} />
                                {upcoming && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                                        <Sparkles size={10} /> Upcoming
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl font-black text-slate-900">{performance.title}</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => onEdit(performance)}>
                                <Pencil size={14} /> Edit
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => onDelete(performance)}>
                                <Trash2 size={14} /> Delete
                            </Button>
                        </div>
                    </div>

                    {/* Grid of details */}
                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                                Date
                            </p>
                            <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                <Calendar size={14} className="text-blue-400" />
                                {formatDate(performance.date)}
                            </p>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                                Start Time
                            </p>
                            <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                <Clock size={14} className="text-blue-400" />
                                {performance.start_time ? formatTime(performance.start_time) : '—'}
                            </p>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                                Location
                            </p>
                            <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                <MapPin size={14} className="text-blue-400" />
                                {performance.location || '—'}
                            </p>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                                Choir
                            </p>
                            <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                <Music2 size={14} className="text-blue-400" />
                                {performance.choir?.name || '—'}
                            </p>
                        </div>
                    </div>

                    {/* Team / leader */}
                    {performance.choir?.team_leader?.name && (
                        <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                            <Users size={14} className="text-blue-400 shrink-0" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Team Leader
                                </p>
                                <p className="text-sm font-bold text-slate-800">
                                    {performance.choir.team_leader.name}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {performance.description && (
                        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                                Description
                            </p>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {performance.description}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────── Main Page ─────────────────────── */

export default function AdminPerformancesPage() {
    const [choirs, setChoirs] = useState([]);
    const [selectedChoirId, setSelectedChoirId] = useState('');
    const [performances, setPerformances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('upcoming'); // 'upcoming' | 'past' | 'all'

    // Modals / Detail view
    const [formModal, setFormModal] = useState({ open: false, performance: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, performance: null });
    const [deleting, setDeleting] = useState(false);
    const [detailPerf, setDetailPerf] = useState(null);

    const [toast, setToast] = useState(null);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    // Fetch choirs
    useEffect(() => {
        api.get('/public/choirs?per_page=100')
            .then((res) => {
                const items = res.data?.data?.items || res.data?.data || [];
                setChoirs(items);
                if (items.length > 0) setSelectedChoirId(items[0].id.toString());
            })
            .catch(() => setError('Failed to load choirs.'));
    }, []);

    // Fetch performances for selected choir
    const fetchPerformances = useCallback(async () => {
        if (!selectedChoirId) return;
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/choirs/${selectedChoirId}/performances?per_page=200`);
            const items = res.data?.data?.items || res.data?.data || [];
            setPerformances(Array.isArray(items) ? items : []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load performances.');
        } finally {
            setLoading(false);
        }
    }, [selectedChoirId]);

    useEffect(() => {
        fetchPerformances();
    }, [fetchPerformances]);

    // Delete
    const handleDelete = async () => {
        const perf = deleteModal.performance;
        if (!perf) return;
        const choirId = perf.choir_id || perf.choir?.id || selectedChoirId;
        setDeleting(true);
        try {
            await api.delete(`/choirs/${choirId}/performances/${perf.id}`);
            setDeleteModal({ open: false, performance: null });
            setDetailPerf(null);
            showToast('success', `"${perf.title}" deleted successfully.`);
            fetchPerformances();
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to delete performance.');
        } finally {
            setDeleting(false);
        }
    };

    // Derived lists
    const choirName = choirs.find((c) => c.id.toString() === selectedChoirId)?.name || 'Choir';

    const filtered = performances.filter((p) => {
        const matchSearch =
            !search.trim() ||
            p.title?.toLowerCase().includes(search.toLowerCase()) ||
            p.location?.toLowerCase().includes(search.toLowerCase());
        const matchTab =
            tab === 'all'
                ? true
                : tab === 'upcoming'
                ? isUpcoming(p.date)
                : !isUpcoming(p.date);
        return matchSearch && matchTab;
    });

    const upcomingCount = performances.filter((p) => isUpcoming(p.date)).length;
    const pastCount = performances.filter((p) => !isUpcoming(p.date)).length;

    // ── If viewing detail ──
    if (detailPerf) {
        return (
            <div className="space-y-6 pb-12">
                <PerformanceDetail
                    performance={detailPerf}
                    onBack={() => setDetailPerf(null)}
                    onEdit={(perf) => setFormModal({ open: true, performance: perf })}
                    onDelete={(perf) => setDeleteModal({ open: true, performance: perf })}
                />
                {/* Form modal still works from detail view */}
                <PerformanceFormModal
                    open={formModal.open}
                    onClose={() => setFormModal({ open: false, performance: null })}
                    onSaved={() => {
                        setFormModal({ open: false, performance: null });
                        showToast('success', 'Performance saved successfully.');
                        fetchPerformances();
                        setDetailPerf(null);
                    }}
                    initial={formModal.performance}
                    choirs={choirs}
                />
                <Modal
                    open={deleteModal.open}
                    onClose={() => setDeleteModal({ open: false, performance: null })}
                    title="Delete Performance"
                    size="md"
                >
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                                <AlertTriangle size={20} />
                            </div>
                            <p className="text-sm text-slate-600">
                                Are you sure you want to delete{' '}
                                <strong>"{deleteModal.performance?.title}"</strong>? This action
                                cannot be undone and will remove all associated attendance records.
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteModal({ open: false, performance: null })}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={handleDelete}
                                loading={deleting}
                            >
                                Delete Performance
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }

    // ── Main list view ──
    return (
        <div className="space-y-6 pb-12">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
                            <CalendarDays size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                Performances
                            </h1>
                            <p className="text-sm text-slate-500">
                                Manage choir events, concerts, and worship performances
                            </p>
                        </div>
                    </div>
                </div>
                <Button
                    variant="primary"
                    size="md"
                    onClick={() => setFormModal({ open: true, performance: null })}
                >
                    <Plus size={16} /> New Performance
                </Button>
            </div>

            {/* Toast */}
            {toast && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <Alert variant={toast.type === 'error' ? 'error' : 'success'}>
                        {toast.message}
                    </Alert>
                </div>
            )}

            {error && <Alert variant="error">{error}</Alert>}

            {/* Controls: Choir picker + search + refresh */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
                <div className="flex-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Choir / Ministry Team
                    </label>
                    <select
                        value={selectedChoirId}
                        onChange={(e) => {
                            setSelectedChoirId(e.target.value);
                            setDetailPerf(null);
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
                    >
                        {choirs.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Search
                    </label>
                    <div className="relative">
                        <Search
                            size={15}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            placeholder="Search by title or location…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex items-end">
                    <button
                        onClick={fetchPerformances}
                        disabled={loading}
                        title="Refresh"
                        className="rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/80 w-fit">
                {[
                    { key: 'upcoming', label: `Upcoming (${upcomingCount})`, icon: Sparkles },
                    { key: 'past', label: `Past (${pastCount})`, icon: CalendarClock },
                    { key: 'all', label: `All (${performances.length})`, icon: Calendar },
                ].map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                            tab === key
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Icon size={13} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white">
                    <LoadingSpinner size={32} className="text-indigo-600" />
                    <p className="mt-3 text-sm font-semibold text-slate-500">
                        Loading performances…
                    </p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                    <CalendarDays size={40} className="text-slate-300" />
                    <h3 className="mt-3 text-base font-bold text-slate-700">
                        No performances found
                    </h3>
                    <p className="mt-1 text-xs text-slate-400 max-w-xs">
                        {search
                            ? 'Try a different search term.'
                            : tab === 'upcoming'
                            ? `No upcoming performances scheduled for ${choirName}.`
                            : tab === 'past'
                            ? `No past performances recorded for ${choirName}.`
                            : `No performances found for ${choirName}.`}
                    </p>
                    {!search && (
                        <Button
                            variant="primary"
                            size="sm"
                            className="mt-5"
                            onClick={() => setFormModal({ open: true, performance: null })}
                        >
                            <Plus size={14} /> Create Performance
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((perf) => (
                        <PerformanceCard
                            key={perf.id}
                            performance={perf}
                            onEdit={(p) => setFormModal({ open: true, performance: p })}
                            onDelete={(p) => setDeleteModal({ open: true, performance: p })}
                            onView={(p) => setDetailPerf(p)}
                        />
                    ))}
                </div>
            )}

            {/* Performance Form Modal */}
            <PerformanceFormModal
                open={formModal.open}
                onClose={() => setFormModal({ open: false, performance: null })}
                onSaved={() => {
                    setFormModal({ open: false, performance: null });
                    showToast('success', 'Performance saved successfully.');
                    fetchPerformances();
                }}
                initial={formModal.performance}
                choirs={choirs}
            />

            {/* Delete Confirmation Modal */}
            <Modal
                open={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, performance: null })}
                title="Delete Performance"
                size="md"
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                            <AlertTriangle size={20} />
                        </div>
                        <p className="text-sm text-slate-600">
                            Are you sure you want to delete{' '}
                            <strong>"{deleteModal.performance?.title}"</strong>? This action cannot
                            be undone and will remove all associated attendance records.
                        </p>
                    </div>
                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteModal({ open: false, performance: null })}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleDelete}
                            loading={deleting}
                        >
                            Delete Performance
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
