import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

const VARIANTS = {
    error: { icon: AlertCircle, class: 'border-red-200 bg-red-50 text-red-700' },
    success: { icon: CheckCircle2, class: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    info: { icon: Info, class: 'border-navy-200 bg-navy-50 text-navy-800' },
    warning: { icon: AlertTriangle, class: 'border-gold-200 bg-gold-50 text-gold-800' },
};

export default function Alert({ variant = 'info', title, children, className = '' }) {
    const { icon: Icon, class: variantClass } = VARIANTS[variant] ?? VARIANTS.info;

    return (
        <div
            role="alert"
            className={`flex gap-3 rounded-xl border p-4 text-sm ${variantClass} ${className}`}
        >
            <Icon size={20} className="mt-0.5 shrink-0" />
            <div>
                {title && <p className="font-semibold">{title}</p>}
                {children && <div className="mt-0.5">{children}</div>}
            </div>
        </div>
    );
}
