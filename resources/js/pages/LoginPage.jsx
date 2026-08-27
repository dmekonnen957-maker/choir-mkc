import { useState } from 'react';
import Logo from '../components/Logo';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
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
        <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100">

            {/* Background Image */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: "url('/images/login-background.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />

            {/* Glass Overlay */}
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />

            {/* Subtle Blue Glow */}
            <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px]" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-[500px] w-[500px] rounded-full bg-blue-400/5 blur-[140px]" />

            {/* Navigation back */}
            <Link
                to="/"
                className="absolute left-6 top-6 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 backdrop-blur-md transition-all duration-300 hover:border-blue-400/30 hover:bg-white/10 hover:text-white/80"
            >
                <ArrowLeft size={16} /> Back
            </Link>

            {/* Main Form Box */}
            <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">

                    {/* Glass Card */}
                    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl shadow-black/40 sm:p-10">

                        {/* Logo and Title - Centered */}
                        <div className="flex flex-col items-center justify-center mb-8">
                            <Logo size="lg" className="mb-3" />
                            <h1 className="text-2xl font-light text-white/90 tracking-wide">
                                Yeka MKC
                            </h1>
                            <p className="text-xs text-blue-300/60 font-light tracking-wider mt-1">
                                Choir & Worship Team
                            </p>
                        </div>

                        {/* Alert Messages */}
                        {alert && (
                            <div className="mb-5">
                                <Alert variant={alert.variant} title={alert.message} />
                            </div>
                        )}

                        {/* Login Form */}
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
                                className="bg-white/5 border-white/10 text-white/90 placeholder:text-white/30"
                                trailing={
                                    <span className="text-white/30">
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
                                className="bg-white/5 border-white/10 text-white/90 placeholder:text-white/30"
                            />

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2.5 text-white/50 cursor-pointer hover:text-white/70 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={remember}
                                        onChange={(e) => setRemember(e.target.checked)}
                                        className="h-4 w-4 rounded border-white/20 bg-white/5 text-blue-400/60 focus:ring-blue-400/30 focus:ring-offset-0"
                                    />
                                    Keep me signed in
                                </label>
                                <a
                                    href="#"
                                    className="text-blue-300/50 transition-all duration-300 hover:text-blue-300/80"
                                >
                                    Forgot password?
                                </a>
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                loading={submitting}
                                className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/20 text-white/90 py-3.5 font-light shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300"
                            >
                                Sign In
                                {!submitting && <ArrowRight size={18} />}
                            </Button>
                        </form>

                        {/* Register Link */}
                        <div className="mt-8 border-t border-white/5 pt-6 text-center text-sm text-white/40">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="text-blue-300/50 transition-all duration-300 hover:text-blue-300/80"
                            >
                                Request Access
                            </Link>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="mt-6 text-center text-xs text-white/20">
                        © 2026 Yeka MKC
                    </p>
                </div>
            </div>
        </div>
    );
}