export function formatLongDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    }).format(d);
}

export function isSameDay(iso, date = new Date()) {
    if (!iso) return false;
    const d = new Date(iso + 'T00:00:00');
    return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
    );
}

export function formatTime(time) {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    if (Number.isNaN(h)) return time;
    const period = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    return m ? `${hr}:${String(m).padStart(2, '0')} ${period}` : `${hr} ${period}`;
}
