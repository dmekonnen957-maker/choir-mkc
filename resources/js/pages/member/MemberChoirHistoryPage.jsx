import { useCallback, useEffect, useState } from 'react';
import {
    BookOpen,
    CalendarDays,
    Camera,
    Check,
    Clock3,
    ImagePlus,
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

function formatDate(value) {
    if (!value) return 'Date not recorded';
    return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function MemberChoirHistoryPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState('');
    const [draftPhoto, setDraftPhoto] = useState(null);
    const [lightboxPhoto, setLightboxPhoto] = useState(null);
    const [photoUrls, setPhotoUrls] = useState({});

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/member/choir-history');
            const next = response.data?.data ?? response.data;
            setData(next);
            setHistory(next.choir?.history || '');
        } catch (err) {
            setError(err.message || 'Unable to load choir history.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        let active = true;
        const objectUrls = [];

        Promise.all((data?.photos || []).map(async (photo) => {
            try {
                const response = await api.get(photo.url, { responseType: 'blob' });
                const url = URL.createObjectURL(response.data);
                objectUrls.push(url);
                return [photo.id, url];
            } catch {
                return null;
            }
        })).then((entries) => {
            if (active) setPhotoUrls(Object.fromEntries(entries.filter(Boolean)));
        });

        return () => {
            active = false;
            objectUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [data?.photos]);

    const saveHistory = async () => {
        setSaving(true);
        try {
            await api.put('/member/choir-history', { history });
            await load();
        } catch (err) {
            setError(err.message || 'Unable to save choir history.');
        } finally {
            setSaving(false);
        }
    };

    const uploadPhoto = async (event) => {
        event.preventDefault();
        if (!draftPhoto?.file) return;
        setSaving(true);
        const form = new FormData();
        form.append('photo', draftPhoto.file);
        form.append('title', draftPhoto.title);
        form.append('description', draftPhoto.description);
        form.append('event_date', draftPhoto.eventDate);
        try {
            await api.post('/member/choir-history/photos', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setDraftPhoto(null);
            await load();
        } catch (err) {
            setError(err.message || 'Unable to upload historical photo.');
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
            const form = new FormData();
            form.append('photo', file);
            form.append('_method', 'PUT');
            try {
                await api.post(`/member/choir-history/photos/${photo.id}`, form, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                await load();
            } catch (err) {
                setError(err.message || 'Unable to replace historical photo.');
            } finally {
                setSaving(false);
            }
        };
        input.click();
    };

    const deletePhoto = async (photo) => {
        if (!window.confirm(`Delete ${photo.title || 'this historical photo'}?`)) return;
        setSaving(true);
        try {
            await api.delete(`/member/choir-history/photos/${photo.id}`);
            await load();
        } catch (err) {
            setError(err.message || 'Unable to delete historical photo.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="h-96 animate-pulse rounded-3xl bg-slate-200" />;
    }

    if (error && !data) {
        return <Alert variant="error" title="Unable to load choir history."><p>{error}</p><button type="button" onClick={load} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white">Try Again</button></Alert>;
    }

    const photos = data?.photos || [];
    const canManage = data?.can_manage;

    return (
        <div className="space-y-8 pb-14">
            {error && <Alert variant="error" title="Action could not be completed."><p>{error}</p></Alert>}
            <header className="relative overflow-hidden rounded-3xl bg-blue-700 p-7 text-white shadow-xl shadow-blue-900/10 sm:p-10">
                <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[28px] border-white/10" />
                <div className="relative max-w-3xl">
                    <div className="mb-4 flex items-center gap-3 text-blue-100"><BookOpen size={20} /><span className="text-xs font-black uppercase tracking-[0.2em]">Our story</span></div>
                    <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{data?.choir?.name || 'Choir'} History</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">A private archive of the people, moments, worship, and milestones that shaped your choir.</p>
                </div>
            </header>

            <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="mb-5 flex items-center justify-between gap-4">
                        <div><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">The story</p><h2 className="mt-1 text-2xl font-black text-slate-900">Where we come from</h2></div>
                        {canManage && <button type="button" onClick={saveHistory} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"><Check size={15} /> Save story</button>}
                    </div>
                    {canManage ? <textarea value={history} onChange={(event) => setHistory(event.target.value)} rows={9} maxLength={20000} className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Write the story of your choir..." /> : <p className="whitespace-pre-wrap text-sm leading-8 text-slate-600">{history || 'Your choir history has not been written yet.'}</p>}
                </div>
                <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-6">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">In the archive</p>
                    <div className="mt-5 space-y-5"><div className="flex gap-3"><CalendarDays className="shrink-0 text-blue-600" size={20} /><div><p className="text-xs font-bold text-slate-500">Established</p><p className="font-black text-slate-900">{formatDate(data?.choir?.founded_at)}</p></div></div><div className="flex gap-3"><Camera className="shrink-0 text-blue-600" size={20} /><div><p className="text-xs font-bold text-slate-500">Historical photos</p><p className="font-black text-slate-900">{photos.length} of 7 saved</p></div></div></div>
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-8"><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">Milestones</p><h2 className="mt-1 text-2xl font-black text-slate-900">Moments that shaped us</h2></div>
                <div className="relative ml-2 space-y-7 border-l-2 border-blue-100 pl-7">{(data?.milestones || []).map((item) => <div key={item.id} className="relative"><span className="absolute -left-[38px] top-1 h-4 w-4 rounded-full border-4 border-white bg-blue-600 ring-2 ring-blue-100" /><p className="text-xs font-black uppercase tracking-wider text-blue-600">{formatDate(item.date)}</p><h3 className="mt-1 text-lg font-black text-slate-900">{item.title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p></div>)}{!(data?.milestones || []).length && <EmptyState icon={Clock3} title="No milestones yet" message="Important dates will appear as the choir's story grows." />}</div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-8"><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">Archive</p><h2 className="mt-1 text-2xl font-black text-slate-900">Historical activities</h2></div>
                <div className="grid gap-4 md:grid-cols-2">{(data?.events || []).map((event) => <article key={`${event.type}-${event.id}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-blue-600">{event.type}</p><h3 className="mt-1 font-black text-slate-900">{event.title}</h3></div><span className="text-xs font-bold text-slate-400">{formatDate(event.date)}</span></div>{event.location && <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><MapPin size={14} />{event.location}</p>}{event.description && <p className="mt-3 text-sm leading-6 text-slate-500">{event.description}</p>}</article>)}{!(data?.events || []).length && <EmptyState icon={CalendarDays} title="No historical activities yet" message="Past performances and rehearsals will appear here." />}</div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">Memory wall</p><h2 className="mt-1 text-2xl font-black text-slate-900">Historical photographs</h2></div>{canManage && photos.length < 7 && <button type="button" onClick={() => setDraftPhoto({ file: null, preview: '', title: '', description: '', eventDate: '' })} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700"><Plus size={16} /> Add photo</button>}</div>
                {!photos.length ? <EmptyState icon={ImagePlus} title="No historical photos yet" message="The choir's photo archive will appear here when the first memory is saved." /> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{photos.map((photo) => <article key={photo.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white"><button type="button" onClick={() => setLightboxPhoto(photo)} className="block aspect-[4/3] w-full overflow-hidden bg-slate-100"><img src={photoUrls[photo.id]} alt={photo.title || 'Historical choir memory'} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /></button><div className="p-4"><h3 className="font-black text-slate-900">{photo.title || 'Choir memory'}</h3><p className="mt-1 text-xs text-slate-400">{formatDate(photo.event_date)}</p>{canManage && <div className="mt-3 flex gap-2"><button type="button" onClick={() => replacePhoto(photo)} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"><Pencil size={13} /> Replace</button><button type="button" onClick={() => deletePhoto(photo)} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"><Trash2 size={13} /> Delete</button></div>}</div></article>)}</div>}
            </section>

            {draftPhoto && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true"><form onSubmit={uploadPhoto} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-black text-slate-900">Add historical photo</h2><button type="button" onClick={() => setDraftPhoto(null)} aria-label="Close"><X /></button></div><label className="mt-5 flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 text-blue-700">{draftPhoto.preview ? <img src={draftPhoto.preview} alt="Photo preview" className="h-full w-full object-cover" /> : <span className="flex flex-col items-center gap-2 text-sm font-bold"><Upload /><span>Choose a JPG, PNG, or WebP image</span><small className="font-medium text-blue-500">Maximum 10 MB</small></span>}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" required onChange={(event) => { const file = event.target.files?.[0]; if (file) setDraftPhoto((current) => ({ ...current, file, preview: URL.createObjectURL(file) })); }} /></label><input value={draftPhoto.title} onChange={(event) => setDraftPhoto((current) => ({ ...current, title: event.target.value }))} placeholder="Photo title (optional)" className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" /><input type="date" value={draftPhoto.eventDate} onChange={(event) => setDraftPhoto((current) => ({ ...current, eventDate: event.target.value }))} className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" /><textarea value={draftPhoto.description} onChange={(event) => setDraftPhoto((current) => ({ ...current, description: event.target.value }))} placeholder="What is happening in this memory?" rows={3} className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" /><button type="submit" disabled={saving || !draftPhoto.file} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><Upload size={17} /> Save photo</button></form></div>}
            {lightboxPhoto && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4" role="dialog" aria-modal="true"><button type="button" onClick={() => setLightboxPhoto(null)} aria-label="Close photo" className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X /></button><img src={photoUrls[lightboxPhoto.id]} alt={lightboxPhoto.title || 'Historical choir memory'} className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl" /></div>}
        </div>
    );
}
