import { useEffect, useState } from 'react';
import { User as UserIcon, Church, ShieldCheck } from 'lucide-react';
import { api } from '../../axios';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

function initials(name) {
    return (name || '?')
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export default function MemberProfile() {
    const { user, primaryChoir, refreshUser } = useAuth();
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        let active = true;
        api
            .get('/member/profile')
            .then((res) => {
                const d = res.data.data;
                setForm((prev) => ({
                    ...prev,
                    name: d.user.name,
                    email: d.user.email,
                    phone: d.member?.phone ?? '',
                }));
            })
            .catch(() => {})
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, []);

    const update = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlert(null);
        setSaving(true);
        try {
            const payload = {
                name: form.name,
                email: form.email,
                phone: form.phone,
            };
            if (form.password) {
                payload.password = form.password;
                payload.password_confirmation = form.password_confirmation;
            }
            await api.put('/member/profile', payload);
            await refreshUser();
            setAlert({ variant: 'success', message: 'Profile updated successfully.' });
            setForm((prev) => ({ ...prev, password: '', password_confirmation: '' }));
        } catch (err) {
            if (err.errors) setErrors(err.errors);
            setAlert({ variant: 'error', message: err.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size={36} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-ink-900">My Profile</h1>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-blue-100 bg-canvas p-6 text-center shadow-sm">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-700">
                        {initials(user?.name)}
                    </div>
                    <p className="mt-4 text-lg font-semibold text-ink-900">{user?.name}</p>
                    <p className="text-sm text-ink-500">{user?.email}</p>

                    <div className="mt-4 space-y-2 text-left text-sm">
                        <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-ink-600">
                            <Church size={16} className="text-blue-500" />
                            <span>{primaryChoir ? primaryChoir.name : 'No choir assigned'}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-ink-600">
                            <ShieldCheck size={16} className="text-blue-500" />
                            <span>Member (read-only)</span>
                        </div>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl border border-blue-100 bg-canvas p-6 shadow-sm lg:col-span-2"
                >
                    {alert && (
                        <div className="mb-4">
                            <Alert variant={alert.variant} title={alert.message} />
                        </div>
                    )}

                    <div className="space-y-4">
                        <Input
                            label="Full name"
                            value={form.name}
                            onChange={update('name')}
                            error={errors.name?.[0]}
                            required
                        />
                        <Input
                            label="Email"
                            type="email"
                            value={form.email}
                            onChange={update('email')}
                            error={errors.email?.[0]}
                            required
                        />
                        <Input
                            label="Phone"
                            value={form.phone}
                            onChange={update('phone')}
                            error={errors.phone?.[0]}
                            placeholder="Optional"
                        />

                        <div className="border-t border-blue-100 pt-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                                Change password (optional)
                            </p>
                            <div className="space-y-3">
                                <PasswordInput
                                    label="New password"
                                    value={form.password}
                                    onChange={update('password')}
                                    error={errors.password?.[0]}
                                    placeholder="Leave blank to keep current"
                                />
                                <PasswordInput
                                    label="Confirm new password"
                                    value={form.password_confirmation}
                                    onChange={update('password_confirmation')}
                                    error={errors.password_confirmation?.[0]}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button type="submit" loading={saving}>
                                Save changes
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
