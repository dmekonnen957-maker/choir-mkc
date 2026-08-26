import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Music, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import Input from '../components/ui/Input';
import PasswordInput from '../components/ui/PasswordInput';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [remember, setRemember] = useState(false);
    const [alert, setAlert] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const update = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlert(null);
        setSubmitting(true);

        try {
            const user = await login(form, remember);
            const roles = user?.roles ?? [];
            const role = user?.role;
            const destination =
                roles.includes('super-admin') || roles.includes('admin') || role === 'admin' || role === 'super-admin'
                    ? '/admin/dashboard'
                    : roles.includes('team_leader') || role === 'team_leader'
                        ? '/team-leader/dashboard'
                        : '/member/dashboard';
            navigate(destination, { replace: true });
        } catch (err) {
            if (err.errors) {
                setErrors(err.errors);
            }
            const isPending = err.status === 403 && (err.message?.includes('approval') || err.message?.includes('waiting'));
            setAlert({
                variant: isPending ? 'warning' : 'error',
                message: err.message || 'Login failed. Please check your credentials.',
                isPending,
            });
            setSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white">
            {/* Background Image Display */}
            <div
                className="absolute inset-0 bg-slate-950"
                style={{
                    backgroundImage: "url('/images/login-background.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />

            {/* Gradient Dark Backdrop Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/80 to-blue-950/85 backdrop-blur-sm" />

            {/* Glowing Accent Lights */}
            <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-600/20 blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />

            {/* Navigation back */}
            <Link
                to="/"
                className="absolute left-6 top-6 z-20 inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-300 backdrop-blur-md transition-all duration-300 hover:border-blue-500 hover:bg-slate-800 hover:text-white"
            >
                <ArrowLeft size={16} /> Return Home
            </Link>

            {/* Main Form Box */}
            <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
                <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl sm:p-10">

                    {/* Brand Banner */}
                    <div className="mb-8 flex flex-col items-center text-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-600/30">
                            <Music size={28} />
                        </span>
                        <p className="mt-4 text-xl font-black tracking-wide text-white">
                            Yeka MKC <span className="font-light text-blue-400">Choir</span>
                        </p>
                    </div>

                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-extrabold text-white">Member Portal</h1>
                        <p className="mt-1 text-sm text-slate-400">Sign in to access your worship team dashboard.</p>
                    </div>

                    {alert && (
                        <div className="mb-5">
                            <Alert variant={alert.variant} title={alert.message} />
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        <Input
                            label="Email Address"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="member@yekamkc.org"
                            value={form.email}
                            onChange={update('email')}
                            error={errors.email?.[0]}
                            glass
                            trailing={
                                <span className="text-slate-400">
                                    <Mail size={18} />
                                </span>
                            }
                        />

                        <PasswordInput
                            label="Password"
                            autoComplete="current-password"
                            required
                            placeholder="••••••••"
                            value={form.password}
                            onChange={update('password')}
                            error={errors.password?.[0]}
                            glass
                        />

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500/40"
                                />
                                Keep me signed in
                            </label>
                            <a href="#" className="font-semibold text-blue-400 transition-colors hover:text-blue-300">
                                Forgot password?
                            </a>
                        </div>

                        <Button type="submit" size="lg" loading={submitting} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 font-bold shadow-lg shadow-blue-600/25 hover:from-blue-500 hover:to-indigo-500">
                            Sign In to Worship Team
                            {!submitting && <ArrowRight size={18} />}
                        </Button>
                    </form>

                    <div className="mt-8 border-t border-slate-800/80 pt-6 text-center text-sm text-slate-400">
                        Don&apos;t have an active account?{' '}
                        <Link
                            to="/register"
                            className="font-bold text-blue-400 transition-colors hover:text-blue-300"
                        >
                            Request Access
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}