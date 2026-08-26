import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building2, User, Users, Music2, CalendarDays, Search } from 'lucide-react';
import { api } from '../../axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import Input from '../../components/ui/Input';

export default function AdminChoirsPage() {
    const [choirs, setChoirs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    const load = useCallback(() => {
        setLoading(true);
        api.get('/admin/choirs', { params: { per_page: 100 } })
            .then((res) => setChoirs(res.data.data.items || []))
            .catch(() => setError('Failed to load choirs.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const filtered = choirs.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-ink-900">Choirs</h1>
                    <p className="mt-1 text-sm text-ink-500">
                        Manage church choirs, their team leaders and membership.
                    </p>
                </div>
                <Link to="/admin/choirs/create">
                    <Button>
                        <Plus size={16} className="mr-1" /> New Choir
                    </Button>
                </Link>
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            <div className="max-w-sm">
                <Input
                    placeholder="Search choirs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    trailing={<Search size={16} className="text-ink-400" />}
                />
            </div>

            {loading ? (
                <div className="flex h-48 items-center justify-center">
                    <LoadingSpinner text="Loading choirs..." />
                </div>
            ) : filtered.length === 0 ? (
                <Card className="py-16 text-center">
                    <Building2 size={28} className="mx-auto text-ink-300" />
                    <p className="mt-2 text-sm text-ink-500">No choirs found.</p>
                    <Link to="/admin/choirs/create" className="mt-3 inline-block text-sm font-medium text-blue-600">
                        Create your first choir
                    </Link>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((choir) => (
                        <Link key={choir.id} to={`/admin/choirs/${choir.id}`}>
                            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-lg">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <Building2 size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold text-ink-900">{choir.name}</p>
                                        <p className="truncate text-xs text-ink-400">
                                            {choir.church_name || choir.slug}
                                        </p>
                                    </div>
                                    <span
                                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                            choir.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : 'bg-ink-100 text-ink-500'
                                        }`}
                                    >
                                        {choir.status}
                                    </span>
                                </div>

                                <div className="mt-4 flex items-center gap-4 text-xs text-ink-500">
                                    <span className="inline-flex items-center gap-1">
                                        <User size={14} /> {choir.team_leader?.name || 'No leader'}
                                    </span>
                                </div>
                                <div className="mt-2 flex items-center gap-4 border-t border-blue-50 pt-3 text-xs text-ink-500">
                                    <span className="inline-flex items-center gap-1">
                                        <Users size={14} /> {choir.member_count ?? 0}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <Music2 size={14} /> {choir.songs_count ?? 0}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <CalendarDays size={14} /> {choir.performances_count ?? 0}
                                    </span>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
