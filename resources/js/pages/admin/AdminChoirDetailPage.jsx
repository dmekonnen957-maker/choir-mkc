import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    ArrowLeft, Pencil, Users, Music2, CalendarDays, User, Trash2, Power, Loader2, Building2,
} from 'lucide-react';
import { api } from '../../axios';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import ChoirFormModal from '../../components/admin/ChoirFormModal';
import ChoirDeleteModal from '../../components/admin/ChoirDeleteModal';

function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminChoirDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { can } = useAuth();
    const [choir, setChoir] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [busy, setBusy] = useState(false);

    // Modal States
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        setError('');
        api.get(`/admin/choirs/${id}`)
            .then((res) => setChoir(res.data.data))
            .catch(() => setError('Failed to load choir.'))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const toggleStatus = () => {
        if (!choir) return;
        setBusy(true);
        setActionError('');
        const next = choir.status === 'active' ? 'inactive' : 'active';
        api.put(`/admin/choirs/${id}`, { ...choir, status: next })
            .then(() => load())
            .catch((err) => setActionError(err.response?.data?.message || 'Failed to update status.'))
            .finally(() => setBusy(false));
    };

    if (loading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <LoadingSpinner text="Loading choir..." />
            </div>
        );
    }

    if (error || !choir) {
        return (
            <div className="space-y-4">
                <button onClick={() => navigate('/admin/choirs')} className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700">
                    <ArrowLeft size={16} /> Back to choirs
                </button>
                <Alert variant="error">{error || 'Choir not found.'}</Alert>
            </div>
        );
    }

    const members = choir.members || [];
    const upcoming = choir.upcoming_performances || [];
    const history = choir.performance_history || [];

    return (
        <div className="space-y-6">
            <button onClick={() => navigate('/admin/choirs')} className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
                <ArrowLeft size={16} /> Back to choirs
            </button>

            {actionError && <Alert variant="error">{actionError}</Alert>}

            <Card>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                        {choir.logo_path ? (
                            <img
                                src={choir.logo_path}
                                alt={choir.name}
                                className="h-14 w-14 rounded-2xl object-cover"
                            />
                        ) : (
                            <div
                                className="flex h-14 w-14 items-center justify-center rounded-2xl font-bold shadow-sm"
                                style={{
                                    backgroundColor: choir.uniform_primary_color || '#2563eb',
                                    color: choir.uniform_secondary_color || '#ffffff',
                                }}
                            >
                                <Building2 size={26} />
                            </div>
                        )}

                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{choir.name}</h1>
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                    choir.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {choir.status}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">{choir.church_name || choir.slug}</p>
                            {choir.description && (
                                <p className="mt-2 max-w-xl text-sm text-slate-600 leading-relaxed">{choir.description}</p>
                            )}
                            <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-slate-700">
                                <User size={14} className="text-blue-600" /> {choir.team_leader?.name || 'No team leader assigned'}
                            </p>

                            {/* Color preview */}
                            {(choir.uniform_primary_color || choir.uniform_secondary_color) && (
                                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                                    <span className="font-bold text-slate-700">Uniform:</span>
                                    {choir.uniform_primary_color && (
                                        <span className="inline-flex items-center gap-1">
                                            <span className="h-3.5 w-3.5 rounded-full border border-slate-300 shadow-xs" style={{ backgroundColor: choir.uniform_primary_color }} />
                                            <span className="font-mono">{choir.uniform_primary_color}</span>
                                        </span>
                                    )}
                                    {choir.uniform_secondary_color && (
                                        <span className="inline-flex items-center gap-1">
                                            <span className="h-3.5 w-3.5 rounded-full border border-slate-300 shadow-xs" style={{ backgroundColor: choir.uniform_secondary_color }} />
                                            <span className="font-mono">{choir.uniform_secondary_color}</span>
                                        </span>
                                    )}
                                    {choir.uniform_pattern && (
                                        <span className="font-semibold text-slate-700">({choir.uniform_pattern})</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => setEditModalOpen(true)}>
                            <Pencil size={15} className="mr-1" /> Edit
                        </Button>
                        {can('choirs.update') && (
                            <Button variant="outline" onClick={toggleStatus} disabled={busy}>
                                {busy ? <Loader2 size={15} className="mr-1 animate-spin" /> : <Power size={15} className="mr-1" />}
                                {choir.status === 'active' ? 'Deactivate' : 'Activate'}
                            </Button>
                        )}
                        {can('choirs.delete') && (
                            <Button variant="danger" onClick={() => setDeleteModalOpen(true)} disabled={busy}>
                                <Trash2 size={15} className="mr-1" /> Delete
                            </Button>
                        )}
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5 text-center">
                    <div>
                        <p className="text-xl font-bold text-slate-900">{choir.member_count ?? 0}</p>
                        <p className="text-xs text-slate-500 font-medium">Members</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold text-slate-900">{choir.songs_count ?? 0}</p>
                        <p className="text-xs text-slate-500 font-medium">Songs</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold text-slate-900">{choir.performances_count ?? 0}</p>
                        <p className="text-xs text-slate-500 font-medium">Performances</p>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <Users size={18} className="text-blue-600" /> Members ({members.length})
                    </h2>
                    {members.length === 0 ? (
                        <p className="py-6 text-center text-sm text-slate-400">No members assigned yet.</p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {members.map((m) => (
                                <li key={m.id} className="flex items-center justify-between py-2.5">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{m.name}</p>
                                        <p className="text-xs text-slate-400">
                                            {m.role || m.email || ''}
                                        </p>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-500">{m.status}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <div className="space-y-6">
                    <Card>
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                            <CalendarDays size={18} className="text-emerald-600" /> Upcoming Performances
                        </h2>
                        {upcoming.length === 0 ? (
                            <p className="py-6 text-center text-sm text-slate-400">None scheduled.</p>
                        ) : (
                            <ul className="space-y-3">
                                {upcoming.map((p) => (
                                    <li key={p.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                        <p className="text-sm font-bold text-slate-900">{p.title}</p>
                                        <p className="text-xs text-slate-500">
                                            {formatDate(p.date)}{p.start_time ? ` · ${p.start_time}` : ''}
                                            {p.venue ? ` · ${p.venue}` : ''}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    <Card>
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                            <Music2 size={18} className="text-violet-600" /> Performance History
                        </h2>
                        {history.length === 0 ? (
                            <p className="py-6 text-center text-sm text-slate-400">No past performances.</p>
                        ) : (
                            <ul className="space-y-3">
                                {history.map((p) => (
                                    <li key={p.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                        <p className="text-sm font-bold text-slate-900">{p.title}</p>
                                        <p className="text-xs text-slate-500">{formatDate(p.date)}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>
            </div>

            {/* Edit Choir Modal */}
            <ChoirFormModal
                open={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                choir={choir}
                onSaved={() => load()}
            />

            {/* Deletion Modal with Reason Text Field */}
            <ChoirDeleteModal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                choir={choir}
                onDeleted={() => navigate('/admin/choirs')}
            />
        </div>
    );
}
