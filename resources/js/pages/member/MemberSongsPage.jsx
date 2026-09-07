import { useEffect, useState, useMemo, useCallback } from 'react';
import {
    Music2,
    Search,
    RefreshCw,
    Download,
    FileText,
    Play,
    X,
    Disc3,
    Plus,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Upload,
    Image,
    Sparkles,
} from 'lucide-react';
import { api } from '../../axios';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/member/EmptyState';
import MemberSongLyricsModal from '../../components/member/MemberSongLyricsModal';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'Db', 'Eb', 'Gb', 'Ab', 'Bb'];
const SCALES = [
    { value: 'major', label: 'Major' },
    { value: 'minor', label: 'Minor' },
    { value: 'ethiopian', label: 'Ethiopian / Traditional' },
];

/* ─────────────────────── Mini Audio Player ─────────────────────── */
function MiniAudioPlayer({ audioUrl, onClose }) {
    return (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-2xl border border-blue-200 bg-white px-5 py-3 shadow-2xl ring-1 ring-blue-100">
            <Music2 size={18} className="text-blue-600 shrink-0" />
            <audio
                controls
                autoPlay
                src={audioUrl}
                className="h-8 w-56 sm:w-72"
                onEnded={onClose}
            />
            <button
                onClick={onClose}
                className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close player"
            >
                <X size={16} />
            </button>
        </div>
    );
}

/* ─────────────────────── Song Card ─────────────────────── */
function SongCard({ song, onPlay, onLyrics, isSubmission = false }) {
    const isPending = song.status === 'pending';
    const isApproved = song.status === 'approved';
    const isRejected = song.status === 'rejected';

    return (
        <div className="group flex flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-slate-50 transition hover:shadow-md hover:border-blue-100">
            {/* Status Header for Submissions */}
            {isSubmission && (
                <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Submission Status
                    </span>
                    {isPending && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
                            <Clock size={12} className="animate-spin" /> Pending Review
                        </span>
                    )}
                    {isApproved && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} /> Approved
                        </span>
                    )}
                    {isRejected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
                            <XCircle size={12} /> Rejected
                        </span>
                    )}
                </div>
            )}

            {/* Rejection Note */}
            {isSubmission && isRejected && song.rejection_reason && (
                <div className="mb-3 rounded-xl bg-rose-50/80 p-2.5 border border-rose-100 text-xs text-rose-800">
                    <p className="font-bold mb-0.5 flex items-center gap-1">
                        <AlertCircle size={13} /> Admin Feedback:
                    </p>
                    <p className="text-[11px] leading-relaxed">{song.rejection_reason}</p>
                </div>
            )}

            {/* Cover / Icon */}
            <div className="mb-3 flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-500 overflow-hidden">
                    {song.cover_url ? (
                        <img src={song.cover_url} alt={song.title} className="h-full w-full object-cover" />
                    ) : (
                        <Disc3 size={26} />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-slate-900 leading-tight">{song.title}</h3>
                    {song.artist && (
                        <p className="mt-0.5 truncate text-xs text-slate-500">{song.artist}</p>
                    )}
                    {song.original_key && (
                        <span className="mt-1.5 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            Key: {song.original_key}
                        </span>
                    )}
                </div>
            </div>

            {/* Badges */}
            <div className="mb-3 flex flex-wrap gap-1.5">
                {song.has_lyrics && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-100">
                        <FileText size={10} /> Lyrics
                    </span>
                )}
                {song.has_audio && (
                    <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-100">
                        <Play size={10} /> Audio
                    </span>
                )}
                <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-100">
                    {song.choir?.name || 'Choir MKC'}
                </span>
            </div>

            {/* Actions */}
            <div className="mt-auto flex flex-wrap gap-2 pt-1">
                {song.has_lyrics && (
                    <button
                        onClick={() => onLyrics(song)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                        <FileText size={13} /> Lyrics
                    </button>
                )}
                {song.has_audio && (
                    <button
                        onClick={() => onPlay(song)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                    >
                        <Play size={13} /> Play
                    </button>
                )}
                {song.has_audio && (
                    <a
                        href={song.audio_url}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                        title="Download audio"
                    >
                        <Download size={13} />
                    </a>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────── Submit Song Modal ─────────────────────── */
function SubmitSongModal({ open, onClose, onSubmitted, apiPath }) {
    const [form, setForm] = useState({
        title: '',
        composer: '',
        artist: '',
        original_key: 'C',
        scale: 'major',
        scale_mode: '',
        description: '',
        lyrics: '',
    });
    const [audioFile, setAudioFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const update = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        try {
            const payload = new FormData();
            payload.append('title', form.title);
            if (form.composer) payload.append('composer', form.composer);
            if (form.artist) payload.append('artist', form.artist);
            payload.append('original_key', form.original_key);
            payload.append('scale', form.scale);
            if (form.scale_mode) payload.append('scale_mode', form.scale_mode);
            if (form.description) payload.append('description', form.description);
            if (form.lyrics) payload.append('lyrics', form.lyrics);

            if (audioFile) {
                payload.append('audio', audioFile);
            }
            if (coverFile) {
                payload.append('cover_image', coverFile);
            }

            await api.post(`/${apiPath}`, payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            onSubmitted('Your song was submitted successfully and is now pending administrator review.');
            onClose();
        } catch (err) {
            if (err.errors) {
                setErrors(err.errors);
            } else {
                setErrors({ general: err.message || 'Failed to submit song.' });
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title="Submit Song for Review" size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="rounded-xl bg-blue-50/70 p-3 border border-blue-100 text-xs text-blue-800 flex items-start gap-2">
                    <Sparkles size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold">Submission & Approval Process</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                            Submitted songs will be reviewed by the choir administration with status <strong>Pending</strong>.
                            Once approved, it will be published to the choir and public worship music library.
                        </p>
                    </div>
                </div>

                {errors.general && (
                    <Alert variant="error" title={errors.general} />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                        <Input
                            label="Song Title"
                            value={form.title}
                            onChange={update('title')}
                            error={errors.title?.[0]}
                            placeholder="e.g. Halleluya LeAmlak"
                            maxLength={255}
                            required
                        />
                    </div>

                    <Input
                        label="Artist / Choir"
                        value={form.artist}
                        onChange={update('artist')}
                        error={errors.artist?.[0]}
                        placeholder="e.g. Yeka MKC Choir"
                        maxLength={255}
                    />

                    <Input
                        label="Composer / Songwriter"
                        value={form.composer}
                        onChange={update('composer')}
                        error={errors.composer?.[0]}
                        placeholder="e.g. Anonymous / Traditional"
                        maxLength={255}
                    />

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Original Key <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={form.original_key}
                            onChange={update('original_key')}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            {KEYS.map((k) => (
                                <option key={k} value={k}>
                                    Key of {k}
                                </option>
                            ))}
                        </select>
                        {errors.original_key?.[0] && (
                            <p className="mt-1 text-xs text-rose-600">{errors.original_key[0]}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Scale / Mode <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={form.scale}
                            onChange={update('scale')}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            {SCALES.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                        {errors.scale?.[0] && (
                            <p className="mt-1 text-xs text-rose-600">{errors.scale[0]}</p>
                        )}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Description / Spiritual Context
                        </label>
                        <textarea
                            rows={2}
                            value={form.description}
                            onChange={update('description')}
                            placeholder="Brief notes about the occasion or theme of this song..."
                            maxLength={2000}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                        {errors.description?.[0] && (
                            <p className="mt-1 text-xs text-rose-600">{errors.description[0]}</p>
                        )}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Song Lyrics
                        </label>
                        <textarea
                            rows={5}
                            value={form.lyrics}
                            onChange={update('lyrics')}
                            placeholder="Enter the full lyrics for this song (stanzas and chorus)..."
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 font-mono placeholder:text-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                        {errors.lyrics?.[0] && (
                            <p className="mt-1 text-xs text-rose-600">{errors.lyrics[0]}</p>
                        )}
                    </div>

                    {/* Audio Upload */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            MP3 Audio File (Max 15MB)
                        </label>
                        <input
                            type="file"
                            accept=".mp3,audio/mpeg"
                            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                        />
                        {errors.audio?.[0] && (
                            <p className="mt-1 text-xs text-rose-600">{errors.audio[0]}</p>
                        )}
                    </div>

                    {/* Cover Image Upload */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Cover Image (Max 5MB)
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                        />
                        {errors.cover_image?.[0] && (
                            <p className="mt-1 text-xs text-rose-600">{errors.cover_image[0]}</p>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={submitting} className="gap-2">
                        <Upload size={15} />
                        Submit for Review
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

/* ─────────────────────── Page ─────────────────────── */
export default function MemberSongsPage({ apiPath = 'member/songs' }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [search, setSearch] = useState('');
    const [playingSong, setPlayingSong] = useState(null);
    const [lyricsSong, setLyricsSong] = useState(null);
    const [activeTab, setActiveTab] = useState('library'); // 'library' | 'my_submissions'
    const [isSubmitOpen, setIsSubmitOpen] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        api.get(`/${apiPath}`)
            .then((res) => setData(res.data?.data ?? res.data))
            .catch((err) => setError(err.message || 'Unable to load songs.'))
            .finally(() => setLoading(false));
    }, [apiPath]);

    useEffect(() => {
        load();
    }, [load]);

    const songs = data?.songs ?? [];
    const mySubmissions = data?.my_submissions ?? [];

    const filteredSongs = useMemo(() => {
        const list = activeTab === 'library' ? songs : mySubmissions;
        if (!search.trim()) return list;
        const q = search.toLowerCase();
        return list.filter(
            (s) =>
                s.title?.toLowerCase().includes(q) ||
                s.artist?.toLowerCase().includes(q) ||
                s.composer?.toLowerCase().includes(q)
        );
    }, [songs, mySubmissions, activeTab, search]);

    const stats = useMemo(() => ({
        total: songs.length,
        withLyrics: songs.filter((s) => s.has_lyrics).length,
        withAudio: songs.filter((s) => s.has_audio).length,
    }), [songs]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Music Library</h1>
                    <p className="mt-0.5 text-sm text-slate-500">
                        {data?.choir ? `${data.choir.name} songs and submissions` : 'Your choir song library'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsSubmitOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition active:scale-95"
                    >
                        <Plus size={16} />
                        Submit Song
                    </button>
                    <button
                        onClick={load}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60"
                        title="Refresh"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Toast Alerts */}
            {toast && (
                <Alert
                    variant={toast.variant}
                    title={toast.message}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                    onClick={() => setActiveTab('library')}
                    className={`px-4 py-2 text-sm font-bold rounded-xl transition ${
                        activeTab === 'library'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    Choir Library ({stats.total})
                </button>
                <button
                    onClick={() => setActiveTab('my_submissions')}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition ${
                        activeTab === 'my_submissions'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    My Submissions
                    {mySubmissions.length > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                            activeTab === 'my_submissions' ? 'bg-white text-blue-700' : 'bg-slate-200 text-slate-700'
                        }`}>
                            {mySubmissions.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Stats bar (shown for library tab) */}
            {activeTab === 'library' && !loading && !error && songs.length > 0 && (
                <div className="flex flex-wrap gap-3">
                    {[
                        { label: 'Approved Songs', value: stats.total, color: 'blue' },
                        { label: 'With Lyrics', value: stats.withLyrics, color: 'emerald' },
                        { label: 'With Audio', value: stats.withAudio, color: 'indigo' },
                    ].map(({ label, value, color }) => (
                        <div
                            key={label}
                            className={`flex items-center gap-2 rounded-2xl border bg-white px-4 py-2.5 shadow-sm border-${color}-100`}
                        >
                            <span className={`text-lg font-black text-${color}-600`}>{value}</span>
                            <span className="text-xs font-medium text-slate-500">{label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Search */}
            {!loading && !error && (
                <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab === 'library' ? 'songs' : 'my submissions'} by title, artist, or composer…`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            )}

            {/* Error */}
            {error && (
                <Alert variant="error" title="Unable to load songs">
                    <p>{error}</p>
                    <button onClick={load} className="mt-2 text-sm font-semibold underline">Try Again</button>
                </Alert>
            )}

            {/* Song Grid */}
            {loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
                    <div className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
                    <div className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
                </div>
            ) : filteredSongs.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
                    <Music2 size={36} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-base font-bold text-slate-800">
                        {activeTab === 'library' ? 'No songs found in this choir library' : 'No song submissions yet'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        {activeTab === 'library'
                            ? 'Approved choir songs will appear here once reviewed by the administrator.'
                            : 'You haven\'t submitted any songs yet. Click below to submit a song for review.'}
                    </p>
                    <button
                        onClick={() => setIsSubmitOpen(true)}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                    >
                        <Plus size={15} />
                        Submit a Song
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredSongs.map((song) => (
                        <SongCard
                            key={song.id}
                            song={song}
                            onPlay={(s) => setPlayingSong(s)}
                            onLyrics={(s) => setLyricsSong(s)}
                            isSubmission={activeTab === 'my_submissions'}
                        />
                    ))}
                </div>
            )}

            {/* Mini Player */}
            {playingSong && (
                <MiniAudioPlayer
                    audioUrl={playingSong.audio_url}
                    onClose={() => setPlayingSong(null)}
                />
            )}

            {/* Lyrics Modal */}
            <MemberSongLyricsModal
                open={Boolean(lyricsSong)}
                onClose={() => setLyricsSong(null)}
                song={lyricsSong}
            />

            {/* Submit Song Modal */}
            <SubmitSongModal
                open={isSubmitOpen}
                onClose={() => setIsSubmitOpen(false)}
                onSubmitted={(msg) => {
                    setToast({ variant: 'success', message: msg });
                    setActiveTab('my_submissions');
                    load();
                }}
                apiPath={apiPath}
            />
        </div>
    );
}
