import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChoir } from '../../context/ChoirContext';
import { api } from '../../axios';
import {
    Plus,
    Music,
    Pencil,
    Trash2,
    Search,
    Eye,
    Play,
    Pause,
    Volume2,
    Check,
    X,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    User,
    FileText,
    Sparkles,
    Heart,
    TrendingUp,
    BarChart2,
    ArrowUpDown,
    ExternalLink,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import AdminSongFormPage from './AdminSongFormPage';
import { fetchAdminSongStats } from '../../lib/publicApi';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminSongsPage() {
    const { can } = useAuth();
    const { currentChoir, isAllChoirs } = useChoir();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [songs, setSongs] = useState([]);
    const [choirs, setChoirs] = useState([]);
    const [stats, setStats] = useState(null);
    const [search, setSearch] = useState('');
    const [choirId, setChoirId] = useState('');
    const [statusTab, setStatusTab] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
    const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'most_liked' | 'oldest' | 'title'

    const [toDelete, setToDelete] = useState(null);
    const [toReject, setToReject] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejecting, setRejecting] = useState(false);
    const [toReview, setToReview] = useState(null);
    const [approvingId, setApprovingId] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [toast, setToast] = useState(null);
    const [playingId, setPlayingId] = useState(null);
    const [audioRefs, setAudioRefs] = useState({});

    // Sync choirId filter with currentChoir context
    useEffect(() => {
        if (!isAllChoirs && currentChoir?.id) {
            setChoirId(String(currentChoir.id));
        } else {
            setChoirId('');
        }
    }, [currentChoir?.id, isAllChoirs]);

    const load = () => {
        setLoading(true);
        setError('');
        Promise.all([
            api.get('/admin/songs'),
            api.get('/admin/choirs'),
            fetchAdminSongStats().catch(() => null),
        ])
            .then(([songsRes, choirsRes, statsData]) => {
                setSongs(songsRes.data?.data?.items ?? []);
                setChoirs(choirsRes.data?.data?.items ?? []);
                if (statsData) setStats(statsData);
            })
            .catch(() => setError(t('songs.load_error', 'Unable to load songs.')))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    // Filter by search, choir, and status tab
    const filtered = songs.filter((s) => {
        if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
        if (choirId && String(s.choir_id) !== String(choirId)) return false;
        if (statusTab !== 'all' && s.status !== statusTab) return false;
        return true;
    });

    const sortedSongs = [...filtered].sort((a, b) => {
        if (sortBy === 'most_liked') {
            return (b.likes_count || 0) - (a.likes_count || 0);
        }
        if (sortBy === 'oldest') {
            return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        }
        if (sortBy === 'title') {
            return (a.title || '').localeCompare(b.title || '');
        }
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    const pendingCount = songs.filter((s) => s.status === 'pending').length;
    const approvedCount = songs.filter((s) => s.status === 'approved').length;
    const rejectedCount = songs.filter((s) => s.status === 'rejected').length;

    const handleApprove = async (song) => {
        setApprovingId(song.id);
        try {
            const res = await api.post(`/admin/songs/${song.id}/approve`);
            setToast({ variant: 'success', message: `"${song.title}" ${t('songs.approved_published', 'approved and published to library.')}` });
            setSongs((prev) =>
                prev.map((s) =>
                    s.id === song.id
                        ? { ...s, status: 'approved', is_published: true, approved_at: new Date().toISOString() }
                        : s
                )
            );
            if (toReview?.id === song.id) {
                setToReview(null);
            }
        } catch (err) {
            setToast({ variant: 'error', message: err.message || t('songs.approve_error', 'Could not approve song.') });
        } finally {
            setApprovingId(null);
        }
    };

    const handleReject = async (e) => {
        e.preventDefault();
        if (!rejectionReason.trim()) return;

        setRejecting(true);
        try {
            await api.post(`/admin/songs/${toReject.id}/reject`, {
                rejection_reason: rejectionReason,
            });
            setToast({ variant: 'success', message: `"${toReject.title}" ${t('songs.rejected_msg', 'has been rejected.')}` });
            setSongs((prev) =>
                prev.map((s) =>
                    s.id === toReject.id
                        ? { ...s, status: 'rejected', is_published: false, rejection_reason: rejectionReason }
                        : s
                )
            );
            setToReject(null);
            setRejectionReason('');
            if (toReview?.id === toReject.id) {
                setToReview(null);
            }
        } catch (err) {
            setToast({ variant: 'error', message: err.message || t('songs.reject_error', 'Could not reject song.') });
        } finally {
            setRejecting(false);
        }
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/admin/songs/${toDelete.id}`);
            setToast({ variant: 'success', message: t('songs.deleted_msg', 'Song deleted.') });
            setSongs((prev) => prev.filter((s) => s.id !== toDelete.id));
        } catch {
            setToast({ variant: 'error', message: t('songs.delete_error', 'Could not delete song.') });
        } finally {
            setToDelete(null);
        }
    };

    const togglePlay = (songId, audioPath) => {
        const audioUrl = `/storage/${String(audioPath).replace(/^\/+/, '')}`;
        if (playingId === songId) {
            if (audioRefs[songId]) {
                audioRefs[songId].pause();
            }
            setPlayingId(null);
        } else {
            if (playingId && audioRefs[playingId]) {
                audioRefs[playingId].pause();
            }
            if (audioRefs[songId]) {
                audioRefs[songId].play();
                setPlayingId(songId);
            } else {
                const audio = new Audio(audioUrl);
                audio.onended = () => setPlayingId(null);
                audio.play();
                setAudioRefs((prev) => ({ ...prev, [songId]: audio }));
                setPlayingId(songId);
            }
        }
    };

    useEffect(() => {
        return () => {
            Object.values(audioRefs).forEach((audio) => {
                if (audio) {
                    audio.pause();
                    audio.src = '';
                }
            });
        };
    }, [audioRefs]);

    if (loading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <LoadingSpinner text={t('common.loading', 'Loading...')} />
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-ink-900">{t('songs.management_title', 'Songs Library Management')}</h1>
                    <p className="text-sm text-ink-500">{t('songs.management_subtitle', 'Manage choir songs, spiritual scales, chord sheets, audio recordings, and member submissions.')}</p>
                </div>
                {can('songs.create') && (
                    <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                    >
                        <Plus className="h-4 w-4" /> {t('songs.add_song', 'Add Song')}
                    </button>
                )}
            </div>

            {/* Engagement Statistics Dashboard Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('songs.stats_total', 'Total Songs')}</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Music size={16} />
                        </div>
                    </div>
                    <p className="mt-2 text-2xl font-extrabold text-slate-900">
                        {stats?.total_songs ?? songs.length}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{t('songs.in_catalog', 'In catalog')}</p>
                </div>

                <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/40 to-white p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-500">{t('songs.total_likes', 'Total Likes')}</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                            <Heart size={16} className="fill-rose-500 text-rose-500" />
                        </div>
                    </div>
                    <p className="mt-2 text-2xl font-extrabold text-slate-900">
                        {stats?.total_likes ?? 0}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{t('songs.audience_appreciations', 'Audience appreciations')}</p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('songs.most_liked_song', 'Most Liked Song')}</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <TrendingUp size={16} />
                        </div>
                    </div>
                    <p className="mt-2 text-sm font-bold text-slate-900 truncate">
                        {stats?.most_liked_song?.title || t('songs.no_likes_yet', 'No likes yet')}
                    </p>
                    <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                        {stats?.most_liked_song ? `♥ ${stats.most_liked_song.likes_count} ${t('songs.likes_label', 'likes')}` : '—'}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('songs.avg_likes', 'Avg Likes / Song')}</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <BarChart2 size={16} />
                        </div>
                    </div>
                    <p className="mt-2 text-2xl font-extrabold text-slate-900">
                        {stats?.avg_likes_per_song ?? 0}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{t('songs.per_published_title', 'Per published title')}</p>
                </div>
            </div>

            {/* Toast & Error */}
            {toast && (
                <Alert variant={toast.variant} title={toast.message} onClose={() => setToast(null)} />
            )}
            {error && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span>{error}</span>
                    <Button variant="outline" size="sm" onClick={load}>
                        {t('common.retry', 'Retry')}
                    </Button>
                </div>
            )}

            <Modal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title={t('songs.create_new_song', 'Create New Song')}
                size="full"
            >
                <AdminSongFormPage
                    mode="create"
                    embedded
                    onCancel={() => setShowCreateModal(false)}
                    onSuccess={(song) => {
                        setShowCreateModal(false);
                        setToast({ variant: 'success', message: `"${song.title}" ${t('songs.created_success', 'created successfully.')}` });
                        load();
                    }}
                />
            </Modal>

            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
                <button
                    onClick={() => setStatusTab('all')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${
                        statusTab === 'all'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    {t('songs.tab_all', 'All Songs')} ({songs.length})
                </button>
                <button
                    onClick={() => setStatusTab('pending')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${
                        statusTab === 'pending'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <Clock size={13} />
                    {t('songs.tab_pending', 'Pending Approval')}
                    {pendingCount > 0 && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-black ${
                            statusTab === 'pending' ? 'bg-white text-amber-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                            {pendingCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setStatusTab('approved')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${
                        statusTab === 'approved'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <CheckCircle2 size={13} />
                    {t('songs.tab_approved', 'Approved')} ({approvedCount})
                </button>
                <button
                    onClick={() => setStatusTab('rejected')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${
                        statusTab === 'rejected'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <XCircle size={13} />
                    {t('songs.tab_rejected', 'Rejected')} ({rejectedCount})
                </button>
            </div>

            {/* Filters and Sorting Bar */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('songs.search_placeholder', 'Search songs by title, artist, composer...')}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>
                <select
                    value={choirId}
                    onChange={(e) => setChoirId(e.target.value)}
                    className="min-w-[170px] rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium text-slate-700"
                >
                    <option value="">{t('songs.filter_all_choirs', 'All Choirs')}</option>
                    {choirs.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <div className="flex items-center gap-1.5">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="min-w-[160px] rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium text-slate-700"
                    >
                        <option value="newest">{t('songs.sort_newest', 'Newest first')}</option>
                        <option value="most_liked">{t('songs.sort_popular', 'Most liked')}</option>
                        <option value="oldest">{t('songs.sort_oldest', 'Oldest first')}</option>
                        <option value="title">{t('songs.sort_title', 'Title (A - Z)')}</option>
                    </select>
                </div>
            </div>

            {/* Songs Grid */}
            {sortedSongs.length === 0 ? (
                <div className="min-h-0 flex-1 overflow-y-auto">
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
                    <Music className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                    <p className="font-bold text-slate-800">
                        {statusTab === 'pending'
                            ? t('songs.no_pending', 'No pending song submissions')
                            : t('common.no_data', 'No data found')}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        {statusTab === 'pending'
                            ? t('songs.no_pending_desc', 'All submitted choir songs have been reviewed and approved.')
                            : t('songs.no_results_desc', 'Adjust your search query or filters to see music records.')}
                    </p>
                </div>
                </div>
            ) : (
                <div className="min-h-0 flex-1 overflow-y-auto pb-4">
                    <div className="grid grid-cols-1 gap-4">
                    {sortedSongs.map((s) => {
                        const isPending = s.status === 'pending';
                        const isApproved = s.status === 'approved';
                        const isRejected = s.status === 'rejected';

                        return (
                            <div
                                key={s.id}
                                className={`group rounded-2xl border bg-white p-4 shadow-xs transition-all hover:shadow-md ${
                                    isPending ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'
                                }`}
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    {/* Song & Artwork */}
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 font-bold overflow-hidden border border-blue-200">
                                            {s.cover_url ? (
                                                <img src={s.cover_url} alt={s.title} className="h-full w-full object-cover" />
                                            ) : (
                                                <Music size={24} />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-slate-900 leading-tight truncate">
                                                    {s.title}
                                                </h3>
                                                {/* Status Badge */}
                                                {isPending && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                                                        <Clock size={11} className="animate-spin" /> {t('songs.tab_pending', 'Pending Approval')}
                                                    </span>
                                                )}
                                                {isApproved && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                                                        <CheckCircle2 size={11} /> {t('status.approved', 'Approved')}
                                                    </span>
                                                )}
                                                {isRejected && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">
                                                        <XCircle size={11} /> {t('status.rejected', 'Rejected')}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                                {s.artist && <span>{t('songs.artist_label', 'Artist')}: <strong className="text-slate-700">{s.artist}</strong></span>}
                                                <span>{t('songs.choir_label', 'Choir')}: <strong className="text-slate-700">{s.choir?.name || '—'}</strong></span>
                                                {s.original_key && <span>{t('songs.key_label_short', 'Key')}: <strong>{s.original_key}</strong></span>}
                                                {s.likes_count !== undefined && (
                                                    <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                                                        <Heart size={11} className="fill-rose-500 text-rose-500" />
                                                        {s.likes_count} {s.likes_count === 1 ? t('songs.like_singular', 'like') : t('songs.likes_label', 'likes')}
                                                    </span>
                                                )}
                                                {s.creator && (
                                                    <span className="flex items-center gap-1 text-blue-700 font-medium">
                                                        <User size={12} /> {t('songs.submitted_by', 'Submitted by')} {s.creator.name}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Rejection Note in card */}
                                            {isRejected && s.rejection_reason && (
                                                <p className="mt-2 rounded-lg bg-rose-50 px-2.5 py-1 text-xs text-rose-700 border border-rose-100">
                                                    <strong>{t('songs.reason_label', 'Reason')}:</strong> {s.rejection_reason}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex flex-wrap items-center gap-2 shrink-0 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
                                        {/* Play Audio */}
                                        {s.audio_path && (
                                            <button
                                                onClick={() => togglePlay(s.id, s.audio_path)}
                                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition shadow-xs"
                                                title={playingId === s.id ? t('common.pause', 'Pause') : t('common.play_audio', 'Play audio')}
                                            >
                                                {playingId === s.id ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                                            </button>
                                        )}

                                        {/* Pending Actions: Approve / Reject */}
                                        {isPending && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(s)}
                                                    disabled={approvingId === s.id}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition active:scale-95 disabled:opacity-60"
                                                >
                                                    <Check size={14} /> {t('songs.approve_action', 'Approve')}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setToReject(s);
                                                        setRejectionReason('');
                                                    }}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 border border-rose-200 hover:bg-rose-100 transition active:scale-95"
                                                >
                                                    <X size={14} /> {t('songs.reject_action', 'Reject')}
                                                </button>
                                            </>
                                        )}

                                        {/* Review / View */}
                                        <button
                                            onClick={() => setToReview(s)}
                                            className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                                        >
                                            <Eye size={14} /> {t('songs.review_action', 'Review')}
                                        </button>

                                        {/* Edit */}
                                        {can('songs.edit') && (
                                            <button
                                                onClick={() => navigate(`/admin/songs/${s.id}/edit`)}
                                                className="inline-flex items-center justify-center rounded-xl bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 transition"
                                                title={t('common.edit', 'Edit')}
                                            >
                                                <Pencil size={15} />
                                            </button>
                                        )}

                                        {/* Delete */}
                                        {can('songs.delete') && (
                                            <button
                                                onClick={() => setToDelete(s)}
                                                className="inline-flex items-center justify-center rounded-xl bg-slate-50 p-2 text-rose-600 hover:bg-rose-50 transition"
                                                title={t('common.delete', 'Delete')}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                </div>
            )}

            {/* Review / Detail Modal */}
            <Modal open={Boolean(toReview)} onClose={() => setToReview(null)} title={toReview?.title || t('songs.song_review_title', 'Song Review')} size="lg">
                {toReview && (
                    <div className="space-y-5 text-slate-800">
                        {/* Status bar */}
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('common.status', 'Status')}</span>
                                <p className="text-sm font-bold capitalize mt-0.5">
                                    {toReview.status === 'pending' && <span className="text-amber-700">{t('songs.tab_pending', 'Pending Approval')}</span>}
                                    {toReview.status === 'approved' && <span className="text-emerald-700">{t('songs.approved_published_label', 'Approved & Published')}</span>}
                                    {toReview.status === 'rejected' && <span className="text-rose-700">{t('status.rejected', 'Rejected')}</span>}
                                </p>
                            </div>
                            {toReview.creator && (
                                <div className="text-right">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('songs.submitted_by_label', 'Submitted By')}</span>
                                    <p className="text-xs font-bold text-slate-700 mt-0.5">{toReview.creator.name}</p>
                                </div>
                            )}
                        </div>

                        {/* Metadata grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                                <span className="text-slate-400 block font-semibold uppercase text-[10px]">{t('songs.choir_label', 'Choir')}</span>
                                <strong className="text-slate-800 truncate block mt-0.5">{toReview.choir?.name || '—'}</strong>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                                <span className="text-slate-400 block font-semibold uppercase text-[10px]">{t('songs.artist_lead', 'Artist / Lead Singer')}</span>
                                <strong className="text-slate-800 truncate block mt-0.5">{toReview.artist || '—'}</strong>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                                <span className="text-slate-400 block font-semibold uppercase text-[10px]">{t('songs.key_scale_label', 'Key & Scale')}</span>
                                <strong className="text-slate-800 truncate block mt-0.5">
                                    {toReview.original_key || '—'} ({toReview.scale || 'major'})
                                </strong>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                                <span className="text-slate-400 block font-semibold uppercase text-[10px]">{t('songs.composer_label', 'Composer')}</span>
                                <strong className="text-slate-800 truncate block mt-0.5">{toReview.composer || '—'}</strong>
                            </div>
                        </div>

                        {/* Audio preview in modal */}
                        {toReview.audio_path && (
                            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
                                <p className="text-xs font-bold text-blue-900 mb-2 flex items-center gap-1.5">
                                    <Volume2 size={16} /> {t('songs.attached_audio', 'Attached Audio Recording')}
                                </p>
                                <audio
                                    controls
                                    src={`/storage/${String(toReview.audio_path).replace(/^\/+/, '')}`}
                                    className="w-full h-9"
                                />
                            </div>
                        )}

                        {/* Description */}
                        {toReview.description && (
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{t('songs.description_context', 'Description / Context')}</h4>
                                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    {toReview.description}
                                </p>
                            </div>
                        )}

                        {/* Lyrics */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                                <FileText size={13} /> {t('songs.lyrics_field', 'Lyrics & Chords')}
                            </h4>
                            {toReview.lyrics ? (
                                <div className="max-h-60 overflow-y-auto whitespace-pre-wrap font-mono text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    {toReview.lyrics}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl">{t('songs.no_lyrics', 'No lyrics attached to this song.')}</p>
                            )}
                        </div>

                        {/* Rejection reason if rejected */}
                        {toReview.status === 'rejected' && toReview.rejection_reason && (
                            <div className="rounded-xl bg-rose-50 p-3 border border-rose-100 text-xs text-rose-800">
                                <strong>{t('songs.rejection_reason_label', 'Rejection Reason')}:</strong> {toReview.rejection_reason}
                            </div>
                        )}

                        {/* Modal Action Buttons */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                            <Button variant="ghost" onClick={() => setToReview(null)}>
                                {t('common.close', 'Close')}
                            </Button>
                            <div className="flex items-center gap-2">
                                {toReview.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setToReject(toReview);
                                                setRejectionReason('');
                                            }}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
                                        >
                                            <X size={14} /> {t('songs.reject_action', 'Reject')}
                                        </button>
                                        <button
                                            onClick={() => handleApprove(toReview)}
                                            disabled={approvingId === toReview.id}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-60"
                                        >
                                            <Check size={14} /> {t('songs.approve_publish', 'Approve & Publish')}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Rejection Modal */}
            <Modal open={Boolean(toReject)} onClose={() => setToReject(null)} title={t('songs.reject_modal_title', 'Reject Song Submission')} size="md">
                {toReject && (
                    <form onSubmit={handleReject} className="space-y-4 text-slate-800">
                        <p className="text-xs text-slate-600">
                            {t('songs.rejecting_label', 'Rejecting')} <strong>"{toReject.title}"</strong> {t('songs.reject_notify_msg', 'will notify the submitter. Please provide a clear explanation or feedback.')}
                        </p>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                {t('songs.reject_reason_label', 'Reason for Rejection')} <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                required
                                maxLength={1000}
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder={t('songs.reject_reason_placeholder', 'Explain why this song is rejected or what changes are needed before resubmission...')}
                                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 transition focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
                            />
                        </div>
                        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                            <Button type="button" variant="ghost" onClick={() => setToReject(null)} disabled={rejecting}>
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button type="submit" variant="danger" loading={rejecting} disabled={!rejectionReason.trim()}>
                                {t('songs.confirm_reject', 'Confirm Rejection')}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Delete Modal */}
            <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title={t('songs.delete_modal_title', 'Delete Song')}>
                <p className="text-sm text-ink-600">
                    {t('songs.delete_confirm', 'Are you sure you want to delete this song? This cannot be undone.')} <strong>"{toDelete?.title}"</strong>
                </p>
                <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                    <Button variant="ghost" onClick={() => setToDelete(null)}>
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        {t('common.delete', 'Delete')}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}