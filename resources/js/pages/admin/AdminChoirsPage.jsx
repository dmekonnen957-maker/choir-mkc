import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building2, User, Users, Music2, CalendarDays, Search, Pencil, Trash2 } from 'lucide-react';
import { api } from '../../axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import Input from '../../components/ui/Input';
import ChoirFormModal from '../../components/admin/ChoirFormModal';
import ChoirDeleteModal from '../../components/admin/ChoirDeleteModal';

export default function AdminChoirsPage() {
    const [choirs, setChoirs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [search, setSearch] = useState('');

    // Modal States
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [editingChoir, setEditingChoir] = useState(null);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingChoir, setDeletingChoir] = useState(null);

    const load = useCallback(() => {
        setLoading(true);
        api.get('/admin/choirs', { params: { per_page: 100 } })
            .then((res) => setChoirs(res.data.data.items || []))
            .catch(() => setError('Failed to load choirs.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleCreateClick = () => {
        setEditingChoir(null);
        setFormModalOpen(true);
    };

    const handleEditClick = (choir, e) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingChoir(choir);
        setFormModalOpen(true);
    };

    const handleDeleteClick = (choir, e) => {
        e.preventDefault();
        e.stopPropagation();
        setDeletingChoir(choir);
        setDeleteModalOpen(true);
    };

    const handleSaved = () => {
        setSuccessMessage(editingChoir ? 'Choir updated successfully.' : 'Choir created successfully.');
        load();
        setTimeout(() => setSuccessMessage(''), 4000);
    };

    const handleDeleted = (deletedId) => {
        setSuccessMessage('Choir deleted successfully.');
        setChoirs((prev) => prev.filter((c) => c.id !== deletedId));
        setTimeout(() => setSuccessMessage(''), 4000);
    };

    const filtered = choirs.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Choirs Management</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage church choirs, team leaders, uniforms, and repertoire.
                    </p>
                </div>
                <Button onClick={handleCreateClick}>
                    <Plus size={16} className="mr-1.5" /> New Choir
                </Button>
            </div>

            {successMessage && <Alert variant="success">{successMessage}</Alert>}
            {error && <Alert variant="error">{error}</Alert>}

            <div className="max-w-sm">
                <Input
                    placeholder="Search choirs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    trailing={<Search size={16} className="text-slate-400" />}
                />
            </div>

            {loading ? (
                <div className="flex h-48 items-center justify-center">
                    <LoadingSpinner text="Loading choirs..." />
                </div>
            ) : filtered.length === 0 ? (
                <Card className="py-16 text-center">
                    <Building2 size={32} className="mx-auto text-slate-300" />
                    <p className="mt-2 text-sm text-slate-500 font-medium">No choirs found.</p>
                    <button
                        type="button"
                        onClick={handleCreateClick}
                        className="mt-3 text-sm font-bold text-blue-600 hover:underline"
                    >
                        Create your first choir
                    </button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((choir) => (
                        <div key={choir.id} className="relative group">
                            <Link to={`/admin/choirs/${choir.id}`} className="block h-full">
                                <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border border-slate-200/80">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            {/* Choir Logo / Swatch */}
                                            {choir.logo_path ? (
                                                <img
                                                    src={choir.logo_path}
                                                    alt={choir.name}
                                                    className="h-11 w-11 shrink-0 rounded-xl object-cover"
                                                />
                                            ) : (
                                                <div
                                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold shadow-xs"
                                                    style={{
                                                        backgroundColor: choir.uniform_primary_color || '#2563eb',
                                                        color: choir.uniform_secondary_color || '#ffffff',
                                                    }}
                                                >
                                                    <Building2 size={20} />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-bold text-slate-900">{choir.name}</p>
                                                <p className="truncate text-xs text-slate-500 font-medium">
                                                    {choir.church_name || choir.choir_type || 'Choir'}
                                                </p>
                                            </div>
                                        </div>

                                        <span
                                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                                choir.status === 'active'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                    : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {choir.status}
                                        </span>
                                    </div>

                                    {/* Swatches & Leader */}
                                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 truncate">
                                            <User size={14} className="text-blue-600 shrink-0" />{' '}
                                            {choir.team_leader?.name || 'No leader assigned'}
                                        </span>

                                        {(choir.uniform_primary_color || choir.uniform_secondary_color) && (
                                            <div className="flex items-center -space-x-1.5 shrink-0" title="Uniform colors">
                                                {choir.uniform_primary_color && (
                                                    <span
                                                        className="h-4 w-4 rounded-full border border-white shadow-xs"
                                                        style={{ backgroundColor: choir.uniform_primary_color }}
                                                    />
                                                )}
                                                {choir.uniform_secondary_color && (
                                                    <span
                                                        className="h-4 w-4 rounded-full border border-white shadow-xs"
                                                        style={{ backgroundColor: choir.uniform_secondary_color }}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                                        <div className="flex items-center gap-3 font-semibold">
                                            <span className="inline-flex items-center gap-1">
                                                <Users size={14} className="text-blue-500" /> {choir.member_count ?? 0}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <Music2 size={14} className="text-violet-500" /> {choir.songs_count ?? 0}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <CalendarDays size={14} className="text-emerald-500" /> {choir.performances_count ?? 0}
                                            </span>
                                        </div>

                                        {/* Quick Edit / Delete Modal Action Buttons */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={(e) => handleEditClick(choir, e)}
                                                className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition"
                                                title="Edit Choir"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => handleDeleteClick(choir, e)}
                                                className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                                                title="Delete Choir"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {/* Create & Edit Modal */}
            <ChoirFormModal
                open={formModalOpen}
                onClose={() => setFormModalOpen(false)}
                choir={editingChoir}
                onSaved={handleSaved}
            />

            {/* Deletion Modal with Reason Text Field */}
            <ChoirDeleteModal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                choir={deletingChoir}
                onDeleted={handleDeleted}
            />
        </div>
    );
}
