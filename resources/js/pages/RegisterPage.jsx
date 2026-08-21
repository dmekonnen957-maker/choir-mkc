import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight, Check } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout';
import Input from '../components/ui/Input';
import PasswordInput from '../components/ui/PasswordInput';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        terms: false,
    });
    const [errors, setErrors] = useState({});
    const [alert, setAlert] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const update = (field) => (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlert(null);

        if (!form.terms) {
            setErrors((prev) => ({ ...prev, terms: ['You must accept the terms to continue.'] }));
            return;
        }

        setSubmitting(true);

        try {
            await register({
                first_name: form.first_name,
                last_name: form.last_name,
                email: form.email,
                phone: form.phone || undefined,
                password: form.password,
                password_confirmation: form.password_confirmation,
            });
            navigate('/app', { replace: true });
        } catch (err) {
            if (err.errors) {
                setErrors(err.errors);
            }
            setAlert({ variant: 'error', message: err.message });
            setSubmitting(false);
        }
    };

    return (
        <AuthLayout
            title="Create Your Account"
            subtitle="Join CHOIR MKC and connect with your choir."
        >
            {alert && (
                <div className="mb-6">
                    <Alert variant={alert.variant} title={alert.message} />
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                        label="First Name"
                        required
                        autoComplete="given-name"
                        placeholder="Jane"
                        value={form.first_name}
                        onChange={update('first_name')}
                        error={errors.first_name?.[0]}
                        trailing={
                            <span className="text-ink-400">
                                <User size={18} />
                            </span>
                        }
                    />
                    <Input
                        label="Last Name"
                        required
                        autoComplete="family-name"
                        placeholder="Doe"
                        value={form.last_name}
                        onChange={update('last_name')}
                        error={errors.last_name?.[0]}
                    />
                </div>

                <Input
                    label="Email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={update('email')}
                    error={errors.email?.[0]}
                    trailing={
                        <span className="text-ink-400">
                            <Mail size={18} />
                        </span>
                    }
                />

                <Input
                    label="Phone (optional)"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+1 555 000 0000"
                    value={form.phone}
                    onChange={update('phone')}
                    error={errors.phone?.[0]}
                    trailing={
                        <span className="text-ink-400">
                            <Phone size={18} />
                        </span>
                    }
                />

                <PasswordInput
                    label="Password"
                    required
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={form.password}
                    onChange={update('password')}
                    error={errors.password?.[0]}
                    hint="Use at least 8 characters."
                />

                <PasswordInput
                    label="Confirm Password"
                    required
                    autoComplete="new-password"
                    placeholder="Re-enter password"
                    value={form.password_confirmation}
                    onChange={update('password_confirmation')}
                    error={errors.password_confirmation?.[0]}
                />

                <label className="flex items-start gap-2.5 text-sm text-ink-600">
                    <input
                        type="checkbox"
                        checked={form.terms}
                        onChange={update('terms')}
                        className="mt-0.5 h-4 w-4 rounded border-ink-300 text-navy-900 focus:ring-navy-300"
                    />
                    <span>
                        I agree to the{' '}
                        <a href="#" className="font-medium text-navy-700 hover:text-navy-900">
                            Terms
                        </a>{' '}
                        and{' '}
                        <a href="#" className="font-medium text-navy-700 hover:text-navy-900">
                            Privacy Policy
                        </a>
                        .
                    </span>
                </label>
                {errors.terms && (
                    <p role="alert" className="text-sm text-red-600">
                        {errors.terms[0]}
                    </p>
                )}

                <Button type="submit" size="lg" loading={submitting} className="w-full">
                    Create Account
                    {!submitting && <ArrowRight size={18} />}
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-500">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-navy-700 hover:text-navy-900">
                    Sign In
                </Link>
            </p>
        </AuthLayout>
    );
}
