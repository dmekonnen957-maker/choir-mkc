import { useState, useEffect, useCallback } from 'react';
import {
    Users,
    UserCheck,
    UserX,
    Clock,
    Search,
    Filter,
    Shield,
    Church,
    CheckCircle2,
    XCircle,
    Eye,
    Edit3,
    Phone,
    Mail,
    Calendar,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Plus,
    UserPlus,
    Trash2,
} from 'lucide-react';
import { api } from '../../axios';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const ROLE_BADGES = {
    admin: { label: 'Admin', bg: 'bg-purple-100 text-purple-700 border-purple-200' },
    'super-admin': { label: 'Super Admin', bg: 'bg-purple-100 text-purple-700 border-purple-200' },
    team_leader: { label: 'Team Leader', bg: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    member: { label: 'Member', bg: 'bg-blue-100 text-blue-700 border-blue-200' },
};

const STATUS_BADGES = {
    pending: { label: 'Pending', bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
    approved: { label: 'Approved', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
    rejected: { label: 'Rejected', bg: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
};

function formatDate(val) {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [choirs, setChoirs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [statusFilter, setStatusFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [choirFilter, setChoirFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    // Selected user for review modal
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [toast, setToast] = useState(null);

    // Create User modal
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        role: 'member',
        choir_id: '',
        status: 'approved',
    });
    const [createErrors, setCreateErrors] = useState({});
    const [createSaving, setCreateSaving] = useState(false);

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const { can, user: currentUser } = useAuth();

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api.delete(`/admin/users/${deleteTarget.id}`);
            setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
            setToast({ variant: 'success', message: `User "${deleteTarget.name}" has been deleted.` });
            setDeleteTarget(null);
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.message ||
                'Failed to delete user';
            setToast({ variant: 'error', message: msg });
            setDeleteTarget(null);
        } finally {
            setDeleting(false);
        }
    };

    // Edit form within modal
    const [editRole, setEditRole] = useState('member');
    const [editChoirId, setEditChoirId] = useState('');
    const [editStatus, setEditStatus] = useState('pending');

    // Fetch Choirs for filtering and assigning
    useEffect(() => {
        api.get('/public/choirs?per_page=100')
            .then((res) => {
                const items = res.data?.data?.items || res.data?.data || [];
                setChoirs(items);
            })
            .catch(() => {});
    }, []);

    // Fetch users list
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                role: roleFilter !== 'all' ? roleFilter : undefined,
                choir_id: choirFilter !== 'all' ? choirFilter : undefined,
                search: search.trim() || undefined,
            };

            const res = await api.get('/admin/users', { params });
            const data = res.data?.data || {};
            setUsers(data.items || []);
            if (data.pagination) {
                setPagination(data.pagination);
            }
        } catch (err) {
            setToast({ variant: 'error', message: err.message || 'Failed to load users' });
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, roleFilter, choirFilter, search]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Open review modal
    const handleReview = (user) => {
        setSelectedUser(user);
        setEditRole(user.role || 'member');
        const userChoirId = user.choir?.id || (user.choirs?.[0]?.id ?? '');
        setEditChoirId(userChoirId);
        setEditStatus(user.status || 'pending');
        setModalOpen(true);
    };

    // Quick Approve
    const handleApprove = async (user) => {
        setSaving(true);
        try {
            const res = await api.post(`/admin/users/${user.id}/approve`);
            setToast({ variant: 'success', message: `User "${user.name}" has been approved.` });
            if (selectedUser?.id === user.id) {
                setSelectedUser(res.data?.data);
                setEditStatus('approved');
            }
            fetchUsers();
        } catch (err) {
            setToast({ variant: 'error', message: err.message || 'Approval failed' });
        } finally {
            setSaving(false);
        }
    };

    // Trigger Reject dialog
    const handleOpenReject = (user) => {
        setSelectedUser(user);
        setRejectionReason(user.rejection_reason || '');
        setRejectModalOpen(true);
    };

    // Submit Reject
    const handleConfirmReject = async () => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            const res = await api.post(`/admin/users/${selectedUser.id}/reject`, {
                rejection_reason: rejectionReason,
            });
            setToast({ variant: 'warning', message: `User "${selectedUser.name}" registration was rejected.` });
            setRejectModalOpen(false);
            if (modalOpen) {
                setSelectedUser(res.data?.data);
                setEditStatus('rejected');
            }
            fetchUsers();
        } catch (err) {
            setToast({ variant: 'error', message: err.message || 'Rejection failed' });
        } finally {
            setSaving(false);
        }
    };

    // Save changes from review modal (Role, Choir, Status)
    const handleSaveChanges = async () => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            const res = await api.put(`/admin/users/${selectedUser.id}`, {
                name: selectedUser.name,
                email: selectedUser.email,
                role: editRole,
                choir_id: editChoirId || null,
                status: editStatus,
            });
            setToast({ variant: 'success', message: 'User updated successfully.' });
            setSelectedUser(res.data?.data);
            setModalOpen(false);
            fetchUsers();
        } catch (err) {
            setToast({ variant: 'error', message: err.message || 'Update failed' });
        } finally {
            setSaving(false);
        }
    };

    // Create User modal handlers
    const openCreateModal = () => {
        setCreateForm({
            name: '',
            email: '',
            phone: '',
            password: '',
            password_confirmation: '',
            role: 'member',
            choir_id: '',
            status: 'approved',
        });
        setCreateErrors({});
        setCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        setCreateModalOpen(false);
        setCreateErrors({});
    };

    const handleCreateChange = (field) => (e) => {
        setCreateForm((prev) => ({ ...prev, [field]: e.target.value }));
        setCreateErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleCreatePhoneChange = (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.startsWith('0')) v = v.slice(1);
        v = v.slice(0, 9);
        setCreateForm((prev) => ({ ...prev, phone: v }));
        setCreateErrors((prev) => ({ ...prev, phone: undefined }));
    };

    const validateCreate = () => {
        const errs = {};
        const name = createForm.name.trim();
        if (!name) errs.name = ['Full name is required.'];
        else if (name.length < 2) errs.name = ['Full name must contain at least 2 characters.'];
        else if (!/^[\p{L}\s]+$/u.test(name)) errs.name = ['Full name may only contain letters and spaces.'];

        if (!createForm.email) errs.email = ['Email address is required.'];
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) errs.email = ['Enter a valid email address.'];

        const phoneDigits = createForm.phone.replace(/\D/g, '').replace(/^0/, '');
        if (!createForm.phone) errs.phone = ['Phone number is required.'];
        else if (!/^9\d{8}$/.test(phoneDigits)) errs.phone = ['Enter a valid Ethiopian phone number (e.g. 0912345678).'];

        if (!createForm.password) errs.password = ['Password is required.'];
        else if (createForm.password.length < 8) errs.password = ['Password must be at least 8 characters.'];
        if (!createForm.password_confirmation) errs.password_confirmation = ['Please confirm the password.'];
        else if (createForm.password !== createForm.password_confirmation) errs.password_confirmation = ['Password confirmation does not match.'];

        return errs;
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setCreateSaving(true);
        setCreateErrors({});
        const clientErrors = validateCreate();
        if (Object.keys(clientErrors).length > 0) {
            setCreateErrors(clientErrors);
            setCreateSaving(false);
            return;
        }
        try {
            const res = await api.post('/admin/users', createForm);
            setToast({ variant: 'success', message: `User "${res.data.data.name}" created successfully.` });
            closeCreateModal();
            fetchUsers();
        } catch (err) {
            if (err.errors) setCreateErrors(err.errors);
            setToast({ variant: 'error', message: err.message || 'Failed to create user' });
        } finally {
            setCreateSaving(false);
        }
    };

    // Stats calculation
    const pendingCount = users.filter((u) => u.status === 'pending').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-ink-900">User Management</h1>
                    <p className="text-sm text-ink-500">
                        Review member registration requests, approve/reject accounts, and assign roles & choirs.
                    </p>
                </div>
                <Button onClick={openCreateModal}><UserPlus size={16} className="mr-2" /> Create User</Button>
            </div>

            {/* Notification toast */}
            {toast && (
                <div className="relative">
                    <Alert
                        variant={toast.variant}
                        title={toast.message}
                        onClose={() => setToast(null)}
                    />
                </div>
            )}

            {/* Status Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-blue-100 pb-3">
                {[
                    { key: 'all', label: 'All Users', icon: Users },
                    { key: 'pending', label: 'Pending Approval', icon: Clock, count: statusFilter === 'all' ? pendingCount : null },
                    { key: 'approved', label: 'Approved', icon: UserCheck },
                    { key: 'rejected', label: 'Rejected', icon: UserX },
                ].map((tab) => {
                    const active = statusFilter === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => {
                                setStatusFilter(tab.key);
                                setPage(1);
                            }}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                                active
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-canvas text-ink-600 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {tab.count !== null && tab.count > 0 && (
                                <span
                                    className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                                        active ? 'bg-white text-blue-700' : 'bg-amber-100 text-amber-800'
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Filters & Search Toolbar */}
            <div className="grid gap-3 rounded-2xl border border-blue-100 bg-canvas p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
                {/* Search */}
                <div className="relative sm:col-span-2">
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-full rounded-xl border border-blue-200 bg-white px-4 py-2.5 pl-10 text-sm text-ink-900 placeholder:text-ink-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                </div>

                {/* Role Filter */}
                <div>
                    <select
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value);
                            setPage(1);
                        }}
                        className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm text-ink-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="all">All Roles</option>
                        <option value="member">Member</option>
                        <option value="team_leader">Team Leader</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                {/* Choir Filter */}
                <div>
                    <select
                        value={choirFilter}
                        onChange={(e) => {
                            setChoirFilter(e.target.value);
                            setPage(1);
                        }}
                        className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm text-ink-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="all">All Choirs</option>
                        {choirs.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="overflow-hidden rounded-2xl border border-blue-100 bg-canvas shadow-sm">
                {loading ? (
                    <div className="flex justify-center py-24">
                        <LoadingSpinner size={36} />
                    </div>
                ) : users.length === 0 ? (
                    <div className="py-20 text-center text-ink-500">
                        <Users size={40} className="mx-auto mb-2 text-ink-300" />
                        <p className="font-semibold text-ink-700">No users found</p>
                        <p className="text-xs text-ink-400">Try adjusting your filters or search terms.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-ink-700">
                            <thead className="border-b border-blue-100 bg-blue-50/50 text-xs font-semibold uppercase tracking-wider text-ink-500">
                                <tr>
                                    <th className="px-5 py-3.5">User</th>
                                    <th className="px-5 py-3.5">Phone</th>
                                    <th className="px-5 py-3.5">Choir</th>
                                    <th className="px-5 py-3.5">Role</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5">Registered</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50">
                                {users.map((u) => {
                                    const roleBadge = ROLE_BADGES[u.role] || ROLE_BADGES.member;
                                    const statusBadge = STATUS_BADGES[u.status] || STATUS_BADGES.pending;
                                    const StatusIcon = statusBadge.icon;
                                    const choirName = u.choir?.name || u.choirs?.[0]?.name || 'Unassigned';

                                    const initials = (u.name || '?')
                                        .split(' ')
                                        .map((p) => p[0])
                                        .filter(Boolean)
                                        .slice(0, 2)
                                        .join('')
                                        .toUpperCase();

                                    return (
                                        <tr key={u.id} className="transition-colors hover:bg-blue-50/40">
                                            {/* Name & Email */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm">
                                                        {initials}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-ink-900 truncate">{u.name}</p>
                                                        <p className="text-xs text-ink-400 truncate">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Phone */}
                                            <td className="px-5 py-4 text-xs font-medium text-ink-600 whitespace-nowrap">
                                                {u.phone || '—'}
                                            </td>

                                            {/* Choir */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-900">
                                                    <Church size={14} className="text-blue-500" />
                                                    {choirName}
                                                </span>
                                            </td>

                                            {/* Role */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${roleBadge.bg}`}
                                                >
                                                    {roleBadge.label}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${statusBadge.bg}`}
                                                >
                                                    <StatusIcon size={13} />
                                                    {statusBadge.label}
                                                </span>
                                            </td>

                                            {/* Registered Date */}
                                            <td className="px-5 py-4 text-xs text-ink-500 whitespace-nowrap">
                                                {formatDate(u.created_at)}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {u.status === 'pending' && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleApprove(u)}
                                                                disabled={saving}
                                                                title="Approve User"
                                                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 hover:text-emerald-800 disabled:opacity-50"
                                                            >
                                                                <CheckCircle2 size={14} />
                                                                Approve
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenReject(u)}
                                                                disabled={saving}
                                                                title="Reject User"
                                                                className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 hover:text-red-800 disabled:opacity-50"
                                                            >
                                                                <XCircle size={14} />
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => handleReview(u)}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                                                    >
                                                        <Edit3 size={13} />
                                                        Review
                                                    </button>

                                                    {can('users.delete') && u.id !== currentUser?.id && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteTarget(u)}
                                                            disabled={saving}
                                                            title="Delete User"
                                                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 hover:text-red-800 disabled:opacity-50"
                                                        >
                                                            <Trash2 size={14} />
                                                            Delete
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

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-blue-100 px-5 py-3 text-xs text-ink-500">
                        <span>
                            Page {pagination.current_page} of {pagination.last_page} ({pagination.total} users)
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="rounded-lg border border-blue-200 p-1.5 text-ink-600 transition hover:bg-blue-50 disabled:opacity-40"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                                disabled={page === pagination.last_page}
                                className="rounded-lg border border-blue-200 p-1.5 text-ink-600 transition hover:bg-blue-50 disabled:opacity-40"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Review & Edit User Modal */}
            {selectedUser && (
                <Modal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title={`Review User: ${selectedUser.name}`}
                    size="lg"
                >
                    <div className="space-y-6">
                        {/* User Overview Summary Card */}
                        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Full Name</p>
                                    <p className="mt-0.5 text-sm font-bold text-ink-900">{selectedUser.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Email</p>
                                    <p className="mt-0.5 text-sm font-medium text-ink-800">{selectedUser.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Phone</p>
                                    <p className="mt-0.5 text-sm font-medium text-ink-800">{selectedUser.phone || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Registered Date</p>
                                    <p className="mt-0.5 text-sm font-medium text-ink-800">{formatDate(selectedUser.created_at)}</p>
                                </div>
                            </div>

                            {selectedUser.approved_at && (
                                <div className="mt-3 border-t border-blue-200/60 pt-3 text-xs text-emerald-800">
                                    Approved on {formatDate(selectedUser.approved_at)}
                                    {selectedUser.approver_name && ` by ${selectedUser.approver_name}`}
                                </div>
                            )}

                            {selectedUser.rejection_reason && (
                                <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
                                    <span className="font-semibold">Rejection reason:</span> {selectedUser.rejection_reason}
                                </div>
                            )}
                        </div>

                        {/* Edit Role & Choir Assignment Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-ink-600">
                                Assignments & Permissions
                            </h3>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Role Selection */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-ink-700">
                                        Assign Role <span className="text-blue-600">*</span>
                                    </label>
                                    <select
                                        value={editRole}
                                        onChange={(e) => setEditRole(e.target.value)}
                                        className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="member">MEMBER (Standard choir member)</option>
                                        <option value="team_leader">TEAM_LEADER (Choir leader / conductor)</option>
                                        <option value="admin">ADMIN (System administrator)</option>
                                    </select>
                                    <p className="mt-1 text-xs text-ink-400">
                                        Changes to role are validated server-side.
                                    </p>
                                </div>

                                {/* Choir Selection */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-ink-700">
                                        Assign Choir <span className="text-blue-600">*</span>
                                    </label>
                                    <select
                                        value={editChoirId}
                                        onChange={(e) => setEditChoirId(e.target.value)}
                                        className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="">-- Select Choir --</option>
                                        {choirs.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-ink-400">
                                        Assigns the user to this active choir.
                                    </p>
                                </div>
                            </div>

                            {/* Status Selection */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-ink-700">
                                    Account Status
                                </label>
                                <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value)}
                                    className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="pending">PENDING (Waiting for approval)</option>
                                    <option value="approved">APPROVED (Full login access allowed)</option>
                                    <option value="rejected">REJECTED (Access denied)</option>
                                </select>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-blue-100 pt-5">
                            <div className="flex items-center gap-2">
                                {selectedUser.status === 'pending' && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => handleApprove(selectedUser)}
                                            disabled={saving}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            <CheckCircle2 size={16} />
                                            Approve Account
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenReject(selectedUser)}
                                            disabled={saving}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                                        >
                                            <XCircle size={16} />
                                            Reject
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    loading={saving}
                                    onClick={handleSaveChanges}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Reject Confirmation Modal */}
            {rejectModalOpen && (
                <Modal
                    open={rejectModalOpen}
                    onClose={() => setRejectModalOpen(false)}
                    title="Reject Registration"
                    size="md"
                >
                    <div className="space-y-4">
                        <p className="text-sm text-ink-600">
                            Are you sure you want to reject the registration for{' '}
                            <span className="font-semibold text-ink-900">{selectedUser?.name}</span>?
                        </p>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-ink-700">
                                Rejection Reason (Optional)
                            </label>
                            <textarea
                                rows={3}
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Provide a reason for rejection (e.g. invalid information or choir full)..."
                                className="w-full rounded-xl border border-blue-200 p-3 text-sm text-ink-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        <div className="flex justify-end gap-2 border-t border-blue-100 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setRejectModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                loading={saving}
                                onClick={handleConfirmReject}
                            >
                                Confirm Rejection
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Create User Modal */}
            {createModalOpen && (
                <Modal
                    open={createModalOpen}
                    onClose={closeCreateModal}
                    title="Create User"
                    size="lg"
                >
                    <form onSubmit={handleCreateSubmit} className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Full Name"
                                value={createForm.name}
                                onChange={handleCreateChange('name')}
                                error={createErrors.name?.[0]}
                                maxLength={100}
                                placeholder="Daniel Mekonnen"
                                required
                            />
                            <Input
                                label="Email"
                                type="email"
                                value={createForm.email}
                                onChange={handleCreateChange('email')}
                                error={createErrors.email?.[0]}
                                required
                            />
                            <Input
                                label="Phone"
                                prefix="+251"
                                value={createForm.phone}
                                onChange={handleCreatePhoneChange}
                                error={createErrors.phone?.[0]}
                                placeholder="912345678"
                                maxLength={9}
                                hint="9 digits, starting with 9 (e.g. 912345678)"
                                required
                            />
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-ink-700">
                                    Choir <span className="text-blue-600">*</span>
                                </label>
                                <select
                                    value={createForm.choir_id}
                                    onChange={handleCreateChange('choir_id')}
                                    className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="">-- Select Choir --</option>
                                    {choirs.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                {createErrors.choir_id?.[0] && (
                                    <p className="mt-1 text-xs text-red-600">{createErrors.choir_id[0]}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-ink-700">
                                    Role <span className="text-blue-600">*</span>
                                </label>
                                <select
                                    value={createForm.role}
                                    onChange={handleCreateChange('role')}
                                    className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="member">MEMBER (Standard choir member)</option>
                                    <option value="team_leader">TEAM_LEADER (Choir leader / conductor)</option>
                                    <option value="admin">ADMIN (System administrator)</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-ink-700">
                                    Account Status
                                </label>
                                <select
                                    value={createForm.status}
                                    onChange={handleCreateChange('status')}
                                    className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="pending">PENDING (Waiting for approval)</option>
                                    <option value="approved">APPROVED (Full login access allowed)</option>
                                    <option value="rejected">REJECTED (Access denied)</option>
                                </select>
                            </div>
                        </div>

                        <div className="border-t border-blue-100 pt-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                                Password
                            </p>
                            <div className="space-y-3">
                                <PasswordInput
                                    label="Password"
                                    value={createForm.password}
                                    onChange={handleCreateChange('password')}
                                    error={createErrors.password?.[0]}
                                    required
                                    minLength={8}
                                />
                                <PasswordInput
                                    label="Confirm Password"
                                    value={createForm.password_confirmation}
                                    onChange={handleCreateChange('password_confirmation')}
                                    error={createErrors.password_confirmation?.[0]}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-blue-100 pt-5">
                            <div className="flex items-center gap-2 text-xs text-ink-500">
                                <span>Admin-created users are auto-approved by default.</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" onClick={closeCreateModal} disabled={createSaving}>
                                    Cancel
                                </Button>
                                <Button variant="primary" loading={createSaving} type="submit">
                                    Create User
                                </Button>
                            </div>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Delete User Confirmation */}
            {deleteTarget && (
                <Modal
                    open={!!deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    title="Delete User"
                    size="sm"
                >
                    <div className="space-y-4">
                        <p className="text-sm text-ink-700">
                            Are you sure you want to delete this user?
                        </p>
                        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                            <span className="font-semibold">{deleteTarget.name}</span>{' '}
                            ({deleteTarget.email})
                        </div>
                        <p className="text-xs text-ink-400">
                            This action cannot be undone. If the user has related records (choirs,
                            members, or activity logs), deletion will be blocked and you should
                            deactivate them instead.
                        </p>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                                Cancel
                            </Button>
                            <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
                                {deleting ? 'Deleting…' : 'Delete User'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
