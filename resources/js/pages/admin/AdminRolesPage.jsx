import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Users,
    Shield,
    Plus,
    Search,
    Edit3,
    Trash2,
    Eye,
    X,
    Check,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { api } from '../../axios';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const CORE_ROLES = ['super-admin', 'admin', 'team_leader', 'member'];

const PERMISSION_GROUPS = [
    { key: 'Users', permissions: ['users.view', 'users.create', 'users.edit', 'users.delete', 'users.approve'] },
    { key: 'Roles', permissions: ['roles.view', 'roles.create', 'roles.edit', 'roles.delete'] },
    { key: 'Permissions', permissions: ['permissions.view', 'permissions.create', 'permissions.edit', 'permissions.delete'] },
    { key: 'Choirs', permissions: ['choirs.view', 'choirs.view.all', 'choirs.create', 'choirs.update', 'choirs.delete'] },
    { key: 'Members', permissions: ['members.view', 'members.view.all', 'members.manage'] },
    { key: 'Songs', permissions: ['songs.view', 'songs.view.all', 'songs.manage'] },
    { key: 'Rehearsals', permissions: ['rehearsals.view', 'rehearsals.view.all', 'rehearsals.manage'] },
    { key: 'Performances', permissions: ['performances.view', 'performances.view.all', 'performances.manage'] },
    { key: 'Attendance', permissions: ['attendance.view', 'attendance.manage', 'attendance.reports'] },
    { key: 'Announcements', permissions: ['announcements.view', 'announcements.view.all', 'announcements.manage'] },
    { key: 'Gallery', permissions: ['gallery.view', 'gallery.view.all', 'gallery.manage'] },
    { key: 'Notifications', permissions: ['notifications.view', 'notifications.manage'] },
    { key: 'Reports', permissions: ['reports.view', 'reports.export'] },
    { key: 'System', permissions: ['audit_logs.view', 'manage.settings'] },
];

function formatDate(val) {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminRolesPage() {
    const [roles, setRoles] = useState([]);
    const [allPermissions, setAllPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedRole, setSelectedRole] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formPermissions, setFormPermissions] = useState([]);

    // Fetch roles list
    const fetchRoles = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/roles', { params: { search: search.trim() || undefined } });
            setRoles(res.data?.data || []);
        } catch (err) {
            setToast({ variant: 'error', message: err.message || 'Failed to load roles' });
        } finally {
            setLoading(false);
        }
    }, [search]);

    // Fetch all permissions
    const fetchPermissions = useCallback(async () => {
        try {
            const res = await api.get('/admin/permissions');
            setAllPermissions(res.data?.data?.items || res.data?.data || []);
        } catch (err) {
            console.error('Failed to load permissions', err);
        }
    }, []);

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, [fetchRoles, fetchPermissions]);

    // Open modals
    const openCreateModal = () => {
        setFormName('');
        setFormDescription('');
        setFormPermissions([]);
        setSelectedRole(null);
        setModalMode('create');
        setModalOpen(true);
    };

    const openEditModal = (role) => {
        setSelectedRole(role);
        setFormName(role.name);
        setFormDescription(role.description || '');
        setFormPermissions(role.permissions || []);
        setModalMode('edit');
        setModalOpen(true);
    };

    const openViewModal = (role) => {
        setSelectedRole(role);
        setModalMode('view');
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedRole(null);
    };

    // Handle permission checkbox changes
    const togglePermission = (permName) => {
        setFormPermissions((prev) =>
            prev.includes(permName) ? prev.filter((p) => p !== permName) : [...prev, permName]
        );
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formName.trim()) return;

        setSaving(true);
        try {
            if (modalMode === 'create') {
                const res = await api.post('/admin/roles', {
                    name: formName.trim(),
                    description: formDescription.trim(),
                    permissions: formPermissions,
                });
                setToast({ variant: 'success', message: `Role "${res.data.data.name}" created successfully.` });
            } else if (modalMode === 'edit' && selectedRole) {
                const res = await api.put(`/admin/roles/${selectedRole.id}`, {
                    name: formName.trim(),
                    description: formDescription.trim(),
                    permissions: formPermissions,
                });
                setToast({ variant: 'success', message: `Role "${res.data.data.name}" updated successfully.` });
            }
            closeModal();
            fetchRoles();
        } catch (err) {
            setToast({ variant: 'error', message: err.message || 'Operation failed' });
        } finally {
            setSaving(false);
        }
    };

    // Delete role
    const confirmDelete = (role) => setDeleteConfirm(role);
    const cancelDelete = () => setDeleteConfirm(null);

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        setSaving(true);
        try {
            await api.delete(`/admin/roles/${deleteConfirm.id}`);
            setToast({ variant: 'success', message: `Role "${deleteConfirm.name}" deleted.` });
            setDeleteConfirm(null);
            fetchRoles();
        } catch (err) {
            setToast({ variant: 'error', message: err.message || 'Delete failed' });
        } finally {
            setSaving(false);
        }
    };

    // Group permissions by group for the form
    const groupedPermissions = useMemo(() => {
        const groups = {};
        allPermissions.forEach((p) => {
            const group = p.group || 'Other';
            if (!groups[group]) groups[group] = [];
            groups[group].push(p);
        });
        return groups;
    }, [allPermissions]);

    const sortedGroups = useMemo(() => {
        const order = [
            'Users', 'Roles', 'Permissions', 'Choirs', 'Members',
            'Songs', 'Lyrics', 'Rehearsals', 'Performances', 'Attendance',
            'Announcements', 'Gallery', 'Notifications', 'Reports', 'System', 'Other'
        ];
        return Object.keys(groupedPermissions).sort((a, b) => {
            const ia = order.indexOf(a);
            const ib = order.indexOf(b);
            if (ia === -1 && ib === -1) return a.localeCompare(b);
            if (ia === -1) return 1;
            if (ib === -1) return -1;
            return ia - ib;
        });
    }, [groupedPermissions]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-ink-900">Roles & Permissions</h1>
                    <p className="text-sm text-ink-500">Manage system roles and their assigned permissions.</p>
                </div>
                <Button onClick={openCreateModal}><Plus size={16} className="mr-2" /> Create Role</Button>
            </div>

            {toast && (
                <div className="relative">
                    <Alert variant={toast.variant} title={toast.message} onClose={() => setToast(null)} />
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-md">
                <input
                    type="text"
                    placeholder="Search roles..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="w-full rounded-xl border border-blue-200 bg-white px-4 py-2.5 pl-10 text-sm text-ink-900 placeholder:text-ink-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            </div>

            {/* Roles Table */}
            <div className="overflow-hidden rounded-2xl border border-blue-100 bg-canvas shadow-sm">
                {loading ? (
                    <div className="flex justify-center py-24"><LoadingSpinner size={36} /></div>
                ) : roles.length === 0 ? (
                    <div className="py-20 text-center text-ink-500">
                        <Shield size={40} className="mx-auto mb-2 text-ink-300" />
                        <p className="font-semibold text-ink-700">No roles found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-ink-700">
                            <thead className="border-b border-blue-100 bg-blue-50/50 text-xs font-semibold uppercase tracking-wider text-ink-500">
                                <tr>
                                    <th className="px-5 py-3.5">Role Name</th>
                                    <th className="px-5 py-3.5">Description</th>
                                    <th className="px-5 py-3.5">Users</th>
                                    <th className="px-5 py-3.5">Permissions</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50">
                                {roles.map((r) => (
                                    <tr key={r.id} className="transition-colors hover:bg-blue-50/40">
                                        <td className="px-5 py-4">
                                            <span className={`font-semibold text-ink-900 ${CORE_ROLES.includes(r.name) ? 'text-blue-700' : ''}`}>
                                                {r.name}
                                                {CORE_ROLES.includes(r.name) && <span className="ml-2 rounded px-1.5 text-[10px] font-bold bg-amber-100 text-amber-800">Core</span>}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-xs text-ink-500 truncate max-w-xs">{r.description || '—'}</td>
                                        <td className="px-5 py-4 text-xs font-medium text-ink-700">{r.users_count ?? 0}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {(r.permissions || []).slice(0, 4).map((p) => (
                                                    <span key={p} className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">{p}</span>
                                                ))}
                                                {(r.permissions || []).length > 4 && (
                                                    <span className="rounded px-1.5 py-0.5 text-[10px] font-medium text-ink-400">+{(r.permissions || []).length - 4} more</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            {CORE_ROLES.includes(r.name) ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">Protected</span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">Custom</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button onClick={() => openViewModal(r)} className="rounded-lg border border-blue-200 bg-white p-1.5 text-ink-600 transition hover:bg-blue-50" title="View"><Eye size={14} /></button>
                                                {!CORE_ROLES.includes(r.name) && (
                                                    <button onClick={() => openEditModal(r)} className="rounded-lg border border-blue-200 bg-white p-1.5 text-ink-600 transition hover:bg-blue-50" title="Edit"><Edit3 size={14} /></button>
                                                )}
                                                {!CORE_ROLES.includes(r.name) && (
                                                    <button onClick={() => confirmDelete(r)} className="rounded-lg border border-red-200 bg-white p-1.5 text-red-600 transition hover:bg-red-50" title="Delete"><Trash2 size={14} /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create / Edit / View Role Modal */}
            {modalOpen && (
                <Modal open={modalOpen} onClose={closeModal} title={modalMode === 'create' ? 'Create Role' : modalMode === 'edit' ? `Edit Role: ${selectedRole?.name}` : `View Role: ${selectedRole?.name}`} size="xl">
                    {modalMode === 'view' ? (
                        <div className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div><p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Role Name</p><p className="mt-0.5 text-sm font-bold text-ink-900">{selectedRole?.name}</p></div>
                                <div><p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Description</p><p className="mt-0.5 text-sm text-ink-600">{selectedRole?.description || '—'}</p></div>
                                <div><p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Users Assigned</p><p className="mt-0.5 text-sm font-medium text-ink-800">{selectedRole?.users_count ?? 0}</p></div>
                                <div><p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Permissions Count</p><p className="mt-0.5 text-sm font-medium text-ink-800">{selectedRole?.permissions_count ?? 0}</p></div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-2">Permissions</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {(selectedRole?.permissions || []).map((p) => (
                                        <span key={p} className="rounded px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">{p}</span>
                                    ))}
                                </div>
                            </div>
                            {selectedRole?.users?.length > 0 && (
                                <div className="border-t border-blue-100 pt-4">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-2">Users with this role</p>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-ink-700">
                                            <thead className="border-b border-blue-100 text-xs font-semibold uppercase tracking-wider text-ink-500"><tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Email</th><th className="px-3 py-2 text-left">Choir</th><th className="px-3 py-2 text-left">Status</th></tr></thead>
                                            <tbody className="divide-y divide-blue-50">
                                                {selectedRole.users.map((u) => (
                                                    <tr key={u.id} className="hover:bg-blue-50/40">
                                                        <td className="px-3 py-2 font-medium text-ink-900">{u.name}</td>
                                                        <td className="px-3 py-2 text-ink-600">{u.email}</td>
                                                        <td className="px-3 py-2 text-ink-500">{u.choir?.name || 'Unassigned'}</td>
                                                        <td className="px-3 py-2"><span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700">{u.status}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <Input label="Role Name" value={formName} onChange={(e) => setFormName(e.target.value)} error={!formName && modalMode !== 'view' ? 'Required' : undefined} required disabled={modalMode === 'view'} />
                                <Input label="Description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Optional description" disabled={modalMode === 'view'} />
                            </div>

                            {modalMode !== 'view' && (
                                <div className="border-t border-blue-100 pt-4">
                                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Permissions</p>
                                    <div className="max-h-96 overflow-y-auto space-y-4">
                                        {sortedGroups.map((group) => (
                                            <div key={group}>
                                                <div className="mb-1 flex items-center justify-between">
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">{group}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleGroup(groupedPermissions[group] || [])}
                                                        className="text-xs font-medium text-blue-600 hover:text-blue-700"
                                                    >
                                                        {(groupedPermissions[group] || []).every((p) => formPermissions.includes(p.name)) ? 'Clear' : 'Select all'}
                                                    </button>
                                                </div>
                                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                    {(groupedPermissions[group] || []).map((p) => (
                                                        <label key={p.name} className="flex items-center gap-2 rounded-lg border border-blue-100 bg-white p-2 text-sm text-ink-700 hover:bg-blue-50 transition cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={formPermissions.includes(p.name)}
                                                                onChange={() => togglePermission(p.name)}
                                                                className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <span className="font-medium">{p.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-blue-100 pt-5">
                                <div className="flex items-center gap-2">
                                    {modalMode !== 'view' && CORE_ROLES.includes(selectedRole?.name) && (
                                        <Alert variant="warning" title="Core system role - changes affect all users." />
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" onClick={closeModal} disabled={saving}>Cancel</Button>
                                    {modalMode !== 'view' && <Button variant="primary" loading={saving} type="submit">{modalMode === 'create' ? 'Create Role' : 'Save Changes'}</Button>}
                                </div>
                            </div>
                        </form>
                    )}
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <Modal open onClose={cancelDelete} title="Delete Role" size="md">
                    <div className="space-y-4">
                        <Alert variant="warning" title={`Are you sure you want to delete the role "${deleteConfirm.name}"?`} />
                        <p className="text-sm text-ink-600">This action cannot be undone. Users assigned to this role will lose its permissions.</p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={cancelDelete}>Cancel</Button>
                            <Button variant="danger" loading={saving} onClick={handleDelete}>Delete Role</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}