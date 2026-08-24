import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Key,
    Plus,
    Search,
    Edit3,
    Trash2,
    Eye,
    Users,
    X,
    Loader2,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { api } from '../../axios';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const PERMISSION_GROUPS = [
    'Users', 'Roles', 'Permissions', 'Choirs', 'Members',
    'Songs', 'Lyrics', 'Rehearsals', 'Performances', 'Attendance',
    'Announcements', 'Gallery', 'Notifications', 'Reports', 'System', 'Other'
];

function formatDate(val) {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getGroup(key) {
    const parts = key.split('.');
    const prefix = parts[0] || 'system';
    return match(prefix);
    function match(p) {
        return {
            users: 'Users', roles: 'Roles', permissions: 'Permissions',
            choirs: 'Choirs', members: 'Members', songs: 'Songs',
            lyrics: 'Lyrics', rehearsals: 'Rehearsals',
            performances: 'Performances', attendance: 'Attendance',
            announcements: 'Announcements', gallery: 'Gallery',
            notifications: 'Notifications', reports: 'Reports',
            audit_logs: 'Audit Logs', default: 'System',
        }[p] || 'Other';
    }
}

export default function AdminPermissionsPage() {
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [groupFilter, setGroupFilter] = useState('all');
    const [selectedPerm, setSelectedPerm] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const [formName, setFormName] = useState('');
    const [formKey, setFormKey] = useState('');
    const [formGroup, setFormGroup] = useState('');
    const [formDescription, setFormDescription] = useState('');

    const fetchPermissions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/permissions');
            setPermissions(res.data?.data?.items || res.data?.data || []);
        } catch (err) {
            setToast({ variant: 'error', message: err.message || 'Failed to load permissions' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

    const openCreateModal = () => {
        setFormName(''); setFormKey(''); setFormGroup(''); setFormDescription('');
        setSelectedPerm(null); setModalMode('create'); setModalOpen(true);
    };

    const openEditModal = (p) => {
        setSelectedPerm(p);
        setFormName(p.name);
        setFormKey(p.key || p.name);
        setFormGroup(p.group || '');
        setFormDescription(p.description || '');
        setModalMode('edit');
        setModalOpen(true);
    };

    const openViewModal = (p) => {
        setSelectedPerm(p);
        setModalMode('view');
        setModalOpen(true);
    };

    const closeModal = () => { setModalOpen(false); setSelectedPerm(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formName.trim() || !formKey.trim()) return;
        setSaving(true);
        try {
            if (modalMode === 'create') {
                const res = await api.post('/admin/permissions', {
                    name: formName.trim(),
                    description: formDescription.trim(),
                    group: formGroup.trim(),
                });
                setToast({ variant: 'success', message: `Permission "${res.data.data.name}" created.` });
            } else if (modalMode === 'edit' && selectedPerm) {
                const res = await api.put(`/admin/permissions/${selectedPerm.id}`, {
                    name: formName.trim(),
                    description: formDescription.trim(),
                    group: formGroup.trim(),
                });
                setToast({ variant: 'success', message: `Permission "${res.data.data.name}" updated.` });
            }
            closeModal(); fetchPermissions();
        } catch (err) { setToast({ variant: 'error', message: err.message || 'Operation failed' }); }
        finally { setSaving(false); }
    };

    const confirmDelete = (p) => setDeleteConfirm(p);
    const cancelDelete = () => setDeleteConfirm(null);

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        setSaving(true);
        try {
            await api.delete(`/admin/permissions/${deleteConfirm.id}`);
            setToast({ variant: 'success', message: `Permission "${deleteConfirm.name}" deleted.` });
            setDeleteConfirm(null); fetchPermissions();
        } catch (err) { setToast({ variant: 'error', message: err.message || 'Delete failed' }); }
        finally { setSaving(false); }
    };

    const filteredPerms = useMemo(() => {
        return permissions.filter((p) => {
            const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.key.toLowerCase().includes(search.toLowerCase());
            const matchesGroup = groupFilter === 'all' || p.group === groupFilter;
            return matchesSearch && matchesGroup;
        });
    }, [permissions, search, groupFilter]);

    const groups = useMemo(() => [...new Set(permissions.map(p => p.group).filter(Boolean))].sort(), [permissions]);

    // Render table content
    function renderTableContent() {
        if (loading) {
            return <div className="flex justify-center py-24"><LoadingSpinner size={36} /></div>;
        }
        if (filteredPerms.length === 0) {
            return (
                <div className="py-20 text-center text-ink-500">
                    <Key size={40} className="mx-auto mb-2 text-ink-300" />
                    <p className="font-semibold text-ink-700">No permissions found</p>
                </div>
            );
        }
        return (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-ink-700">
                    <thead className="border-b border-blue-100 bg-blue-50/50 text-xs font-semibold uppercase tracking-wider text-ink-500">
                        <tr>
                            <th className="px-5 py-3.5">Permission Name</th>
                            <th className="px-5 py-3.5">Key</th>
                            <th className="px-5 py-3.5">Group</th>
                            <th className="px-5 py-3.5">Roles Using</th>
                            <th className="px-5 py-3.5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                        {filteredPerms.map((p) => (
                            <tr key={p.id} className="transition-colors hover:bg-blue-50/40">
                                <td className="px-5 py-4 font-medium text-ink-900">{p.name}</td>
                                <td className="px-5 py-4 text-xs font-mono text-ink-500">{p.key || p.name}</td>
                                <td className="px-5 py-4"><span className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{p.group || '—'}</span></td>
                                <td className="px-5 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {(p.roles || []).slice(0, 3).map((r) => <span key={r} className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">{r}</span>)}
                                        {(p.roles || []).length > 3 && <span className="rounded px-1.5 py-0.5 text-[10px] text-ink-400">+{(p.roles || []).length - 3} more</span>}
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <button onClick={() => openViewModal(p)} className="rounded-lg border border-blue-200 bg-white p-1.5 text-ink-600 transition hover:bg-blue-50"><Eye size={14} /></button>
                                        <button onClick={() => openEditModal(p)} className="rounded-lg border border-blue-200 bg-white p-1.5 text-ink-600 transition hover:bg-blue-50"><Edit3 size={14} /></button>
                                        <button onClick={() => confirmDelete(p)} className="rounded-lg border border-red-200 bg-white p-1.5 text-red-600 transition hover:bg-red-50"><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-ink-900">Permissions</h1>
                    <p className="text-sm text-ink-500">Manage permission definitions and their role assignments.</p>
                </div>
                <Button onClick={openCreateModal}><Plus size={16} className="mr-2" /> Create Permission</Button>
            </div>

            {toast && <div className="relative"><Alert variant={toast.variant} title={toast.message} onClose={() => setToast(null)} /></div>}

            {/* Filters */}
            <div className="grid gap-3 rounded-2xl border border-blue-100 bg-canvas p-4 shadow-sm sm:grid-cols-3">
                <div className="relative sm:col-span-2">
                    <input type="text" placeholder="Search by name or key..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-blue-200 bg-white px-4 py-2.5 pl-10 text-sm text-ink-900 placeholder:text-ink-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                </div>
                <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm text-ink-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option value="all">All Groups</option>
                    {groups.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>

            {/* Permissions Table */}
            <div className="overflow-hidden rounded-2xl border border-blue-100 bg-canvas shadow-sm">
                {renderTableContent()}
            </div>

            {/* Create / Edit / View Permission Modal */}
            {modalOpen && (
                <Modal open={modalOpen} onClose={closeModal} title={modalMode === 'create' ? 'Create Permission' : modalMode === 'edit' ? `Edit Permission: ${selectedPerm?.name}` : `View Permission: ${selectedPerm?.name}`} size="md">
                    {modalMode === 'view' ? (
                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div><p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Name</p><p className="mt-0.5 text-sm font-bold text-ink-900">{selectedPerm?.name}</p></div>
                                <div><p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Key</p><p className="mt-0.5 text-sm font-mono text-ink-600">{selectedPerm?.key || selectedPerm?.name}</p></div>
                                <div><p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Group</p><p className="mt-0.5 text-sm font-medium text-ink-800">{selectedPerm?.group || '—'}</p></div>
                                <div><p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Roles Using</p><p className="mt-0.5 text-sm font-medium text-ink-800">{selectedPerm?.roles_count ?? 0}</p></div>
                            </div>
                            {selectedPerm?.description && <div><p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1">Description</p><p className="text-sm text-ink-600">{selectedPerm.description}</p></div>}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input label="Permission Name" value={formName} onChange={(e) => setFormName(e.target.value)} error={!formName && modalMode !== 'view' ? 'Required' : undefined} required disabled={modalMode === 'view'} />
                            <Input label="Permission Key (e.g., users.view)" value={formKey} onChange={(e) => setFormKey(e.target.value)} error={!formKey && modalMode !== 'view' ? 'Required' : undefined} required disabled={modalMode === 'view' || modalMode === 'edit'} />
                            <Input label="Group" value={formGroup} onChange={(e) => setFormGroup(e.target.value)} placeholder="e.g., Users, Roles, Choirs" disabled={modalMode === 'view'} />
                            <div><label className="mb-1 block text-xs font-semibold text-ink-700">Description</label><textarea rows={3} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Optional" className="w-full rounded-xl border border-blue-200 p-3 text-sm text-ink-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" disabled={modalMode === 'view'} /></div>
                            <div className="flex justify-end gap-2 border-t border-blue-100 pt-4">
                                <Button variant="outline" onClick={closeModal} disabled={saving}>Cancel</Button>
                                {modalMode !== 'view' && <Button variant="primary" loading={saving} type="submit">{modalMode === 'create' ? 'Create Permission' : 'Save Changes'}</Button>}
                            </div>
                        </form>
                    )}
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <Modal open onClose={cancelDelete} title="Delete Permission" size="md">
                    <div className="space-y-4"><Alert variant="warning" title={`Delete permission "${deleteConfirm.name}"?`} /><p className="text-sm text-ink-600">This will remove the permission from all roles. This action cannot be undone.</p>
                        <div className="flex justify-end gap-2"><Button variant="outline" onClick={cancelDelete}>Cancel</Button><Button variant="danger" loading={saving} onClick={handleDelete}>Delete Permission</Button></div>
                    </div>
                </Modal>
            )}
        </div>
    );
}