import React, { useMemo } from 'react';

/**
 * MoonPhase3D – Astronomically accurate 3D SVG moon phase renderer.
 *
 * Uses the true Moon-Sun elongation angle from the ephem backend:
 *   elongation   0°  = New Moon  (dark)
 *   elongation  90°  = First Quarter (right half lit)
 *   elongation 180°  = Full Moon  (fully lit)
 *   elongation 270°  = Last Quarter (left half lit)
 *
 * Shadow path algorithm:
 *   The illuminated fraction f = (1 - cos(elongation)) / 2
 *   The terminator is an ellipse whose x-radius = R * |cos(elongation)|
 *   Waxing  (0-180°): lit side is on the right  → shadow covers left
 *   Waning (180-360°): lit side is on the left  → shadow covers right
 *
 * Props:
 *   illumination  – 0-100 percent (used for the bar only; rendering uses elongation)
 *   elongation    – 0-360 degrees of moon-sun angle (primary driver)
 *   phaseEn       – English phase name string
 *   size          – diameter in CSS px (default 130)
 */
const MoonPhase3D = ({ illumination = 50, elongation = 90, phaseEn = '', size = 130 }) => {
    const R = size / 2;       // SVG radius
    const cx = R;             // Centre X
    const cy = R;             // Centre Y
    const vb = size;

    // ── Derived geometry from elongation ─────────────────────────────────────
    const elongRad  = (elongation * Math.PI) / 180;

    // Is the moon waxing (lit on right) or waning (lit on left)?
    const isWaning = elongation > 180;

    // Terminator ellipse half-width: 0 at new/full (line), R at quarter (semicircle)
    // cos(0°)=1 → terminator at edge (new moon, nearly invisible sliver)
    // cos(90°)=0 → terminator is a straight line through centre (quarter)
    // cos(180°)=-1 → terminator at other edge (full moon)
    const cosElong = Math.cos(elongRad);
    // ex = half-width of the elliptical terminator
    const ex = Math.abs(cosElong) * R;

    // ── SVG shadow path: covers the dark side of the sphere ──────────────────
    //
    // The shadow is drawn as a compound arc:
    //   Arc 1: outer limb of the moon (the dark side's boundary)  — always radius R
    //   Arc 2: the terminator ellipse — radius ex × R
    //
    // Path goes: top-of-moon → dark-side limb → bottom-of-moon → terminator → back to top

    const shadowPath = useMemo(() => {
        // Special cases
        if (elongation <= 1 || elongation >= 359) {
            // New Moon: full shadow circle
            return `M ${cx} ${cy - R} A ${R} ${R} 0 1 0 ${cx} ${cy + R} A ${R} ${R} 0 1 0 ${cx} ${cy - R} Z`;
        }
        if (elongation >= 179 && elongation <= 181) {
            // Full Moon: no shadow
            return '';
        }

        // Waxing (0°-180°): lit on right, shadow on left
        // Waning (180°-360°): lit on left, shadow on right
        if (!isWaning) {
            // Shadow is on the left half
            // - Outer limb arc: left half of circle (counter-clockwise from top to bottom)
            // - Terminator: ellipse from bottom back to top
            //   For crescent (elong < 90°): terminator bows LEFT  → sweep=0 (CCW)
            //   For gibbous  (elong > 90°): terminator bows RIGHT → sweep=1 (CW)
            const terminatorSweep = cosElong < 0 ? 1 : 0;  // cos<0 means elong>90° (gibbous)
            return [
                `M ${cx} ${cy - R}`,
                `A ${R} ${R} 0 0 0 ${cx} ${cy + R}`,                          // left limb (CCW)
                `A ${ex.toFixed(3)} ${R} 0 0 ${terminatorSweep} ${cx} ${cy - R}`, // terminator
                'Z'
            ].join(' ');
        } else {
            // Shadow is on the right half
            // - Outer limb arc: right half of circle (clockwise from top to bottom)
            // - Terminator bows:
            //   elong 180°-270° (waning gibbous): terminatorSweep=0 (CCW = bows left into lit side)
            //   elong 270°-360° (waning crescent): terminatorSweep=1 (CW)
            const terminatorSweep = cosElong > 0 ? 0 : 1;  // cos>0 means elong>270° (crescent)
            return [
                `M ${cx} ${cy - R}`,
                `A ${R} ${R} 0 0 1 ${cx} ${cy + R}`,                           // right limb (CW)
                `A ${ex.toFixed(3)} ${R} 0 0 ${terminatorSweep} ${cx} ${cy - R}`, // terminator
                'Z'
            ].join(' ');
        }
    }, [elongation, isWaning, cosElong, ex, R, cx, cy]);

    // ── Realistic craters with fixed organic positions ────────────────────────
    const craters = [
        { cx: cx - R * 0.28, cy: cy - R * 0.22, r: R * 0.10 },
        { cx: cx + R * 0.25, cy: cy + R * 0.18, r: R * 0.13 },
        { cx: cx - R * 0.12, cy: cy + R * 0.35, r: R * 0.08 },
        { cx: cx + R * 0.10, cy: cy - R * 0.38, r: R * 0.07 },
        { cx: cx + R * 0.35, cy: cy - R * 0.12, r: R * 0.09 },
        { cx: cx - R * 0.38, cy: cy + R * 0.08, r: R * 0.06 },
        { cx: cx + R * 0.05, cy: cy + R * 0.12, r: R * 0.05 },
        { cx: cx - R * 0.20, cy: cy + R * 0.42, r: R * 0.07 },
    ];

    const uid = `moon3d-${size}`;

    // ── Float speed tied to phase (fuller = slower) ───────────────────────────
    const floatDuration = 3.5 + (illumination / 100) * 2;

    return (
        <div className="relative select-none" style={{ width: size, height: size }}>
            <style>{`
                @keyframes mf3d-float-${size} {
                    0%, 100% { transform: translateY(0px) rotate(-0.8deg); }
                    50%       { transform: translateY(-${Math.round(size * 0.04)}px) rotate(0.8deg); }
                }
                @keyframes mf3d-glow-${size} {
                    0%, 100% { opacity: 0.40; transform: scale(1); }
                    50%       { opacity: 0.72; transform: scale(1.10); }
                }
                @keyframes mf3d-shimmer-${size} {
                    0%, 100% { opacity: 0.15; }
                    50%       { opacity: 0.40; }
                }
                .mf3d-float-${size} { animation: mf3d-float-${size} ${floatDuration}s ease-in-out infinite; transform-origin: center; }
                .mf3d-glow-${size}  { animation: mf3d-glow-${size}  4.5s ease-in-out infinite; transform-origin: center; }
                .mf3d-shimmer-${size} { animation: mf3d-shimmer-${size} 3s ease-in-out infinite; }
            `}</style>

            {/* Ambient glow halo */}
            <div
                className={`absolute inset-0 rounded-full mf3d-glow-${size}`}
                style={{
                    background: 'radial-gradient(circle, rgba(147,197,253,0.28) 0%, rgba(99,102,241,0.14) 50%, transparent 78%)',
                    transform: 'scale(1.38)',
                    filter: `blur(${Math.round(size * 0.12)}px)`,
                    pointerEvents: 'none',
                }}
            />

            <svg
                className={`mf3d-float-${size} relative z-10`}
                viewBox={`0 0 ${vb} ${vb}`}
                width={size}
                height={size}
                style={{ overflow: 'visible' }}
            >
                <defs>
                    {/* 3D sphere base — lit from upper-left */}
                    <radialGradient id={`${uid}-sphere`} cx="33%" cy="28%" r="68%">
                        <stop offset="0%"    stopColor="#f8fafc" />
                        <stop offset="18%"   stopColor="#e2e8f0" />
                        <stop offset="52%"   stopColor="#94a3b8" />
                        <stop offset="82%"   stopColor="#475569" />
                        <stop offset="100%"  stopColor="#1e293b" />
                    </radialGradient>

                    {/* Dark shadow fill */}
                    <radialGradient id={`${uid}-dark`} cx="50%" cy="50%" r="60%">
                        <stop offset="0%"   stopColor="#030914" stopOpacity="0.78" />
                        <stop offset="100%" stopColor="#050d1e" stopOpacity="0.92" />
                    </radialGradient>

                    {/* Clip to sphere boundary */}
                    <clipPath id={`${uid}-clip`}>
                        <circle cx={cx} cy={cy} r={R - 0.5} />
                    </clipPath>
                </defs>

                {/* Drop shadow */}
                <ellipse
                    cx={cx + R * 0.07}
                    cy={cy + R * 1.06}
                    rx={R * 0.62}
                    ry={R * 0.11}
                    fill="rgba(0,0,0,0.38)"
                    style={{ filter: `blur(${Math.round(size * 0.07)}px)` }}
                />

                {/* ── BASE SPHERE ── */}
                <circle cx={cx} cy={cy} r={R - 0.5} fill={`url(#${uid}-sphere)`} />

                {/* ── ALL SURFACE DETAILS (clipped to sphere) ── */}
                <g clipPath={`url(#${uid}-clip)`}>

                    {/* Craters */}
                    {craters.map((c, i) => (
                        <g key={i}>
                            {/* Rim highlight */}
                            <circle
                                cx={c.cx - c.r * 0.15}
                                cy={c.cy - c.r * 0.15}
                                r={c.r}
                                fill="none"
                                stroke="rgba(255,255,255,0.16)"
                                strokeWidth={c.r * 0.28}
                            />
                            {/* Bowl shadow */}
                            <circle
                                cx={c.cx + c.r * 0.05}
                                cy={c.cy + c.r * 0.05}
                                r={c.r * 0.72}
                                fill="rgba(15,23,42,0.45)"
                            />
                        </g>
                    ))}

                    {/* ── SHADOW CAP (dark side) ── */}
                    {shadowPath && (
                        <path
                            d={shadowPath}
                            fill={`url(#${uid}-dark)`}
                        />
                    )}

                    {/* ── TERMINATOR GLOW (blue edge where day meets night) ── */}
                    {shadowPath && elongation > 2 && elongation < 358 && (
                        <path
                            d={shadowPath}
                            fill="none"
                            stroke="rgba(147,197,253,0.38)"
                            strokeWidth={R * 0.055}
                            className={`mf3d-shimmer-${size}`}
                        />
                    )}

                    {/* ── SPECULAR HIGHLIGHTS (upper-left reflection) ── */}
                    <ellipse
                        cx={cx - R * 0.27}
                        cy={cy - R * 0.30}
                        rx={R * 0.20}
                        ry={R * 0.09}
                        fill="rgba(255,255,255,0.42)"
                        transform={`rotate(-30, ${cx - R * 0.27}, ${cy - R * 0.30})`}
                    />
                    <ellipse
                        cx={cx - R * 0.14}
                        cy={cy - R * 0.19}
                        rx={R * 0.055}
                        ry={R * 0.026}
                        fill="rgba(255,255,255,0.58)"
                        transform={`rotate(-22, ${cx - R * 0.14}, ${cy - R * 0.19})`}
                    />

                    {/* ── LIMB DARKENING ring (edges of sphere look dimmer) ── */}
                    <circle
                        cx={cx}
                        cy={cy}
                        r={R - 0.5}
                        fill="none"
                        stroke="rgba(0,0,0,0.22)"
                        strokeWidth={R * 0.14}
                    />
                </g>

                {/* Outer corona ring */}
                <circle
                    cx={cx}
                    cy={cy}
                    r={R + 2}
                    fill="none"
                    stroke="rgba(147,197,253,0.13)"
                    strokeWidth={2}
                />
            </svg>
        </div>
    );
};

export default MoonPhase3D;
