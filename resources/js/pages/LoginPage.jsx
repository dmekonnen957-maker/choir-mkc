import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout';
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
            const destination = user?.roles?.includes('super-admin') ? '/app' : '/app';
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
        <AuthLayout
            title="Welcome Back"
            subtitle="Sign in to continue to your choir workspace."
        >
            {alert && (
                <div className="mb-6">
                    <Alert variant={alert.variant} title={alert.message} />
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <Input
                    label="Email"
                    type="email"
                    autoComplete="email"
                    required
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

                <PasswordInput
                    label="Password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={form.password}
                    onChange={update('password')}
                    error={errors.password?.[0]}
                />

                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-ink-600">
                        <input
                            type="checkbox"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                            className="h-4 w-4 rounded border-ink-300 text-navy-900 focus:ring-navy-300"
                        />
                        Remember me
                    </label>
                    <a href="#" className="font-medium text-navy-700 hover:text-navy-900">
                        Forgot password?
                    </a>
                </div>

                <Button type="submit" size="lg" loading={submitting} className="w-full">
                    Sign In
                    {!submitting && <ArrowRight size={18} />}
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-500">
                Don&apos;t have an account?{' '}
                <Link
                    to="/register"
                    className="font-medium text-navy-700 hover:text-navy-900"
                >
                    Create an account
                </Link>
            </p>
        </AuthLayout>
    );
}
