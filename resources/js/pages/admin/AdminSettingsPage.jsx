import { useState, useEffect, useCallback } from 'react';
import {
    Settings,
    Building2,
    Music2,
    Users,
    Bell,
    Shield,
    Server,
    Save,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Mail,
    Phone,
    MapPin,
    Clock,
    Lock,
    KeyRound,
    User,
    Sparkles,
    Trash2,
    Database,
    Cpu,
    Radio,
    FileText,
} from 'lucide-react';
import { api } from '../../axios';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import Alert from '../../components/ui/Alert';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

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

export default function AdminSettingsPage() {
    const { user, refreshUser } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [clearingCache, setClearingCache] = useState(false);
    const [alert, setAlert] = useState(null);
    const [errors, setErrors] = useState({});

    // System Settings State
    const [settings, setSettings] = useState({
        ministry_name: 'YKA M.K.C Choirs & Worship Ministry',
        ministry_tagline: 'Serving the Lord with passion, unity, and choral excellence.',
        church_name: 'Ethiopian Kale Heywet Church (YKA M.K.C)',
        church_address: 'Addis Ababa, Ethiopia',
        contact_email: 'contact@ykamkc.org',
        contact_phone: '+251 911 000 000',
        default_language: 'en',
        default_timezone: 'Africa/Addis_Ababa',
        default_rehearsal_duration_minutes: '120',
        attendance_grace_period_minutes: '15',
        attendance_quorum_percentage: '75',
        allow_member_file_downloads: '1',
        public_registration_enabled: '1',
        require_admin_approval: '1',
        default_registration_role: 'member',
        email_notifications_enabled: '1',
        sms_alerts_enabled: '0',
        rehearsal_reminder_lead_hours: '24',
        performance_reminder_lead_hours: '48',
    });

    // System Diagnostics info
    const [systemInfo, setSystemInfo] = useState(null);

    // Admin Profile Form
    const [profileForm, setProfileForm] = useState({
        name: '',
        username: '',
        email: '',
        phone: '',
        language: 'en',
        timezone: 'Africa/Addis_Ababa',
    });
    const [savingProfile, setSavingProfile] = useState(false);

    // Password change form
    const [passwords, setPasswords] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [savingPassword, setSavingPassword] = useState(false);

    const fetchAdminSettings = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/settings');
            const data = res.data?.data;
            if (data?.settings) {
                setSettings((prev) => ({
                    ...prev,
                    ...data.settings,
                }));
            }
            if (data?.system_info) {
                setSystemInfo(data.system_info);
            }

            // Sync profile
            if (user) {
                setProfileForm({
                    name: user.name || '',
                    username: user.username || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    language: user.language || 'en',
                    timezone: user.timezone || 'Africa/Addis_Ababa',
                });
            }
        } catch (err) {
            setAlert({ variant: 'error', message: 'Failed to load system settings.' });
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchAdminSettings();
    }, [fetchAdminSettings]);

    const handleSettingChange = (field, value) => {
        setSettings((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleProfileChange = (field) => (e) => {
        setProfileForm((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleSaveSystemSettings = async (e) => {
        e.preventDefault();
        setAlert(null);

        // Ethiopian phone validation
        if (settings.contact_phone && !/^(09|07)\d{8}$/.test(settings.contact_phone)) {
            setErrors((prev) => ({
                ...prev,
                'settings.contact_phone': ['Contact phone must be exactly 10 Ethiopian digits starting with 09 or 07 (e.g., 0911223344 or 0711223344).'],
            }));
            setAlert({ variant: 'error', message: 'Contact phone must be exactly 10 Ethiopian digits starting with 09 or 07.' });
            return;
        }

        setSavingSettings(true);
        try {
            await api.put('/admin/settings', { settings });
            setAlert({ variant: 'success', message: 'System settings saved successfully!' });
        } catch (err) {
            if (err.errors) setErrors(err.errors);
            setAlert({ variant: 'error', message: err.message || 'Failed to save settings.' });
        } finally {
            setSavingSettings(false);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setAlert(null);

        // Ethiopian phone validation
        if (profileForm.phone && !/^(09|07)\d{8}$/.test(profileForm.phone)) {
            setErrors((prev) => ({
                ...prev,
                phone: ['Phone number must be exactly 10 Ethiopian digits starting with 09 or 07 (e.g., 0911223344 or 0711223344).'],
            }));
            setAlert({ variant: 'error', message: 'Phone number must be exactly 10 Ethiopian digits starting with 09 or 07.' });
            return;
        }

        setSavingProfile(true);
        try {
            await api.put('/member/settings', profileForm);
            await refreshUser();
            setAlert({ variant: 'success', message: 'Admin profile updated successfully!' });
        } catch (err) {
            if (err.errors) setErrors(err.errors);
            setAlert({ variant: 'error', message: err.message || 'Failed to update profile.' });
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setSavingPassword(true);
        setAlert(null);
        try {
            await api.put('/member/settings/password', passwords);
            setPasswords({ current_password: '', password: '', password_confirmation: '' });
            setAlert({ variant: 'success', message: 'Admin password changed successfully!' });
        } catch (err) {
            if (err.errors) setErrors(err.errors);
            setAlert({ variant: 'error', message: err.message || 'Failed to update password.' });
        } finally {
            setSavingPassword(false);
        }
    };

    const handleClearCache = async () => {
        setClearingCache(true);
        setAlert(null);
        try {
            const res = await api.post('/admin/settings/cache-clear');
            setAlert({ variant: 'success', message: res.data?.message || 'Cache cleared successfully!' });
        } catch (err) {
            setAlert({ variant: 'error', message: err.message || 'Failed to clear system cache.' });
        } finally {
            setClearingCache(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <LoadingSpinner size={36} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
                        <Settings className="h-7 w-7 text-blue-600" />
                        System & Ministry Settings
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Configure ministry information, rehearsal policies, registration workflows, notifications, and administrator preferences.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={fetchAdminSettings}
                        className="gap-1.5"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </Button>
                </div>
            </div>

            {alert && <Alert variant={alert.variant} title={alert.message} />}

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 text-sm font-medium">
                <button
                    type="button"
                    onClick={() => setActiveTab('general')}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 transition-colors ${
                        activeTab === 'general'
                            ? 'bg-blue-600 text-white shadow-sm font-semibold'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <Building2 size={16} />
                    <span>General & Ministry</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('rehearsals')}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 transition-colors ${
                        activeTab === 'rehearsals'
                            ? 'bg-blue-600 text-white shadow-sm font-semibold'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <Music2 size={16} />
                    <span>Rehearsals & Attendance</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('registration')}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 transition-colors ${
                        activeTab === 'registration'
                            ? 'bg-blue-600 text-white shadow-sm font-semibold'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <Users size={16} />
                    <span>Registration & Access</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('notifications')}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 transition-colors ${
                        activeTab === 'notifications'
                            ? 'bg-blue-600 text-white shadow-sm font-semibold'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <Bell size={16} />
                    <span>Notifications & Alerts</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 transition-colors ${
                        activeTab === 'profile'
                            ? 'bg-blue-600 text-white shadow-sm font-semibold'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <User size={16} />
                    <span>Admin Profile & Security</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('maintenance')}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 transition-colors ${
                        activeTab === 'maintenance'
                            ? 'bg-slate-800 text-white shadow-sm font-semibold'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <Server size={16} />
                    <span>System Diagnostics</span>
                </button>
            </div>

            {/* TAB CONTENT */}

            {/* TAB 1: General & Ministry Information */}
            {activeTab === 'general' && (
                <form onSubmit={handleSaveSystemSettings} className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Ministry & Church Identity</h2>
                                <p className="text-xs text-slate-500">
                                    General organization branding displayed across public pages and member portal.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <Input
                                    label="Ministry Tagline / Motto"
                                    value={settings.ministry_tagline || ''}
                                    onChange={(e) => handleSettingChange('ministry_tagline', e.target.value)}
                                    error={errors['settings.ministry_tagline']?.[0]}
                                    maxLength={500}
                                    placeholder="e.g. Serving the Lord with passion and choral excellence"
                                />
                            </div>

                            <Input
                                label="Primary Contact Email"
                                type="email"
                                value={settings.contact_email || ''}
                                onChange={(e) => handleSettingChange('contact_email', e.target.value)}
                                error={errors['settings.contact_email']?.[0]}
                                maxLength={255}
                                placeholder="contact@ykamkc.org"
                            />

                            <Input
                                label="Primary Contact Phone"
                                type="tel"
                                value={settings.contact_phone || ''}
                                onChange={(e) => handleSettingChange('contact_phone', e.target.value)}
                                error={errors['settings.contact_phone']?.[0]}
                                placeholder="0911223344"
                                maxLength={10}
                                hint="Must be exactly 10 Ethiopian digits starting with 09 or 07."
                            />

                            <div className="sm:col-span-2">
                                <Input
                                    label="Church Physical Location / Address"
                                    value={settings.church_address || ''}
                                    onChange={(e) => handleSettingChange('church_address', e.target.value)}
                                    error={errors['settings.church_address']?.[0]}
                                    maxLength={255}
                                    placeholder="Addis Ababa, Ethiopia"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Default Language
                                </label>
                                <select
                                    value={settings.default_language || 'en'}
                                    onChange={(e) => handleSettingChange('default_language', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    {LANGUAGES.map((l) => (
                                        <option key={l.code} value={l.code}>
                                            {l.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Default Timezone
                                </label>
                                <select
                                    value={settings.default_timezone || 'Africa/Addis_Ababa'}
                                    onChange={(e) => handleSettingChange('default_timezone', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    {TIMEZONES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
                            <Button type="submit" loading={savingSettings} className="gap-2">
                                <Save size={16} />
                                Save General Settings
                            </Button>
                        </div>
                    </div>
                </form>
            )}

            {/* TAB 2: Rehearsals & Attendance Policies */}
            {activeTab === 'rehearsals' && (
                <form onSubmit={handleSaveSystemSettings} className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                            <Music2 className="h-5 w-5 text-blue-600" />
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Rehearsal & Attendance Rules</h2>
                                <p className="text-xs text-slate-500">
                                    Configure rehearsal timing standards, attendance check-in grace period, and song material rules.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Input
                                label="Default Rehearsal Duration (Minutes)"
                                type="number"
                                min="15"
                                max="480"
                                value={settings.default_rehearsal_duration_minutes || '120'}
                                onChange={(e) => handleSettingChange('default_rehearsal_duration_minutes', e.target.value)}
                                error={errors['settings.default_rehearsal_duration_minutes']?.[0]}
                                hint="Standard duration used when scheduling new rehearsals (e.g. 120 = 2 hours)."
                                required
                            />

                            <Input
                                label="Attendance Check-In Grace Period (Minutes)"
                                type="number"
                                min="0"
                                max="120"
                                value={settings.attendance_grace_period_minutes || '15'}
                                onChange={(e) => handleSettingChange('attendance_grace_period_minutes', e.target.value)}
                                error={errors['settings.attendance_grace_period_minutes']?.[0]}
                                hint="Leniency window after rehearsal starts before marking as late."
                                required
                            />

                            <Input
                                label="Target Attendance Quorum (%)"
                                type="number"
                                min="0"
                                max="100"
                                value={settings.attendance_quorum_percentage || '75'}
                                onChange={(e) => handleSettingChange('attendance_quorum_percentage', e.target.value)}
                                error={errors['settings.attendance_quorum_percentage']?.[0]}
                                hint="Target percentage for successful rehearsal participation reports."
                                required
                            />

                            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                                <input
                                    type="checkbox"
                                    id="allow_member_file_downloads"
                                    checked={settings.allow_member_file_downloads === '1' || settings.allow_member_file_downloads === true}
                                    onChange={(e) => handleSettingChange('allow_member_file_downloads', e.target.checked ? '1' : '0')}
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div>
                                    <label htmlFor="allow_member_file_downloads" className="text-sm font-semibold text-slate-800 cursor-pointer">
                                        Allow Members to Download Audio &amp; Sheet Music
                                    </label>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        When enabled, choir members can download MP3 tracks, rehearsal stems, and PDF chord sheets.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
                            <Button type="submit" loading={savingSettings} className="gap-2">
                                <Save size={16} />
                                Save Rehearsal Policies
                            </Button>
                        </div>
                    </div>
                </form>
            )}

            {/* TAB 3: Registration & Access Controls */}
            {activeTab === 'registration' && (
                <form onSubmit={handleSaveSystemSettings} className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                            <Users className="h-5 w-5 text-blue-600" />
                            <div>
                                <h2 className="text-base font-bold text-slate-900">User Registration &amp; Account Approval</h2>
                                <p className="text-xs text-slate-500">
                                    Control public account registration, mandatory admin approval flow, and role defaults.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 space-y-4">
                            <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Public Member Registration</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Allow new choir singers and candidates to register on the public portal.
                                    </p>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        checked={settings.public_registration_enabled === '1' || settings.public_registration_enabled === true}
                                        onChange={(e) => handleSettingChange('public_registration_enabled', e.target.checked ? '1' : '0')}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Require Administrator Approval</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        When enabled, newly registered users remain in 'Pending' status until approved in the Admin Users tab.
                                    </p>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        checked={settings.require_admin_approval === '1' || settings.require_admin_approval === true}
                                        onChange={(e) => handleSettingChange('require_admin_approval', e.target.checked ? '1' : '0')}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Default Role Assigned on Registration
                                </label>
                                <select
                                    value={settings.default_registration_role || 'member'}
                                    onChange={(e) => handleSettingChange('default_registration_role', e.target.value)}
                                    className="w-full sm:w-80 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="member">Member (Standard Singer / Musician)</option>
                                    <option value="team_leader">Team Leader (Choir Conductor / Section Leader)</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
                            <Button type="submit" loading={savingSettings} className="gap-2">
                                <Save size={16} />
                                Save Registration Settings
                            </Button>
                        </div>
                    </div>
                </form>
            )}

            {/* TAB 4: Notifications & Alert Preferences */}
            {activeTab === 'notifications' && (
                <form onSubmit={handleSaveSystemSettings} className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                            <Bell className="h-5 w-5 text-blue-600" />
                            <div>
                                <h2 className="text-base font-bold text-slate-900">System Notification Defaults</h2>
                                <p className="text-xs text-slate-500">
                                    Configure system-wide notification dispatch timing and delivery channels.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 space-y-4">
                            <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Email Notifications Dispatch</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Send email alerts for upcoming rehearsals, concert announcements, and system alerts.
                                    </p>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        checked={settings.email_notifications_enabled === '1' || settings.email_notifications_enabled === true}
                                        onChange={(e) => handleSettingChange('email_notifications_enabled', e.target.checked ? '1' : '0')}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                                <Input
                                    label="Rehearsal Reminder Lead Time (Hours)"
                                    type="number"
                                    min="1"
                                    max="168"
                                    value={settings.rehearsal_reminder_lead_hours || '24'}
                                    onChange={(e) => handleSettingChange('rehearsal_reminder_lead_hours', e.target.value)}
                                    error={errors['settings.rehearsal_reminder_lead_hours']?.[0]}
                                    hint="How many hours in advance to dispatch rehearsal reminders."
                                    required
                                />

                                <Input
                                    label="Performance Announcement Lead Time (Hours)"
                                    type="number"
                                    min="1"
                                    max="168"
                                    value={settings.performance_reminder_lead_hours || '48'}
                                    onChange={(e) => handleSettingChange('performance_reminder_lead_hours', e.target.value)}
                                    error={errors['settings.performance_reminder_lead_hours']?.[0]}
                                    hint="How many hours in advance to broadcast performance reminders."
                                    required
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
                            <Button type="submit" loading={savingSettings} className="gap-2">
                                <Save size={16} />
                                Save Notification Defaults
                            </Button>
                        </div>
                    </div>
                </form>
            )}

            {/* TAB 5: Admin Profile & Security */}
            {activeTab === 'profile' && (
                <div className="space-y-6">
                    {/* Admin Personal Info */}
                    <form onSubmit={handleSaveProfile} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                            <User className="h-5 w-5 text-blue-600" />
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Administrator Personal Details</h2>
                                <p className="text-xs text-slate-500">
                                    Update your name, contact email, telephone, and interface preferences.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Input
                                label="Full Name"
                                value={profileForm.name}
                                onChange={handleProfileChange('name')}
                                error={errors.name?.[0]}
                                maxLength={255}
                                required
                            />

                            <Input
                                label="Username"
                                value={profileForm.username}
                                onChange={handleProfileChange('username')}
                                error={errors.username?.[0]}
                                prefix="@"
                                maxLength={50}
                                placeholder="admin"
                            />

                            <Input
                                label="Email Address"
                                type="email"
                                value={profileForm.email}
                                onChange={handleProfileChange('email')}
                                error={errors.email?.[0]}
                                maxLength={255}
                                required
                            />

                            <Input
                                label="Phone Number"
                                type="tel"
                                value={profileForm.phone}
                                onChange={handleProfileChange('phone')}
                                error={errors.phone?.[0]}
                                placeholder="0911223344"
                                maxLength={10}
                                hint="Must be exactly 10 Ethiopian digits (09XXXXXXXX or 07XXXXXXXX)."
                            />

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Language Preference
                                </label>
                                <select
                                    value={profileForm.language}
                                    onChange={handleProfileChange('language')}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    {LANGUAGES.map((l) => (
                                        <option key={l.code} value={l.code}>
                                            {l.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Timezone Preference
                                </label>
                                <select
                                    value={profileForm.timezone}
                                    onChange={handleProfileChange('timezone')}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    {TIMEZONES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
                            <Button type="submit" loading={savingProfile} className="gap-2">
                                <Save size={16} />
                                Update Profile
                            </Button>
                        </div>
                    </form>

                    {/* Change Password */}
                    <form onSubmit={handlePasswordChange} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                            <Lock className="h-5 w-5 text-blue-600" />
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Change Administrator Password</h2>
                                <p className="text-xs text-slate-500">
                                    Choose a strong password with at least 8 characters.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 space-y-4 max-w-md">
                            <PasswordInput
                                label="Current Password"
                                value={passwords.current_password}
                                onChange={(e) => setPasswords((prev) => ({ ...prev, current_password: e.target.value }))}
                                error={errors.current_password?.[0]}
                                required
                            />

                            <PasswordInput
                                label="New Password"
                                value={passwords.password}
                                onChange={(e) => setPasswords((prev) => ({ ...prev, password: e.target.value }))}
                                error={errors.password?.[0]}
                                hint="At least 8 characters."
                                required
                            />

                            <PasswordInput
                                label="Confirm New Password"
                                value={passwords.password_confirmation}
                                onChange={(e) => setPasswords((prev) => ({ ...prev, password_confirmation: e.target.value }))}
                                error={errors.password_confirmation?.[0]}
                                required
                            />

                            <div className="pt-2">
                                <Button type="submit" loading={savingPassword} className="gap-2">
                                    <KeyRound size={16} />
                                    Update Password
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* TAB 6: System Diagnostics & Maintenance */}
            {activeTab === 'maintenance' && (
                <div className="space-y-6">
                    {/* Quick Action: Clear Cache */}
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h3 className="text-base font-bold text-blue-950 flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-blue-600" />
                                    Application Cache &amp; Route Optimization
                                </h3>
                                <p className="text-xs text-blue-800/80">
                                    Clear system caches, compiled routes, configuration cache, and setting registry to apply recent updates immediately.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="gold"
                                onClick={handleClearCache}
                                loading={clearingCache}
                                className="shrink-0 gap-2 font-bold"
                            >
                                <RefreshCw size={16} className={clearingCache ? 'animate-spin' : ''} />
                                Clear System Cache
                            </Button>
                        </div>
                    </div>

                    {/* Server Diagnostic Info Table */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                            <Server className="h-5 w-5 text-slate-700" />
                            <div>
                                <h2 className="text-base font-bold text-slate-900">Server &amp; Application Health Overview</h2>
                                <p className="text-xs text-slate-500">
                                    Live runtime diagnostics and database driver configurations.
                                </p>
                            </div>
                        </div>

                        {systemInfo && (
                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                                        <Cpu size={15} className="text-blue-600" />
                                        <span>PHP Version</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 font-mono">{systemInfo.php_version}</p>
                                </div>

                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                                        <Sparkles size={15} className="text-indigo-600" />
                                        <span>Laravel Framework</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 font-mono">v{systemInfo.laravel_version}</p>
                                </div>

                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                                        <Database size={15} className="text-emerald-600" />
                                        <span>Database Connection</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 capitalize font-mono">
                                        {systemInfo.database_connection} ({systemInfo.database_name})
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                                        <Radio size={15} className="text-amber-600" />
                                        <span>Cache Driver</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 capitalize font-mono">{systemInfo.cache_driver}</p>
                                </div>

                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                                        <Clock size={15} className="text-purple-600" />
                                        <span>Session Driver</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 capitalize font-mono">{systemInfo.session_driver}</p>
                                </div>

                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                                        <Mail size={15} className="text-rose-600" />
                                        <span>Mail Driver</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 capitalize font-mono">{systemInfo.mail_driver}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
