import { useState, useEffect, useCallback } from 'react';
import {
    Users,
    Search,
    Filter,
    Church,
    Eye,
    Phone,
    Mail,
    CheckCircle2,
    Clock,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    X,
    Sparkles,
} from 'lucide-react';
import { api } from '../../axios';
import { useChoir } from '../../context/ChoirContext';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const STATUS_BADGES = {
    approved: { label: 'Approved', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
    pending: { label: 'Pending', bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
    rejected: { label: 'Rejected', bg: 'bg-red-100 text-red-800 border-red-300', icon: AlertCircle },
};

const ROLE_BADGES = {
    admin: { label: 'Admin', bg: 'bg-purple-100 text-purple-700 border-purple-200' },
    'super-admin': { label: 'Super Admin', bg: 'bg-purple-100 text-purple-700 border-purple-200' },
    team_leader: { label: 'Team Leader', bg: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    member: { label: 'Member', bg: 'bg-blue-100 text-blue-700 border-blue-200' },
};

function formatDate(val) {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function AdminMembersPage() {
    const { currentChoir, setCurrentChoir, isAllChoirs, choirs: contextChoirs } = useChoir();
    const [members, setMembers] = useState([]);
    const [choirs, setChoirs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [statusFilter, setStatusFilter] = useState('all');
    const [choirFilter, setChoirFilter] = useState(currentChoir?.id?.toString() || 'all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const [selectedMember, setSelectedMember] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [toast, setToast] = useState(null);

    // Sync choirs list from context or public endpoint
    useEffect(() => {
        if (contextChoirs && contextChoirs.length > 0) {
            setChoirs(contextChoirs);
        } else {
            api.get('/public/choirs?per_page=100')
                .then((res) => {
                    const items = res.data?.data?.items || res.data?.data || [];
                    setChoirs(items);
                })
                .catch(() => {});
        }
    }, [contextChoirs]);

    // React immediately when the global choir selector in the sidebar/header changes
    useEffect(() => {
        if (currentChoir?.id) {
            setChoirFilter(currentChoir.id.toString());
        } else if (isAllChoirs) {
            setChoirFilter('all');
        }
        setPage(1);
    }, [currentChoir, isAllChoirs]);

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                choir_id: choirFilter !== 'all' ? choirFilter : undefined,
                search: search.trim() || undefined,
            };

            const res = await api.get('/admin/members', { params });
            const data = res.data?.data || {};
            setMembers(data.items || []);
            if (data.pagination) {
                setPagination(data.pagination);
            }
        } catch (err) {
            setToast({ variant: 'error', message: err.message || 'Failed to load members' });
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, choirFilter, search]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const handleChoirFilterChange = (newChoirId) => {
        setChoirFilter(newChoirId);
        setPage(1);
        if (newChoirId === 'all') {
            setCurrentChoir(null);
        } else {
            const matched = choirs.find((c) => c.id.toString() === newChoirId);
            if (matched) setCurrentChoir(matched);
        }
    };

    const openView = (member) => {
        setSelectedMember(member);
        setModalOpen(true);
    };

    const activeChoirName = choirFilter !== 'all'
        ? (choirs.find((c) => c.id.toString() === choirFilter)?.name || currentChoir?.name || 'Selected Choir')
        : 'All Choirs';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {choirFilter !== 'all' ? `${activeChoirName} Members` : 'Members — All Choirs'}
                    </h1>
                    <p className="text-sm text-slate-500">
                        {choirFilter !== 'all'
                            ? `Showing active members belonging to ${activeChoirName}.`
                            : 'View and manage choir members across all authorized choirs.'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-xs">
                        <Users size={14} />
                        Total Members: {pagination.total}
                    </span>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className="relative">
                    <Alert variant={toast.variant} title={toast.message} onClose={() => setToast(null)} />
                </div>
            )}

            {/* Filters & Search */}
            <div className="grid gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative sm:col-span-2">
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-full rounded-xl border border-blue-200 bg-white px-4 py-2.5 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>

                <div>
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                        className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="all">All Statuses</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>

                <div>
                    <select
                        value={choirFilter}
                        onChange={(e) => handleChoirFilterChange(e.target.value)}
                        className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="all">All Choirs</option>
                        {choirs.map((c) => (
                            <option key={c.id} value={c.id.toString()}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Members Table */}
            <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
                {loading ? (
                    <div className="flex justify-center py-24">
                        <LoadingSpinner size={36} />
                    </div>
                ) : members.length === 0 ? (
                    <div className="py-20 text-center text-slate-500">
                        <Users size={40} className="mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-700">No members found</p>
                        <p className="text-xs text-slate-400">
                            {choirFilter !== 'all'
                                ? `No members found for ${activeChoirName}. Try adjusting status or search terms.`
                                : 'Try adjusting your filters or search terms.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="border-b border-blue-100 bg-blue-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-5 py-3.5">Name</th>
                                    <th className="px-5 py-3.5">Email</th>
                                    <th className="px-5 py-3.5">Phone</th>
                                    <th className="px-5 py-3.5">Choir</th>
                                    <th className="px-5 py-3.5">Role</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5">Created</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50">
                                {members.map((m) => {
                                    const name = m.full_name || m.name || m.email || 'Unknown';
                                    const statusBadge = STATUS_BADGES[m.status] || STATUS_BADGES.approved;
                                    const StatusIcon = statusBadge.icon;
                                    const roleBadge = ROLE_BADGES[m.user_role || m.role] || ROLE_BADGES.member;
                                    const choirName = m.choir?.name || m.choirs?.[0]?.name || 'Unassigned';
                                    const initials = (name || '?')
                                        .split(' ')
                                        .map((p) => p[0])
                                        .filter(Boolean)
                                        .slice(0, 2)
                                        .join('')
                                        .toUpperCase();

                                    return (
                                        <tr key={m.id} className="transition-colors hover:bg-blue-50/40">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm">
                                                        {initials}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-900 truncate">{name}</p>
                                                        {m.member_code && (
                                                            <p className="text-xs text-slate-400 truncate">{m.member_code}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                                                {m.email || '—'}
                                            </td>
                                            <td className="px-5 py-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                                                {m.phone || '—'}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-900">
                                                    <Church size={14} className="text-blue-500" />
                                                    {choirName}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${roleBadge.bg}`}
                                                >
                                                    {roleBadge.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${statusBadge.bg}`}
                                                >
                                                    <StatusIcon size={13} />
                                                    {statusBadge.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                                                {formatDate(m.created_at)}
                                            </td>
                                            <td className="px-5 py-4 text-right whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => openView(m)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                                                >
                                                    <Eye size={13} />
                                                    View
                                                </button>
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
                    <div className="flex items-center justify-between border-t border-blue-100 px-5 py-3 text-xs text-slate-500">
                        <span>
                            Page {pagination.current_page} of {pagination.last_page} ({pagination.total} members)
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="rounded-lg border border-blue-200 p-1.5 text-slate-600 transition hover:bg-blue-50 disabled:opacity-40"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                                disabled={page === pagination.last_page}
                                className="rounded-lg border border-blue-200 p-1.5 text-slate-600 transition hover:bg-blue-50 disabled:opacity-40"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* View Member Modal */}
            {selectedMember && (
                <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Member Details" size="md">
                    <div className="space-y-4">
                        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                            <p className="text-lg font-bold text-slate-900">
                                {selectedMember.full_name || selectedMember.name || selectedMember.email}
                            </p>
                            {selectedMember.member_code && (
                                <p className="text-xs text-slate-400">{selectedMember.member_code}</p>
                            )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email</p>
                                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-slate-800">
                                    <Mail size={14} className="text-slate-400" />
                                    {selectedMember.email || '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Phone</p>
                                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-slate-800">
                                    <Phone size={14} className="text-slate-400" />
                                    {selectedMember.phone || '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Choir</p>
                                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-slate-800">
                                    <Church size={14} className="text-slate-400" />
                                    {selectedMember.choir?.name || selectedMember.choirs?.[0]?.name || 'Unassigned'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Role</p>
                                <p className="mt-0.5 text-sm font-medium text-slate-800">
                                    {(ROLE_BADGES[selectedMember.user_role || selectedMember.role] || ROLE_BADGES.member).label}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status</p>
                                <p className="mt-0.5 text-sm font-medium text-slate-800">
                                    {(STATUS_BADGES[selectedMember.status] || STATUS_BADGES.approved).label}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Created</p>
                                <p className="mt-0.5 text-sm font-medium text-slate-800">
                                    {formatDate(selectedMember.created_at)}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end border-t border-blue-100 pt-4">
                            <Button variant="outline" onClick={() => setModalOpen(false)}>
                                <X size={16} className="mr-2" /> Close
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
