import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { api } from '../../axios';
import EmptyState from '../../components/member/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function MemberNotifications() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        api
            .get('/member/notifications')
            .then((res) => active && setItems(res.data.data.notifications))
            .catch(() => active && setItems([]))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size={36} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-ink-900">Notifications</h1>

            {items.length === 0 ? (
                <EmptyState
                    icon={Bell}
                    title="No notifications yet"
                    message="You'll see choir announcements and updates here."
                />
            ) : (
                <ul className="space-y-3">
                    {items.map((n) => (
                        <li
                            key={n.id}
                            className="rounded-2xl border border-blue-100 bg-canvas p-4 shadow-sm"
                        >
                            <p className="text-sm font-medium text-ink-800">
                                {n.data?.title || n.data?.message || n.type}
                            </p>
                            {n.data?.body && (
                                <p className="mt-1 text-sm text-ink-500">{n.data.body}</p>
                            )}
                            <p className="mt-1 text-xs text-ink-400">
                                {new Date(n.created_at).toLocaleString()}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
