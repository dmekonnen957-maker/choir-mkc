import { useEffect, useState } from 'react';
import { Users, Church, Mail, Phone } from 'lucide-react';
import { api } from '../../axios';
import EmptyState from '../../components/member/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

function asset(path) {
    if (!path) return null;
    return path.startsWith('http') || path.startsWith('/') ? path : `/storage/${path}`;
}

function initials(name) {
    return (name || '?')
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export default function MemberChoir() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;
        api
            .get('/member/choir')
            .then((res) => active && setData(res.data.data))
            .catch((err) => active && setError(err.message))
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

    if (error) {
        return <EmptyState icon={Church} title="Could not load choir" message={error} />;
    }

    if (!data?.choir) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-ink-900">My Choir</h1>
                <EmptyState
                    icon={Church}
                    title="No choir assigned"
                    message="You are not assigned to a choir yet. An administrator will assign you soon."
                />
            </div>
        );
    }

    const { choir, members, leader } = data;
    const [logoFailed, setLogoFailed] = useState(false);
    const logoUrl = asset(choir.logo_path);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-ink-900">My Choir</h1>

            <div className="overflow-hidden rounded-2xl border border-blue-100 bg-canvas shadow-sm">
                <div className="h-28 bg-gradient-to-r from-blue-600 to-blue-400" />
                <div className="px-6 pb-6">
                    <div className="-mt-10 mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-canvas bg-blue-100 text-2xl font-bold text-blue-700 shadow">
                        {logoUrl && !logoFailed ? (
                            <img
                                src={logoUrl}
                                alt={choir.name}
                                className="h-full w-full object-cover"
                                onError={() => setLogoFailed(true)}
                            />
                        ) : (
                            initials(choir.name)
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-ink-900">{choir.name}</h2>
                    {choir.church_name && (
                        <p className="text-sm text-ink-500">{choir.church_name}</p>
                    )}
                    <p className="mt-3 max-w-2xl text-sm text-ink-600">
                        {choir.description || 'No description provided.'}
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-xl bg-surface p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                                Members
                            </p>
                            <p className="mt-1 text-2xl font-bold text-ink-900">
                                {choir.members_count ?? members.length}
                            </p>
                        </div>
                        <div className="rounded-xl bg-surface p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                                Leader
                            </p>
                            <p className="mt-1 text-sm font-semibold text-ink-900">
                                {leader ? `${leader.name} · ${leader.role_title}` : 'Not listed'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <section className="rounded-2xl border border-blue-100 bg-canvas p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-ink-900">
                    <Users size={18} className="text-blue-600" /> Choir Members
                </h3>
                {members.length === 0 ? (
                    <p className="mt-4 text-sm text-ink-500">No members to display.</p>
                ) : (
                    <ul className="mt-4 divide-y divide-blue-50">
                        {members.map((m) => (
                            <li key={m.id} className="flex items-center gap-3 py-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                                    {initials(m.full_name)}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-ink-800">
                                        {m.full_name}
                                    </p>
                                    <p className="text-xs text-ink-500">
                                        {m.role_title || 'Member'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 text-ink-400">
                                    {m.email && <Mail size={16} />}
                                    {m.phone && <Phone size={16} />}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
