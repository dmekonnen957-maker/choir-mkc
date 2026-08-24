import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, Music, ArrowLeft, Clock } from 'lucide-react';
import Button from '../components/ui/Button';

export default function RegistrationPendingPage() {
    const location = useLocation();
    const email = location.state?.email;
    const name = location.state?.name;

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

            {/* Subtle blue/dark overlay */}
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
                <div className="glass-panel w-full max-w-md p-8 sm:p-10 text-center">
                    {/* Icon */}
                    <div className="mb-6 flex justify-center">
                        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-500/20 text-blue-300 ring-1 ring-white/30 backdrop-blur-md">
                            <CheckCircle2 size={44} className="text-emerald-400" />
                        </div>
                    </div>

                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300 ring-1 ring-amber-400/30">
                        <Clock size={13} />
                        Pending Approval
                    </div>

                    <h1 className="mt-3 text-2xl font-bold text-white">
                        Registration Submitted
                    </h1>

                    {name && (
                        <p className="mt-1 font-medium text-blue-200">
                            Thank you, {name}!
                        </p>
                    )}

                    <div className="my-6 space-y-3 rounded-2xl border border-white/15 bg-white/10 p-5 text-sm text-white/85 text-left">
                        <p>
                            Your account is currently waiting for administrator approval.
                        </p>
                        <p className="text-white/70 text-xs leading-relaxed">
                            An administrator will review your registration and choir assignment. Once approved, you will be able to sign in with <span className="font-semibold text-white">{email || 'your email'}</span>.
                        </p>
                    </div>

                    <Link to="/login" className="block w-full">
                        <Button size="lg" className="w-full">
                            <ArrowLeft size={18} />
                            Back to Login
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
