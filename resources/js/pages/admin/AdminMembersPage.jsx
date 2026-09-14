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
    UserPlus,
    Calendar,
    Baby,
    UserCheck,
    Pencil,
    Shield,
    HeartHandshake,
    Music,
    CalendarDays,
    CalendarClock,
    FileText,
    Check,
    HelpCircle,
    PhoneCall,
    MapPin,
    AlertTriangle,
} from 'lucide-react';
import { api } from '../../axios';
import { useChoir } from '../../context/ChoirContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const STATUS_BADGES = {
    active: { label: 'Active', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
    approved: { label: 'Approved', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
    inactive: { label: 'Inactive', bg: 'bg-slate-100 text-slate-700 border-slate-300', icon: Clock },
    suspended: { label: 'Suspended', bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: AlertTriangle },
    former: { label: 'Former', bg: 'bg-slate-100 text-slate-600 border-slate-300', icon: Clock },
    transferred: { label: 'Transferred', bg: 'bg-purple-100 text-purple-800 border-purple-300', icon: Users },
    graduated: { label: 'Graduated / Adult', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: Sparkles },
};

function formatDate(val) {
    if (!val) return '—';
    try {
        return new Date(val).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return val;
    }
}

function calculateAge(dob) {
    if (!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(diff);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    return isNaN(age) ? null : age;
}

export default function AdminMembersPage() {
    const { user } = useAuth();
    const { currentChoir, setCurrentChoir, isAllChoirs, choirs: contextChoirs } = useChoir();

    const [members, setMembers] = useState([]);
    const [choirs, setChoirs] = useState([]);
    const [voiceSections, setVoiceSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

    // Filters
    const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'adult' | 'child'
    const [statusFilter, setStatusFilter] = useState('all');
    const [choirFilter, setChoirFilter] = useState(currentChoir?.id?.toString() || 'all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    // Selected member for profile modal
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberDetail, setMemberDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [activeProfileTab, setActiveProfileTab] = useState('attendance'); // 'attendance' | 'rehearsals' | 'performances' | 'songs'

    // Add Member Modal state
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [memberTypeChoice, setMemberTypeChoice] = useState('child'); // 'adult' | 'child'
    const [addSaving, setAddSaving] = useState(false);
    const [addErrors, setAddErrors] = useState({});

    // Add Child Form fields
    const [childForm, setChildForm] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        date_of_birth: '',
        gender: '',
        choir_id: '',
        voice_section_id: '',
        grade_school_level: '',
        emergency_notes: '',
        special_notes: '',
        photo: null,
        // Guardian fields
        guardian_name: '',
        guardian_relationship: 'Mother',
        guardian_relationship_other: '',
        guardian_phone: '',
        guardian_alt_phone: '',
        guardian_email: '',
        guardian_address: '',
        // Consent
        consent_confirmed: false,
    });

    // Add Adult Form fields
    const [adultForm, setAdultForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        choir_id: '',
        voice_section_id: '',
        role_title: '',
        create_user_account: true,
        password: '',
    });

    // Edit Member Modal state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [editSaving, setEditSaving] = useState(false);
    const [editErrors, setEditErrors] = useState({});

    const [toast, setToast] = useState(null);

    const showToast = (variant, message) => {
        setToast({ variant, message });
        setTimeout(() => setToast(null), 5000);
    };

    // Sync choirs list
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

    // React immediately when global choir changes
    useEffect(() => {
        if (currentChoir?.id) {
            setChoirFilter(currentChoir.id.toString());
        } else if (isAllChoirs) {
            setChoirFilter('all');
        }
        setPage(1);
    }, [currentChoir, isAllChoirs]);

    // Load voice sections when choir is selected
    useEffect(() => {
        const effectiveChoirId = choirFilter !== 'all' ? choirFilter : (choirs[0]?.id || currentChoir?.id);
        if (effectiveChoirId) {
            api.get(`/choirs/${effectiveChoirId}/voice-sections`)
                .then((res) => {
                    const items = res.data?.data?.items || res.data?.data || [];
                    setVoiceSections(Array.isArray(items) ? items : []);
                })
                .catch(() => setVoiceSections([]));
        }
    }, [choirFilter, choirs, currentChoir]);

    // Fetch members
    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page,
                type: typeFilter !== 'all' ? typeFilter : undefined,
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
            showToast('error', err.response?.data?.message || err.message || 'Failed to load members');
        } finally {
            setLoading(false);
        }
    }, [page, typeFilter, statusFilter, choirFilter, search]);

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

    // Open detailed profile modal
    const openProfile = async (member) => {
        setSelectedMember(member);
        setProfileModalOpen(true);
        setDetailLoading(true);
        setActiveProfileTab('attendance');

        try {
            const choirId = member.choir_id || member.choir?.id;
            const res = await api.get(`/choirs/${choirId}/members/${member.id}`);
            setMemberDetail(res.data?.data || null);
        } catch {
            setMemberDetail(null);
        } finally {
            setDetailLoading(false);
        }
    };

    // Open Add Member Modal
    const openAddModal = () => {
        const defaultChoirId = (choirFilter !== 'all' ? choirFilter : (currentChoir?.id?.toString() || choirs[0]?.id?.toString() || ''));
        setChildForm({
            first_name: '',
            middle_name: '',
            last_name: '',
            date_of_birth: '',
            gender: 'Female',
            choir_id: defaultChoirId,
            voice_section_id: '',
            grade_school_level: '',
            emergency_notes: '',
            special_notes: '',
            photo: null,
            guardian_name: '',
            guardian_relationship: 'Mother',
            guardian_relationship_other: '',
            guardian_phone: '',
            guardian_alt_phone: '',
            guardian_email: '',
            guardian_address: '',
            consent_confirmed: false,
        });
        setAdultForm({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            choir_id: defaultChoirId,
            voice_section_id: '',
            role_title: '',
            create_user_account: true,
            password: '',
        });
        setMemberTypeChoice('child');
        setAddErrors({});
        setAddModalOpen(true);
    };

    // Submit Add Member
    const handleAddMember = async (e) => {
        e.preventDefault();
        setAddSaving(true);
        setAddErrors({});

        try {
            if (memberTypeChoice === 'child') {
                if (!childForm.consent_confirmed) {
                    setAddErrors({ consent_confirmed: ['Parent/Guardian consent must be confirmed to register a child.'] });
                    setAddSaving(false);
                    return;
                }

                const formData = new FormData();
                formData.append('member_type', 'child');
                formData.append('first_name', childForm.first_name);
                if (childForm.middle_name) formData.append('middle_name', childForm.middle_name);
                formData.append('last_name', childForm.last_name);
                formData.append('date_of_birth', childForm.date_of_birth);
                if (childForm.gender) formData.append('gender', childForm.gender);
                formData.append('choir_id', childForm.choir_id);
                if (childForm.voice_section_id) formData.append('voice_section_id', childForm.voice_section_id);
                if (childForm.grade_school_level) formData.append('grade_school_level', childForm.grade_school_level);
                if (childForm.emergency_notes) formData.append('emergency_notes', childForm.emergency_notes);
                if (childForm.special_notes) formData.append('special_notes', childForm.special_notes);
                if (childForm.photo) formData.append('photo', childForm.photo);

                // Guardian
                formData.append('guardian_name', childForm.guardian_name);
                formData.append('guardian_relationship', childForm.guardian_relationship);
                if (childForm.guardian_relationship === 'Other' && childForm.guardian_relationship_other) {
                    formData.append('guardian_relationship_other', childForm.guardian_relationship_other);
                }
                formData.append('guardian_phone', childForm.guardian_phone);
                if (childForm.guardian_alt_phone) formData.append('guardian_alt_phone', childForm.guardian_alt_phone);
                if (childForm.guardian_email) formData.append('guardian_email', childForm.guardian_email);
                if (childForm.guardian_address) formData.append('guardian_address', childForm.guardian_address);

                formData.append('consent_confirmed', '1');

                await api.post(`/choirs/${childForm.choir_id}/members`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                showToast('success', `Child member "${childForm.first_name} ${childForm.last_name}" registered successfully with parent contact.`);
            } else {
                // Adult member
                const payload = {
                    member_type: 'adult',
                    first_name: adultForm.first_name,
                    last_name: adultForm.last_name,
                    email: adultForm.email,
                    phone: adultForm.phone,
                    choir_id: adultForm.choir_id,
                    voice_section_id: adultForm.voice_section_id || null,
                    role_title: adultForm.role_title || null,
                    create_user_account: adultForm.create_user_account,
                    password: adultForm.password || undefined,
                };

                await api.post(`/choirs/${adultForm.choir_id}/members`, payload);
                showToast('success', `Adult member "${adultForm.first_name} ${adultForm.last_name}" registered successfully.`);
            }

            setAddModalOpen(false);
            fetchMembers();
        } catch (err) {
            const errs = err.response?.data?.errors || {};
            setAddErrors(errs);
            showToast('error', err.response?.data?.message || 'Failed to register member. Please check fields.');
        } finally {
            setAddSaving(false);
        }
    };

    // Open Edit Member Modal
    const openEditModal = (member) => {
        const primaryG = member.primary_guardian || (member.guardians && member.guardians[0]) || null;
        setEditForm({
            id: member.id,
            choir_id: member.choir_id,
            first_name: member.first_name || '',
            middle_name: member.middle_name || '',
            last_name: member.last_name || '',
            date_of_birth: member.date_of_birth || '',
            gender: member.gender || '',
            voice_section_id: member.voice_section_id || member.voice_section?.id || '',
            grade_school_level: member.grade_school_level || '',
            status: member.status || 'active',
            bio: member.bio || '',
            notes: member.notes || '',
            emergency_notes: member.emergency_notes || '',
            special_notes: member.special_notes || '',
            // Guardian
            guardian_name: primaryG?.full_name || '',
            guardian_relationship: primaryG?.raw_relationship || primaryG?.relationship || 'Mother',
            guardian_relationship_other: primaryG?.relationship_other || '',
            guardian_phone: primaryG?.phone || '',
            guardian_alt_phone: primaryG?.alt_phone || '',
            guardian_email: primaryG?.email || '',
            guardian_address: primaryG?.address || '',
            // Adult contact
            phone: member.phone || '',
            email: member.email || '',
        });
        setEditErrors({});
        setEditModalOpen(true);
    };

    // Submit Edit Member
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditSaving(true);
        setEditErrors({});

        try {
            await api.put(`/choirs/${editForm.choir_id}/members/${editForm.id}`, editForm);
            showToast('success', 'Member updated successfully.');
            setEditModalOpen(false);
            fetchMembers();
            if (selectedMember && selectedMember.id === editForm.id) {
                openProfile({ ...selectedMember, ...editForm });
            }
        } catch (err) {
            setEditErrors(err.response?.data?.errors || {});
            showToast('error', err.response?.data?.message || 'Failed to update member.');
        } finally {
            setEditSaving(false);
        }
    };

    // Deactivate member
    const handleDeactivate = async (member) => {
        if (!window.confirm(`Are you sure you want to deactivate ${member.full_name}? Historical attendance and performance records will be preserved.`)) {
            return;
        }

        try {
            await api.delete(`/choirs/${member.choir_id}/members/${member.id}`);
            showToast('success', `${member.full_name} has been deactivated and retained in history.`);
            fetchMembers();
            setProfileModalOpen(false);
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to deactivate member.');
        }
    };

    const activeChoirName = choirFilter !== 'all'
        ? (choirs.find((c) => c.id.toString() === choirFilter)?.name || currentChoir?.name || 'Selected Choir')
        : 'All Choirs';

    // Real-time calculated age for child form
    const childAge = calculateAge(childForm.date_of_birth);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        {choirFilter !== 'all' ? `${activeChoirName} Members` : 'Choir Members'}
                    </h1>
                    <p className="text-sm text-slate-500">
                        Manage choir members (adults & children under 18), attendance, performances, and parent/guardian contacts.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-xs">
                        <Users size={14} />
                        Total Members: {pagination.total}
                    </span>
                    <Button
                        variant="primary"
                        onClick={openAddModal}
                        className="shadow-sm"
                    >
                        <UserPlus size={16} className="mr-1.5" />
                        Add Member
                    </Button>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className="relative">
                    <Alert variant={toast.variant} title={toast.message} onClose={() => setToast(null)} />
                </div>
            )}

            {/* Quick Member Type Filter Pills & Search Toolbar */}
            <div className="space-y-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Member Type Switcher */}
                    <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/70">
                        {[
                            { key: 'all', label: 'All Members', icon: Users },
                            { key: 'adult', label: 'Adult Members', icon: UserCheck },
                            { key: 'child', label: 'Children (Under 18)', icon: Baby },
                        ].map((btn) => {
                            const Icon = btn.icon;
                            const active = typeFilter === btn.key;
                            return (
                                <button
                                    key={btn.key}
                                    type="button"
                                    onClick={() => {
                                        setTypeFilter(btn.key);
                                        setPage(1);
                                    }}
                                    className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                                        active
                                            ? 'bg-white text-blue-700 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <Icon size={14} />
                                    {btn.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="text-xs text-slate-500 font-medium">
                        Showing {members.length} of {pagination.total} registered members
                    </div>
                </div>

                {/* Filters Grid */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-1">
                    <div className="relative sm:col-span-2">
                        <input
                            type="text"
                            placeholder="Search by member name, parent name, phone, code..."
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
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="transferred">Transferred</option>
                            <option value="graduated">Graduated / Adult</option>
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
            </div>

            {/* Members Table */}
            <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
                {loading ? (
                    <div className="flex justify-center py-24">
                        <LoadingSpinner size={36} />
                    </div>
                ) : members.length === 0 ? (
                    <div className="py-20 text-center text-slate-500">
                        <Users size={44} className="mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-700">No members found</p>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                            {typeFilter === 'child'
                                ? 'No child members found matching current filters. Click "Add Member" to register a child under 18.'
                                : 'Try adjusting your filters or search terms.'}
                        </p>
                        <Button variant="outline" size="sm" onClick={openAddModal} className="mt-4">
                            <UserPlus size={14} className="mr-1.5" /> Add Member
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="border-b border-blue-100 bg-blue-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-5 py-3.5">Member</th>
                                    <th className="px-5 py-3.5">Type & Age</th>
                                    <th className="px-5 py-3.5">Contact / Guardian</th>
                                    <th className="px-5 py-3.5">Choir & Section</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50">
                                {members.map((m) => {
                                    const name = m.full_name || `${m.first_name || ''} ${m.last_name || ''}`.trim() || 'Member';
                                    const isChild = m.is_child || m.member_type === 'child';
                                    const statusBadge = STATUS_BADGES[m.status] || STATUS_BADGES.active;
                                    const choirName = m.choir?.name || 'Unassigned';
                                    const sectionName = m.voice_section?.name || '—';
                                    const primaryG = m.primary_guardian || (m.guardians && m.guardians[0]) || null;
                                    const age = m.age !== undefined && m.age !== null ? m.age : calculateAge(m.date_of_birth);

                                    return (
                                        <tr key={m.id} className="transition-colors hover:bg-blue-50/40">
                                            {/* Name & Code */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs ${
                                                        isChild ? 'bg-amber-500 ring-2 ring-amber-200' : 'bg-blue-600 ring-2 ring-blue-200'
                                                    }`}>
                                                        {isChild ? <Baby size={18} /> : (name.charAt(0) || 'M')}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
                                                            {name}
                                                        </p>
                                                        {m.member_code && (
                                                            <p className="text-xs text-slate-400 font-mono">#{m.member_code}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Member Type & Age */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                {isChild ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 shadow-2xs">
                                                        <Baby size={13} className="text-amber-600" />
                                                        Child — Under 18
                                                        {age !== null && <span className="text-amber-900 ml-1">({age} yrs)</span>}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                                        <UserCheck size={13} className="text-blue-500" />
                                                        Adult Member
                                                    </span>
                                                )}
                                            </td>

                                            {/* Contact / Parent Contact */}
                                            <td className="px-5 py-4 text-xs whitespace-nowrap">
                                                {isChild ? (
                                                    primaryG ? (
                                                        <div className="space-y-0.5">
                                                            <p className="font-semibold text-slate-800 flex items-center gap-1">
                                                                <HeartHandshake size={13} className="text-amber-600" />
                                                                {primaryG.full_name} <span className="text-slate-400">({primaryG.relationship})</span>
                                                            </p>
                                                            {primaryG.phone && (
                                                                <a
                                                                    href={`tel:${primaryG.phone}`}
                                                                    className="inline-flex items-center gap-1 font-mono text-blue-600 hover:text-blue-800 hover:underline"
                                                                >
                                                                    <Phone size={12} /> {primaryG.phone}
                                                                </a>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">Parent info pending</span>
                                                    )
                                                ) : (
                                                    <div className="space-y-0.5">
                                                        {m.phone ? (
                                                            <p className="font-mono text-slate-700 flex items-center gap-1">
                                                                <Phone size={12} className="text-slate-400" /> {m.phone}
                                                            </p>
                                                        ) : null}
                                                        {m.email ? (
                                                            <p className="text-slate-500 flex items-center gap-1">
                                                                <Mail size={12} className="text-slate-400" /> {m.email}
                                                            </p>
                                                        ) : null}
                                                        {!m.phone && !m.email && <span className="text-slate-400">—</span>}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Choir & Section */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <p className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                                                    <Church size={13} className="text-blue-500 shrink-0" />
                                                    {choirName}
                                                </p>
                                                <p className="text-xs text-slate-500 pl-4">{sectionName}</p>
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${statusBadge.bg}`}>
                                                    {statusBadge.label}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openProfile(m)}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
                                                        title="View Member Profile"
                                                    >
                                                        <Eye size={13} /> View
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(m)}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                                        title="Edit Member"
                                                    >
                                                        <Pencil size={13} /> Edit
                                                    </button>
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

            {/* ─────────────────── ADD MEMBER MODAL ─────────────────── */}
            <Modal
                open={addModalOpen}
                onClose={() => !addSaving && setAddModalOpen(false)}
                title="Register Choir Member"
                size="lg"
            >
                <form onSubmit={handleAddMember} className="space-y-6">
                    {/* Member Type Selection Box */}
                    <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/50 p-4">
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-blue-900 mb-2.5">
                            Select Member Type *
                        </label>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {/* Adult Member Option */}
                            <label
                                className={`flex items-start gap-3 rounded-xl border-2 p-3.5 cursor-pointer transition-all ${
                                    memberTypeChoice === 'adult'
                                        ? 'border-blue-600 bg-white shadow-sm ring-2 ring-blue-500/20'
                                        : 'border-slate-200 bg-white/70 hover:border-slate-300'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="member_type_choice"
                                    value="adult"
                                    checked={memberTypeChoice === 'adult'}
                                    onChange={() => setMemberTypeChoice('adult')}
                                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                                />
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <UserCheck size={16} className="text-blue-600" />
                                        <p className="font-bold text-slate-900 text-sm">Adult Member</p>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                                        Member has their own device, personal phone, and login account.
                                    </p>
                                </div>
                            </label>

                            {/* Child Member Option */}
                            <label
                                className={`flex items-start gap-3 rounded-xl border-2 p-3.5 cursor-pointer transition-all ${
                                    memberTypeChoice === 'child'
                                        ? 'border-amber-500 bg-white shadow-sm ring-2 ring-amber-500/20'
                                        : 'border-slate-200 bg-white/70 hover:border-slate-300'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="member_type_choice"
                                    value="child"
                                    checked={memberTypeChoice === 'child'}
                                    onChange={() => setMemberTypeChoice('child')}
                                    className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500"
                                />
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <Baby size={16} className="text-amber-600" />
                                        <p className="font-bold text-slate-900 text-sm">Child Member (Under 18)</p>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                                        Registered using parent/guardian contact. No child phone or password required.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* ── CHILD REGISTRATION FORM ── */}
                    {memberTypeChoice === 'child' && (
                        <div className="space-y-5">
                            {/* Child Information Section */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Baby size={16} className="text-amber-600" />
                                        Child Information
                                    </h3>
                                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                        No child phone/email required
                                    </span>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={childForm.first_name}
                                            onChange={(e) => setChildForm({ ...childForm, first_name: e.target.value })}
                                            placeholder="Child's first name"
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                        {addErrors.first_name && <p className="text-xs text-red-500 mt-1">{addErrors.first_name[0]}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Middle Name</label>
                                        <input
                                            type="text"
                                            value={childForm.middle_name}
                                            onChange={(e) => setChildForm({ ...childForm, middle_name: e.target.value })}
                                            placeholder="Middle name"
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Last Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={childForm.last_name}
                                            onChange={(e) => setChildForm({ ...childForm, last_name: e.target.value })}
                                            placeholder="Last name"
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                        {addErrors.last_name && <p className="text-xs text-red-500 mt-1">{addErrors.last_name[0]}</p>}
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth *</label>
                                        <input
                                            type="date"
                                            required
                                            value={childForm.date_of_birth}
                                            onChange={(e) => setChildForm({ ...childForm, date_of_birth: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                        {addErrors.date_of_birth && <p className="text-xs text-red-500 mt-1">{addErrors.date_of_birth[0]}</p>}

                                        {/* Dynamic Age Badge */}
                                        {childAge !== null && (
                                            <div className="mt-1.5">
                                                {childAge < 18 ? (
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                                        <Check size={12} /> Age: {childAge} yrs (Child — Under 18)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                                                        <AlertTriangle size={12} /> Age is 18 or older ({childAge} yrs)
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                                        <select
                                            value={childForm.gender}
                                            onChange={(e) => setChildForm({ ...childForm, gender: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Female">Female</option>
                                            <option value="Male">Male</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Grade / School Level</label>
                                        <input
                                            type="text"
                                            value={childForm.grade_school_level}
                                            onChange={(e) => setChildForm({ ...childForm, grade_school_level: e.target.value })}
                                            placeholder="e.g., Grade 6, Primary"
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Choir *</label>
                                        <select
                                            required
                                            value={childForm.choir_id}
                                            onChange={(e) => setChildForm({ ...childForm, choir_id: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                                        >
                                            {choirs.map((c) => (
                                                <option key={c.id} value={c.id.toString()}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Voice Part / Section</label>
                                        <select
                                            value={childForm.voice_section_id}
                                            onChange={(e) => setChildForm({ ...childForm, voice_section_id: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                                        >
                                            <option value="">Select Voice Section</option>
                                            {voiceSections.map((v) => (
                                                <option key={v.id} value={v.id.toString()}>{v.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Notes</label>
                                        <textarea
                                            rows={2}
                                            value={childForm.emergency_notes}
                                            onChange={(e) => setChildForm({ ...childForm, emergency_notes: e.target.value })}
                                            placeholder="Allergies, emergency instructions, medical notes..."
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Special Participation Notes</label>
                                        <textarea
                                            rows={2}
                                            value={childForm.special_notes}
                                            onChange={(e) => setChildForm({ ...childForm, special_notes: e.target.value })}
                                            placeholder="Musical background, special accommodations..."
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Parent / Guardian Information Section */}
                            <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-4 space-y-4">
                                <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <HeartHandshake size={16} className="text-amber-700" />
                                        Parent / Guardian Information (Primary Contact)
                                    </h3>
                                    <span className="text-[11px] text-slate-500">Contact holder for child</span>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Parent/Guardian Full Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={childForm.guardian_name}
                                            onChange={(e) => setChildForm({ ...childForm, guardian_name: e.target.value })}
                                            placeholder="Responsible parent/guardian name"
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                        {addErrors.guardian_name && <p className="text-xs text-red-500 mt-1">{addErrors.guardian_name[0]}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Relationship to Child *</label>
                                        <select
                                            required
                                            value={childForm.guardian_relationship}
                                            onChange={(e) => setChildForm({ ...childForm, guardian_relationship: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                        >
                                            <option value="Mother">Mother</option>
                                            <option value="Father">Father</option>
                                            <option value="Legal Guardian">Legal Guardian</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                {childForm.guardian_relationship === 'Other' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Specify Relationship *</label>
                                        <input
                                            type="text"
                                            required
                                            value={childForm.guardian_relationship_other}
                                            onChange={(e) => setChildForm({ ...childForm, guardian_relationship_other: e.target.value })}
                                            placeholder="e.g., Grandmother, Aunt, Older Sibling"
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                        {addErrors.guardian_relationship_other && <p className="text-xs text-red-500 mt-1">{addErrors.guardian_relationship_other[0]}</p>}
                                    </div>
                                )}

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Primary Phone Number * <span className="text-slate-400 font-normal">(Child's contact)</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={childForm.guardian_phone}
                                            onChange={(e) => setChildForm({ ...childForm, guardian_phone: e.target.value })}
                                            placeholder="09XXXXXXXX"
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
                                        />
                                        {addErrors.guardian_phone && <p className="text-xs text-red-500 mt-1">{addErrors.guardian_phone[0]}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Alternative Phone</label>
                                        <input
                                            type="text"
                                            value={childForm.guardian_alt_phone}
                                            onChange={(e) => setChildForm({ ...childForm, guardian_alt_phone: e.target.value })}
                                            placeholder="Alternative phone"
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Email (Optional)</label>
                                        <input
                                            type="email"
                                            value={childForm.guardian_email}
                                            onChange={(e) => setChildForm({ ...childForm, guardian_email: e.target.value })}
                                            placeholder="parent@example.com"
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Home Address (Optional)</label>
                                        <input
                                            type="text"
                                            value={childForm.guardian_address}
                                            onChange={(e) => setChildForm({ ...childForm, guardian_address: e.target.value })}
                                            placeholder="Residence / Sub-city / House No."
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Consent Confirmation Checkbox */}
                            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        required
                                        checked={childForm.consent_confirmed}
                                        onChange={(e) => setChildForm({ ...childForm, consent_confirmed: e.target.checked })}
                                        className="mt-0.5 h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div className="text-xs leading-relaxed text-slate-700">
                                        <span className="font-bold text-slate-900 block">
                                            Parent / Guardian consent confirmed *
                                        </span>
                                        I confirm that parent/guardian permission has been received for the child to participate in choir rehearsals, attendance, and performances.
                                    </div>
                                </label>
                                {addErrors.consent_confirmed && (
                                    <p className="text-xs text-red-500 mt-1.5 pl-7">{addErrors.consent_confirmed[0]}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── ADULT REGISTRATION FORM ── */}
                    {memberTypeChoice === 'adult' && (
                        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <UserCheck size={16} className="text-blue-600" />
                                Adult Member Information
                            </h3>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={adultForm.first_name}
                                        onChange={(e) => setAdultForm({ ...adultForm, first_name: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Last Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={adultForm.last_name}
                                        onChange={(e) => setAdultForm({ ...adultForm, last_name: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                                    <input
                                        type="email"
                                        required
                                        value={adultForm.email}
                                        onChange={(e) => setAdultForm({ ...adultForm, email: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                                    <input
                                        type="text"
                                        required
                                        value={adultForm.phone}
                                        onChange={(e) => setAdultForm({ ...adultForm, phone: e.target.value })}
                                        placeholder="09XXXXXXXX"
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Choir *</label>
                                    <select
                                        required
                                        value={adultForm.choir_id}
                                        onChange={(e) => setAdultForm({ ...adultForm, choir_id: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                                    >
                                        {choirs.map((c) => (
                                            <option key={c.id} value={c.id.toString()}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Voice Part / Section</label>
                                    <select
                                        value={adultForm.voice_section_id}
                                        onChange={(e) => setAdultForm({ ...adultForm, voice_section_id: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="">Select Voice Section</option>
                                        {voiceSections.map((v) => (
                                            <option key={v.id} value={v.id.toString()}>{v.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Role Title (Optional)</label>
                                <input
                                    type="text"
                                    value={adultForm.role_title}
                                    onChange={(e) => setAdultForm({ ...adultForm, role_title: e.target.value })}
                                    placeholder="e.g., Section Leader, Vocalist"
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2.5">
                                <label className="flex items-center gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={adultForm.create_user_account}
                                        onChange={(e) => setAdultForm({ ...adultForm, create_user_account: e.target.checked })}
                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-xs font-bold text-slate-800">
                                        Create Login User Account for this Member
                                    </span>
                                </label>
                                {adultForm.create_user_account && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Initial Password (min 8 chars)</label>
                                        <input
                                            type="password"
                                            value={adultForm.password}
                                            onChange={(e) => setAdultForm({ ...adultForm, password: e.target.value })}
                                            placeholder="Leave blank for default Choir@1234"
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                        <Button variant="outline" type="button" onClick={() => setAddModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" loading={addSaving}>
                            <UserPlus size={16} className="mr-1.5" />
                            {memberTypeChoice === 'child' ? 'Register Child Member' : 'Register Adult Member'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ─────────────────── MEMBER PROFILE MODAL ─────────────────── */}
            {selectedMember && (
                <Modal
                    open={profileModalOpen}
                    onClose={() => setProfileModalOpen(false)}
                    title={selectedMember.is_child ? 'Child Member Profile' : 'Member Profile'}
                    size="lg"
                >
                    <div className="space-y-6">
                        {/* Member Header Card */}
                        <div className={`overflow-hidden rounded-2xl border p-5 ${
                            selectedMember.is_child
                                ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50'
                                : 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50'
                        }`}>
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-sm ${
                                        selectedMember.is_child ? 'bg-amber-500' : 'bg-blue-600'
                                    }`}>
                                        {selectedMember.is_child ? <Baby size={28} /> : (selectedMember.full_name?.charAt(0) || 'M')}
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-xl font-extrabold text-slate-900">
                                                {selectedMember.full_name}
                                            </h2>
                                            {selectedMember.is_child ? (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white px-2.5 py-0.5 text-xs font-bold text-amber-800 shadow-2xs">
                                                    <Baby size={12} className="text-amber-600" />
                                                    Child — Under 18
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-white px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                                    <UserCheck size={12} className="text-blue-600" />
                                                    Adult Member
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                                            <span className="flex items-center gap-1 font-semibold text-slate-800">
                                                <Church size={13} className="text-blue-600" />
                                                {selectedMember.choir?.name || 'Choir'}
                                            </span>
                                            {selectedMember.voice_section?.name && (
                                                <span className="flex items-center gap-1">
                                                    <Music size={13} className="text-slate-400" />
                                                    {selectedMember.voice_section.name}
                                                </span>
                                            )}
                                            {selectedMember.age !== undefined && selectedMember.age !== null && (
                                                <span className="font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-md">
                                                    Age: {selectedMember.age}
                                                </span>
                                            )}
                                            {selectedMember.member_code && (
                                                <span className="font-mono text-slate-400">
                                                    #{selectedMember.member_code}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => openEditModal(selectedMember)}>
                                        <Pencil size={13} className="mr-1" /> Edit
                                    </Button>
                                    <Button variant="danger" size="sm" onClick={() => handleDeactivate(selectedMember)}>
                                        Deactivate
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* ── PARENT / GUARDIAN CARD (For Children) ── */}
                        {selectedMember.is_child && (
                            <div className="rounded-2xl border-2 border-amber-200/90 bg-white p-4 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                                        <HeartHandshake size={16} className="text-amber-600" />
                                        Parent / Guardian Contact
                                    </h3>
                                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                        Primary Contact for Leader
                                    </span>
                                </div>

                                {selectedMember.primary_guardian || (selectedMember.guardians && selectedMember.guardians[0]) ? (
                                    (() => {
                                        const g = selectedMember.primary_guardian || selectedMember.guardians[0];
                                        return (
                                            <div className="grid gap-4 sm:grid-cols-3">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Guardian Name</p>
                                                    <p className="mt-0.5 text-sm font-bold text-slate-900">{g.full_name}</p>
                                                    <p className="text-xs text-amber-700 font-semibold">{g.relationship}</p>
                                                </div>

                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Primary Phone</p>
                                                    <a
                                                        href={`tel:${g.phone}`}
                                                        className="mt-1 inline-flex items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 shadow-2xs"
                                                    >
                                                        <PhoneCall size={14} className="text-blue-600" />
                                                        {g.phone}
                                                    </a>
                                                    {g.alt_phone && (
                                                        <p className="mt-1 text-xs text-slate-500 font-mono">Alt: {g.alt_phone}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address & Email</p>
                                                    <p className="mt-0.5 text-xs text-slate-700">{g.address || '—'}</p>
                                                    <p className="text-xs text-slate-500">{g.email || ''}</p>
                                                </div>
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <p className="text-xs text-slate-500 italic">No parent/guardian information recorded.</p>
                                )}

                                {/* Consent Details */}
                                {selectedMember.consent_confirmed && (
                                    <div className="border-t border-amber-100 pt-2 flex items-center justify-between text-[11px] text-slate-500">
                                        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                                            <CheckCircle2 size={13} className="text-emerald-600" />
                                            Parent/Guardian consent confirmed
                                        </span>
                                        {selectedMember.consent_confirmed_at && (
                                            <span>Date: {formatDate(selectedMember.consent_confirmed_at)}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Extra Notes / Emergency info */}
                        {(selectedMember.emergency_notes || selectedMember.special_notes || selectedMember.grade_school_level) && (
                            <div className="grid gap-3 sm:grid-cols-2 text-xs">
                                {selectedMember.grade_school_level && (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                                        <p className="font-bold text-slate-700 mb-0.5">School / Grade</p>
                                        <p className="text-slate-600">{selectedMember.grade_school_level}</p>
                                    </div>
                                )}
                                {selectedMember.emergency_notes && (
                                    <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
                                        <p className="font-bold text-rose-800 mb-0.5">Emergency / Medical Notes</p>
                                        <p className="text-slate-700 whitespace-pre-wrap">{selectedMember.emergency_notes}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── PARTICIPATION TABS: Attendance, Practice, Performances, Songs ── */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-1 border-b border-slate-200 pb-2 overflow-x-auto">
                                {[
                                    { key: 'attendance', label: 'Attendance History', icon: CheckCircle2 },
                                    { key: 'rehearsals', label: 'Practice Attendance', icon: CalendarClock },
                                    { key: 'performances', label: 'Performances', icon: CalendarDays },
                                    { key: 'songs', label: 'Songs', icon: Music },
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    const active = activeProfileTab === tab.key;
                                    return (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => setActiveProfileTab(tab.key)}
                                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                                                active
                                                    ? 'bg-blue-600 text-white shadow-xs'
                                                    : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            <Icon size={14} />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Tab Content */}
                            {detailLoading ? (
                                <div className="py-8 flex justify-center">
                                    <LoadingSpinner size={24} />
                                </div>
                            ) : (
                                <div>
                                    {/* Stats strip */}
                                    {memberDetail?.stats && (
                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
                                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Attendance Rate</p>
                                                <p className="text-lg font-black text-blue-700">{memberDetail.stats.attendance_rate}%</p>
                                            </div>
                                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Present</p>
                                                <p className="text-lg font-black text-emerald-600">{memberDetail.stats.present}</p>
                                            </div>
                                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Performances</p>
                                                <p className="text-lg font-black text-indigo-600">{memberDetail.stats.performances_count || 0}</p>
                                            </div>
                                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Songs</p>
                                                <p className="text-lg font-black text-amber-600">{memberDetail.stats.songs_count || 0}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* 1. All Attendance History */}
                                    {activeProfileTab === 'attendance' && (
                                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                                            {memberDetail?.attendance_history && memberDetail.attendance_history.length > 0 ? (
                                                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
                                                    {memberDetail.attendance_history.map((rec) => (
                                                        <div key={rec.id} className="flex items-center justify-between p-3 hover:bg-slate-50">
                                                            <div>
                                                                <p className="font-bold text-slate-900">{rec.title}</p>
                                                                <p className="text-slate-400 font-mono text-[11px]">{rec.date}</p>
                                                            </div>
                                                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-bold uppercase text-[10px] ${
                                                                rec.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                                                                rec.status === 'late' ? 'bg-amber-100 text-amber-800' :
                                                                rec.status === 'excused' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-rose-100 text-rose-800'
                                                            }`}>
                                                                {rec.status}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="p-6 text-center text-xs text-slate-400">No attendance records found yet.</p>
                                            )}
                                        </div>
                                    )}

                                    {/* 2. Practice Attendance */}
                                    {activeProfileTab === 'rehearsals' && (
                                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                                            {memberDetail?.practice_history && memberDetail.practice_history.length > 0 ? (
                                                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
                                                    {memberDetail.practice_history.map((rec) => (
                                                        <div key={rec.id} className="flex items-center justify-between p-3 hover:bg-slate-50">
                                                            <div>
                                                                <p className="font-bold text-slate-900">{rec.title}</p>
                                                                <p className="text-slate-400 font-mono text-[11px]">{rec.date}</p>
                                                            </div>
                                                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-bold uppercase text-[10px] ${
                                                                rec.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                                                                rec.status === 'late' ? 'bg-amber-100 text-amber-800' :
                                                                'bg-rose-100 text-rose-800'
                                                            }`}>
                                                                {rec.status}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="p-6 text-center text-xs text-slate-400">No practice attendance records found.</p>
                                            )}
                                        </div>
                                    )}

                                    {/* 3. Performances */}
                                    {activeProfileTab === 'performances' && (
                                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                                            {memberDetail?.performances && memberDetail.performances.length > 0 ? (
                                                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
                                                    {memberDetail.performances.map((p) => (
                                                        <div key={p.id} className="flex items-center justify-between p-3 hover:bg-slate-50">
                                                            <div>
                                                                <p className="font-bold text-slate-900">{p.title}</p>
                                                                <p className="text-slate-400">{formatDate(p.date)} · {p.location || 'Church'}</p>
                                                            </div>
                                                            <span className="inline-flex items-center rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                                                                {p.type || 'Event'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="p-6 text-center text-xs text-slate-400">No performance records recorded.</p>
                                            )}
                                        </div>
                                    )}

                                    {/* 4. Songs */}
                                    {activeProfileTab === 'songs' && (
                                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                                            {memberDetail?.songs && memberDetail.songs.length > 0 ? (
                                                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
                                                    {memberDetail.songs.map((s) => (
                                                        <div key={s.id} className="flex items-center justify-between p-3 hover:bg-slate-50">
                                                            <div>
                                                                <p className="font-bold text-slate-900">{s.title}</p>
                                                                <p className="text-slate-400">{s.artist || s.composer || 'Choir Repertoire'}</p>
                                                            </div>
                                                            <Music size={14} className="text-blue-500" />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="p-6 text-center text-xs text-slate-400">No songs associated with this member yet.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end border-t border-slate-100 pt-4">
                            <Button variant="outline" onClick={() => setProfileModalOpen(false)}>
                                <X size={16} className="mr-1.5" /> Close Profile
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ─────────────────── EDIT MEMBER MODAL ─────────────────── */}
            <Modal
                open={editModalOpen}
                onClose={() => !editSaving && setEditModalOpen(false)}
                title="Edit Member Information"
                size="md"
            >
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
                            <input
                                type="text"
                                required
                                value={editForm.first_name || ''}
                                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Last Name *</label>
                            <input
                                type="text"
                                required
                                value={editForm.last_name || ''}
                                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                            <input
                                type="date"
                                value={editForm.date_of_birth || ''}
                                onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                            <select
                                value={editForm.status || 'active'}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold focus:border-blue-500 focus:outline-none"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="transferred">Transferred</option>
                                <option value="graduated">Graduated / Adult</option>
                            </select>
                        </div>
                    </div>

                    {/* If editing child, show parent guardian fields */}
                    <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-3.5 space-y-3">
                        <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <HeartHandshake size={14} className="text-amber-700" />
                            Parent / Guardian Information
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Parent/Guardian Name</label>
                                <input
                                    type="text"
                                    value={editForm.guardian_name || ''}
                                    onChange={(e) => setEditForm({ ...editForm, guardian_name: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Relationship</label>
                                <select
                                    value={editForm.guardian_relationship || 'Mother'}
                                    onChange={(e) => setEditForm({ ...editForm, guardian_relationship: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="Mother">Mother</option>
                                    <option value="Father">Father</option>
                                    <option value="Legal Guardian">Legal Guardian</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Primary Phone</label>
                                <input
                                    type="text"
                                    value={editForm.guardian_phone || ''}
                                    onChange={(e) => setEditForm({ ...editForm, guardian_phone: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Alt Phone</label>
                                <input
                                    type="text"
                                    value={editForm.guardian_alt_phone || ''}
                                    onChange={(e) => setEditForm({ ...editForm, guardian_alt_phone: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                        <Button variant="outline" size="sm" type="button" onClick={() => setEditModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" size="sm" type="submit" loading={editSaving}>
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
