import { useEffect, useState } from 'react';
import { api } from '../../axios';

export default function AudioPlayer({ songId, className = '' }) {
    const [url, setUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!songId) return undefined;

        let revoked = false;
        let objectUrl = null;
        setLoading(true);
        setError('');
        setUrl(null);

        api
            .get(`/admin/songs/${songId}/audio`, { responseType: 'blob' })
            .then((res) => {
                objectUrl = URL.createObjectURL(res.data);
                if (!revoked) setUrl(objectUrl);
            })
            .catch(() => {
                if (!revoked) setError('Audio unavailable');
            })
            .finally(() => {
                if (!revoked) setLoading(false);
            });

        return () => {
            revoked = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [songId]);

    if (loading) return <span className="text-xs text-ink-400">Loading…</span>;
    if (error) return <span className="text-xs text-red-400">{error}</span>;
    if (!url) return <span className="text-xs text-ink-300">—</span>;

    return <audio controls src={url} className={`h-9 ${className}`} />;
}
