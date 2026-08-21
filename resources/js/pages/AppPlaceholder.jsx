import { useNavigate } from 'react-router-dom';
import { LogOut, Music } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function AppPlaceholder() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    const displayName =
        user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Member';

    return (
        <div className="flex min-h-screen flex-col bg-surface">
            <header className="border-b border-ink-100 bg-canvas">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-gold-400">
                            <Music size={20} />
                        </span>
                        <span className="text-lg font-semibold tracking-tight text-navy-900">
                            CHOIR <span className="text-gold-600">MKC</span>
                        </span>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                        <LogOut size={16} />
                        Sign out
                    </Button>
                </div>
            </header>

            <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
                <span className="inline-flex items-center rounded-full border border-gold-200 bg-gold-50 px-3 py-1 text-xs font-medium text-gold-800">
                    Workspace preview
                </span>
                <h1 className="mt-5 text-3xl font-semibold tracking-tight text-navy-900">
                    Welcome, {displayName}
                </h1>
                <p className="mt-3 text-ink-600">
                    You are successfully signed in. The full dashboard, member management, songs,
                    rehearsals, performances and admin tools will be available in the next stage.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <Card>
                        <p className="text-sm text-ink-500">Account</p>
                        <p className="mt-1 font-medium text-navy-900">{user?.email}</p>
                    </Card>
                    <Card>
                        <p className="text-sm text-ink-500">Roles</p>
                        <p className="mt-1 font-medium text-navy-900">
                            {user?.roles?.length ? user.roles.join(', ') : 'Member'}
                        </p>
                    </Card>
                </div>
            </main>
        </div>
    );
}
