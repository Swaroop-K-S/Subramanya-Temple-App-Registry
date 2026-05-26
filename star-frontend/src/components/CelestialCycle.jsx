import React, { useState, useEffect, useMemo } from 'react';
import { Sun, Moon, Sunrise, Sunset, Stars } from 'lucide-react';
import { useTempleTime } from '../context/TimeContext';

const CelestialCycle = ({ sunrise, sunset, dateDisplay }) => {
    const { currentTime } = useTempleTime();
    const [percentage, setPercentage] = useState(0);
    const [isNight, setIsNight] = useState(false);

    // Helper: Parse "hh:mm AM/PM" to minutes from midnight
    const parseTimeToMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const [timePart, modifier] = timeStr.split(' ');
        let [hours, minutes] = timePart.split(':');
        hours = parseInt(hours, 10);
        minutes = parseInt(minutes, 10);

        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;

        return hours * 60 + minutes;
    };

    // Calculate real-time position
    useEffect(() => {
        const calculatePosition = () => {
            const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
            const startMinutes = parseTimeToMinutes(sunrise);
            const endMinutes = parseTimeToMinutes(sunset);

            if (startMinutes === 0 || endMinutes === 0) return;

            let percent = 0;
            let nightMode = false;

            // DAY MODE
            if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
                nightMode = false;
                const totalDay = endMinutes - startMinutes;
                const elapsed = currentMinutes - startMinutes;
                percent = elapsed / totalDay;
            }
            // NIGHT MODE
            else {
                nightMode = true;
                const minutesInDay = 24 * 60;
                const totalNight = (minutesInDay - endMinutes) + startMinutes;

                let elapsed = 0;
                if (currentMinutes > endMinutes) {
                    elapsed = currentMinutes - endMinutes;
                } else {
                    elapsed = (minutesInDay - endMinutes) + currentMinutes;
                }

                percent = elapsed / totalNight;
            }

            if (percent < 0) percent = 0;
            if (percent > 1) percent = 1;

            setPercentage(percent);
            setIsNight(nightMode);
        };

        calculatePosition();
    }, [currentTime, sunrise, sunset]);

    // Smooth sweep rise animation on mount or percentage change
    const [animatedPercentage, setAnimatedPercentage] = useState(0);
    useEffect(() => {
        let start = null;
        const duration = 2000; // 2s smooth sweep

        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const elapsed = timestamp - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // Expo ease out for a very premium landing
            const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setAnimatedPercentage(easeOutExpo * percentage);

            if (elapsed < duration) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [percentage]);

    // Background Sky Color Interpolation based on time
    // We want Dawn/Dusk colors at the edges (0 and 1), and Noon/Midnight colors in the middle (0.5)
    const getSkyGradient = () => {
        const p = animatedPercentage;
        // Distance from center (0 = noon/midnight, 1 = sunrise/sunset)
        const distFromCenter = Math.abs(p - 0.5) * 2; 

        if (isNight) {
            // NIGHT: From Dusk (purples) to Midnight (deep blue/black) to Dawn (purples)
            return `linear-gradient(135deg, 
                color-mix(in srgb, #0f172a ${100 - distFromCenter * 50}%, #2e1065),
                color-mix(in srgb, #020617 ${100 - distFromCenter * 30}%, #1e1b4b)
            )`;
        } else {
            // DAY: From Sunrise/Sunset (oranges/pinks) to Noon (bright sky blue)
            return `linear-gradient(135deg, 
                color-mix(in srgb, #38bdf8 ${100 - distFromCenter * 90}%, #fb923c),
                color-mix(in srgb, #0ea5e9 ${100 - distFromCenter * 80}%, #f43f5e)
            )`;
        }
    };

    // Generate randomized background stars
    const stars = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 40; i++) {
            temp.push({
                id: i,
                top: `${Math.random() * 85 + 5}%`,
                left: `${Math.random() * 95 + 2}%`,
                size: Math.random() * 2 + 0.5,
                delay: `${Math.random() * 5}s`,
                duration: `${Math.random() * 3 + 2}s`
            });
        }
        return temp;
    }, []);

    // Generate solar sparkles and light rays (daytime)
    const lightRays = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 6; i++) {
            temp.push({
                id: i,
                rotation: Math.random() * 180 - 90,
                opacity: Math.random() * 0.15 + 0.05,
                width: Math.random() * 100 + 50,
            });
        }
        return temp;
    }, []);

    // Visual Theme Configurations
    const theme = isNight ? {
        textColor: "text-slate-100",
        subTextColor: "text-indigo-300",
        planetGradient: "url(#moonCore)",
        glowColor: "rgba(165, 180, 252, 0.5)",
        trailBase: "rgba(255,255,255,0.05)",
        trailActive: "url(#moonTrail)",
        startLabel: "Sunset",
        endLabel: "Dawn",
        iconStart: <Sunset className="w-5 h-5" />,
        iconEnd: <Sunrise className="w-5 h-5" />,
        accentColor: "bg-indigo-500",
        panelBg: "bg-[#090b14]/40"
    } : {
        textColor: "text-white",
        subTextColor: "text-orange-100",
        planetGradient: "url(#sunCore)",
        glowColor: "rgba(251, 146, 60, 0.8)",
        trailBase: "rgba(255,255,255,0.15)",
        trailActive: "url(#sunTrail)",
        startLabel: "Sunrise",
        endLabel: "Sunset",
        iconStart: <Sunrise className="w-5 h-5" />,
        iconEnd: <Sunset className="w-5 h-5" />,
        accentColor: "bg-amber-400",
        panelBg: "bg-white/10"
    };

    // Orbit Path Calculation
    const width = 600;
    const height = 300;
    const radius = 220;
    const cx = width / 2;
    const cy = 250;

    // Angle of planet along the semi-circle
    const angleRad = Math.PI * (1 - animatedPercentage);
    const celestialX = cx + radius * Math.cos(angleRad);
    const celestialY = cy - radius * Math.sin(angleRad);

    // Calculate strokeDasharray for the glowing trail
    const arcLength = Math.PI * radius; 
    const trailOffset = arcLength * (1 - animatedPercentage);

    return (
        <div 
            className="relative overflow-hidden rounded-[2.5rem] border border-white/10 transition-all duration-1000 ease-in-out select-none"
            style={{
                background: getSkyGradient(),
                boxShadow: isNight 
                    ? '0 25px 50px -12px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.1)' 
                    : '0 25px 50px -12px rgba(2,132,199,0.3), inset 0 1px 1px rgba(255,255,255,0.4)'
            }}
        >
            {/* Embedded animations */}
            <style>{`
                @keyframes twinkle-star {
                    0%, 100% { opacity: 0.2; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); filter: drop-shadow(0 0 4px rgba(255,255,255,0.8)); }
                }
                @keyframes float-ray {
                    0%, 100% { transform: translateY(0) rotate(var(--rot)); opacity: var(--op); }
                    50% { transform: translateY(-10px) rotate(var(--rot)); opacity: calc(var(--op) * 1.5); }
                }
                @keyframes rotate-corona {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse-glow {
                    0%, 100% { transform: scale(1); opacity: 0.6; }
                    50% { transform: scale(1.15); opacity: 0.9; }
                }
                .star-anim { animation: twinkle-star var(--dur) ease-in-out infinite; }
                .ray-anim { animation: float-ray 8s ease-in-out infinite; }
                .corona-spin { animation: rotate-corona 40s linear infinite; }
                .glow-pulse { animation: pulse-glow 4s ease-in-out infinite; }
            `}</style>

            {/* BACK LAYER: Atmospheric effects */}
            <div className="absolute inset-0 pointer-events-none">
                {isNight ? (
                    // Night Sky: Stars & Milky Way glow
                    <>
                        {stars.map(star => (
                            <div
                                key={star.id}
                                className="absolute bg-white rounded-full star-anim"
                                style={{
                                    top: star.top, left: star.left,
                                    width: `${star.size}px`, height: `${star.size}px`,
                                    '--dur': star.duration, animationDelay: star.delay
                                }}
                            />
                        ))}
                        {/* Midnight Horizon Glow */}
                        <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-indigo-900/40 to-transparent" />
                    </>
                ) : (
                    // Day Sky: Light Rays & Sun glare
                    <>
                        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[150%] h-[150%] flex items-center justify-center opacity-40 mix-blend-overlay">
                            {lightRays.map(ray => (
                                <div
                                    key={ray.id}
                                    className="absolute h-[200%] origin-center bg-gradient-to-b from-transparent via-white to-transparent ray-anim"
                                    style={{
                                        width: `${ray.width}px`,
                                        '--rot': `${ray.rotation}deg`,
                                        '--op': ray.opacity,
                                        animationDelay: `${ray.id * 0.5}s`
                                    }}
                                />
                            ))}
                        </div>
                        {/* Horizon Haze */}
                        <div className="absolute bottom-0 w-full h-40 bg-gradient-to-t from-white/30 to-transparent backdrop-blur-[2px]" />
                    </>
                )}
            </div>

            {/* CORE CONTENT */}
            <div className="relative z-10 p-8 flex flex-col items-center justify-between min-h-[380px]">
                
                {/* SVG ORBIT LAYER (Positioned absolutely behind the top content) */}
                <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[110%] max-w-[800px] pointer-events-none">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                        <defs>
                            {/* Sun Gradients */}
                            <radialGradient id="sunCore" cx="40%" cy="40%" r="60%">
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="30%" stopColor="#fef08a" />
                                <stop offset="70%" stopColor="#f97316" />
                                <stop offset="100%" stopColor="#ea580c" />
                            </radialGradient>
                            
                            {/* Moon Gradients */}
                            <radialGradient id="moonCore" cx="30%" cy="30%" r="70%">
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="40%" stopColor="#e2e8f0" />
                                <stop offset="80%" stopColor="#94a3b8" />
                                <stop offset="100%" stopColor="#475569" />
                            </radialGradient>

                            {/* Trails */}
                            <linearGradient id="sunTrail" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0" />
                                <stop offset="40%" stopColor="#f97316" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#fde047" stopOpacity="1" />
                            </linearGradient>
                            <linearGradient id="moonTrail" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#312e81" stopOpacity="0" />
                                <stop offset="40%" stopColor="#6366f1" stopOpacity="0.6" />
                                <stop offset="100%" stopColor="#e0e7ff" stopOpacity="1" />
                            </linearGradient>
                            
                            {/* Filters */}
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="8" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>

                        {/* Base Dotted Orbit Path */}
                        <path
                            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                            fill="none"
                            stroke={theme.trailBase}
                            strokeWidth="2"
                            strokeDasharray="6 6"
                        />

                        {/* Active Progress Trail */}
                        <path
                            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                            fill="none"
                            stroke={theme.trailActive}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={arcLength}
                            strokeDashoffset={trailOffset}
                            filter="url(#glow)"
                            className="transition-all duration-300"
                        />

                        {/* Horizon Line */}
                        <line 
                            x1="10" y1={cy} x2={width - 10} y2={cy} 
                            stroke={theme.trailBase} 
                            strokeWidth="1" 
                        />

                        {/* Celestial Body Group */}
                        <g transform={`translate(${celestialX}, ${celestialY})`}>
                            {/* Outer Glow Pulse */}
                            <circle 
                                r="45" 
                                fill={theme.glowColor} 
                                className="glow-pulse blur-md mix-blend-screen"
                            />
                            
                            {isNight ? (
                                // --- PREMIUM MOON ---
                                <g>
                                    <circle r="35" fill="rgba(255,255,255,0.05)" className="blur-sm" />
                                    <circle r="22" fill={theme.planetGradient} />
                                    {/* Craters */}
                                    <circle cx="-6" cy="-8" r="4" fill="#1e293b" opacity="0.3" />
                                    <circle cx="8" cy="2" r="5" fill="#1e293b" opacity="0.25" />
                                    <circle cx="-4" cy="10" r="3" fill="#1e293b" opacity="0.4" />
                                    {/* Crescent Shadow (Simulated phase based on time of night - purely aesthetic) */}
                                    <path 
                                        d="M 0 -22 A 22 22 0 0 0 0 22 A 12 22 0 0 0 0 -22" 
                                        fill="#020617" 
                                        opacity="0.6" 
                                    />
                                </g>
                            ) : (
                                // --- PREMIUM SUN ---
                                <g>
                                    {/* Rotating Solar Flares/Corona */}
                                    <g className="corona-spin opacity-80" fill="#fde047" filter="blur(2px)">
                                        {Array.from({length: 12}).map((_, i) => (
                                            <polygon 
                                                key={i}
                                                points="0,-28 4,-18 -4,-18" 
                                                transform={`rotate(${i * 30})`}
                                            />
                                        ))}
                                    </g>
                                    <circle r="24" fill={theme.planetGradient} />
                                    {/* Inner bright spot */}
                                    <circle r="12" fill="#ffffff" opacity="0.4" className="blur-[2px]" />
                                </g>
                            )}
                        </g>
                    </svg>
                </div>

                {/* TOP ROW: Title & Date (Lifted above the arc) */}
                <div className="w-full text-center mt-2 z-20">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 mb-4 shadow-lg">
                        {isNight ? <Stars className={`w-4 h-4 ${theme.subTextColor}`} /> : <Sun className={`w-4 h-4 ${theme.subTextColor}`} />}
                        <span className={`text-xs font-bold uppercase tracking-[0.2em] ${theme.subTextColor}`}>
                            {isNight ? "Night Sky" : "Solar Path"}
                        </span>
                    </div>
                    <h2 
                        className={`text-4xl md:text-5xl font-heading font-black tracking-tight ${theme.textColor} drop-shadow-xl`}
                        style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
                    >
                        {dateDisplay}
                    </h2>
                </div>

                {/* BOTTOM ROW: Sunrise/Sunset Panels */}
                <div className="w-full flex justify-between items-end z-20 mt-40">
                    {/* START PANEL */}
                    <div className={`flex items-center gap-4 p-4 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl ${theme.panelBg} transition-colors duration-500`}>
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${isNight ? 'from-indigo-600 to-purple-900' : 'from-amber-400 to-orange-600'} text-white shadow-inner`}>
                            {theme.iconStart}
                        </div>
                        <div>
                            <div className={`text-[10px] font-bold uppercase tracking-widest ${theme.subTextColor} mb-1`}>
                                {theme.startLabel}
                            </div>
                            <div className={`text-xl font-black font-heading tracking-wide ${theme.textColor}`}>
                                {isNight ? sunset : sunrise}
                            </div>
                        </div>
                    </div>

                    {/* END PANEL */}
                    <div className={`flex items-center gap-4 p-4 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl ${theme.panelBg} transition-colors duration-500 text-right`}>
                        <div>
                            <div className={`text-[10px] font-bold uppercase tracking-widest ${theme.subTextColor} mb-1 flex justify-end`}>
                                {theme.endLabel}
                            </div>
                            <div className={`text-xl font-black font-heading tracking-wide ${theme.textColor}`}>
                                {isNight ? sunrise : sunset}
                            </div>
                        </div>
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${isNight ? 'from-slate-700 to-indigo-900' : 'from-orange-500 to-rose-700'} text-white shadow-inner`}>
                            {theme.iconEnd}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CelestialCycle;
