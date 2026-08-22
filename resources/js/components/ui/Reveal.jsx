import { useEffect, useRef, useState } from 'react';

/**
 * Reveal — scroll-triggered entrance animation.
 * Respects prefers-reduced-motion (handled in CSS).
 */
export default function Reveal({
    children,
    direction = 'up',
    delay = 0,
    as: Tag = 'div',
    className = '',
    once = true,
}) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (typeof IntersectionObserver === 'undefined') {
            setVisible(true);
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setVisible(true);
                        if (once) observer.unobserve(entry.target);
                    } else if (!once) {
                        setVisible(false);
                    }
                });
            },
            { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [once]);

    const dirClass =
        direction === 'left'
            ? 'reveal-left'
            : direction === 'right'
              ? 'reveal-right'
              : direction === 'scale'
                ? 'reveal-scale'
                : '';

    return (
        <Tag
            ref={ref}
            className={`reveal ${dirClass} ${visible ? 'is-visible' : ''} ${className}`}
            style={delay ? { transitionDelay: `${delay}ms` } : undefined}
        >
            {children}
        </Tag>
    );
}
