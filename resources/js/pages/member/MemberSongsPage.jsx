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
    Heart,
} from 'lucide-react';
import { api } from '../../axios';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/member/EmptyState';
import MemberSongLyricsModal from '../../components/member/MemberSongLyricsModal';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { likeSong, unlikeSong } from '../../lib/publicApi';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'Db', 'Eb', 'Gb', 'Ab', 'Bb'];
const SCALES = [
    { value: 'major', labelKey: 'songs.scale_major', label: 'Major' },
    { value: 'minor', labelKey: 'songs.scale_minor', label: 'Minor' },
    { value: 'ethiopian', labelKey: 'songs.scale_ethiopian', label: 'Ethiopian / Traditional' },
];

/* ─────────────────────── Mini Audio Player ─────────────────────── */
function MiniAudioPlayer({ audioUrl, onClose }) {
    const { t } = useLanguage();
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
                aria-label={t('songs.close_player', 'Close player')}
            >
                <X size={16} />
            </button>
        </div>
    );
}

/* ─────────────────────── Song Card ─────────────────────── */
function SongCard({ song, onPlay, onLyrics, isSubmission = false }) {
    const { t } = useLanguage();
    const isPending = song.status === 'pending';
    const isApproved = song.status === 'approved';
    const isRejected = song.status === 'rejected';

    return (
        <div className="group flex flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-slate-50 transition hover:shadow-md hover:border-blue-100">
            {/* Status Header for Submissions */}
            {isSubmission && (
                <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {t('songs.submission_status', 'Submission Status')}
                    </span>
                    {isPending && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
                            <Clock size={12} className="animate-spin" /> {t('status.pending_review', 'Pending Review')}
                        </span>
                    )}
                    {isApproved && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} /> {t('status.approved', 'Approved')}
                        </span>
                    )}
                    {isRejected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
                            <XCircle size={12} /> {t('status.rejected', 'Rejected')}
                        </span>
                    )}
                </div>
            )}

            {/* Rejection Note */}
            {isSubmission && isRejected && song.rejection_reason && (
                <div className="mb-3 rounded-xl bg-rose-50/80 p-2.5 border border-rose-100 text-xs text-rose-800">
                    <p className="font-bold mb-0.5 flex items-center gap-1">
                        <AlertCircle size={13} /> {t('songs.admin_feedback', 'Admin Feedback:')}
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
                            {t('songs.key_label', { key: song.original_key })}
                        </span>
                    )}
                </div>
            </div>

            {/* Badges */}
            <div className="mb-3 flex flex-wrap gap-1.5">
                {song.has_lyrics && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-100">
                        <FileText size={10} /> {t('common.lyrics', 'Lyrics')}
                    </span>
                )}
                {song.has_audio && (
                    <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-100">
                        <Play size={10} /> {t('songs.badge_audio', 'Audio')}
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
                        <FileText size={13} /> {t('common.lyrics', 'Lyrics')}
                    </button>
                )}
                {song.has_audio && (
                    <button
                        onClick={() => onPlay(song)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                    >
                        <Play size={13} /> {t('common.play', 'Play')}
                    </button>
                )}
                {song.has_audio && (
                    <a
                        href={song.audio_url}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                        title={t('common.download_audio', 'Download audio')}
                    >
                        <Download size={13} />
                    </a>
                )}
            </div>
        </div>
    );
}

function SongTable({ songs, onPlay, onLyrics, isSubmission = false }) {
    const { t } = useLanguage();

    return (
        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-full overflow-auto pb-24">
                <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                        <tr>
                            <th className="px-4 py-3 font-semibold">{t('songs.col_song', 'Song')}</th>
                            <th className="px-4 py-3 font-semibold">{t('songs.col_key', 'Key')}</th>
                            <th className="px-4 py-3 font-semibold">{t('songs.col_status', 'Status')}</th>
                            <th className="px-4 py-3 font-semibold">{t('songs.col_available', 'Available')}</th>
                            <th className="px-4 py-3 text-right font-semibold">{t('songs.col_actions', 'Actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {songs.map((song) => (
                            <tr key={song.id} className="transition hover:bg-slate-50/80">
                                <td className="max-w-[280px] px-4 py-3">
                                    <p className="truncate font-semibold text-slate-900">{song.title}</p>
                                    <p className="truncate text-xs text-slate-500">
                                        {song.artist || song.composer || song.choir?.name || 'Choir MKC'}
                                    </p>
                                    {isSubmission && song.rejection_reason && (
                                        <p className="mt-1 truncate text-xs text-rose-600" title={song.rejection_reason}>
                                            {t('songs.admin_feedback', 'Feedback:')} {song.rejection_reason}
                                        </p>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-slate-600">{song.original_key || '—'}</td>
                                <td className="px-4 py-3">
                                    {isSubmission ? (
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                                            song.status === 'approved'
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : song.status === 'rejected'
                                                    ? 'bg-rose-50 text-rose-700'
                                                    : 'bg-amber-50 text-amber-700'
                                        }`}>
                                            {song.status === 'approved' && <CheckCircle2 size={13} />}
                                            {song.status === 'rejected' && <XCircle size={13} />}
                                            {song.status === 'pending' && <Clock size={13} />}
                                            {song.status === 'approved' ? t('status.approved', 'Approved') : (song.status === 'rejected' ? t('status.rejected', 'Rejected') : t('status.pending', 'Pending'))}
                                        </span>
                                    ) : (
                                        <span className="text-xs font-semibold text-emerald-700">{t('status.approved', 'Approved')}</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2 text-xs">
                                        {song.has_lyrics && <span className="text-emerald-700">{t('common.lyrics', 'Lyrics')}</span>}
                                        {song.has_audio && <span className="text-blue-700">{t('songs.badge_audio', 'Audio')}</span>}
                                        {!song.has_lyrics && !song.has_audio && <span className="text-slate-400">—</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-1.5">
                                        <SongLikeButton song={song} />
                                        {song.has_lyrics && (
                                             <button
                                                type="button"
                                                onClick={() => onLyrics(song)}
                                                className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                                                title={t('common.lyrics', 'Lyrics')}
                                                aria-label={`View lyrics for ${song.title}`}
                                            >
                                                <FileText size={16} />
                                            </button>
                                        )}
                                        {song.has_audio && (
                                            <button
                                                type="button"
                                                onClick={() => onPlay(song)}
                                                className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 hover:text-blue-800"
                                                title={t('common.play', 'Play')}
                                                aria-label={`Play ${song.title}`}
                                            >
                                                <Play size={16} />
                                            </button>
                                        )}
                                        {song.has_audio && (
                                            <a
                                                href={song.audio_url}
                                                download
                                                className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700"
                                                title={t('common.download_audio', 'Download audio')}
                                                aria-label={`Download ${song.title}`}
                                            >
                                                <Download size={16} />
                                            </a>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SongLikeButton({ song }) {
    const { t } = useLanguage();
    const { isAuthenticated, hasRole } = useAuth();
    const canLike = isAuthenticated && hasRole('member');
    const [liked, setLiked] = useState(Boolean(song.is_liked));
    const [count, setCount] = useState(Number(song.likes_count || 0));
    const [saving, setSaving] = useState(false);

    const toggleLike = async () => {
        if (!canLike || saving) return;

        const previousLiked = liked;
        const previousCount = count;
        const nextLiked = !previousLiked;
        setLiked(nextLiked);
        setCount(Math.max(0, previousCount + (nextLiked ? 1 : -1)));
        setSaving(true);

        try {
            const response = nextLiked ? await likeSong(song.id) : await unlikeSong(song.id);
            if (response?.likes_count !== undefined) setCount(Number(response.likes_count));
        } catch {
            setLiked(previousLiked);
            setCount(previousCount);
        } finally {
            setSaving(false);
        }
    };

    return (
        <button
            type="button"
            onClick={toggleLike}
            disabled={!canLike || saving}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
                liked ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-rose-50 hover:text-rose-600'
            }`}
            title={canLike ? (liked ? t('songs.unlike_song', 'Unlike song') : t('songs.like_song', 'Like song')) : t('songs.members_can_like', 'Members can like songs')}
            aria-label={`${count} likes${canLike ? `, ${liked ? 'unlike' : 'like'} ${song.title}` : ''}`}
        >
            <Heart size={15} className={liked ? 'fill-current' : ''} />
            <span>{count}</span>
        </button>
    );
}

/* ─────────────────────── Submit Song Modal ─────────────────────── */
function SubmitSongModal({ open, onClose, onSubmitted, apiPath, defaultChoir, userChoirs = [] }) {
    const { t } = useLanguage();
    const initialChoirId = defaultChoir?.id || userChoirs?.[0]?.id || '';
    const [form, setForm] = useState({
        choir_id: initialChoirId,
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

    // Keep choir_id synchronized with available choir
    useEffect(() => {
        if (!form.choir_id) {
            const cid = defaultChoir?.id || userChoirs?.[0]?.id || '';
            if (cid) setForm((prev) => ({ ...prev, choir_id: cid }));
        }
    }, [defaultChoir, userChoirs]);

    const update = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    };

    const resetForm = () => {
        setForm({
            choir_id: defaultChoir?.id || userChoirs?.[0]?.id || '',
            title: '',
            composer: '',
            artist: '',
            original_key: 'C',
            scale: 'major',
            scale_mode: '',
            description: '',
            lyrics: '',
        });
        setAudioFile(null);
        setCoverFile(null);
        setErrors({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        try {
            const payload = new FormData();
            if (form.choir_id) payload.append('choir_id', form.choir_id);
            payload.append('title', form.title.trim());
            if (form.composer?.trim()) payload.append('composer', form.composer.trim());
            if (form.artist?.trim()) payload.append('artist', form.artist.trim());
            payload.append('original_key', form.original_key);
            payload.append('scale', form.scale);
            if (form.scale_mode?.trim()) payload.append('scale_mode', form.scale_mode.trim());
            if (form.description?.trim()) payload.append('description', form.description.trim());
            if (form.lyrics?.trim()) payload.append('lyrics', form.lyrics.trim());

            if (audioFile) {
                payload.append('audio', audioFile);
            }
            if (coverFile) {
                payload.append('cover_image', coverFile);
            }

            await api.post(`/${apiPath}`, payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            resetForm();
            onSubmitted(t('songs.submit_success', 'Your song was submitted successfully and is now pending administrator review.'));
            onClose();
        } catch (err) {
            console.error('Song submission error:', err);
            if (err.errors) {
                const firstErr = Object.values(err.errors).flat()[0];
                setErrors({
                    ...err.errors,
                    general: firstErr || err.message || t('songs.validation_errors', 'Please correct the highlighted validation errors.'),
                });
            } else {
                setErrors({ general: err.message || t('songs.submit_failed', 'Failed to submit song. Please check your data and try again.') });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const choirOptions = userChoirs.length > 0
        ? userChoirs
        : defaultChoir
        ? [defaultChoir]
        : [];

    return (
        <Modal open={open} onClose={onClose} title={t('songs.modal_submit_title', 'Submit Song for Review')} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="rounded-xl bg-blue-50/70 p-3 border border-blue-100 text-xs text-blue-800 flex items-start gap-2">
                    <Sparkles size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold">{t('songs.process_title', 'Submission & Approval Process')}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                            {t('songs.process_desc', 'Submitted songs are saved with status Pending. Administrators review submissions to approve, reject, or request edits. Once approved, the song appears publicly in the worship music library.')}
                        </p>
                    </div>
                </div>

                {errors.general && (
                    <Alert variant="error" title={errors.general} />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Choir Selection */}
                    {choirOptions.length > 1 ? (
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                {t('songs.field_choir', 'Choir')} <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={form.choir_id}
                                onChange={update('choir_id')}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                required
                            >
                                <option value="">{t('songs.field_select_choir', 'Select Choir...')}</option>
                                {choirOptions.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            {errors.choir_id?.[0] && (
                                <p className="mt-1 text-xs text-rose-600">{errors.choir_id[0]}</p>
                            )}
                        </div>
                    ) : choirOptions.length === 1 ? (
                        <div className="sm:col-span-2 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 flex items-center justify-between text-xs text-slate-600">
                            <span>{t('songs.submitting_for_choir', 'Submitting for Choir:')}</span>
                            <span className="font-bold text-blue-700">{choirOptions[0].name}</span>
                        </div>
                    ) : null}
                    <div className="sm:col-span-2">
                        <Input
                            label={t('songs.field_title', 'Song Title')}
                            value={form.title}
                            onChange={update('title')}
                            error={errors.title?.[0]}
                            placeholder={t('songs.title_placeholder', 'e.g. Halleluya LeAmlak')}
                            maxLength={255}
                            required
                        />
                    </div>

                    <Input
                        label={t('songs.field_artist', 'Artist / Choir')}
                        value={form.artist}
                        onChange={update('artist')}
                        error={errors.artist?.[0]}
                        placeholder={t('songs.artist_placeholder', 'Lead vocalist or original performer')}
                        maxLength={255}
                    />

                    <Input
                        label={t('songs.field_composer', 'Composer / Songwriter')}
                        value={form.composer}
                        onChange={update('composer')}
                        error={errors.composer?.[0]}
                        placeholder={t('songs.composer_placeholder', 'Songwriter / Composer name')}
                        maxLength={255}
                    />

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            {t('songs.field_key', 'Original Key')} <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={form.original_key}
                            onChange={update('original_key')}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            {KEYS.map((k) => (
                                <option key={k} value={k}>
                                    {t('songs.key_of', 'Key of {{key}}', { key: k })}
                                </option>
                            ))}
                        </select>
                        {errors.original_key?.[0] && (
                            <p className="mt-1 text-xs text-rose-600">{errors.original_key[0]}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            {t('songs.field_scale', 'Scale / Mode')} <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={form.scale}
                            onChange={update('scale')}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            {SCALES.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.labelKey ? t(s.labelKey, s.label) : s.label}
                                </option>
                            ))}
                        </select>
                        {errors.scale?.[0] && (
                            <p className="mt-1 text-xs text-rose-600">{errors.scale[0]}</p>
                        )}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            {t('songs.field_description', 'Description / Spiritual Context')}
                        </label>
                        <textarea
                            rows={2}
                            value={form.description}
                            onChange={update('description')}
                            placeholder={t('songs.description_placeholder', 'Brief notes about the occasion or theme of this song...')}
                            maxLength={2000}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                        {errors.description?.[0] && (
                            <p className="mt-1 text-xs text-rose-600">{errors.description[0]}</p>
                        )}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            {t('songs.field_lyrics', 'Song Lyrics')}
                        </label>
                        <textarea
                            rows={5}
                            value={form.lyrics}
                            onChange={update('lyrics')}
                            placeholder={t('songs.lyrics_placeholder', 'Enter the full lyrics for this song (stanzas and chorus)...')}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 font-mono placeholder:text-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                        {errors.lyrics?.[0] && (
                            <p className="mt-1 text-xs text-rose-600">{errors.lyrics[0]}</p>
                        )}
                    </div>

                    {/* Audio Upload */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            {t('songs.field_audio', 'MP3 Audio File (Max 15MB)')}
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
                            {t('songs.field_cover', 'Cover Image (Max 5MB)')}
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
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button type="submit" loading={submitting} className="gap-2">
                        <Upload size={15} />
                        {t('songs.btn_submit_review', 'Submit for Review')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

/* ─────────────────────── Page ─────────────────────── */
export default function MemberSongsPage({ apiPath = 'member/songs' }) {
    const { t } = useLanguage();
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
            .catch((err) => setError(err.message || t('songs.load_error', 'Unable to load songs.')))
            .finally(() => setLoading(false));
    }, [apiPath, t]);

    useEffect(() => {
        load();
    }, [load]);

    const songs = Array.isArray(data?.songs)
        ? data.songs
        : (Array.isArray(data?.songs?.items) ? data.songs.items : []);
    const mySubmissions = Array.isArray(data?.my_submissions)
        ? data.my_submissions
        : (Array.isArray(data?.my_submissions?.items) ? data.my_submissions.items : []);

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
        <div className="flex h-full min-h-0 flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                        {t('songs.library_title', 'Music Library')}
                    </h1>
                    <p className="mt-0.5 text-sm text-slate-500">
                        {data?.choir
                            ? t('songs.library_subtitle', '{choir} songs and submissions', { choir: data.choir.name })
                            : t('songs.default_subtitle', 'Your choir song library')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsSubmitOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition active:scale-95"
                    >
                        <Plus size={16} />
                        {t('songs.submit_song', 'Submit Song')}
                    </button>
                    <button
                        onClick={load}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60"
                        title={t('common.refresh', 'Refresh')}
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
                    {t('songs.tab_choir_library', 'Choir Library ({count})', { count: stats.total })}
                </button>
                <button
                    onClick={() => setActiveTab('my_submissions')}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition ${
                        activeTab === 'my_submissions'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    {t('songs.tab_my_submissions', 'My Submissions')}
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
                        { label: t('songs.approved_songs', 'Approved Songs'), value: stats.total, color: 'blue' },
                        { label: t('songs.with_lyrics', 'With Lyrics'), value: stats.withLyrics, color: 'emerald' },
                        { label: t('songs.with_audio', 'With Audio'), value: stats.withAudio, color: 'indigo' },
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
                        placeholder={
                            activeTab === 'library'
                                ? t('songs.search_placeholder_library', 'Search songs by title, artist, or composer…')
                                : t('songs.search_placeholder_submissions', 'Search my submissions by title, artist, or composer…')
                        }
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
                <Alert variant="error" title={t('songs.load_error', 'Unable to load songs.')}>
                    <p>{error}</p>
                    <button onClick={load} className="mt-2 text-sm font-semibold underline">{t('common.try_again', 'Try Again')}</button>
                </Alert>
            )}

            {/* Song Table */}
            {loading ? (
                <div className="min-h-0 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
                        <div className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
                        <div className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
                    </div>
                </div>
            ) : filteredSongs.length === 0 ? (
                <div className="min-h-0 flex-1 overflow-y-auto">
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
                    <Music2 size={36} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-base font-bold text-slate-800">
                        {activeTab === 'library'
                            ? t('songs.no_songs_found', 'No songs found in this choir library')
                            : t('songs.no_submissions', 'No song submissions yet')}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        {activeTab === 'library'
                            ? t('songs.no_songs_found_desc', 'Approved choir songs will appear here once reviewed by the administrator.')
                            : t('songs.no_submissions_desc', "You haven't submitted any songs yet. Click below to submit a song for review.")}
                    </p>
                    <button
                        onClick={() => setIsSubmitOpen(true)}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                    >
                        <Plus size={15} />
                        {t('songs.submit_a_song', 'Submit a Song')}
                    </button>
                </div>
                </div>
            ) : (
                <SongTable
                    songs={filteredSongs}
                    onPlay={(song) => setPlayingSong(song)}
                    onLyrics={(song) => setLyricsSong(song)}
                    isSubmission={activeTab === 'my_submissions'}
                />
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
                defaultChoir={data?.choir}
                userChoirs={data?.user_choirs || []}
            />
        </div>
    );
}
