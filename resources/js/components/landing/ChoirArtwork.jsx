import { useMemo } from 'react';

/**
 * ChoirArtwork — elegant, self-contained SVG illustration of a choir singing.
 *
 * Used as a stand-in for real choir photography. Each `variant` + `seed`
 * produces a distinct, deterministic composition so the carousel / gallery
 * feel like different "photos". Swap with real <img> sources from the API
 * (choir.image, gallery.image) when photography is available.
 */

function makeRng(seed) {
    let s = (seed || 1) * 9301 + 49297;
    return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
}

const VARIANTS = {
    stage: { count: 8, rows: 2, bg: ['#1e3a8a', '#172554'], glow: '#3b82f6' },
    rows: { count: 13, rows: 3, bg: ['#2563eb', '#1e3a8a'], glow: '#60a5fa' },
    glow: { count: 9, rows: 2, bg: ['#1d4ed8', '#172554'], glow: '#93c5fd' },
};

function Singer({ x, y, scale, shade }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${scale})`} opacity="0.92">
            {/* shoulders / body */}
            <path
                d="M -42 70 C -42 28 -26 14 0 14 C 26 14 42 28 42 70 L 42 120 L -42 120 Z"
                fill={shade}
            />
            {/* head */}
            <circle cx="0" cy="-12" r="20" fill={shade} />
            {/* soft rim light */}
            <path
                d="M -42 70 C -42 28 -26 14 0 14 C 26 14 42 28 42 70"
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="2"
            />
        </g>
    );
}

export default function ChoirArtwork({ variant = 'stage', seed = 1, className = '', label }) {
    const model = VARIANTS[variant] ?? VARIANTS.stage;
    const { singers, notes } = useMemo(() => {
        const rng = makeRng(seed);
        const W = 1200;
        const H = 800;
        const baseShade = '#0b1f3a';
        const singers = [];
        const perRow = Math.ceil(model.count / model.rows);
        for (let r = 0; r < model.rows; r++) {
            const rowY = H - 150 - r * 150;
            const rowScale = 1.05 - r * 0.12;
            const offset = (perRow - Math.ceil(model.count / model.rows)) * 0 + rng() * 30;
            for (let i = 0; i < perRow && singers.length < model.count; i++) {
                const x = (W / (perRow + 1)) * (i + 1) + (rng() - 0.5) * 40 + offset;
                const shade = r === 0 ? '#0b1f3a' : '#102a4c';
                singers.push({ x, y: rowY, scale: rowScale * (0.9 + rng() * 0.2), shade });
            }
        }
        const notes = Array.from({ length: 6 }, () => ({
            x: 80 + rng() * (W - 160),
            y: 80 + rng() * (H * 0.45),
            size: 18 + rng() * 26,
            opacity: 0.1 + rng() * 0.15,
        }));
        return { singers, notes };
    }, [seed, model.count, model.rows]);

    const gid = `g-${variant}-${seed}`;

    return (
        <svg
            viewBox="0 0 1200 800"
            preserveAspectRatio="xMidYMid slice"
            className={className}
            role="img"
            aria-label={label ?? 'Illustration of a choir singing together'}
            aria-hidden={label ? undefined : true}
        >
            <defs>
                <linearGradient id={`${gid}-bg`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={model.bg[0]} />
                    <stop offset="100%" stopColor={model.bg[1]} />
                </linearGradient>
                <radialGradient id={`${gid}-light`} cx="50%" cy="22%" r="60%">
                    <stop offset="0%" stopColor={model.glow} stopOpacity="0.55" />
                    <stop offset="60%" stopColor={model.glow} stopOpacity="0.08" />
                    <stop offset="100%" stopColor={model.glow} stopOpacity="0" />
                </radialGradient>
            </defs>

            <rect width="1200" height="800" fill={`url(#${gid}-bg)`} />
            <rect width="1200" height="800" fill={`url(#${gid}-light)`} />

            {notes.map((n, i) => (
                <text
                    key={i}
                    x={n.x}
                    y={n.y}
                    fontSize={n.size}
                    fill="#ffffff"
                    opacity={n.opacity}
                    fontFamily="serif"
                >
                    ♪
                </text>
            ))}

            {singers.map((s, i) => (
                <Singer key={i} x={s.x} y={s.y} scale={s.scale} shade={s.shade} />
            ))}
        </svg>
    );
}
