import { Link } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

const VARIANTS = {
    primary:
        'bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600 shadow-sm',
    gold: 'bg-blue-100 text-blue-700 hover:bg-blue-200 focus-visible:outline-blue-300 shadow-sm',
    outline:
        'border border-blue-200 bg-canvas text-blue-800 hover:bg-blue-50 focus-visible:outline-blue-300',
    ghost: 'text-blue-700 hover:bg-blue-50 focus-visible:outline-blue-300',
    danger: 'bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600 shadow-sm',
};

const SIZES = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
};

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    to,
    href,
    type = 'button',
    className = '',
    ...props
}) {
    const classes = `inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

    const content = (
        <>
            {loading && <LoadingSpinner size={16} className="text-current" />}
            {children}
        </>
    );

    if (to) {
        return (
            <Link to={to} className={classes} {...props}>
                {content}
            </Link>
        );
    }

    if (href) {
        return (
            <a href={href} className={classes} {...props}>
                {content}
            </a>
        );
    }

    return (
        <button type={type} disabled={disabled || loading} className={classes} {...props}>
            {content}
        </button>
    );
}
