import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    CalendarClock,
    Calendar,
    Clock,
    MapPin,
    Plus,
    Pencil,
    Trash2,
    CheckCircle2,
    Search,
    RefreshCw,
    Music2,
    Users,
    ArrowLeft,
    AlertTriangle,
    Sparkles,
    Eye,
    FileText,
    Check,
    X,
    Filter,
} from 'lucide-react';
import { api } from '../../axios';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Input from '../../components/ui/Input';

/* ─────────────────────── Date & Time Helpers ─────────────────────── */

function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const [y, m, d] = dateStr.split('-');
        if (!y || !m || !d) return dateStr;
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

/**
 * Determine dynamic rehearsal status:
 * - 'completed' if marked completed or in past
 * - 'ongoing' if today and current time is around rehearsal time
 * - 'upcoming' if scheduled in future or today before start time
 * - 'cancelled' if explicitly cancelled
 */
function getRehearsalStatus(rehearsal) {
    if (!rehearsal) return 'upcoming';
    if (rehearsal.status === 'cancelled') return 'cancelled';
    if (rehearsal.status === 'completed') return 'completed';

    if (!rehearsal.date) return 'upcoming';

    try {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const rehDateStr = typeof rehearsal.date === 'string' ? rehearsal.date.split('T')[0] : '';

        if (!rehDateStr) return 'upcoming';

        if (rehDateStr < todayStr) {
            return 'completed';
        }

        if (rehDateStr === todayStr) {
            if (!rehearsal.start_time) return 'ongoing';

            const currentMinutes = today.getHours() * 60 + today.getMinutes();
            const [startH, startM] = rehearsal.start_time.split(':').map((n) => parseInt(n, 10));
            const startMinutes = (startH || 0) * 60 + (startM || 0);

            let endMinutes = startMinutes + 120; // Default 2 hours
            if (rehearsal.end_time) {
                const [endH, endM] = rehearsal.end_time.split(':').map((n) => parseInt(n, 10));
                endMinutes = (endH || 0) * 60 + (endM || 0);
            }

            if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
                return 'ongoing';
            }
            if (currentMinutes < startMinutes) {
                return 'upcoming';
            }
            return 'completed';
        }

        return 'upcoming';
    } catch {
        return 'upcoming';
    }
}

const STATUS_MAP = {
    upcoming: {
        label: 'Upcoming',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
        bar: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    },
    ongoing: {
        label: 'Ongoing',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse',
        dot: 'bg-emerald-500',
        bar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    },
    completed: {
        label: 'Completed',
        bg: 'bg-slate-50 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
        bar: 'bg-gradient-to-r from-slate-300 to-slate-400',
    },
    cancelled: {
        label: 'Cancelled',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        bar: 'bg-gradient-to-r from-rose-400 to-rose-500',
    },
};

function StatusBadge({ status }) {
    const config = STATUS_MAP[status] || STATUS_MAP.upcoming;
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${config.bg}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
            {config.label}
        </span>
    );
}

const EMPTY_FORM = {
    title: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    description: '',
    notes: '',
    status: 'scheduled',
};

/* ─────────────────────── Rehearsal Card ─────────────────────── */

function RehearsalCard({ rehearsal, onEdit, onDelete, onView, onTakeAttendance, canManage }) {
    const effectiveStatus = getRehearsalStatus(rehearsal);
    const config = STATUS_MAP[effectiveStatus] || STATUS_MAP.upcoming;
    const isOngoing = effectiveStatus === 'ongoing';
    const isUpcoming = effectiveStatus === 'upcoming';

    return (
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            {/* Top color bar */}
            <div className={`h-1.5 w-full ${config.bar}`} />

            <div className="flex flex-1 flex-col p-5">
                {/* Header info */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <StatusBadge status={effectiveStatus} />
                            {isOngoing && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800">
                                    <Sparkles size={10} /> Active Now
                                </span>
                            )}
                            {isUpcoming && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700">
                                    Scheduled
                                </span>
                            )}
                        </div>
                        <h3
                            onClick={() => onView(rehearsal)}
                            className="cursor-pointer text-base font-bold text-slate-900 transition-colors hover:text-blue-700 line-clamp-1"
                            title={rehearsal.title}
                        >
                            {rehearsal.title}
                        </h3>
                    </div>

                    {/* Action buttons on card hover */}
                    {canManage && (
                        <div className="flex shrink-0 items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                                type="button"
                                onClick={() => onEdit(rehearsal)}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                title="Edit rehearsal"
                            >
                                <Pencil size={15} />
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(rehearsal)}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                title="Delete rehearsal"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Details grid */}
                <div className="mt-3.5 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-blue-500 shrink-0" />
                        <span className="font-semibold text-slate-800">{formatDate(rehearsal.date)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-blue-500 shrink-0" />
                        <span>
                            {rehearsal.start_time ? formatTime(rehearsal.start_time) : 'Time not set'}
                            {rehearsal.end_time ? ` – ${formatTime(rehearsal.end_time)}` : ''}
                        </span>
                    </div>

                    {rehearsal.location && (
                        <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-blue-500 shrink-0" />
                            <span className="truncate">{rehearsal.location}</span>
                        </div>
                    )}

                    {rehearsal.choir?.name && (
                        <div className="flex items-center gap-2">
                            <Music2 size={14} className="text-blue-500 shrink-0" />
                            <span className="font-medium text-blue-700 truncate">{rehearsal.choir.name}</span>
                        </div>
                    )}
                </div>

                {/* Notes snippet */}
                {(rehearsal.description || rehearsal.notes) && (
                    <p className="mt-3 line-clamp-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-500 border border-slate-100">
                        {rehearsal.description || rehearsal.notes}
                    </p>
                )}
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/70 p-3">
                <button
                    type="button"
                    onClick={() => onView(rehearsal)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                    <Eye size={13} />
                    <span>View</span>
                </button>

                <button
                    type="button"
                    onClick={() => onTakeAttendance(rehearsal)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-700 py-2 text-xs font-bold text-white shadow-sm shadow-blue-700/20 transition hover:bg-blue-800"
                >
                    <CheckCircle2 size={13} />
                    <span>Take Attendance</span>
                </button>
            </div>
        </div>
    );
}

/* ─────────────────────── Form Modal (Create / Edit) ─────────────────────── */

function RehearsalFormModal({ open, onClose, onSaved, initial, choirs, defaultChoirId }) {
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
                    date: initial.date ? initial.date.split('T')[0] : '',
                    start_time: initial.start_time || '',
                    end_time: initial.end_time || '',
                    location: initial.location || '',
                    description: initial.description || initial.notes || '',
                    notes: initial.notes || initial.description || '',
                    status: initial.status || 'scheduled',
                });
                setChoirId(initial.choir_id?.toString() || initial.choir?.id?.toString() || defaultChoirId || '');
            } else {
                setForm(EMPTY_FORM);
                setChoirId(defaultChoirId || choirs[0]?.id?.toString() || '');
            }
            setErrors({});
        }
    }, [open, initial, choirs, defaultChoirId]);

    const set = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!choirId) {
            setErrors({ choir_id: 'Please select a choir.' });
            return;
        }
        if (!form.title.trim()) {
            setErrors({ title: 'Rehearsal title is required.' });
            return;
        }
        if (!form.date) {
            setErrors({ date: 'Date is required.' });
            return;
        }

        setSaving(true);
        setErrors({});

        const payload = {
            title: form.title.trim(),
            date: form.date,
            start_time: form.start_time || null,
            end_time: form.end_time || null,
            location: form.location?.trim() || null,
            description: form.description?.trim() || form.notes?.trim() || null,
            notes: form.notes?.trim() || form.description?.trim() || null,
            status: form.status || 'scheduled',
        };

        try {
            if (isEdit) {
                const targetChoirId = initial.choir_id || initial.choir?.id || choirId;
                await api.put(`/choirs/${targetChoirId}/rehearsals/${initial.id}`, payload);
            } else {
                await api.post(`/choirs/${choirId}/rehearsals`, payload);
            }
            onSaved();
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) {
                setErrors(data.errors);
            } else {
                setErrors({ general: data?.message || 'Failed to save rehearsal.' });
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={isEdit ? 'Edit Rehearsal' : 'Create New Rehearsal'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {errors.general && <Alert variant="error">{errors.general}</Alert>}

                {/* Choir Selection */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Choir / Ministry Team <span className="text-rose-500">*</span>
                    </label>
                    <select
                        value={choirId}
                        onChange={(e) => setChoirId(e.target.value)}
                        disabled={isEdit || choirs.length <= 1}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none disabled:bg-slate-100"
                    >
                        <option value="">Select a choir</option>
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Rehearsal Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={form.title}
                        onChange={(e) => set('title', e.target.value)}
                        placeholder="e.g. Weekly Harmony & Vocal Sectional"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                    />
                    {errors.title && (
                        <p className="mt-1 text-xs text-rose-600">
                            {Array.isArray(errors.title) ? errors.title[0] : errors.title}
                        </p>
                    )}
                </div>

                {/* Date & Status */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Date <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={form.date}
                            onChange={(e) => set('date', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                        />
                        {errors.date && (
                            <p className="mt-1 text-xs text-rose-600">
                                {Array.isArray(errors.date) ? errors.date[0] : errors.date}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Status
                        </label>
                        <select
                            value={form.status}
                            onChange={(e) => set('status', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                        >
                            <option value="scheduled">Scheduled / Upcoming</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Start & End Time */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Start Time
                        </label>
                        <input
                            type="time"
                            value={form.start_time}
                            onChange={(e) => set('start_time', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            End Time
                        </label>
                        <input
                            type="time"
                            value={form.end_time}
                            onChange={(e) => set('end_time', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Location */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Location / Room
                    </label>
                    <input
                        type="text"
                        value={form.location}
                        onChange={(e) => set('location', e.target.value)}
                        placeholder="e.g. Main Church Sanctuary, Room 204"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                    />
                </div>

                {/* Notes / Description */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Notes & Agenda
                    </label>
                    <textarea
                        rows={3}
                        value={form.description}
                        onChange={(e) => {
                            set('description', e.target.value);
                            set('notes', e.target.value);
                        }}
                        placeholder="Songs to practice, voice sectional focus, preparation instructions..."
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                    />
                </div>

                {/* Submit actions */}
                <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" loading={saving}>
                        {isEdit ? 'Save Changes' : 'Create Rehearsal'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

/* ─────────────────────── Rehearsal Detail Modal ─────────────────────── */

function RehearsalDetailModal({ rehearsal, open, onClose, onEdit, onDelete, onTakeAttendance, canManage }) {
    if (!rehearsal) return null;
    const effectiveStatus = getRehearsalStatus(rehearsal);

    return (
        <Modal open={open} onClose={onClose} title="Rehearsal Details" size="lg">
            <div className="space-y-6">
                {/* Header banner */}
                <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <StatusBadge status={effectiveStatus} />
                        {rehearsal.choir?.name && (
                            <span className="rounded-full bg-blue-900/60 px-3 py-0.5 text-xs font-semibold text-blue-300 border border-blue-500/30">
                                {rehearsal.choir.name}
                            </span>
                        )}
                    </div>
                    <h2 className="text-2xl font-black text-white">{rehearsal.title}</h2>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Date</span>
                        <p className="mt-1 text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <Calendar size={15} className="text-blue-600" />
                            {formatDate(rehearsal.date)}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Time</span>
                        <p className="mt-1 text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <Clock size={15} className="text-blue-600" />
                            {rehearsal.start_time ? formatTime(rehearsal.start_time) : 'Not specified'}
                            {rehearsal.end_time ? ` – ${formatTime(rehearsal.end_time)}` : ''}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Location</span>
                        <p className="mt-1 text-sm font-bold text-slate-900 flex items-center gap-1.5 truncate">
                            <MapPin size={15} className="text-blue-600 shrink-0" />
                            {rehearsal.location || 'Church sanctuary'}
                        </p>
                    </div>
                </div>

                {/* Notes & Description */}
                {(rehearsal.description || rehearsal.notes) && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                            <FileText size={14} className="text-blue-600" /> Notes & Preparation
                        </h4>
                        <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                            {rehearsal.description || rehearsal.notes}
                        </p>
                    </div>
                )}

                {/* Actions Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2">
                        {canManage && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        onClose();
                                        onEdit(rehearsal);
                                    }}
                                >
                                    <Pencil size={14} /> Edit
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => {
                                        onClose();
                                        onDelete(rehearsal);
                                    }}
                                >
                                    <Trash2 size={14} /> Delete
                                </Button>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={onClose}>
                            Close
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                                onClose();
                                onTakeAttendance(rehearsal);
                            }}
                        >
                            <CheckCircle2 size={15} /> Take Attendance
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

/* ─────────────────────── MAIN PAGE COMPONENT ─────────────────────── */

export default function AdminRehearsalsPage() {
    const navigate = useNavigate();
    const { user, role, primaryChoir, can } = useAuth();
    const isAdmin = role === 'admin' || role === 'super-admin';
    const isTeamLeader = role === 'team_leader';
    const canManage = isAdmin || isTeamLeader || can('rehearsals.manage');

    // Choirs and selection
    const [choirs, setChoirs] = useState([]);
    const [selectedChoirId, setSelectedChoirId] = useState('all'); // 'all' or choirId

    // Rehearsals data
    const [rehearsals, setRehearsals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('all'); // 'all' | 'upcoming' | 'ongoing' | 'completed'

    // Modals
    const [formModal, setFormModal] = useState({ open: false, rehearsal: null });
    const [detailModal, setDetailModal] = useState({ open: false, rehearsal: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, rehearsal: null });
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    // 1. Fetch choirs accessible to user
    useEffect(() => {
        const fetchChoirList = async () => {
            try {
                const res = await api.get('/public/choirs?per_page=100');
                const items = res.data?.data?.items || res.data?.data || [];
                setChoirs(items);

                if (isAdmin) {
                    setSelectedChoirId('all');
                } else if (primaryChoir?.id) {
                    setSelectedChoirId(primaryChoir.id.toString());
                } else if (items.length > 0) {
                    setSelectedChoirId(items[0].id.toString());
                }
            } catch {
                setError('Failed to load choirs.');
            }
        };

        fetchChoirList();
    }, [isAdmin, primaryChoir]);

    // 2. Fetch rehearsals for selected choir (or all choirs)
    const fetchRehearsals = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            if (selectedChoirId === 'all') {
                if (choirs.length === 0) {
                    setRehearsals([]);
                    setLoading(false);
                    return;
                }

                // Fetch rehearsals for all accessible choirs in parallel
                const promises = choirs.map((c) =>
                    api
                        .get(`/choirs/${c.id}/rehearsals?per_page=100`)
                        .then((res) => {
                            const items = res.data?.data?.items || res.data?.data || [];
                            return (Array.isArray(items) ? items : []).map((r) => ({
                                ...r,
                                choir: r.choir || { id: c.id, name: c.name },
                            }));
                        })
                        .catch(() => [])
                );

                const results = await Promise.all(promises);
                const combined = results.flat();
                // Sort by date desc, start_time desc
                combined.sort((a, b) => {
                    const dateDiff = new Date(b.date || 0) - new Date(a.date || 0);
                    if (dateDiff !== 0) return dateDiff;
                    return (b.start_time || '').localeCompare(a.start_time || '');
                });
                setRehearsals(combined);
            } else {
                const res = await api.get(`/choirs/${selectedChoirId}/rehearsals?per_page=200`);
                const items = res.data?.data?.items || res.data?.data || [];
                const choirObj = choirs.find((c) => c.id.toString() === selectedChoirId);
                const enriched = (Array.isArray(items) ? items : []).map((r) => ({
                    ...r,
                    choir: r.choir || (choirObj ? { id: choirObj.id, name: choirObj.name } : null),
                }));
                setRehearsals(enriched);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load rehearsals.');
        } finally {
            setLoading(false);
        }
    }, [selectedChoirId, choirs]);

    useEffect(() => {
        if (choirs.length > 0) {
            fetchRehearsals();
        }
    }, [fetchRehearsals, choirs.length]);

    // 3. Delete rehearsal
    const handleDelete = async () => {
        const reh = deleteModal.rehearsal;
        if (!reh) return;

        const choirId = reh.choir_id || reh.choir?.id || (selectedChoirId !== 'all' ? selectedChoirId : null);
        if (!choirId) return;

        setDeleting(true);
        try {
            await api.delete(`/choirs/${choirId}/rehearsals/${reh.id}`);
            setDeleteModal({ open: false, rehearsal: null });
            if (detailModal.rehearsal?.id === reh.id) {
                setDetailModal({ open: false, rehearsal: null });
            }
            showToast('success', `"${reh.title}" deleted successfully.`);
            fetchRehearsals();
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to delete rehearsal.');
        } finally {
            setDeleting(false);
        }
    };

    // 4. Handle Take Attendance -> navigate directly to Attendance page
    const handleTakeAttendance = (rehearsal) => {
        const choirId = rehearsal.choir_id || rehearsal.choir?.id || (selectedChoirId !== 'all' ? selectedChoirId : '');
        const basePath = isAdmin ? '/admin' : isTeamLeader ? '/team-leader' : '/member';
        navigate(`${basePath}/attendance?choir_id=${choirId}&rehearsal_id=${rehearsal.id}&date=${rehearsal.date || ''}`, {
            state: {
                choirId,
                rehearsalId: rehearsal.id,
                date: rehearsal.date,
            },
        });
    };

    // Filter rehearsals based on search & active tab
    const filteredRehearsals = useMemo(() => {
        return rehearsals.filter((r) => {
            const matchesSearch =
                !search.trim() ||
                r.title?.toLowerCase().includes(search.toLowerCase()) ||
                r.location?.toLowerCase().includes(search.toLowerCase()) ||
                r.description?.toLowerCase().includes(search.toLowerCase()) ||
                r.choir?.name?.toLowerCase().includes(search.toLowerCase());

            const effectiveStatus = getRehearsalStatus(r);

            let matchesTab = true;
            if (tab === 'upcoming') matchesTab = effectiveStatus === 'upcoming';
            else if (tab === 'ongoing') matchesTab = effectiveStatus === 'ongoing';
            else if (tab === 'completed') matchesTab = effectiveStatus === 'completed';

            return matchesSearch && matchesTab;
        });
    }, [rehearsals, search, tab]);

    // Counts for tabs
    const counts = useMemo(() => {
        let upcoming = 0;
        let ongoing = 0;
        let completed = 0;

        rehearsals.forEach((r) => {
            const s = getRehearsalStatus(r);
            if (s === 'upcoming') upcoming++;
            else if (s === 'ongoing') ongoing++;
            else if (s === 'completed') completed++;
        });

        return {
            all: rehearsals.length,
            upcoming,
            ongoing,
            completed,
        };
    }, [rehearsals]);

    return (
        <div className="space-y-6 pb-14">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-lg shadow-blue-700/20">
                        <CalendarClock size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">Rehearsals</h1>
                        <p className="text-sm text-slate-500">
                            Schedule, coordinate, and track choir rehearsals and attendance
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={fetchRehearsals}
                        disabled={loading}
                        className="rounded-xl border-slate-200"
                        title="Refresh rehearsals"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </Button>

                    {canManage && (
                        <Button
                            type="button"
                            variant="primary"
                            onClick={() => setFormModal({ open: true, rehearsal: null })}
                            className="rounded-xl shadow-md shadow-blue-700/20"
                        >
                            <Plus size={16} />
                            <span>Create Rehearsal</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Toast Alert */}
            {toast && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <Alert variant={toast.type === 'error' ? 'error' : 'success'}>
                        {toast.message}
                    </Alert>
                </div>
            )}

            {error && <Alert variant="error">{error}</Alert>}

            {/* Filter & Controls Bar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                {/* Choir Selector */}
                <div className="flex items-center gap-2 sm:w-72">
                    <Music2 size={16} className="text-blue-600 shrink-0 hidden sm:block" />
                    <select
                        value={selectedChoirId}
                        onChange={(e) => setSelectedChoirId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                    >
                        {isAdmin && <option value="all">🎶 All Choirs ({choirs.length})</option>}
                        {choirs.map((c) => (
                            <option key={c.id} value={c.id.toString()}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/80 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setTab('all')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                            tab === 'all'
                                ? 'bg-white text-blue-700 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        All ({counts.all})
                    </button>

                    <button
                        type="button"
                        onClick={() => setTab('upcoming')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                            tab === 'upcoming'
                                ? 'bg-white text-blue-700 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Upcoming ({counts.upcoming})
                    </button>

                    <button
                        type="button"
                        onClick={() => setTab('ongoing')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                            tab === 'ongoing'
                                ? 'bg-white text-emerald-700 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Ongoing ({counts.ongoing})
                    </button>

                    <button
                        type="button"
                        onClick={() => setTab('completed')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                            tab === 'completed'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Completed ({counts.completed})
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative sm:w-64">
                    <Search
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search rehearsals..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                    />
                </div>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3">
                    <LoadingSpinner size={32} />
                    <p className="text-xs font-medium text-slate-500">Loading rehearsals...</p>
                </div>
            ) : filteredRehearsals.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4">
                        <CalendarClock size={28} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">No rehearsals found</h3>
                    <p className="mt-1 max-w-sm text-xs text-slate-500">
                        {search
                            ? `No rehearsals matched your search "${search}".`
                            : tab !== 'all'
                            ? `No ${tab} rehearsals found for this selection.`
                            : 'No rehearsals have been scheduled yet.'}
                    </p>
                    {canManage && (
                        <Button
                            variant="primary"
                            size="sm"
                            className="mt-5 rounded-xl"
                            onClick={() => setFormModal({ open: true, rehearsal: null })}
                        >
                            <Plus size={15} /> Create Rehearsal
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredRehearsals.map((reh) => (
                        <RehearsalCard
                            key={reh.id}
                            rehearsal={reh}
                            onEdit={(r) => setFormModal({ open: true, rehearsal: r })}
                            onDelete={(r) => setDeleteModal({ open: true, rehearsal: r })}
                            onView={(r) => setDetailModal({ open: true, rehearsal: r })}
                            onTakeAttendance={handleTakeAttendance}
                            canManage={canManage}
                        />
                    ))}
                </div>
            )}

            {/* Create / Edit Form Modal */}
            <RehearsalFormModal
                open={formModal.open}
                onClose={() => setFormModal({ open: false, rehearsal: null })}
                onSaved={() => {
                    setFormModal({ open: false, rehearsal: null });
                    showToast('success', 'Rehearsal saved successfully.');
                    fetchRehearsals();
                }}
                initial={formModal.rehearsal}
                choirs={choirs}
                defaultChoirId={selectedChoirId !== 'all' ? selectedChoirId : choirs[0]?.id?.toString()}
            />

            {/* Detailed View Modal */}
            <RehearsalDetailModal
                open={detailModal.open}
                onClose={() => setDetailModal({ open: false, rehearsal: null })}
                rehearsal={detailModal.rehearsal}
                onEdit={(r) => setFormModal({ open: true, rehearsal: r })}
                onDelete={(r) => setDeleteModal({ open: true, rehearsal: r })}
                onTakeAttendance={handleTakeAttendance}
                canManage={canManage}
            />

            {/* Delete Confirmation Modal */}
            <Modal
                open={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, rehearsal: null })}
                title="Delete Rehearsal"
                size="md"
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-700">
                                Are you sure you want to delete{' '}
                                <strong className="font-bold text-slate-900">
                                    "{deleteModal.rehearsal?.title}"
                                </strong>
                                ?
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                This action cannot be undone and will remove associated attendance records.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteModal({ open: false, rehearsal: null })}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            loading={deleting}
                            onClick={handleDelete}
                        >
                            Delete Rehearsal
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
