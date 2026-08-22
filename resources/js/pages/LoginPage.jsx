import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Music, ArrowRight, ArrowLeft } from 'lucide-react';
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
            const destination = roles.includes('super-admin') || roles.includes('admin')
                ? '/admin/dashboard'
                : roles.includes('team_leader')
                    ? '/team-leader/dashboard'
                    : '/member/dashboard';
            navigate(destination, { replace: true });
        } catch (err) {
            if (err.errors) {
                setErrors(err.errors);
            }
            setAlert({ variant: 'error', message: err.message });
            setSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden">
            {/* Background image (replace public/images/login-background.jpg) */}
            <div
                className="absolute inset-0 bg-blue-950"
                style={{
                    backgroundImage: "url('/images/login-background.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />

            {/* Subtle blue/dark overlay so the form stays readable */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/45 via-blue-950/40 to-blue-950/55" />

            {/* Minimal decorative glass blur */}
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-blue-300/10 blur-3xl" />

            {/* Back to home */}
            <Link
                to="/"
                className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
                <ArrowLeft size={16} /> Back to home
            </Link>

            {/* Content */}
            <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
                <div className="glass-panel w-full max-w-md p-7 sm:p-9">
                    {/* Brand */}
                    <div className="mb-7 flex flex-col items-center text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
                            <Music size={24} />
                        </span>
                        <p className="mt-3 text-lg font-bold tracking-wide text-white">CHOIR MKC</p>
                    </div>

                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-semibold text-white">Welcome Back</h1>
                        <p className="mt-1 text-sm text-white/75">Sign in to continue to your choir.</p>
                    </div>

                    {alert && (
                        <div className="mb-5">
                            <Alert variant={alert.variant} title={alert.message} />
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        <Input
                            label="Email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={update('email')}
                            error={errors.email?.[0]}
                            glass
                            trailing={
                                <span className="text-white/70">
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
                            <label className="flex items-center gap-2 text-white/80">
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    className="h-4 w-4 rounded border-white/40 bg-white/10 text-blue-400 focus:ring-blue-300"
                                />
                                Remember me
                            </label>
                            <a href="#" className="font-medium text-blue-200 hover:text-white">
                                Forgot password?
                            </a>
                        </div>

                        <Button type="submit" size="lg" loading={submitting} className="w-full">
                            Sign In
                            {!submitting && <ArrowRight size={18} />}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-white/70">
                        Don&apos;t have an account?{' '}
                        <Link
                            to="/register"
                            className="font-medium text-blue-200 hover:text-white"
                        >
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
