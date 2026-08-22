import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Accessible Modal / Drawer.
 * - Esc to close
 * - click backdrop to close
 * - focus trap + initial focus
 * - body scroll lock
 * - respects reduced motion (CSS)
 * - on mobile becomes full-screen drawer via `full` size
 */
export default function Modal({ open, onClose, title, children, size = 'lg', labelledBy }) {
    const [mounted, setMounted] = useState(open);
    const [closing, setClosing] = useState(false);
    const panelRef = useRef(null);
    const previousFocus = useRef(null);

    // Manage mount + exit animation when `open` changes.
    useEffect(() => {
        if (open) {
            previousFocus.current = document.activeElement;
            setClosing(false);
            setMounted(true);
            return undefined;
        }
        if (!mounted) return undefined;
        setClosing(true);
        const t = setTimeout(() => {
            setMounted(false);
            setClosing(false);
            onClose?.();
        }, 220);
        return () => clearTimeout(t);
    }, [open, mounted, onClose]);

    // Scroll lock + focus management while mounted.
    useEffect(() => {
        if (!mounted) return undefined;
        document.body.style.overflow = 'hidden';
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.();
            if (e.key === 'Tab') {
                const f = panelRef.current?.querySelectorAll(
                    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
                );
                if (!f || f.length === 0) return;
                const first = f[0];
                const last = f[f.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener('keydown', onKey);
        const t = setTimeout(() => panelRef.current?.focus(), 50);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
            clearTimeout(t);
            if (previousFocus.current && document.activeElement !== previousFocus.current) {
                previousFocus.current.focus?.();
            }
        };
    }, [mounted, onClose]);

    if (!mounted) return null;

    const sizeClass =
        size === 'full'
            ? 'w-full max-w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[90vh] sm:rounded-2xl'
            : size === 'md'
              ? 'w-full max-w-md rounded-2xl'
              : 'w-full max-w-2xl rounded-2xl';

    return createPortal(
        <div
            className={`modal-backdrop fixed inset-0 z-[100] flex items-end justify-center bg-blue-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6 ${
                closing ? 'opacity-0 transition-opacity duration-200' : ''
            }`}
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose?.();
            }}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
                tabIndex={-1}
                className={`modal-panel relative flex max-h-full flex-col overflow-hidden bg-white shadow-2xl ${sizeClass} ${
                    closing ? 'opacity-0 translate-y-3 transition-all duration-200' : ''
                }`}
            >
                <div className="flex items-start justify-between gap-4 border-b border-blue-100 px-6 py-5">
                    <div id={labelledBy} className="text-lg font-semibold text-blue-900">
                        {title}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-lg p-1.5 text-blue-500 transition-colors hover:bg-blue-50 hover:text-blue-800"
                    >
                        <X size={22} />
                    </button>
                </div>
                <div className="lyric-scroll flex-1 overflow-y-auto px-6 py-6">{children}</div>
            </div>
        </div>,
        document.body,
    );
}
