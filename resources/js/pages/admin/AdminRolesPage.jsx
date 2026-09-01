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
    AlertCircle,
    AlertTriangle,
    Key,
    Lock,
    CheckCircle2,
    Layers,
    ChevronRight,
} from 'lucide-react';
import { api } from '../../axios';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const CORE_ROLES = ['super-admin', 'admin', 'team_leader', 'member'];

function formatDate(val) {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminRolesPage() {
    const [activeTab, setActiveTab] = useState('roles'); // 'roles' | 'permissions'
    const [roles, setRoles] = useState([]);
    const [allPermissions, setAllPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [permSearch, setPermSearch] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('all');

    // Modals
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

    const showToast = (variant, message) => {
        setToast({ variant, message });
        setTimeout(() => setToast(null), 4000);
    };

    // 1. Fetch roles list
    const fetchRoles = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/roles', { params: { search: search.trim() || undefined } });
            setRoles(res.data?.data || []);
        } catch (err) {
            showToast('error', err.response?.data?.message || err.message || 'Failed to load roles');
        } finally {
            setLoading(false);
        }
    }, [search]);

    // 2. Fetch all permissions
    const fetchPermissions = useCallback(async () => {
        try {
            const res = await api.get('/admin/permissions');
            const items = res.data?.data?.items || res.data?.data || [];
            setAllPermissions(Array.isArray(items) ? items : []);
        } catch (err) {
            console.error('Failed to load permissions', err);
        }
    }, []);

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, [fetchRoles, fetchPermissions]);

    // Modals handler
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

    // Permission checkbox toggle
    const togglePermission = (permName) => {
        setFormPermissions((prev) =>
            prev.includes(permName) ? prev.filter((p) => p !== permName) : [...prev, permName]
        );
    };

    const toggleGroup = (perms) => {
        const allSelected = perms.every((p) => formPermissions.includes(p.name));
        if (allSelected) {
            setFormPermissions((prev) => prev.filter((p) => !perms.find((pp) => pp.name === p)));
        } else {
            setFormPermissions((prev) => [...new Set([...prev, ...perms.map((p) => p.name)])]);
        }
    };

    // Handle form submit (Create or Edit)
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
                showToast('success', `Role "${res.data?.data?.name || formName}" created successfully.`);
            } else if (modalMode === 'edit' && selectedRole) {
                const res = await api.put(`/admin/roles/${selectedRole.id}`, {
                    name: formName.trim(),
                    description: formDescription.trim(),
                    permissions: formPermissions,
                });
                showToast('success', `Role "${res.data?.data?.name || formName}" updated successfully.`);
            }
            closeModal();
            fetchRoles();
        } catch (err) {
            showToast('error', err.response?.data?.message || err.message || 'Operation failed');
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
            showToast('success', `Role "${deleteConfirm.name}" deleted successfully.`);
            setDeleteConfirm(null);
            if (selectedRole?.id === deleteConfirm.id) {
                closeModal();
            }
            fetchRoles();
        } catch (err) {
            showToast('error', err.response?.data?.message || err.message || 'Delete failed');
        } finally {
            setSaving(false);
        }
    };

    // Group permissions by category
    const groupedPermissions = useMemo(() => {
        const groups = {};
        allPermissions.forEach((p) => {
            const group = p.group || 'General';
            if (!groups[group]) groups[group] = [];
            groups[group].push(p);
        });
        return groups;
    }, [allPermissions]);

    const sortedGroups = useMemo(() => {
        const order = [
            'Users', 'Roles', 'Permissions', 'Choirs', 'Members',
            'Songs', 'Lyrics', 'Rehearsals', 'Performances', 'Attendance',
            'Announcements', 'Gallery', 'Notifications', 'Reports', 'System', 'General'
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

    // Permissions tab filtered list
    const filteredPermissionsList = useMemo(() => {
        return allPermissions.filter((p) => {
            const matchSearch =
                !permSearch.trim() ||
                p.name?.toLowerCase().includes(permSearch.toLowerCase()) ||
                p.group?.toLowerCase().includes(permSearch.toLowerCase());
            const matchGroup = selectedGroup === 'all' || p.group === selectedGroup;
            return matchSearch && matchGroup;
        });
    }, [allPermissions, permSearch, selectedGroup]);

    const isCoreRole = (name) => CORE_ROLES.includes(name);

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white shadow-md shadow-blue-700/20">
                            <Shield size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Roles & Permissions</h1>
                            <p className="text-sm text-slate-500">
                                Manage user roles, capability assignments, and security permissions
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
                        <button
                            type="button"
                            onClick={() => setActiveTab('roles')}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                activeTab === 'roles'
                                    ? 'bg-white text-blue-700 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Shield size={14} />
                            <span>Roles ({roles.length})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('permissions')}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                activeTab === 'permissions'
                                    ? 'bg-white text-blue-700 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Key size={14} />
                            <span>Permissions ({allPermissions.length})</span>
                        </button>
                    </div>

                    <Button onClick={openCreateModal} variant="primary" className="rounded-xl shadow-md shadow-blue-700/20">
                        <Plus size={16} />
                        <span>Create Role</span>
                    </Button>
                </div>
            </div>

            {toast && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <Alert variant={toast.variant === 'error' ? 'error' : 'success'} onClose={() => setToast(null)}>
                        {toast.message}
                    </Alert>
                </div>
            )}

            {/* TAB 1: ROLES MANAGEMENT */}
            {activeTab === 'roles' && (
                <>
                    {/* Search & Stats Bar */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="relative max-w-md w-full">
                            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search roles by name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                            <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1">
                                <Shield size={13} className="text-blue-600" />
                                {roles.length} Total Roles
                            </span>
                            <span className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-amber-800 border border-amber-200">
                                <Lock size={13} />
                                {roles.filter((r) => isCoreRole(r.name)).length} Core System Roles
                            </span>
                        </div>
                    </div>

                    {/* Roles Table */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-3">
                                <LoadingSpinner size={36} />
                                <p className="text-xs font-medium text-slate-500">Loading roles...</p>
                            </div>
                        ) : roles.length === 0 ? (
                            <div className="py-20 text-center text-slate-500">
                                <Shield size={40} className="mx-auto mb-2 text-slate-300" />
                                <p className="font-semibold text-slate-700">No roles found</p>
                                <p className="mt-1 text-xs text-slate-400">Try adjusting your search or create a new role.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-700">
                                    <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-5 py-4">Role Name</th>
                                            <th className="px-5 py-4">Description</th>
                                            <th className="px-5 py-4">Users</th>
                                            <th className="px-5 py-4">Permissions</th>
                                            <th className="px-5 py-4">Role Type</th>
                                            <th className="px-5 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {roles.map((r) => {
                                            const core = isCoreRole(r.name);
                                            return (
                                                <tr key={r.id} className="transition-colors hover:bg-slate-50/70">
                                                    {/* Role Name */}
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${core ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'}`}>
                                                                {core ? <Lock size={15} /> : <Shield size={15} />}
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-slate-900 block">{r.name}</span>
                                                                <span className="text-[10px] text-slate-400">ID: {r.id}</span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Description */}
                                                    <td className="px-5 py-4 text-xs text-slate-500 max-w-xs truncate">
                                                        {r.description || 'No description provided'}
                                                    </td>

                                                    {/* Users Count */}
                                                    <td className="px-5 py-4">
                                                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                                                            <Users size={13} className="text-slate-500" />
                                                            {r.users_count ?? 0}
                                                        </span>
                                                    </td>

                                                    {/* Permissions Count */}
                                                    <td className="px-5 py-4">
                                                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200/80">
                                                            <Key size={13} className="text-blue-600" />
                                                            {r.permissions_count ?? (r.permissions || []).length}{' '}
                                                            {(r.permissions_count ?? (r.permissions || []).length) === 1 ? 'Permission' : 'Permissions'}
                                                        </span>
                                                    </td>

                                                    {/* Status / Type */}
                                                    <td className="px-5 py-4">
                                                        {core ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                                                                <Lock size={10} /> Core Role
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                                                                <CheckCircle2 size={10} /> Custom Role
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Action Buttons: View, Edit, Delete */}
                                                    <td className="px-5 py-4 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {/* 1. View Button */}
                                                            <button
                                                                type="button"
                                                                onClick={() => openViewModal(r)}
                                                                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
                                                                title="View details"
                                                            >
                                                                <Eye size={14} className="text-blue-600" />
                                                                <span>View</span>
                                                            </button>

                                                            {/* 2. Edit Button (Always available for all roles) */}
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditModal(r)}
                                                                className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50/50 px-2.5 py-1.5 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-100 hover:border-blue-300"
                                                                title="Edit role permissions and details"
                                                            >
                                                                <Edit3 size={14} />
                                                                <span>Edit</span>
                                                            </button>

                                                            {/* 3. Delete Button */}
                                                            {core ? (
                                                                <button
                                                                    type="button"
                                                                    disabled
                                                                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed opacity-60"
                                                                    title="Core system roles cannot be deleted"
                                                                >
                                                                    <Trash2 size={14} />
                                                                    <span>Delete</span>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => confirmDelete(r)}
                                                                    className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50/50 px-2.5 py-1.5 text-xs font-bold text-rose-700 shadow-sm transition hover:bg-rose-100 hover:border-rose-300"
                                                                    title="Delete custom role"
                                                                >
                                                                    <Trash2 size={14} />
                                                                    <span>Delete</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* TAB 2: PERMISSIONS EXPLORER */}
            {activeTab === 'permissions' && (
                <div className="space-y-5">
                    {/* Filter & Search */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="relative max-w-md w-full">
                            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search permissions (e.g. songs.manage, attendance.view)..."
                                value={permSearch}
                                onChange={(e) => setPermSearch(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                            />
                        </div>

                        {/* Category Dropdown */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Group:</span>
                            <select
                                value={selectedGroup}
                                onChange={(e) => setSelectedGroup(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                            >
                                <option value="all">All Groups ({allPermissions.length})</option>
                                {sortedGroups.map((g) => (
                                    <option key={g} value={g}>
                                        {g} ({groupedPermissions[g]?.length || 0})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Permissions Grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredPermissionsList.map((perm) => (
                            <div key={perm.id || perm.name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-200 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 border border-blue-100 mb-1.5">
                                            {perm.group || 'System'}
                                        </span>
                                        <p className="font-mono text-xs font-bold text-slate-900 break-all">{perm.name}</p>
                                    </div>
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                        <Key size={14} />
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
                                    <span>Assigned Roles:</span>
                                    <span className="font-bold text-slate-800">{perm.roles_count ?? (perm.roles?.length || 0)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CREATE / EDIT / VIEW ROLE MODAL */}
            {modalOpen && (
                <Modal
                    open={modalOpen}
                    onClose={closeModal}
                    title={
                        modalMode === 'create'
                            ? 'Create New Role'
                            : modalMode === 'edit'
                            ? `Edit Role: ${selectedRole?.name}`
                            : `Role Details: ${selectedRole?.name}`
                    }
                    size="xl"
                >
                    {modalMode === 'view' ? (
                        /* VIEW ROLE DETAILS */
                        <div className="space-y-6">
                            {/* Role Banner */}
                            <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl relative overflow-hidden">
                                <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    {isCoreRole(selectedRole?.name) ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-0.5 text-xs font-bold text-amber-300 border border-amber-500/30">
                                            <Lock size={12} /> Core System Role
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                                            <CheckCircle2 size={12} /> Custom Role
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-2xl font-black text-white">{selectedRole?.name}</h2>
                                <p className="mt-1 text-xs text-slate-300">
                                    {selectedRole?.description || 'No description provided for this role.'}
                                </p>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Users Assigned</span>
                                    <p className="mt-1 text-lg font-bold text-slate-900 flex items-center gap-1.5">
                                        <Users size={16} className="text-blue-600" />
                                        {selectedRole?.users_count ?? selectedRole?.users?.length ?? 0}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Permissions Count</span>
                                    <p className="mt-1 text-lg font-bold text-slate-900 flex items-center gap-1.5">
                                        <Key size={16} className="text-blue-600" />
                                        {selectedRole?.permissions?.length ?? 0}
                                    </p>
                                </div>

                                <div className="col-span-2 sm:col-span-1 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Guard</span>
                                    <p className="mt-1 text-lg font-bold text-slate-900 font-mono text-xs">
                                        {selectedRole?.guard_name || 'api'}
                                    </p>
                                </div>
                            </div>

                            {/* Permissions List */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                                    Assigned Permissions ({selectedRole?.permissions?.length ?? 0})
                                </p>
                                <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1">
                                    {(selectedRole?.permissions || []).map((p) => (
                                        <span key={p} className="rounded-lg px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                            {p}
                                        </span>
                                    ))}
                                    {(!selectedRole?.permissions || selectedRole.permissions.length === 0) && (
                                        <p className="text-xs text-slate-400 italic">No permissions assigned to this role.</p>
                                    )}
                                </div>
                            </div>

                            {/* View Modal Footer Actions */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                                <div>
                                    {!isCoreRole(selectedRole?.name) && (
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => {
                                                closeModal();
                                                confirmDelete(selectedRole);
                                            }}
                                        >
                                            <Trash2 size={14} /> Delete Role
                                        </Button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={closeModal}>
                                        Close
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => openEditModal(selectedRole)}
                                    >
                                        <Edit3 size={14} /> Edit Role
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* CREATE / EDIT FORM */
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Core Role Notice */}
                            {modalMode === 'edit' && isCoreRole(selectedRole?.name) && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                                    <Lock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-bold">Core System Role:</span> Role name is locked to preserve system authentication rules, but you can freely customize assigned permissions and description.
                                    </div>
                                </div>
                            )}

                            {/* Inputs */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Role Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        disabled={modalMode === 'edit' && isCoreRole(selectedRole?.name)}
                                        placeholder="e.g. music_director, guest_vocalist"
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                        placeholder="Briefly describe what this role is for"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Permissions Checkbox Matrix */}
                            <div className="border-t border-slate-100 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                        Assign Permissions ({formPermissions.length} selected)
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (formPermissions.length === allPermissions.length) {
                                                setFormPermissions([]);
                                            } else {
                                                setFormPermissions(allPermissions.map((p) => p.name));
                                            }
                                        }}
                                        className="text-xs font-bold text-blue-700 hover:text-blue-800"
                                    >
                                        {formPermissions.length === allPermissions.length ? 'Deselect All' : 'Select All Permissions'}
                                    </button>
                                </div>

                                <div className="max-h-96 overflow-y-auto space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                                    {sortedGroups.map((group) => {
                                        const groupPerms = groupedPermissions[group] || [];
                                        const allChecked = groupPerms.length > 0 && groupPerms.every((p) => formPermissions.includes(p.name));

                                        return (
                                            <div key={group} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                                <div className="mb-2.5 flex items-center justify-between border-b border-slate-100 pb-2">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                                                        <Layers size={13} className="text-blue-600" />
                                                        {group}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleGroup(groupPerms)}
                                                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
                                                    >
                                                        {allChecked ? 'Clear' : 'Select all'}
                                                    </button>
                                                </div>

                                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                    {groupPerms.map((p) => (
                                                        <label
                                                            key={p.name}
                                                            className={`flex items-center gap-2 rounded-lg border p-2 text-xs transition cursor-pointer ${
                                                                formPermissions.includes(p.name)
                                                                    ? 'border-blue-300 bg-blue-50/70 text-blue-900 font-bold'
                                                                    : 'border-slate-100 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={formPermissions.includes(p.name)}
                                                                onChange={() => togglePermission(p.name)}
                                                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <span className="font-mono text-[11px] truncate">{p.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                                <Button type="button" variant="outline" onClick={closeModal} disabled={saving}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" loading={saving}>
                                    {modalMode === 'create' ? 'Create Role' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    )}
                </Modal>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deleteConfirm && (
                <Modal open onClose={cancelDelete} title="Delete Role" size="md">
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-700">
                                    Are you sure you want to delete the role{' '}
                                    <strong className="font-bold text-slate-900">"{deleteConfirm.name}"</strong>?
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    This action cannot be undone. Users assigned to this role will lose its permissions.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-3">
                            <Button variant="outline" size="sm" onClick={cancelDelete} disabled={saving}>
                                Cancel
                            </Button>
                            <Button variant="danger" size="sm" loading={saving} onClick={handleDelete}>
                                Delete Role
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}