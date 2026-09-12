import { useState, useEffect } from 'react';
import Logo from '../components/Logo';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Music, ArrowRight, ArrowLeft, User, Phone, Church, CheckCircle2 } from 'lucide-react';
import Input from '../components/ui/Input';
import PasswordInput from '../components/ui/PasswordInput';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { api } from '../axios';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        choir_id: '',
        password: '',
        password_confirmation: '',
    });
    const [choirs, setChoirs] = useState([]);
    const [loadingChoirs, setLoadingChoirs] = useState(true);
    const [errors, setErrors] = useState({});
    const [alert, setAlert] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let active = true;
        api.get('/public/choirs?per_page=100')
            .then((res) => {
                if (active) {
                    const items = res.data?.data?.items || res.data?.data || [];
                    setChoirs(items);
                    if (items.length > 0 && !form.choir_id) {
                        setForm((prev) => ({ ...prev, choir_id: items[0].id }));
                    }
                }
            })
            .catch(() => {
                // Silently fallback if needed
            })
            .finally(() => {
                if (active) setLoadingChoirs(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const update = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handlePhone = (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.startsWith('0')) v = v.slice(1);
        v = v.slice(0, 9);
        setForm((prev) => ({ ...prev, phone: v }));
        setErrors((prev) => ({ ...prev, phone: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlert(null);

        if (!form.choir_id) {
            setErrors((prev) => ({ ...prev, choir_id: ['Please select a choir.'] }));
            return;
        }

        setSubmitting(true);

        try {
            await register({
                name: form.name,
                email: form.email,
                phone: form.phone || undefined,
                choir_id: form.choir_id,
                password: form.password,
                password_confirmation: form.password_confirmation,
            });

            // Redirect to the pending approval page
            navigate('/registration-pending', {
                replace: true,
                state: { email: form.email, name: form.name },
            });
        } catch (err) {
            if (err.errors) {
                setErrors(err.errors);
            }
            setAlert({ variant: 'error', message: err.message || 'Registration failed. Please review the form.' });
            setSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
            {/* Background image */}
            <div
            className="absolute inset-0"
                style={{
                    backgroundImage: "url('/images/login-background.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />

            {/* Subtle blue/dark overlay for readability */}
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />

            {/* Minimal decorative glass blur */}
            <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px]" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-[500px] w-[500px] rounded-full bg-blue-400/5 blur-[140px]" />

            {/* Back to home */}
            <Link
                to="/"
                className="absolute left-6 top-6 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 backdrop-blur-md transition-all duration-300 hover:border-blue-400/30 hover:bg-white/10 hover:text-white/80"
            >
                <ArrowLeft size={16} /> Back to home
            </Link>

            {/* Content */}
            <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
                <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-9">
                    <div className="mb-6 flex flex-col items-center justify-center text-center">
                        <Logo size="md" />
                        <p className="mt-3 text-lg font-black tracking-wide text-white">YEKA <span className="text-blue-400">M.K.C</span> CHOIR</p>
                    </div>

                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-semibold text-white">Create an Account</h1>
                        <p className="mt-1 text-sm text-white/75">
                            Register as a choir member. Administrator approval is required before access.
                        </p>
                    </div>

                    {alert && (
                        <div className="mb-5">
                            <Alert variant={alert.variant} title={alert.message} />
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        <Input
                            label="Full Name"
                            required
                            autoComplete="name"
                            placeholder="Abebe Bikila"
                            value={form.name}
                            onChange={update('name')}
                            error={errors.name?.[0]}
                            glass
                            trailing={
                                <span className="text-white/70">
                                    <User size={18} />
                                </span>
                            }
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Email"
                                type="email"
                                required
                                autoComplete="email"
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

                            <Input
                                label="Phone"
                                type="tel"
                                prefix="+251"
                                autoComplete="tel"
                                placeholder="912345678"
                                value={form.phone}
                                onChange={handlePhone}
                                error={errors.phone?.[0]}
                                hint="9 digits, starting with 9 (e.g. 912345678)"
                                glass
                                trailing={
                                    <span className="text-white/70">
                                        <Phone size={18} />
                                    </span>
                                }
                            />
                        </div>

                        {/* Choose Choir */}
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-white/90">
                                Choose Choir <span className="text-blue-300">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={form.choir_id}
                                    onChange={update('choir_id')}
                                    disabled={loadingChoirs}
                                    className={`w-full appearance-none rounded-xl border bg-white/10 px-4 py-2.5 text-sm text-white backdrop-blur transition focus:border-blue-400 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-400/30 ${
                                        errors.choir_id ? 'border-red-400' : 'border-white/20'
                                    }`}
                                >
                                    {loadingChoirs ? (
                                        <option value="" className="text-ink-900">
                                            Loading choirs...
                                        </option>
                                    ) : (
                                        choirs.map((c) => (
                                            <option key={c.id} value={c.id} className="text-ink-900">
                                                {c.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/70">
                                    <Church size={18} />
                                </span>
                            </div>
                            {errors.choir_id && (
                                <p className="mt-1 text-xs text-red-300">{errors.choir_id[0]}</p>
                            )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <PasswordInput
                                label="Password"
                                required
                                autoComplete="new-password"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={update('password')}
                                error={errors.password?.[0]}
                                glass
                            />

                            <PasswordInput
                                label="Confirm Password"
                                required
                                autoComplete="new-password"
                                placeholder="••••••••"
                                value={form.password_confirmation}
                                onChange={update('password_confirmation')}
                                error={errors.password_confirmation?.[0]}
                                glass
                            />
                        </div>

                        <Button type="submit" size="lg" loading={submitting} className="mt-2 w-full">
                            Register
                            {!submitting && <ArrowRight size={18} />}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-white/70">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-blue-200 hover:text-white">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
