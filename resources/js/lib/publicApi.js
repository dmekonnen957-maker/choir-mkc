import { api } from '../axios';

function normalize(res) {
    const data = res.data?.data;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    return [];
}

export async function fetchChoirs() {
    const res = await api.get('/public/choirs', { params: { per_page: 100 } });
    return normalize(res);
}

export async function fetchChoir(id) {
    const res = await api.get(`/public/choirs/${id}`);
    return res.data?.data ?? null;
}

export async function fetchChoirSongs(id) {
    const res = await api.get(`/public/choirs/${id}/songs`, { params: { per_page: 200 } });
    return normalize(res);
}

export async function fetchChoirSong(choirId, songId, transpose = 0) {
    const res = await api.get(`/public/choirs/${choirId}/songs/${songId}`, {
        params: transpose ? { transpose } : {},
    });
    return res.data?.data ?? null;
}

export async function fetchChoirMembers(choirId) {
    const res = await api.get(`/public/choirs/${choirId}/members`, { params: { per_page: 200 } });
    return normalize(res);
}

export async function fetchChoirGallery(choirId) {
    const res = await api.get(`/public/choirs/${choirId}/gallery`, { params: { per_page: 200 } });
    return normalize(res);
}

export async function fetchChoirAnnouncements(choirId) {
    const res = await api.get(`/public/choirs/${choirId}/announcements`, { params: { per_page: 200 } });
    return normalize(res);
}

export async function fetchChoirPerformances(id) {
    const res = await api.get(`/public/choirs/${id}/performances`, { params: { per_page: 200 } });
    return normalize(res);
}

export async function fetchAllSongs() {
    const choirs = await fetchChoirs();
    const lists = await Promise.all(
        choirs.map((c) =>
            fetchChoirSongs(c.id).then((songs) =>
                songs.map((s) => ({ ...s, choir: s.choir ?? { id: c.id, name: c.name } })),
            ),
        ),
    );
    return lists.flat();
}

export async function fetchAllPerformances() {
    const choirs = await fetchChoirs();
    const lists = await Promise.all(
        choirs.map((c) =>
            fetchChoirPerformances(c.id).then((ps) =>
                ps.map((p) => ({ ...p, choir: p.choir ?? { id: c.id, name: c.name } })),
            ),
        ),
    );
    return lists.flat();
}

export function imageUrl(path) {
    if (!path) return null;
    if (/^https?:\/\//.test(path)) return path;
    if (String(path).startsWith('/')) return path;
    return `/storage/${String(path).replace(/^\/+/, '')}`;
}

export function storageUrl(path) {
    if (!path) return null;
    if (/^https?:\/\//.test(path)) return path;
    if (/^\/storage\//.test(path)) return path;
    return `/storage/${String(path).replace(/^\/+/, '')}`;
}

export function formatDate(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function parseDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

export function isUpcoming(dateValue) {
    const d = parseDate(dateValue);
    if (!d) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today;
}
