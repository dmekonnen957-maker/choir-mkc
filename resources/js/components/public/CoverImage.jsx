import { imageUrl } from '../../lib/publicApi';

function initials(label = '') {
    const parts = label.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '♪';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const GRADIENTS = [
    'from-blue-600 to-indigo-600',
    'from-sky-500 to-blue-600',
    'from-indigo-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-violet-500 to-blue-600',
];

function gradientFor(label = '') {
    let sum = 0;
    for (let i = 0; i < label.length; i += 1) sum += label.charCodeAt(i);
    return GRADIENTS[sum % GRADIENTS.length];
}

export default function CoverImage({ src, alt = '', label = '', className = '' }) {
    const url = imageUrl(src);
    if (url) {
        return (
            <img
                src={url}
                alt={alt || label}
                loading="lazy"
                className={`h-full w-full object-cover ${className}`}
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.parentElement) {
                        e.currentTarget.parentElement.classList.add(
                            'flex',
                            'items-center',
                            'justify-center',
                            'bg-gradient-to-br',
                            gradientFor(label),
                        );
                        e.currentTarget.parentElement.textContent = initials(label);
                    }
                }}
            />
        );
    }
    return (
        <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientFor(
                label,
            )} text-3xl font-semibold text-white/90 ${className}`}
            aria-hidden="true"
        >
            {initials(label)}
        </div>
    );
}
