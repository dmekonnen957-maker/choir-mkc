import { useCallback, useEffect, useRef, useState } from 'react';
import {
    AlertTriangle,
    BookOpen,
    CalendarDays,
    Camera,
    Check,
    Clock3,
    ImageOff,
    ImagePlus,
    Loader2,
    MapPin,
    Pencil,
    Plus,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { api } from '../../axios';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/member/EmptyState';
import { useLanguage } from '../../context/LanguageContext';
import { useChoir } from '../../context/ChoirContext';
import { useAuth } from '../../context/AuthContext';

const PHOTOS_PER_PAGE = 50;
const EMPTY_PAGE = { items: [], pagination: { current_page: 1, last_page: 1, per_page: PHOTOS_PER_PAGE, total: 0 } };

function formatDate(value, fallback = '') {
    if (!value) return fallback;
    return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function MemberChoirHistoryPage() {
    const { t } = useLanguage();
    const { role } = useAuth();
    const { currentChoir, isAllChoirs } = useChoir();
    const isAdmin = role === 'admin' || role === 'super-admin';
    const isTeamLeader = role === 'team_leader';
    const canSwitchChoir = isAdmin || isTeamLeader;

    const getChoirParams = useCallback(() => {
        const params = {};
        if (canSwitchChoir && currentChoir && !isAllChoirs) {
            params.choir_id = currentChoir.id;
        }
        return params;
    }, [canSwitchChoir, currentChoir, isAllChoirs]);

    const getChoirFormData = useCallback((form) => {
        if (canSwitchChoir && currentChoir && !isAllChoirs) {
            form.append('choir_id', currentChoir.id);
        }
        return form;
    }, [canSwitchChoir, currentChoir, isAllChoirs]);

    const [data, setData] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [photoMeta, setPhotoMetaState] = useState(EMPTY_PAGE.pagination);
    const photoMetaRef = useRef(photoMeta);
    const [photosLoading, setPhotosLoading] = useState(true);
    const [photosLoadingMore, setPhotosLoadingMore] = useState(false);
    const [photosError, setPhotosError] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState('');
    const [draftPhoto, setDraftPhoto] = useState(null);
    const [lightbox, setLightbox] = useState(null);
    const [, setImageVersion] = useState(0);

    const thumbUrlsRef = useRef(new Map());
    const fullUrlsRef = useRef(new Map());
    const failedThumbsRef = useRef(new Set());
    const fetchingThumbsRef = useRef(new Set());
    const requestedPagesRef = useRef(new Set([1]));
    const loadingMoreRef = useRef(false);
    const sentinelRef = useRef(null);
    const hasMorePhotos = photoMeta.current_page < photoMeta.last_page;

    const setPhotoMeta = useCallback((meta) => {
        const next = meta || EMPTY_PAGE.pagination;
        photoMetaRef.current = next;
        setPhotoMetaState(next);
    }, []);

    const resetImageCache = useCallback(() => {
        thumbUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        fullUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        thumbUrlsRef.current.clear();
        fullUrlsRef.current.clear();
        failedThumbsRef.current.clear();
        fetchingThumbsRef.current.clear();
        requestedPagesRef.current = new Set([1]);
        setImageVersion((v) => v + 1);
    }, []);

    const requestThumb = useCallback(async (photo) => {
        const id = photo.id;
        if (thumbUrlsRef.current.has(id) || failedThumbsRef.current.has(id) || fetchingThumbsRef.current.has(id)) {
            return;
        }
        fetchingThumbsRef.current.add(id);
        try {
            const response = await api.get(photo.thumb_url, { responseType: 'blob' });
            const url = URL.createObjectURL(response.data);
            if (thumbUrlsRef.current.has(id)) {
                URL.revokeObjectURL(url);
            } else {
                thumbUrlsRef.current.set(id, url);
                setImageVersion((v) => v + 1);
            }
        } catch (err) {
            console.warn('Failed to load choir history thumbnail', photo.id, photo.thumb_url, err);
            failedThumbsRef.current.add(id);
            setImageVersion((v) => v + 1);
        } finally {
            fetchingThumbsRef.current.delete(id);
        }
    }, []);

    const loadPhotos = useCallback((items) => {
        items.forEach(requestThumb);
    }, [requestThumb]);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        resetImageCache();
        try {
            const response = await api.get('/member/choir-history', { params: getChoirParams() });
            const next = response.data?.data ?? response.data;
            setData(next);
            setHistory(next.choir?.history || '');
            const page = next.photos || EMPTY_PAGE;
            setPhotos(page.items || []);
            setPhotoMeta(page.pagination);
            loadPhotos(page.items || []);
        } catch (err) {
            setError(err.message || t('choir.load_error', 'Unable to load choir history.'));
        } finally {
            setLoading(false);
            setPhotosLoading(false);
        }
    }, [t, getChoirParams, resetImageCache, loadPhotos, setPhotoMeta]);

    const loadMore = useCallback(async () => {
        const meta = photoMetaRef.current;
        if (!meta || loadingMoreRef.current) return;
        if (meta.current_page >= meta.last_page) return;
        const nextPage = meta.current_page + 1;
        if (requestedPagesRef.current.has(nextPage)) return;

        requestedPagesRef.current.add(nextPage);
        loadingMoreRef.current = true;
        setPhotosLoadingMore(true);
        setPhotosError('');
        try {
            const response = await api.get('/member/choir-history/photos', {
                params: { ...getChoirParams(), page: nextPage, per_page: meta.per_page },
            });
            const payload = response.data?.data ?? response.data;
            const items = payload?.items ?? [];
            setPhotos((prev) => [...prev, ...items]);
            setPhotoMeta(payload?.pagination);
            loadPhotos(items);
        } catch (err) {
            setPhotosError(err.message || t('choir_history.load_more_error', 'Unable to load more photos.'));
        } finally {
            loadingMoreRef.current = false;
            setPhotosLoadingMore(false);
        }
    }, [getChoirParams, loadPhotos, setPhotoMeta]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const node = sentinelRef.current;
        if (!node || typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    loadMore();
                }
            },
            { rootMargin: '600px 0px' },
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [loadMore, hasMorePhotos]);

    useEffect(() => () => {
        thumbUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        fullUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    }, []);

    const openLightbox = useCallback(async (photo) => {
        if (fullUrlsRef.current.has(photo.id)) {
            setLightbox({ photo, url: fullUrlsRef.current.get(photo.id), loading: false, error: '' });
            return;
        }
        setLightbox({ photo, url: null, loading: true, error: '' });
        try {
            const response = await api.get(photo.url, { responseType: 'blob' });
            const url = URL.createObjectURL(response.data);
            fullUrlsRef.current.set(photo.id, url);
            setLightbox({ photo, url, loading: false, error: '' });
        } catch (err) {
            console.warn('Failed to load full photo', photo.id, photo.url, err);
            setLightbox((prev) => (prev ? { ...prev, loading: false, error: t('choir_history.photo_load_error', 'Unable to load this photo.') } : prev));
        }
    }, [t]);

    const saveHistory = async () => {
        setSaving(true);
        try {
            await api.put('/member/choir-history', { history, ...getChoirParams() });
            await load();
        } catch (err) {
            setError(err.message || t('choir_history.save_error', 'Unable to save choir history.'));
        } finally {
            setSaving(false);
        }
    };

    const uploadPhoto = async (event) => {
        event.preventDefault();
        if (!draftPhoto?.file) return;
        setSaving(true);
        const form = getChoirFormData(new FormData());
        form.append('photo', draftPhoto.file);
        form.append('title', draftPhoto.title);
        form.append('description', draftPhoto.description);
        form.append('event_date', draftPhoto.eventDate);
        try {
            await api.post('/member/choir-history/photos', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (draftPhoto.preview?.startsWith('blob:')) {
                URL.revokeObjectURL(draftPhoto.preview);
            }
            setDraftPhoto(null);
            await load();
        } catch (err) {
            setError(err.message || t('choir_history.upload_error', 'Unable to upload historical photo.'));
        } finally {
            setSaving(false);
        }
    };

    const replacePhoto = (photo) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/webp';
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            setSaving(true);
            const form = getChoirFormData(new FormData());
            form.append('photo', file);
            form.append('_method', 'PUT');
            try {
                await api.post(`/member/choir-history/photos/${photo.id}`, form, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                const oldThumb = thumbUrlsRef.current.get(photo.id);
                const oldFull = fullUrlsRef.current.get(photo.id);
                thumbUrlsRef.current.delete(photo.id);
                fullUrlsRef.current.delete(photo.id);
                failedThumbsRef.current.delete(photo.id);
                if (oldThumb) URL.revokeObjectURL(oldThumb);
                if (oldFull) URL.revokeObjectURL(oldFull);
                setImageVersion((v) => v + 1);
                await load();
            } catch (err) {
                setError(err.message || t('choir_history.replace_error', 'Unable to replace historical photo.'));
            } finally {
                setSaving(false);
            }
        };
        input.click();
    };

    const deletePhoto = async (photo) => {
        if (!window.confirm(t('choir_history.delete_confirm', 'Delete {{title}}?', { title: photo.title || t('choir_history.this_photo', 'this historical photo') }))) return;
        setSaving(true);
        try {
            const params = getChoirParams();
            const queryString = Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : '';
            await api.delete(`/member/choir-history/photos/${photo.id}${queryString}`);
            const thumb = thumbUrlsRef.current.get(photo.id);
            const full = fullUrlsRef.current.get(photo.id);
            thumbUrlsRef.current.delete(photo.id);
            fullUrlsRef.current.delete(photo.id);
            failedThumbsRef.current.delete(photo.id);
            if (thumb) URL.revokeObjectURL(thumb);
            if (full) URL.revokeObjectURL(full);
            setPhotos((prev) => prev.filter((item) => item.id !== photo.id));
            setPhotoMeta((meta) => ({ ...meta, total: Math.max(0, (meta?.total ?? 0) - 1) }));
            setImageVersion((v) => v + 1);
            setLightbox(null);
        } catch (err) {
            setError(err.message || t('choir_history.delete_error', 'Unable to delete historical photo.'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="h-96 animate-pulse rounded-3xl bg-slate-200" />;
    }

    if (error && !data) {
        return (
            <Alert variant="error" title={t('choir.load_error', 'Unable to load choir history.')}>
                <p>{error}</p>
                <button type="button" onClick={load} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white">
                    {t('common.try_again', 'Try Again')}
                </button>
            </Alert>
        );
    }

    const canManage = data?.can_manage;

    return (
        <div className="space-y-8 pb-14">
            {error && <Alert variant="error" title={error} />}
            <header className="relative overflow-hidden rounded-3xl bg-blue-700 p-7 text-white shadow-xl shadow-blue-900/10 sm:p-10">
                <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[28px] border-white/10" />
                <div className="relative max-w-3xl">
                    <div className="mb-4 flex items-center gap-3 text-blue-100">
                        <BookOpen size={20} />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">{t('choir_history.our_story', 'Our story')}</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
                        {data?.choir?.name ? `${data.choir.name} ${t('nav.choir_history', 'Choir History')}` : t('nav.choir_history', 'Choir History')}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                        {t('choir_history.header_desc', 'A private archive of the people, moments, worship, and milestones that shaped your choir.')}
                    </p>
                </div>
            </header>

            <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="mb-5 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">{t('choir_history.the_story', 'The story')}</p>
                            <h2 className="mt-1 text-2xl font-black text-slate-900">{t('choir_history.where_we_come_from', 'Where we come from')}</h2>
                        </div>
                        {canManage && (
                            <button
                                type="button"
                                onClick={saveHistory}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                            >
                                <Check size={15} /> {t('choir_history.save_story', 'Save story')}
                            </button>
                        )}
                    </div>
                    {canManage ? (
                        <textarea
                            value={history}
                            onChange={(event) => setHistory(event.target.value)}
                            rows={9}
                            maxLength={20000}
                            className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder={t('choir_history.story_placeholder', 'Write the story of your choir...')}
                        />
                    ) : (
                        <p className="whitespace-pre-wrap text-sm leading-8 text-slate-600">
                            {history || t('choir_history.story_empty', 'Your choir history has not been written yet.')}
                        </p>
                    )}
                </div>
                <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-6">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">{t('choir_history.in_the_archive', 'In the archive')}</p>
                    <div className="mt-5 space-y-5">
                        <div className="flex gap-3">
                            <CalendarDays className="shrink-0 text-blue-600" size={20} />
                            <div>
                                <p className="text-xs font-bold text-slate-500">{t('choir_history.established', 'Established')}</p>
                                <p className="font-black text-slate-900">{formatDate(data?.choir?.founded_at, t('choir_history.date_not_recorded', 'Date not recorded'))}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Camera className="shrink-0 text-blue-600" size={20} />
                            <div>
                                <p className="text-xs font-bold text-slate-500">{t('choir_history.historical_photos', 'Historical photos')}</p>
                                <p className="font-black text-slate-900">{t('choir_history.archived_count', '{{count}} archived', { count: photoMeta.total })}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-8">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">{t('choir_history.milestones', 'Milestones')}</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-900">{t('choir_history.moments_title', 'Moments that shaped us')}</h2>
                </div>
                <div className="relative ml-2 space-y-7 border-l-2 border-blue-100 pl-7">
                    {(data?.milestones || []).map((item) => (
                        <div key={item.id} className="relative">
                            <span className="absolute -left-[38px] top-1 h-4 w-4 rounded-full border-4 border-white bg-blue-600 ring-2 ring-blue-100" />
                            <p className="text-xs font-black uppercase tracking-wider text-blue-600">{formatDate(item.date, t('choir_history.date_not_recorded', 'Date not recorded'))}</p>
                            <h3 className="mt-1 text-lg font-black text-slate-900">{item.title}</h3>
                            <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                        </div>
                    ))}
                    {!(data?.milestones || []).length && (
                        <EmptyState icon={Clock3} title={t('choir_history.no_milestones', 'No milestones yet')} message={t('choir_history.no_milestones_desc', "Important dates will appear as the choir's story grows.")} />
                    )}
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-8">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">{t('choir_history.archive', 'Archive')}</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-900">{t('choir_history.historical_activities', 'Historical activities')}</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {(data?.events || []).map((event) => (
                        <article key={`${event.type}-${event.id}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-wider text-blue-600">{event.type}</p>
                                    <h3 className="mt-1 font-black text-slate-900">{event.title}</h3>
                                </div>
                                <span className="text-xs font-bold text-slate-400">{formatDate(event.date, t('choir_history.date_not_recorded', 'Date not recorded'))}</span>
                            </div>
                            {event.location && <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><MapPin size={14} />{event.location}</p>}
                            {event.description && <p className="mt-3 text-sm leading-6 text-slate-500">{event.description}</p>}
                        </article>
                    ))}
                    {!(data?.events || []).length && (
                        <EmptyState icon={CalendarDays} title={t('choir_history.no_activities', 'No historical activities yet')} message={t('choir_history.no_activities_desc', 'Past performances and rehearsals will appear here.')} />
                    )}
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">{t('choir_history.memory_wall', 'Memory wall')}</p>
                        <h2 className="mt-1 text-2xl font-black text-slate-900">{t('choir_history.photo_library_title', 'Historical photographs')}</h2>
                    </div>
                    {canManage && (
                        <button
                            type="button"
                            onClick={() => setDraftPhoto({ file: null, preview: '', title: '', description: '', eventDate: '' })}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
                        >
                            <Plus size={16} /> {t('choir_history.add_photo_short', 'Add photo')}
                        </button>
                    )}
                </div>
                {!photosLoading && !photos.length ? (
                    <EmptyState icon={ImagePlus} title={t('choir_history.no_photos', 'No historical photos yet')} message={t('choir_history.no_photos_desc', "The choir's photo archive will appear here when the first memory is saved.")} />
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {photos.map((photo) => {
                                const url = thumbUrlsRef.current.get(photo.id);
                                const failed = failedThumbsRef.current.has(photo.id);
                                return (
                                    <article key={photo.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                        <button
                                            type="button"
                                            onClick={() => openLightbox(photo)}
                                            className="block aspect-[4/3] w-full overflow-hidden bg-slate-100"
                                            style={{ aspectRatio: '4 / 3' }}
                                        >
                                            {failed ? (
                                                <span className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-100 p-4 text-center">
                                                    <ImageOff size={22} className="text-slate-300" />
                                                    <span className="text-xs font-medium text-slate-400">{t('choir_history.image_unavailable', 'Image unavailable')}</span>
                                                </span>
                                            ) : url ? (
                                                <img
                                                    src={url}
                                                    alt={photo.title || t('choir_history.memory_alt', 'Historical choir memory')}
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                                />
                                            ) : (
                                                <span className="flex h-full w-full animate-pulse items-center justify-center bg-slate-100">
                                                    <ImagePlus size={22} className="text-slate-300" />
                                                </span>
                                            )}
                                        </button>
                                        <div className="p-4">
                                            <h3 className="font-black text-slate-900">{photo.title || t('choir_history.photo_default_title', 'Choir memory')}</h3>
                                            <p className="mt-1 text-xs text-slate-400">{formatDate(photo.event_date, t('choir_history.date_not_recorded', 'Date not recorded'))}</p>
                                            {canManage && (
                                                <div className="mt-3 flex gap-2">
                                                    <button type="button" onClick={() => replacePhoto(photo)} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200">
                                                        <Pencil size={13} /> {t('choir_history.replace', 'Replace')}
                                                    </button>
                                                    <button type="button" onClick={() => deletePhoto(photo)} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100">
                                                        <Trash2 size={13} /> {t('common.delete', 'Delete')}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                        {photosError && (
                            <div className="mt-5 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                                <AlertTriangle size={15} /> {photosError}
                            </div>
                        )}
                        {photosLoadingMore && (
                            <div className="mt-6 flex items-center justify-center gap-2 py-4 text-xs font-semibold text-slate-400">
                                <Loader2 size={16} className="animate-spin" /> {t('choir_history.loading_more', 'Loading more photos...')}
                            </div>
                        )}
                        {hasMorePhotos && <div ref={sentinelRef} className="h-px" aria-hidden="true" />}
                    </>
                )}
            </section>

            {draftPhoto && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true"><form onSubmit={uploadPhoto} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-black text-slate-900">{t('choir_history.add_photo_title', 'Add historical photo')}</h2><button type="button" onClick={() => { if (draftPhoto.preview?.startsWith('blob:')) URL.revokeObjectURL(draftPhoto.preview); setDraftPhoto(null); }} aria-label={t('common.close', 'Close')}><X /></button></div><label className="mt-5 flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 text-blue-700">{draftPhoto.preview ? <img src={draftPhoto.preview} alt={t('choir_history.photo_preview_alt', 'Photo preview')} className="h-full w-full object-cover" /> : <span className="flex flex-col items-center gap-2 text-sm font-bold"><Upload /><span>{t('choir_history.choose_image', 'Choose a JPG, PNG, or WebP image')}</span><small className="font-medium text-blue-500">{t('choir_history.max_size', 'Maximum 10 MB')}</small></span>}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" required onChange={(event) => { const file = event.target.files?.[0]; if (file) setDraftPhoto((current) => ({ ...current, file, preview: URL.createObjectURL(file) })); }} /></label><input value={draftPhoto.title} onChange={(event) => setDraftPhoto((current) => ({ ...current, title: event.target.value }))} placeholder={t('choir_history.photo_title_placeholder', 'Photo title (optional)')} className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" /><input type="date" value={draftPhoto.eventDate} onChange={(event) => setDraftPhoto((current) => ({ ...current, eventDate: event.target.value }))} className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" /><textarea value={draftPhoto.description} onChange={(event) => setDraftPhoto((current) => ({ ...current, description: event.target.value }))} placeholder={t('choir_history.photo_description_placeholder', 'What is happening in this memory?')} rows={3} className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" /><button type="submit" disabled={saving || !draftPhoto.file} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><Upload size={17} /> {t('choir_history.save_photo', 'Save photo')}</button></form></div>}
            {lightbox && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4" role="dialog" aria-modal="true"><button type="button" onClick={() => setLightbox(null)} aria-label={t('choir_history.close_photo', 'Close photo')} className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X /></button>{lightbox.loading ? (<div className="flex h-64 w-64 items-center justify-center"><Loader2 size={28} className="animate-spin text-white/70" /></div>) : lightbox.error ? (<div className="flex h-64 w-64 items-center justify-center rounded-2xl bg-white/5 p-6 text-center"><p className="text-sm text-white/70">{lightbox.error}</p></div>) : (<img src={lightbox.url} alt={lightbox.photo.title || t('choir_history.memory_alt', 'Historical choir memory')} className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl" />)}</div>}
        </div>
    );
}
