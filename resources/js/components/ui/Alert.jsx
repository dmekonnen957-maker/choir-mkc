import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

const VARIANTS = {
    error: { icon: AlertCircle, class: 'border-red-200 bg-red-50 text-red-700' },
    success: { icon: CheckCircle2, class: 'border-blue-200 bg-blue-50 text-blue-700' },
    info: { icon: Info, class: 'border-blue-200 bg-blue-50 text-blue-700' },
    warning: { icon: AlertTriangle, class: 'border-blue-200 bg-blue-50 text-blue-700' },
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
