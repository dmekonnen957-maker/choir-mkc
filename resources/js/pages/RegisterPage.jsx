import { useState, useEffect } from 'react';
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
        <div className="relative min-h-screen w-full overflow-x-hidden">
            {/* Background image */}
            <div
                className="absolute inset-0 bg-blue-950"
                style={{
                    backgroundImage: "url('/images/login-background.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />

            {/* Subtle blue/dark overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-blue-950/45 to-blue-950/60" />

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
            <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
                <div className="glass-panel w-full max-w-lg p-7 sm:p-9">
                    {/* Brand */}
                    <div className="mb-6 flex flex-col items-center text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
                            <Music size={24} />
                        </span>
                        <p className="mt-3 text-lg font-bold tracking-wide text-white">CHOIR MKC</p>
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
                                autoComplete="tel"
                                placeholder="0911000000"
                                value={form.phone}
                                onChange={update('phone')}
                                error={errors.phone?.[0]}
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
