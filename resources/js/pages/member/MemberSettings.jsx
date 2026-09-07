import { useEffect, useState } from 'react';
import {
    User as UserIcon,
    Mail,
    Phone,
    Lock,
    Bell,
    Camera,
    X as XIcon,
    Shield,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    Globe,
    KeyRound,
    Trash2,
    Send,
    Church,
    Music,
    AlertTriangle,
} from 'lucide-react';
import { api } from '../../axios';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const NOTIFICATION_LABELS = {
    performances: {
        title: 'Performance announcements',
        desc: 'Receive alerts when new concerts and church performances are scheduled.',
    },
    rehearsals: {
        title: 'Rehearsal reminders',
        desc: 'Get notified about upcoming rehearsals and schedule changes.',
    },
    choir_updates: {
        title: 'Choir updates & news',
        desc: 'Stay informed on important choir news, announcements, and notices.',
    },
};

const LANGUAGES = [
    { code: 'en', label: 'English (US)' },
    { code: 'am', label: 'አማርኛ (Amharic)' },
    { code: 'om', label: 'Afaan Oromoo (Oromo)' },
    { code: 'ti', label: 'ትግርኛ (Tigrinya)' },
];

const TIMEZONES = [
    { value: 'Africa/Addis_Ababa', label: 'East Africa Time (Addis Ababa, UTC+3)' },
    { value: 'UTC', label: 'Coordinated Universal Time (UTC+0)' },
    { value: 'Europe/London', label: 'London (GMT / BST)' },
    { value: 'America/New_York', label: 'Eastern Time (US & Canada, UTC-5)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada, UTC-8)' },
];

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

export default function MemberSettings() {
    const { refreshUser, logout } = useAuth();
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');

    // Forms
    const [form, setForm] = useState({
        name: '',
        username: '',
        email: '',
        phone: '',
        role_title: '',
        bio: '',
        language: 'en',
        timezone: 'Africa/Addis_Ababa',
    });

    const [prefs, setPrefs] = useState({});
    const [photo, setPhoto] = useState(null);
    const [removePhoto, setRemovePhoto] = useState(false);

    const [passwords, setPasswords] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPrefs, setSavingPrefs] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [sendingReset, setSendingReset] = useState(false);
    const [verifyingEmail, setVerifyingEmail] = useState(false);
    const [deactivating, setDeactivating] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);

    const [alert, setAlert] = useState(null);

    const fetchData = () => {
        api.get('/member/settings')
            .then((res) => {
                const d = res.data.data;
                setData(d);
                setForm({
                    name: d.user?.name ?? '',
                    username: d.user?.username ?? '',
                    email: d.user?.email ?? '',
                    phone: d.member?.phone ?? d.user?.phone ?? '',
                    role_title: d.member?.role_title ?? '',
                    bio: d.member?.bio ?? '',
                    language: d.user?.language ?? 'en',
                    timezone: d.user?.timezone ?? 'Africa/Addis_Ababa',
                });
                setPrefs(d.notification_preferences ?? {});
                setErrors({});
            })
            .catch(() => setAlert({ variant: 'error', message: 'Could not load account settings.' }))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const update = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const togglePref = (key) => (e) => {
        setPrefs((prev) => ({ ...prev, [key]: e.target.checked }));
        setErrors((prev) => ({ ...prev, [`notification_preferences.${key}`]: undefined }));
    };

    const updatePassword = (field) => (e) => {
        setPasswords((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setAlert(null);

        // Ethiopian phone validation
        if (form.phone && !/^(09|07)\d{8}$/.test(form.phone)) {
            setErrors((prev) => ({
                ...prev,
                phone: ['Phone number must be exactly 10 Ethiopian digits starting with 09 or 07 (e.g., 0911223344 or 0711223344).'],
            }));
            setAlert({ variant: 'error', message: 'Please provide a valid 10-digit Ethiopian phone number (09XXXXXXXX or 07XXXXXXXX).' });
            return;
        }

        setSavingProfile(true);
        try {
            const payload = new FormData();
            payload.append('name', form.name);
            payload.append('username', form.username || '');
            payload.append('email', form.email);
            payload.append('phone', form.phone || '');
            payload.append('role_title', form.role_title || '');
            payload.append('bio', form.bio || '');
            payload.append('language', form.language);
            payload.append('timezone', form.timezone);

            if (removePhoto) {
                payload.append('remove_photo', '1');
            }
            if (photo) {
                payload.append('photo', photo);
            }
            payload.append('_method', 'PUT');

            await api.post('/member/settings', payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            await refreshUser();
            setPhoto(null);
            setRemovePhoto(false);
            fetchData();
            setAlert({ variant: 'success', message: 'Profile and account details saved successfully.' });
        } catch (err) {
            if (err.errors) setErrors(err.errors);
            setAlert({ variant: 'error', message: err.message || 'Failed to update profile.' });
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePrefsSubmit = async (e) => {
        e.preventDefault();
        setAlert(null);
        setSavingPrefs(true);
        try {
            await api.put('/member/settings/notifications', {
                notification_preferences: prefs,
            });
            setAlert({ variant: 'success', message: 'Notification preferences updated.' });
        } catch (err) {
            if (err.errors) setErrors(err.errors);
            setAlert({ variant: 'error', message: err.message || 'Failed to update preferences.' });
        } finally {
            setSavingPrefs(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setAlert(null);
        setSavingPassword(true);
        try {
            await api.put('/member/settings/password', passwords);
            setPasswords({
                current_password: '',
                password: '',
                password_confirmation: '',
            });
            setAlert({ variant: 'success', message: 'Password changed successfully.' });
        } catch (err) {
            if (err.errors) setErrors(err.errors);
            setAlert({ variant: 'error', message: err.message || 'Failed to update password.' });
        } finally {
            setSavingPassword(false);
        }
    };

    const handleTriggerPasswordReset = async () => {
        setAlert(null);
        setSendingReset(true);
        try {
            const res = await api.post('/member/settings/reset-password');
            setAlert({
                variant: 'success',
                message: res.data?.message || `A password reset link has been sent to ${form.email}.`,
            });
        } catch (err) {
            setAlert({ variant: 'error', message: err.message || 'Unable to dispatch reset email.' });
        } finally {
            setSendingReset(false);
        }
    };

    const handleVerifyEmail = async () => {
        setAlert(null);
        setVerifyingEmail(true);
        try {
            const res = await api.post('/member/settings/verify-email');
            fetchData();
            await refreshUser();
            setAlert({
                variant: 'success',
                message: res.data?.message || 'Email verified successfully!',
            });
        } catch (err) {
            setAlert({ variant: 'error', message: err.message || 'Email verification failed.' });
        } finally {
            setVerifyingEmail(false);
        }
    };

    const handleDeactivateAccount = async () => {
        setDeactivating(true);
        try {
            await api.post('/member/settings/deactivate');
            await logout();
        } catch (err) {
            setAlert({ variant: 'error', message: err.message || 'Unable to deactivate account.' });
            setShowDeactivateModal(false);
        } finally {
            setDeactivating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <LoadingSpinner size={36} />
            </div>
        );
    }

    const currentPhotoUrl = photo
        ? URL.createObjectURL(photo)
        : removePhoto
          ? null
          : asset(data?.member?.photo_path);

    const isEmailVerified = Boolean(data?.user?.email_verified_at);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-ink-900">Account & Settings</h1>
                <p className="mt-1 text-sm text-ink-500">
                    Manage your personal profile, contact information, security preferences, and account actions.
                </p>
            </div>

            {alert && <Alert variant={alert.variant} title={alert.message} />}

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-blue-100 pb-2 text-sm font-medium">
                <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 transition-colors ${
                        activeTab === 'profile'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-ink-600 hover:bg-blue-50'
                    }`}
                >
                    <UserIcon size={16} />
                    <span>Personal Info & Profile</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('contact')}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 transition-colors ${
                        activeTab === 'contact'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-ink-600 hover:bg-blue-50'
                    }`}
                >
                    <Mail size={16} />
                    <span>Contact Details</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('security')}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 transition-colors ${
                        activeTab === 'security'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-ink-600 hover:bg-blue-50'
                    }`}
                >
                    <Shield size={16} />
                    <span>Security & Authentication</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('preferences')}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 transition-colors ${
                        activeTab === 'preferences'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-ink-600 hover:bg-blue-50'
                    }`}
                >
                    <Globe size={16} />
                    <span>Preferences & Notifications</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('actions')}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 transition-colors ${
                        activeTab === 'actions'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'text-red-600 hover:bg-red-50'
                    }`}
                >
                    <AlertTriangle size={16} />
                    <span>Account Actions</span>
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left Column: Account Overview Profile Badge */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-blue-100 bg-canvas p-6 shadow-sm">
                        <h2 className="text-base font-semibold text-ink-900">Account Overview</h2>
                        <div className="mt-4 flex items-center gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xl font-bold text-blue-700 border border-blue-200">
                                {currentPhotoUrl ? (
                                    <img
                                        src={currentPhotoUrl}
                                        alt={form.name || data?.user?.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    initials(form.name || data?.user?.name)
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold text-ink-900">
                                    {form.name || data?.user?.name}
                                </p>
                                {form.username && (
                                    <p className="truncate text-xs font-mono text-blue-600">
                                        @{form.username}
                                    </p>
                                )}
                                <p className="truncate text-xs text-ink-500">{form.email || data?.user?.email}</p>
                                <span className="mt-1.5 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 capitalize">
                                    {data?.account?.membership_status || 'Active Member'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3 border-t border-blue-100 pt-4 text-sm">
                            <div className="flex items-center justify-between text-ink-600">
                                <span className="flex items-center gap-2 text-ink-500">
                                    <Church size={15} className="text-blue-500" />
                                    Choir
                                </span>
                                <span className="max-w-[150px] truncate font-medium text-ink-800">
                                    {data?.choir?.name || 'No choir assigned'}
                                </span>
                            </div>

                            {form.role_title && (
                                <div className="flex items-center justify-between text-ink-600">
                                    <span className="flex items-center gap-2 text-ink-500">
                                        <ShieldCheck size={15} className="text-blue-500" />
                                        Role / Job Title
                                    </span>
                                    <span className="max-w-[150px] truncate font-medium text-ink-800">
                                        {form.role_title}
                                    </span>
                                </div>
                            )}

                            {data?.account?.voice_section && (
                                <div className="flex items-center justify-between text-ink-600">
                                    <span className="flex items-center gap-2 text-ink-500">
                                        <Music size={15} className="text-blue-500" />
                                        Voice Section
                                    </span>
                                    <span className="font-medium text-ink-800">
                                        {data.account.voice_section}
                                    </span>
                                </div>
                            )}

                            {data?.account?.member_code && (
                                <div className="flex items-center justify-between text-ink-600">
                                    <span className="flex items-center gap-2 text-ink-500">
                                        <KeyRound size={15} className="text-blue-500" />
                                        Member Code
                                    </span>
                                    <span className="font-mono text-xs font-semibold text-ink-800">
                                        {data.account.member_code}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-ink-600">
                                <span className="text-ink-500">Email Status</span>
                                {isEmailVerified ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                                        <CheckCircle2 size={13} /> Verified
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                                        <AlertCircle size={13} /> Unverified
                                    </span>
                                )}
                            </div>

                            {data?.account?.member_since && (
                                <div className="flex items-center justify-between text-ink-600">
                                    <span className="text-ink-500">Member Since</span>
                                    <span className="text-xs text-ink-700">
                                        {new Date(data.account.member_since).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Tabbed Content */}
                <div className="space-y-6 lg:col-span-2">
                    {/* TAB 1: Personal Information & Profile */}
                    {activeTab === 'profile' && (
                        <form
                            onSubmit={handleProfileSubmit}
                            className="rounded-2xl border border-blue-100 bg-canvas p-6 shadow-sm"
                        >
                            <div className="flex items-center gap-2 border-b border-blue-100 pb-4">
                                <UserIcon className="h-5 w-5 text-blue-600" />
                                <div>
                                    <h2 className="text-lg font-semibold text-ink-900">Personal Information</h2>
                                    <p className="text-xs text-ink-500">
                                        Update your personal details, profile avatar, and choir bio.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 space-y-5">
                                {/* Avatar Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-ink-700">
                                        Profile Photo / Avatar
                                    </label>
                                    <div className="mt-2 flex items-center gap-4">
                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xl font-bold text-blue-700 border border-blue-200">
                                            {currentPhotoUrl ? (
                                                <img
                                                    src={currentPhotoUrl}
                                                    alt="Avatar preview"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                initials(form.name || data?.user?.name)
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-canvas px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors">
                                                <Camera size={14} />
                                                <span>Upload New Photo</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="sr-only"
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0];
                                                        if (f) {
                                                            setPhoto(f);
                                                            setRemovePhoto(false);
                                                        }
                                                    }}
                                                />
                                            </label>
                                            {(currentPhotoUrl || photo) && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setPhoto(null);
                                                        setRemovePhoto(true);
                                                    }}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-canvas px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <XIcon size={14} />
                                                    Remove Photo
                                                </button>
                                            )}
                                            {removePhoto && (
                                                <button
                                                    type="button"
                                                    onClick={() => setRemovePhoto(false)}
                                                    className="text-xs text-blue-600 underline hover:text-blue-700"
                                                >
                                                    Undo remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {errors.photo?.[0] && (
                                        <p className="mt-1 text-xs text-red-600">{errors.photo[0]}</p>
                                    )}
                                    <p className="mt-1.5 text-xs text-ink-400">JPG, PNG, GIF or WebP up to 2MB.</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Input
                                        label="Full Name"
                                        value={form.name}
                                        onChange={update('name')}
                                        error={errors.name?.[0]}
                                        maxLength={255}
                                        required
                                    />

                                    <Input
                                        label="Username"
                                        value={form.username}
                                        onChange={update('username')}
                                        error={errors.username?.[0]}
                                        prefix="@"
                                        placeholder="username"
                                        maxLength={50}
                                        hint="Letters, numbers, dashes, and underscores."
                                    />
                                </div>

                                <Input
                                    label="Job Title / Choir Role"
                                    value={form.role_title}
                                    onChange={update('role_title')}
                                    error={errors.role_title?.[0]}
                                    maxLength={100}
                                    placeholder="e.g. Lead Vocalist, Tenor Section Leader, Sound Engineer"
                                />

                                <div>
                                    <label className="block text-sm font-medium text-ink-700 mb-1">
                                        Bio & About Me
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={form.bio}
                                        onChange={update('bio')}
                                        maxLength={1000}
                                        placeholder="Share a brief introduction about your choir journey and background..."
                                        className="w-full rounded-lg border border-ink-200 bg-canvas px-3.5 py-2.5 text-sm text-ink-800 placeholder:text-ink-400 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                    />
                                    {errors.bio?.[0] && (
                                        <p className="mt-1 text-xs text-red-600">{errors.bio[0]}</p>
                                    )}
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button type="submit" loading={savingProfile}>
                                        Save Personal Info
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* TAB 2: Contact Details */}
                    {activeTab === 'contact' && (
                        <form
                            onSubmit={handleProfileSubmit}
                            className="rounded-2xl border border-blue-100 bg-canvas p-6 shadow-sm"
                        >
                            <div className="flex items-center gap-2 border-b border-blue-100 pb-4">
                                <Mail className="h-5 w-5 text-blue-600" />
                                <div>
                                    <h2 className="text-lg font-semibold text-ink-900">Contact Details</h2>
                                    <p className="text-xs text-ink-500">
                                        Manage your verified email address and primary telephone number.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 space-y-5">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-sm font-medium text-ink-700">Primary Email Address *</label>
                                        {isEmailVerified ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                                <CheckCircle2 size={13} /> Verified
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                                                <AlertCircle size={13} /> Unverified
                                            </span>
                                        )}
                                    </div>
                                    <Input
                                        type="email"
                                        value={form.email}
                                        onChange={update('email')}
                                        error={errors.email?.[0]}
                                        maxLength={255}
                                        required
                                    />
                                    {!isEmailVerified && (
                                        <div className="mt-2 flex items-center justify-between rounded-xl bg-amber-50/70 p-3 border border-amber-200/60">
                                            <div className="flex items-center gap-2 text-xs text-amber-800">
                                                <AlertCircle size={15} className="shrink-0 text-amber-600" />
                                                <span>Your email is not verified yet. Verify it now to secure your account.</span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="gold"
                                                size="sm"
                                                onClick={handleVerifyEmail}
                                                loading={verifyingEmail}
                                            >
                                                Verify Email
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <Input
                                    label="Phone Number (Ethiopian format: 09XXXXXXXX or 07XXXXXXXX)"
                                    type="tel"
                                    value={form.phone}
                                    onChange={update('phone')}
                                    error={errors.phone?.[0]}
                                    placeholder="0911223344"
                                    maxLength={10}
                                    hint="Must be exactly 10 Ethiopian digits (e.g. 0911223344 or 0711223344)."
                                />

                                <div className="flex justify-end pt-2">
                                    <Button type="submit" loading={savingProfile}>
                                        Save Contact Details
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* TAB 3: Security & Authentication */}
                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            {/* Password Reset Trigger Card */}
                            <div className="rounded-2xl border border-blue-100 bg-canvas p-6 shadow-sm">
                                <div className="flex items-center gap-2 border-b border-blue-100 pb-4">
                                    <KeyRound className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <h2 className="text-lg font-semibold text-ink-900">Password Reset Link</h2>
                                        <p className="text-xs text-ink-500">
                                            Trigger a password reset link to your registered email address.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-blue-50/60 p-4 border border-blue-100">
                                    <div className="space-y-1 text-sm text-ink-700">
                                        <p className="font-medium text-ink-900">Forgot your current password?</p>
                                        <p className="text-xs text-ink-500">
                                            We will send a secure password reset link to <strong className="text-ink-800">{form.email}</strong>.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleTriggerPasswordReset}
                                        loading={sendingReset}
                                        className="shrink-0"
                                    >
                                        <Send size={15} />
                                        <span>Send Reset Link</span>
                                    </Button>
                                </div>
                            </div>

                            {/* Direct Password Change Form */}
                            <form
                                onSubmit={handlePasswordSubmit}
                                className="rounded-2xl border border-blue-100 bg-canvas p-6 shadow-sm"
                            >
                                <div className="flex items-center gap-2 border-b border-blue-100 pb-4">
                                    <Lock className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <h2 className="text-lg font-semibold text-ink-900">Change Password</h2>
                                        <p className="text-xs text-ink-500">
                                            Enter your current password to choose a new password.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 space-y-4">
                                    <PasswordInput
                                        label="Current Password"
                                        value={passwords.current_password}
                                        onChange={updatePassword('current_password')}
                                        error={errors.current_password?.[0]}
                                        required
                                    />

                                    <PasswordInput
                                        label="New Password"
                                        value={passwords.password}
                                        onChange={updatePassword('password')}
                                        error={errors.password?.[0]}
                                        hint="Must be at least 8 characters."
                                        required
                                    />

                                    <PasswordInput
                                        label="Confirm New Password"
                                        value={passwords.password_confirmation}
                                        onChange={updatePassword('password_confirmation')}
                                        error={errors.password_confirmation?.[0]}
                                        required
                                    />

                                    <div className="flex justify-end pt-2">
                                        <Button type="submit" loading={savingPassword}>
                                            Update Password
                                        </Button>
                                    </div>
                                </div>
                            </form>

                            {/* Active Sessions & Security Overview */}
                            <div className="rounded-2xl border border-blue-100 bg-canvas p-6 shadow-sm">
                                <div className="flex items-center gap-2 border-b border-blue-100 pb-4">
                                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                                    <h2 className="text-lg font-semibold text-ink-900">Session & Security Status</h2>
                                </div>

                                <div className="mt-4 space-y-3 text-sm text-ink-700">
                                    <div className="flex items-center justify-between py-2 border-b border-blue-50">
                                        <div>
                                            <p className="font-medium text-ink-900">Current Active Session</p>
                                            <p className="text-xs text-ink-400">Authenticated via Secure Sanctum API Token</p>
                                        </div>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Active Now
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="font-medium text-ink-900">Role-Based Access Control</p>
                                            <p className="text-xs text-ink-400">Protected by Choir MKC Guard Policy</p>
                                        </div>
                                        <span className="text-xs font-medium text-ink-600 capitalize">
                                            {data?.role || 'Member'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: Preferences & Notifications */}
                    {activeTab === 'preferences' && (
                        <div className="space-y-6">
                            {/* Region & Language Preferences */}
                            <form
                                onSubmit={handleProfileSubmit}
                                className="rounded-2xl border border-blue-100 bg-canvas p-6 shadow-sm"
                            >
                                <div className="flex items-center gap-2 border-b border-blue-100 pb-4">
                                    <Globe className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <h2 className="text-lg font-semibold text-ink-900">Region & Language</h2>
                                        <p className="text-xs text-ink-500">
                                            Customize your preferred display language and timezone region.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-ink-700 mb-1.5">
                                            Preferred Language
                                        </label>
                                        <select
                                            value={form.language}
                                            onChange={update('language')}
                                            className="w-full rounded-lg border border-ink-200 bg-canvas px-3.5 py-2.5 text-sm text-ink-800 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        >
                                            {LANGUAGES.map((lang) => (
                                                <option key={lang.code} value={lang.code}>
                                                    {lang.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-ink-700 mb-1.5">
                                            Timezone Region
                                        </label>
                                        <select
                                            value={form.timezone}
                                            onChange={update('timezone')}
                                            className="w-full rounded-lg border border-ink-200 bg-canvas px-3.5 py-2.5 text-sm text-ink-800 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        >
                                            {TIMEZONES.map((tz) => (
                                                <option key={tz.value} value={tz.value}>
                                                    {tz.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <Button type="submit" loading={savingProfile}>
                                            Save Regional Preferences
                                        </Button>
                                    </div>
                                </div>
                            </form>

                            {/* Notification Preferences */}
                            <form
                                onSubmit={handlePrefsSubmit}
                                className="rounded-2xl border border-blue-100 bg-canvas p-6 shadow-sm"
                            >
                                <div className="flex items-center gap-2 border-b border-blue-100 pb-4">
                                    <Bell className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <h2 className="text-lg font-semibold text-ink-900">Notification Preferences</h2>
                                        <p className="text-xs text-ink-500">Choose which updates and reminders you receive.</p>
                                    </div>
                                </div>

                                <div className="mt-5 space-y-4">
                                    {Object.entries(NOTIFICATION_LABELS).map(([key, item]) => (
                                        <label
                                            key={key}
                                            className="flex items-start gap-3 rounded-xl border border-blue-50 bg-surface/50 p-3.5 hover:bg-surface cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={Boolean(prefs[key])}
                                                onChange={togglePref(key)}
                                                className="mt-1 h-4 w-4 rounded border-ink-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <div className="select-none">
                                                <p className="text-sm font-semibold text-ink-800">{item.title}</p>
                                                <p className="text-xs text-ink-500 mt-0.5">{item.desc}</p>
                                            </div>
                                        </label>
                                    ))}

                                    <div className="flex justify-end pt-2">
                                        <Button type="submit" loading={savingPrefs}>
                                            Save Notification Preferences
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* TAB 5: Account Actions (Danger Zone) */}
                    {activeTab === 'actions' && (
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-red-200 bg-red-50/20 p-6 shadow-sm">
                                <div className="flex items-center gap-2 border-b border-red-100 pb-4">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                    <div>
                                        <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
                                        <p className="text-xs text-red-600">
                                            Permanent and irreversible actions regarding your choir account.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-6">
                                    {/* Password Reset Trigger inside Account Actions */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-red-100 bg-canvas p-4">
                                        <div>
                                            <p className="text-sm font-semibold text-ink-900">Request Password Reset</p>
                                            <p className="text-xs text-ink-500">
                                                Send a password reset link to your registered email address.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleTriggerPasswordReset}
                                            loading={sendingReset}
                                        >
                                            Reset Password
                                        </Button>
                                    </div>

                                    {/* Deactivation / Deletion */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50/50 p-4">
                                        <div>
                                            <p className="text-sm font-semibold text-red-900">Deactivate Account</p>
                                            <p className="text-xs text-red-700">
                                                Deactivating will revoke your active session and temporarily disable access to your choir portal.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="danger"
                                            onClick={() => setShowDeactivateModal(true)}
                                        >
                                            <Trash2 size={15} />
                                            <span>Deactivate Account</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Deactivation Confirmation Modal */}
            {showDeactivateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-red-100 bg-canvas p-6 shadow-xl">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                            <AlertTriangle size={24} />
                        </div>

                        <h3 className="mt-4 text-lg font-bold text-ink-900">Deactivate your account?</h3>
                        <p className="mt-2 text-sm text-ink-600">
                            Are you sure you want to deactivate your account? You will be signed out immediately. To reactivate your account in the future, you will need to contact an administrator.
                        </p>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setShowDeactivateModal(false)}
                                disabled={deactivating}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="danger"
                                onClick={handleDeactivateAccount}
                                loading={deactivating}
                            >
                                Yes, Deactivate
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
