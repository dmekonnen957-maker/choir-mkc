import { useState, useEffect, useCallback, useRef } from 'react';
import {
    CheckCircle2,
    Clock,
    XCircle,
    HelpCircle,
    Users,
    Calendar,
    Search,
    Filter,
    RefreshCw,
    Play,
    Square,
    CheckCheck,
    UserX,
    RotateCcw,
    ChevronDown,
    AlertCircle,
    Sparkles,
    CalendarDays,
    CalendarClock,
    MapPin,
    ArrowUpRight,
    MessageSquare,
    Save,
    FileText,
    BarChart3,
    History,
    Check,
    X,
} from 'lucide-react';
import { api } from '../../axios';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const STATUS_CONFIG = {
    present: {
        label: 'Present',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        activeBtn: 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-md',
        inactiveBtn: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200',
        dot: 'bg-emerald-500',
        icon: CheckCircle2,
    },
    late: {
        label: 'Late',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        activeBtn: 'bg-amber-500 text-white shadow-amber-500/20 shadow-md',
        inactiveBtn: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200',
        dot: 'bg-amber-500',
        icon: Clock,
    },
    absent: {
        label: 'Absent',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        activeBtn: 'bg-rose-600 text-white shadow-rose-500/20 shadow-md',
        inactiveBtn: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200',
        dot: 'bg-rose-500',
        icon: XCircle,
    },
    excused: {
        label: 'Excused',
        bg: 'bg-sky-50 text-sky-700 border-sky-200',
        activeBtn: 'bg-sky-600 text-white shadow-sky-500/20 shadow-md',
        inactiveBtn: 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200',
        dot: 'bg-sky-500',
        icon: HelpCircle,
    },
    unmarked: {
        label: 'Unmarked',
        bg: 'bg-slate-50 text-slate-600 border-slate-200',
        activeBtn: 'bg-slate-700 text-white',
        inactiveBtn: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
        dot: 'bg-slate-400',
        icon: HelpCircle,
    },
};

function formatDisplayDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const [year, month, day] = dateStr.split('-');
        if (!year || !month || !day) return dateStr;
        const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        return d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

function formatDisplayTime(timeStr) {
    if (!timeStr) return '';
    try {
        const [h, m] = timeStr.split(':');
        const hour = parseInt(h, 10);
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 === 0 ? 12 : hour % 12;
        return `${hour12}:${m ?? '00'} ${period}`;
    } catch {
        return timeStr;
    }
}

export default function AdminAttendancePage() {
    const { user, role, primaryChoir, can } = useAuth();
    const isAdmin = role === 'admin' || role === 'super-admin';

    // Tabs
    const [activeTab, setActiveTab] = useState('live'); // 'live' | 'history' | 'stats'

    // Choir & Event state
    const [choirs, setChoirs] = useState([]);
    const [selectedChoirId, setSelectedChoirId] = useState('');
    const [events, setEvents] = useState([]);
    const [selectedEventValue, setSelectedEventValue] = useState(''); // e.g. "performance-5" or "rehearsal-2" or "custom"
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Live session state
    const [currentSession, setCurrentSession] = useState(null);
    const [sessionCounts, setSessionCounts] = useState({
        total_members: 0,
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        unmarked: 0,
        attendance_rate: 0,
    });
    const [members, setMembers] = useState([]);
    const [loadingSession, setLoadingSession] = useState(false);
    const [savingMemberId, setSavingMemberId] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Filter & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sectionFilter, setSectionFilter] = useState('all');

    // Modals
    const [bulkModal, setBulkModal] = useState({ open: false, action: null, title: '', message: '' });
    const [notesModal, setNotesModal] = useState({ open: false, member: null, text: '' });
    const [thresholdModal, setThresholdModal] = useState({ open: false, minutes: 15 });
    const [toast, setToast] = useState(null);

    // History Tab state
    const [historyList, setHistoryList] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyMeta, setHistoryMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

    // Stats Tab state
    const [statsData, setStatsData] = useState({ total_sessions: 0, member_stats: [] });
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsSearch, setStatsSearch] = useState('');

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    // 1. Initial Load: Fetch available choirs
    useEffect(() => {
        const fetchChoirs = async () => {
            try {
                const res = await api.get('/public/choirs?per_page=100');
                const items = res.data?.data?.items || res.data?.data || [];
                setChoirs(items);

                if (items.length > 0) {
                    const defaultChoir = primaryChoir?.id
                        ? items.find((c) => c.id === primaryChoir.id) || items[0]
                        : items[0];
                    setSelectedChoirId(defaultChoir.id.toString());
                }
            } catch (err) {
                showToast('error', 'Failed to load choirs list');
            }
        };

        fetchChoirs();
    }, [primaryChoir]);

    // 2. Fetch Events when selected choir changes
    const fetchEvents = useCallback(async (choirId) => {
        if (!choirId) return;
        try {
            const res = await api.get(`/attendance/events?choir_id=${choirId}`);
            const eventItems = res.data?.data?.events || [];
            setEvents(eventItems);

            if (eventItems.length > 0) {
                const first = eventItems[0];
                setSelectedEventValue(`${first.type}-${first.id}`);
                if (first.date) {
                    setSelectedDate(first.date);
                }
            } else {
                setSelectedEventValue('custom');
            }
        } catch (err) {
            showToast('error', 'Failed to load choir events');
        }
    }, []);

    useEffect(() => {
        if (selectedChoirId) {
            fetchEvents(selectedChoirId);
        }
    }, [selectedChoirId, fetchEvents]);

    // 3. Load or Initialize Attendance Session
    const loadSession = useCallback(async (isBackground = false) => {
        if (!selectedChoirId) return;

        if (!isBackground) {
            setLoadingSession(true);
        } else {
            setIsSyncing(true);
        }

        try {
            let payload = {
                choir_id: parseInt(selectedChoirId, 10),
                session_date: selectedDate,
            };

            if (selectedEventValue && selectedEventValue !== 'custom') {
                const [type, id] = selectedEventValue.split('-');
                if (type === 'performance') {
                    payload.performance_id = parseInt(id, 10);
                    payload.event_type = 'performance';
                } else if (type === 'rehearsal') {
                    payload.rehearsal_id = parseInt(id, 10);
                    payload.event_type = 'rehearsal';
                }
            } else {
                payload.event_type = 'service';
                payload.title = 'General Service Attendance';
            }

            const res = await api.post('/attendance/sessions/find-or-create', payload);
            const data = res.data?.data;

            if (data) {
                setCurrentSession(data.session);
                setSessionCounts(data.counts || {});
                setMembers(data.members || []);
            }
        } catch (err) {
            if (!isBackground) {
                showToast('error', err.response?.data?.message || 'Failed to load attendance session');
            }
        } finally {
            if (!isBackground) {
                setLoadingSession(false);
            }
            setIsSyncing(false);
        }
    }, [selectedChoirId, selectedEventValue, selectedDate]);

    useEffect(() => {
        if (selectedChoirId && selectedEventValue) {
            loadSession(false);
        }
    }, [selectedChoirId, selectedEventValue, selectedDate, loadSession]);

    // 4. Background Polling Strategy (Every 12s when tab is active)
    useEffect(() => {
        if (activeTab !== 'live' || !currentSession?.id) return;

        const interval = setInterval(() => {
            loadSession(true);
        }, 12000);

        return () => clearInterval(interval);
    }, [activeTab, currentSession?.id, loadSession]);

    // Handle Event Selection Change
    const handleEventChange = (e) => {
        const val = e.target.value;
        setSelectedEventValue(val);
        if (val !== 'custom') {
            const [type, id] = val.split('-');
            const found = events.find((ev) => ev.type === type && ev.id.toString() === id);
            if (found && found.date) {
                setSelectedDate(found.date);
            }
        }
    };

    // Toggle Session Status (Open / Close)
    const handleToggleSessionStatus = async (newStatus) => {
        if (!currentSession?.id) return;
        try {
            const res = await api.patch(`/attendance/sessions/${currentSession.id}/status`, {
                status: newStatus,
            });
            setCurrentSession(res.data?.data?.session || { ...currentSession, status: newStatus });
            showToast('success', `Attendance is now ${newStatus === 'open' ? 'OPEN' : 'CLOSED'}`);
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to update session status');
        }
    };

    // Save late threshold
    const handleSaveThreshold = async () => {
        if (!currentSession?.id) return;
        try {
            const res = await api.patch(`/attendance/sessions/${currentSession.id}/status`, {
                status: currentSession.status,
                late_threshold_minutes: parseInt(thresholdModal.minutes, 10),
            });
            setCurrentSession(res.data?.data?.session || { ...currentSession, late_threshold_minutes: thresholdModal.minutes });
            setThresholdModal({ ...thresholdModal, open: false });
            showToast('success', `Late threshold set to ${thresholdModal.minutes} minutes`);
        } catch (err) {
            showToast('error', 'Failed to update threshold');
        }
    };

    // 5. Real-Time Check-In
    const handleCheckIn = async (member) => {
        if (!currentSession?.id) return;
        if (currentSession.status === 'closed') {
            showToast('error', 'Attendance is currently closed. Reopen session to check in.');
            return;
        }

        setSavingMemberId(member.member_id);

        try {
            const res = await api.post('/attendance/check-in', {
                attendance_session_id: currentSession.id,
                member_id: member.member_id,
            });

            const { status, check_in_time, check_in_at, counts } = res.data?.data || {};

            // Optimistic update
            setMembers((prev) =>
                prev.map((m) =>
                    m.member_id === member.member_id
                        ? { ...m, status: status || 'present', check_in_time, check_in_at }
                        : m
                )
            );
            if (counts) setSessionCounts(counts);

            showToast('success', res.data?.message || `Checked in ${member.full_name}`);
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Check-in failed');
        } finally {
            setSavingMemberId(null);
        }
    };

    // 6. Real-Time Check-Out
    const handleCheckOut = async (member) => {
        if (!currentSession?.id) return;
        setSavingMemberId(member.member_id);

        try {
            const res = await api.post('/attendance/check-out', {
                attendance_session_id: currentSession.id,
                member_id: member.member_id,
            });

            const { check_out_time, check_out_at, counts } = res.data?.data || {};

            // Update UI
            setMembers((prev) =>
                prev.map((m) =>
                    m.member_id === member.member_id
                        ? { ...m, check_out_time, check_out_at }
                        : m
                )
            );
            if (counts) setSessionCounts(counts);

            showToast('success', res.data?.message || `Checked out ${member.full_name}`);
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Check-out failed');
        } finally {
            setSavingMemberId(null);
        }
    };

    // 7. Interactive Status Toggle (Present, Late, Absent, Excused)
    const handleSetStatus = async (member, targetStatus) => {
        if (!currentSession?.id) return;
        setSavingMemberId(member.member_id);

        try {
            const res = await api.post('/attendance/records/mark', {
                attendance_session_id: currentSession.id,
                member_id: member.member_id,
                status: targetStatus,
            });

            const { status, check_in_time, check_in_at, check_out_time, check_out_at, counts } = res.data?.data || {};

            setMembers((prev) =>
                prev.map((m) =>
                    m.member_id === member.member_id
                        ? { ...m, status: status || targetStatus, check_in_time, check_in_at, check_out_time, check_out_at }
                        : m
                )
            );
            if (counts) setSessionCounts(counts);

            showToast('success', `Marked ${member.full_name} as ${targetStatus}`);
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to update status');
        } finally {
            setSavingMemberId(null);
        }
    };

    // 8. Save Member Note
    const handleSaveNote = async () => {
        if (!currentSession?.id || !notesModal.member) return;
        setSavingMemberId(notesModal.member.member_id);

        try {
            const res = await api.post('/attendance/records/mark', {
                attendance_session_id: currentSession.id,
                member_id: notesModal.member.member_id,
                status: notesModal.member.status === 'unmarked' ? 'present' : notesModal.member.status,
                notes: notesModal.text,
            });

            setMembers((prev) =>
                prev.map((m) =>
                    m.member_id === notesModal.member.member_id
                        ? { ...m, notes: notesModal.text, status: m.status === 'unmarked' ? 'present' : m.status }
                        : m
                )
            );

            setNotesModal({ open: false, member: null, text: '' });
            showToast('success', 'Note saved successfully');
        } catch (err) {
            showToast('error', 'Failed to save note');
        } finally {
            setSavingMemberId(null);
        }
    };

    // 9. Bulk Actions
    const handleExecuteBulk = async () => {
        if (!currentSession?.id || !bulkModal.action) return;
        setLoadingSession(true);

        try {
            const res = await api.post('/attendance/records/bulk', {
                attendance_session_id: currentSession.id,
                action: bulkModal.action,
            });

            const data = res.data?.data;
            if (data) {
                setMembers(data.members || []);
                setSessionCounts(data.counts || {});
            }

            setBulkModal({ open: false, action: null, title: '', message: '' });
            showToast('success', 'Bulk attendance updated successfully');
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Bulk action failed');
        } finally {
            setLoadingSession(false);
        }
    };

    // 10. Load History Tab Data
    const fetchHistory = useCallback(async (page = 1) => {
        if (!selectedChoirId) return;
        setHistoryLoading(true);
        try {
            const res = await api.get(`/attendance/sessions?choir_id=${selectedChoirId}&page=${page}&per_page=15`);
            const data = res.data?.data;
            setHistoryList(data?.items || []);
            setHistoryMeta({
                current_page: data?.current_page || 1,
                last_page: data?.last_page || 1,
                total: data?.total || 0,
            });
        } catch (err) {
            showToast('error', 'Failed to load attendance history');
        } finally {
            setHistoryLoading(false);
        }
    }, [selectedChoirId]);

    // 11. Load Stats Tab Data
    const fetchStats = useCallback(async () => {
        if (!selectedChoirId) return;
        setStatsLoading(true);
        try {
            const res = await api.get(`/attendance/stats?choir_id=${selectedChoirId}`);
            setStatsData(res.data?.data || { total_sessions: 0, member_stats: [] });
        } catch (err) {
            showToast('error', 'Failed to load attendance analytics');
        } finally {
            setStatsLoading(false);
        }
    }, [selectedChoirId]);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory(historyPage);
        } else if (activeTab === 'stats') {
            fetchStats();
        }
    }, [activeTab, selectedChoirId, historyPage, fetchHistory, fetchStats]);

    // Extract unique voice sections for filtering
    const voiceSections = Array.from(
        new Set(members.map((m) => m.voice_section?.name).filter(Boolean))
    );

    // Filter members list based on search and status
    const filteredMembers = members.filter((m) => {
        const matchesSearch =
            !searchQuery.trim() ||
            m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.phone?.includes(searchQuery) ||
            m.member_code?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            statusFilter === 'all' || m.status === statusFilter;

        const matchesSection =
            sectionFilter === 'all' || m.voice_section?.name === sectionFilter;

        return matchesSearch && matchesStatus && matchesSection;
    });

    const selectedChoirName =
        choirs.find((c) => c.id.toString() === selectedChoirId)?.name || 'Choir';

    return (
        <div className="space-y-6 pb-12">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                            <CheckCircle2 size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance</h1>
                            <p className="text-sm text-slate-500">
                                Live attendance check-in, tracking, and reports
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs Switcher */}
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/80">
                    <button
                        onClick={() => setActiveTab('live')}
                        className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                            activeTab === 'live'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Play size={14} />
                        <span>Live Session</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                            activeTab === 'history'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <History size={14} />
                        <span>History</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                            activeTab === 'stats'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <BarChart3 size={14} />
                        <span>Member Rates</span>
                    </button>
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

            {/* TOP CONTROLS: Select Choir, Select Event, Date */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                {/* 1. Choir Selector */}
                <div className="sm:col-span-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Choir / Ministry Team
                    </label>
                    <select
                        value={selectedChoirId}
                        onChange={(e) => setSelectedChoirId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                    >
                        {choirs.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 2. Event Selector */}
                <div className="sm:col-span-5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Event / Performance / Rehearsal
                    </label>
                    <select
                        value={selectedEventValue}
                        onChange={handleEventChange}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                    >
                        {events.map((ev) => (
                            <option key={`${ev.type}-${ev.id}`} value={`${ev.type}-${ev.id}`}>
                                {ev.label}
                            </option>
                        ))}
                        <option value="custom">📅 Custom Date / General Service</option>
                    </select>
                </div>

                {/* 3. Date Input & Sync button */}
                <div className="sm:col-span-3 flex items-end gap-2">
                    <div className="flex-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => loadSession(false)}
                        disabled={loadingSession}
                        title="Refresh attendance"
                        className="rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                    >
                        <RefreshCw size={18} className={loadingSession || isSyncing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* TAB 1: LIVE ATTENDANCE DASHBOARD */}
            {activeTab === 'live' && (
                <>
                    {/* Live Summary Counter Cards */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                        {/* Total Members */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Total Members
                                </span>
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                    <Users size={16} />
                                </span>
                            </div>
                            <p className="mt-2 text-2xl font-black text-slate-900">
                                {sessionCounts.total_members}
                            </p>
                            <span className="text-xs text-slate-400">Roster active count</span>
                        </div>

                        {/* Present */}
                        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                                    Present
                                </span>
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                    <CheckCircle2 size={16} />
                                </span>
                            </div>
                            <p className="mt-2 text-2xl font-black text-emerald-800">
                                {sessionCounts.present}
                            </p>
                            <span className="text-xs font-semibold text-emerald-600">
                                {sessionCounts.total_members > 0
                                    ? Math.round((sessionCounts.present / sessionCounts.total_members) * 100)
                                    : 0}
                                % of total
                            </span>
                        </div>

                        {/* Late */}
                        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/50 to-white p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                                    Late
                                </span>
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                                    <Clock size={16} />
                                </span>
                            </div>
                            <p className="mt-2 text-2xl font-black text-amber-800">
                                {sessionCounts.late}
                            </p>
                            <span className="text-xs font-semibold text-amber-600">
                                After threshold
                            </span>
                        </div>

                        {/* Absent */}
                        <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/50 to-white p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                                    Absent
                                </span>
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                                    <XCircle size={16} />
                                </span>
                            </div>
                            <p className="mt-2 text-2xl font-black text-rose-800">
                                {sessionCounts.absent}
                            </p>
                            <span className="text-xs font-semibold text-rose-600">
                                Unexcused absence
                            </span>
                        </div>

                        {/* Excused */}
                        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50/50 to-white p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-sky-700">
                                    Excused
                                </span>
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                                    <HelpCircle size={16} />
                                </span>
                            </div>
                            <p className="mt-2 text-2xl font-black text-sky-800">
                                {sessionCounts.excused}
                            </p>
                            <span className="text-xs font-semibold text-sky-600">
                                Permitted leave
                            </span>
                        </div>
                    </div>

                    {/* LIVE EVENT HEADER CARD */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl">
                        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            {/* Event details */}
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                                        {selectedChoirName}
                                    </span>
                                    <span className="text-slate-600">•</span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-900/50 px-2.5 py-0.5 text-xs font-semibold text-blue-300 ring-1 ring-blue-500/30">
                                        {currentSession?.event_type === 'performance' ? 'Performance' : 'Rehearsal'}
                                    </span>
                                </div>

                                <h2 className="text-xl sm:text-2xl font-black text-white">
                                    {currentSession?.title || 'Sunday Worship Performance'}
                                </h2>

                                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar size={14} className="text-blue-400" />
                                        {formatDisplayDate(currentSession?.session_date || selectedDate)}
                                    </span>

                                    {(currentSession?.start_time || currentSession?.performance?.start_time || currentSession?.rehearsal?.start_time) && (
                                        <span className="flex items-center gap-1.5">
                                            <Clock size={14} className="text-blue-400" />
                                            Start: {formatDisplayTime(currentSession?.start_time || currentSession?.performance?.start_time || currentSession?.rehearsal?.start_time)}
                                        </span>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setThresholdModal({ open: true, minutes: currentSession?.late_threshold_minutes ?? 15 })}
                                        className="flex items-center gap-1 text-slate-400 hover:text-blue-300 underline decoration-dotted"
                                    >
                                        Late after: {currentSession?.late_threshold_minutes ?? 15} min
                                    </button>
                                </div>
                            </div>

                            {/* Session Status & Open/Close Controls */}
                            <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0">
                                {/* Status Indicator Badge */}
                                <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 ring-1 ring-slate-800">
                                    <span
                                        className={`h-2.5 w-2.5 rounded-full ${
                                            currentSession?.status === 'open'
                                                ? 'bg-emerald-400 animate-pulse'
                                                : currentSession?.status === 'closed'
                                                ? 'bg-rose-500'
                                                : 'bg-amber-400'
                                        }`}
                                    />
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                                        {currentSession?.status === 'open'
                                            ? 'Attendance Open'
                                            : currentSession?.status === 'closed'
                                            ? 'Attendance Closed'
                                            : 'Not Started'}
                                    </span>
                                </div>

                                {currentSession?.status === 'open' ? (
                                    <button
                                        onClick={() => handleToggleSessionStatus('closed')}
                                        className="flex items-center gap-2 rounded-xl bg-rose-600/20 px-4 py-2 text-xs font-bold text-rose-300 ring-1 ring-rose-500/30 hover:bg-rose-600/30 transition-colors"
                                    >
                                        <Square size={14} />
                                        <span>Close Attendance</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleToggleSessionStatus('open')}
                                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-colors"
                                    >
                                        <Play size={14} />
                                        <span>Open Attendance</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SEARCH, FILTER & BULK CONTROLS BAR */}
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search members by name, email, phone, code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                            />
                        </div>

                        {/* Status Filters */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {['all', 'present', 'late', 'absent', 'excused', 'unmarked'].map((st) => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    className={`rounded-lg px-2.5 py-1.5 text-xs font-bold capitalize transition-colors ${
                                        statusFilter === st
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {st === 'all'
                                        ? `All (${members.length})`
                                        : `${st} (${
                                              st === 'unmarked'
                                                  ? sessionCounts.unmarked
                                                  : sessionCounts[st] || 0
                                          })`}
                                </button>
                            ))}
                        </div>

                        {/* Bulk Action Buttons */}
                        <div className="flex items-center gap-1.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                            <button
                                onClick={() =>
                                    setBulkModal({
                                        open: true,
                                        action: 'mark_all_present',
                                        title: 'Mark All Present',
                                        message: `Mark all ${members.length} active choir members as Present? This will record the current timestamp for members not yet checked in.`,
                                    })
                                }
                                className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                            >
                                <CheckCheck size={14} />
                                <span>All Present</span>
                            </button>

                            <button
                                onClick={() =>
                                    setBulkModal({
                                        open: true,
                                        action: 'mark_remaining_absent',
                                        title: 'Mark Remaining Absent',
                                        message: `Mark all ${sessionCounts.unmarked} unmarked members as Absent?`,
                                    })
                                }
                                className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                            >
                                <UserX size={14} />
                                <span>Remaining Absent</span>
                            </button>

                            <button
                                onClick={() =>
                                    setBulkModal({
                                        open: true,
                                        action: 'reset',
                                        title: 'Reset Attendance',
                                        message: 'Are you sure you want to reset all attendance records for this session? This will clear all check-in times and statuses.',
                                    })
                                }
                                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <RotateCcw size={14} />
                                <span>Reset</span>
                            </button>
                        </div>
                    </div>

                    {/* MEMBER ATTENDANCE LIST (DESKTOP TABLE & MOBILE CARDS) */}
                    {loadingSession ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
                            <LoadingSpinner size={32} className="text-blue-600" />
                            <p className="mt-3 text-sm font-semibold text-slate-500">Loading attendance roster...</p>
                        </div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                            <Users size={40} className="text-slate-300" />
                            <h3 className="mt-2 text-base font-bold text-slate-700">No members found</h3>
                            <p className="text-xs text-slate-400 max-w-sm mt-1">
                                {searchQuery || statusFilter !== 'all'
                                    ? 'Try changing your search query or filter options.'
                                    : 'No active members registered in this choir yet.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden lg:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-black uppercase tracking-wider text-slate-500">
                                            <th className="px-5 py-3.5">Member</th>
                                            <th className="px-4 py-3.5">Status</th>
                                            <th className="px-4 py-3.5">Check-In</th>
                                            <th className="px-4 py-3.5">Check-Out</th>
                                            <th className="px-4 py-3.5 text-center">Real-Time Actions</th>
                                            <th className="px-4 py-3.5">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {filteredMembers.map((member) => {
                                            const statusCfg = STATUS_CONFIG[member.status] || STATUS_CONFIG.unmarked;
                                            const isSaving = savingMemberId === member.member_id;

                                            return (
                                                <tr
                                                    key={member.member_id}
                                                    className="hover:bg-slate-50/80 transition-colors group"
                                                >
                                                    {/* Member Info */}
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-black text-white shadow-sm">
                                                                {member.full_name?.charAt(0) || 'M'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-slate-900 truncate">
                                                                    {member.full_name}
                                                                </p>
                                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                    {member.voice_section && (
                                                                        <span className="font-medium text-blue-600">
                                                                            {member.voice_section.name}
                                                                        </span>
                                                                    )}
                                                                    {member.member_code && (
                                                                        <span className="text-slate-400">
                                                                            #{member.member_code}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Status Badge */}
                                                    <td className="px-4 py-3.5">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${statusCfg.bg}`}
                                                        >
                                                            <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                                                            {statusCfg.label}
                                                        </span>
                                                    </td>

                                                    {/* Check-In Time */}
                                                    <td className="px-4 py-3.5 font-semibold text-slate-700">
                                                        {member.check_in_time ? (
                                                            <span className="inline-flex items-center gap-1 text-emerald-700 font-mono text-xs">
                                                                <Clock size={13} />
                                                                {member.check_in_time}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">—</span>
                                                        )}
                                                    </td>

                                                    {/* Check-Out Time */}
                                                    <td className="px-4 py-3.5 font-semibold text-slate-700">
                                                        {member.check_out_time ? (
                                                            <span className="inline-flex items-center gap-1 text-blue-700 font-mono text-xs">
                                                                <Clock size={13} />
                                                                {member.check_out_time}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">—</span>
                                                        )}
                                                    </td>

                                                    {/* Quick Actions / Controls */}
                                                    <td className="px-4 py-3.5 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            {/* Check In Button */}
                                                            {!member.check_in_time ? (
                                                                <button
                                                                    onClick={() => handleCheckIn(member)}
                                                                    disabled={isSaving || currentSession?.status === 'closed'}
                                                                    className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                                                >
                                                                    {isSaving ? <LoadingSpinner size={12} /> : <Check size={13} />}
                                                                    <span>Check In</span>
                                                                </button>
                                                            ) : !member.check_out_time ? (
                                                                <button
                                                                    onClick={() => handleCheckOut(member)}
                                                                    disabled={isSaving}
                                                                    className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                                                >
                                                                    {isSaving ? <LoadingSpinner size={12} /> : <ArrowUpRight size={13} />}
                                                                    <span>Check Out</span>
                                                                </button>
                                                            ) : (
                                                                <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500">
                                                                    Completed
                                                                </span>
                                                            )}

                                                            {/* Quick Status Buttons */}
                                                            <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                                                                {['present', 'late', 'absent', 'excused'].map((st) => (
                                                                    <button
                                                                        key={st}
                                                                        onClick={() => handleSetStatus(member, st)}
                                                                        disabled={isSaving}
                                                                        className={`rounded-md px-2 py-1 text-[11px] font-bold capitalize transition-all ${
                                                                            member.status === st
                                                                                ? STATUS_CONFIG[st].activeBtn
                                                                                : STATUS_CONFIG[st].inactiveBtn
                                                                        }`}
                                                                    >
                                                                        {st}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Notes */}
                                                    <td className="px-4 py-3.5">
                                                        <button
                                                            onClick={() => setNotesModal({ open: true, member, text: member.notes || '' })}
                                                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 font-medium"
                                                        >
                                                            <MessageSquare size={14} className={member.notes ? 'text-blue-600' : 'text-slate-400'} />
                                                            <span className="truncate max-w-[120px]">
                                                                {member.notes || 'Add note'}
                                                            </span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="grid grid-cols-1 gap-3 lg:hidden">
                                {filteredMembers.map((member) => {
                                    const statusCfg = STATUS_CONFIG[member.status] || STATUS_CONFIG.unmarked;
                                    const isSaving = savingMemberId === member.member_id;

                                    return (
                                        <div
                                            key={member.member_id}
                                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
                                        >
                                            {/* Member Header */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-sm font-black text-white">
                                                        {member.full_name?.charAt(0) || 'M'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{member.full_name}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {member.voice_section?.name || 'Voice'}
                                                            {member.member_code ? ` • #${member.member_code}` : ''}
                                                        </p>
                                                    </div>
                                                </div>

                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${statusCfg.bg}`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                                                    {statusCfg.label}
                                                </span>
                                            </div>

                                            {/* Timestamps */}
                                            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600">
                                                <div>
                                                    <span className="font-bold text-slate-400 uppercase text-[10px] block">
                                                        Check-In
                                                    </span>
                                                    <span className="font-semibold font-mono text-emerald-700">
                                                        {member.check_in_time || '—'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-400 uppercase text-[10px] block">
                                                        Check-Out
                                                    </span>
                                                    <span className="font-semibold font-mono text-blue-700">
                                                        {member.check_out_time || '—'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Primary Check-In / Check-Out Action */}
                                            <div className="flex gap-2">
                                                {!member.check_in_time ? (
                                                    <button
                                                        onClick={() => handleCheckIn(member)}
                                                        disabled={isSaving || currentSession?.status === 'closed'}
                                                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                                                    >
                                                        {isSaving ? <LoadingSpinner size={14} /> : <Check size={14} />}
                                                        <span>Check In</span>
                                                    </button>
                                                ) : !member.check_out_time ? (
                                                    <button
                                                        onClick={() => handleCheckOut(member)}
                                                        disabled={isSaving}
                                                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        {isSaving ? <LoadingSpinner size={14} /> : <ArrowUpRight size={14} />}
                                                        <span>Check Out</span>
                                                    </button>
                                                ) : (
                                                    <div className="flex-1 rounded-xl bg-slate-100 py-2 text-center text-xs font-bold text-slate-500">
                                                        Attendance Complete
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => setNotesModal({ open: true, member, text: member.notes || '' })}
                                                    className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50"
                                                >
                                                    <MessageSquare size={16} />
                                                </button>
                                            </div>

                                            {/* Quick Status Buttons */}
                                            <div className="grid grid-cols-4 gap-1.5 pt-1">
                                                {['present', 'late', 'absent', 'excused'].map((st) => (
                                                    <button
                                                        key={st}
                                                        onClick={() => handleSetStatus(member, st)}
                                                        disabled={isSaving}
                                                        className={`rounded-lg py-1.5 text-xs font-bold capitalize transition-all text-center ${
                                                            member.status === st
                                                                ? STATUS_CONFIG[st].activeBtn
                                                                : STATUS_CONFIG[st].inactiveBtn
                                                        }`}
                                                    >
                                                        {st}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </>
            )}

            {/* TAB 2: SESSION HISTORY */}
            {activeTab === 'history' && (
                <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-base font-bold text-slate-900">Attendance Session History</h3>
                        <p className="text-xs text-slate-500">Past attendance logs for {selectedChoirName}</p>

                        {historyLoading ? (
                            <div className="flex justify-center py-12">
                                <LoadingSpinner size={28} className="text-blue-600" />
                            </div>
                        ) : historyList.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 text-sm">
                                No past attendance sessions recorded for this choir.
                            </div>
                        ) : (
                            <div className="mt-4 divide-y divide-slate-100">
                                {historyList.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3 hover:bg-slate-50 px-2 rounded-xl"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900">{item.title}</span>
                                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                                                    {item.event_type}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {formatDisplayDate(item.session_date)}
                                                {item.start_time ? ` • ${formatDisplayTime(item.start_time)}` : ''}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs">
                                            <div className="flex items-center gap-3">
                                                <span className="text-emerald-700 font-bold">
                                                    Present: {item.summary?.present || 0}
                                                </span>
                                                <span className="text-amber-700 font-bold">
                                                    Late: {item.summary?.late || 0}
                                                </span>
                                                <span className="text-rose-700 font-bold">
                                                    Absent: {item.summary?.absent || 0}
                                                </span>
                                                <span className="text-sky-700 font-bold">
                                                    Excused: {item.summary?.excused || 0}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    setSelectedDate(item.session_date);
                                                    if (item.performance_id) {
                                                        setSelectedEventValue(`performance-${item.performance_id}`);
                                                    } else if (item.rehearsal_id) {
                                                        setSelectedEventValue(`rehearsal-${item.rehearsal_id}`);
                                                    } else {
                                                        setSelectedEventValue('custom');
                                                    }
                                                    setActiveTab('live');
                                                }}
                                                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
                                            >
                                                Open Session
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: MEMBER ATTENDANCE REPORT & RATES */}
            {activeTab === 'stats' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Member Attendance Analytics</h3>
                            <p className="text-xs text-slate-500">
                                Total Sessions Tracked: {statsData.total_sessions}
                            </p>
                        </div>
                        <input
                            type="text"
                            placeholder="Filter members..."
                            value={statsSearch}
                            onChange={(e) => setStatsSearch(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium focus:bg-white focus:outline-none"
                        />
                    </div>

                    {statsLoading ? (
                        <div className="flex justify-center py-12">
                            <LoadingSpinner size={28} className="text-blue-600" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                                        <th className="px-4 py-3">Member</th>
                                        <th className="px-4 py-3">Section</th>
                                        <th className="px-4 py-3 text-center">Sessions</th>
                                        <th className="px-4 py-3 text-center text-emerald-700">Present</th>
                                        <th className="px-4 py-3 text-center text-amber-700">Late</th>
                                        <th className="px-4 py-3 text-center text-rose-700">Absent</th>
                                        <th className="px-4 py-3 text-center text-sky-700">Excused</th>
                                        <th className="px-4 py-3 text-right">Attendance Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {statsData.member_stats
                                        .filter(
                                            (m) =>
                                                !statsSearch ||
                                                m.full_name?.toLowerCase().includes(statsSearch.toLowerCase())
                                        )
                                        .map((m) => (
                                            <tr key={m.member_id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-bold text-slate-900">{m.full_name}</td>
                                                <td className="px-4 py-3 text-xs text-slate-600">{m.voice_section || '—'}</td>
                                                <td className="px-4 py-3 text-center font-semibold">{m.total_sessions}</td>
                                                <td className="px-4 py-3 text-center font-semibold text-emerald-700">{m.present}</td>
                                                <td className="px-4 py-3 text-center font-semibold text-amber-700">{m.late}</td>
                                                <td className="px-4 py-3 text-center font-semibold text-rose-700">{m.absent}</td>
                                                <td className="px-4 py-3 text-center font-semibold text-sky-700">{m.excused}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span
                                                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-black ${
                                                            m.attendance_rate >= 80
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : m.attendance_rate >= 60
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : 'bg-rose-100 text-rose-800'
                                                        }`}
                                                    >
                                                        {m.attendance_rate}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* CONFIRMATION MODAL FOR BULK ACTIONS */}
            <Modal
                open={bulkModal.open}
                onClose={() => setBulkModal({ ...bulkModal, open: false })}
                title={bulkModal.title}
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">{bulkModal.message}</p>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBulkModal({ ...bulkModal, open: false })}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleExecuteBulk}
                        >
                            Confirm Action
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* NOTES MODAL */}
            <Modal
                open={notesModal.open}
                onClose={() => setNotesModal({ ...notesModal, open: false })}
                title={`Attendance Note: ${notesModal.member?.full_name || ''}`}
                size="md"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Notes / Reason
                        </label>
                        <textarea
                            rows={4}
                            value={notesModal.text}
                            onChange={(e) => setNotesModal({ ...notesModal, text: e.target.value })}
                            placeholder="Enter attendance notes, excuse reason, arrival detail..."
                            className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNotesModal({ ...notesModal, open: false })}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSaveNote}
                        >
                            Save Note
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* LATE THRESHOLD CONFIG MODAL */}
            <Modal
                open={thresholdModal.open}
                onClose={() => setThresholdModal({ ...thresholdModal, open: false })}
                title="Configure Late Threshold"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-xs text-slate-600">
                        Members checking in after the scheduled start time plus this threshold will automatically be marked as <strong>Late</strong>.
                    </p>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Late After (Minutes)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="180"
                            value={thresholdModal.minutes}
                            onChange={(e) => setThresholdModal({ ...thresholdModal, minutes: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold text-slate-800 focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setThresholdModal({ ...thresholdModal, open: false })}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSaveThreshold}
                        >
                            Save Setting
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
