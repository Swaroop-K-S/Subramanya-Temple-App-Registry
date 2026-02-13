import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
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

    useEffect(() => {
        const calculatePosition = () => {
            // Use the live time from the hook
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
    }, [currentTime, sunrise, sunset]); // Re-run whenever 'time' updates

    // Visual Theme Configurations
    const theme = isNight ? {
        // Night Theme
        containerClass: "bg-gradient-to-r from-indigo-950 to-slate-900 border-white/10 shadow-indigo-500/20",
        textColor: "text-slate-200",
        subTextColor: "text-slate-400",
        iconColor: "#e0f2fe", // Moon
        glowColor: "#60a5fa",
        arcStroke: "url(#moonGradient)",
        arcStartIcon: <Moon className="w-8 h-8 text-orange-300 opacity-50" />, // Sunset icon reused? No, Night starts with Sunset
        arcEndIcon: <Sun className="w-8 h-8 text-yellow-300 opacity-50" />, // Night ends with Sunrise
        startLabel: "Dusk",
        endLabel: "Dawn",
        bgDecor: (
            <>
                {/* Stars Background */}
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-pulse shadow-[0_0_4px_white]"></div>
                    <div className="absolute top-20 left-1/4 w-0.5 h-0.5 bg-white rounded-full"></div>
                    <div className="absolute top-5 right-1/3 w-1 h-1 bg-white rounded-full animate-pulse delay-700"></div>
                    <div className="absolute bottom-10 right-10 w-1 h-1 bg-white rounded-full animate-pulse delay-300"></div>
                    <div className="absolute top-1/2 left-1/2 w-0.5 h-0.5 bg-blue-200 rounded-full"></div>
                </div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-1000" />
            </>
        )
    } : {
        // Day Theme
        containerClass: "bg-gradient-to-b from-orange-50 to-white border-white/60 shadow-xl",
        textColor: "text-stone-800",
        subTextColor: "text-stone-500",
        iconColor: "#fef3c7", // Sun
        glowColor: "#f59e0b",
        arcStroke: "url(#sunGradient)",
        arcStartIcon: <Sun className="w-8 h-8 text-yellow-500 relative z-10" />,
        arcEndIcon: <Moon className="w-8 h-8 text-orange-500" />,
        startLabel: "Horizon",
        endLabel: "Dusk",
        bgDecor: (
            <>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-300 via-yellow-400 to-orange-300 opacity-50" />
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-temple-saffron/5 rounded-full blur-3xl group-hover:bg-temple-saffron/10 transition-colors duration-1000" />
            </>
        )
    };

    // SVG Props
    const width = 300;
    const height = 150;
    const radius = 120;
    const cx = 150;
    const cy = 130;
    const angleRad = Math.PI * (1 - percentage);
    const celestialX = cx + radius * Math.cos(angleRad);
    const celestialY = cy - radius * Math.sin(angleRad);

    return (
        <div className={`relative overflow-hidden rounded-3xl p-8 border group transition-colors duration-1000 ${theme.containerClass}`}>

            {/* Background Decorations */}
            {theme.bgDecor}

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">

                {/* START POINT */}
                <div className="flex flex-col items-center gap-2">
                    <div className={`p-3 rounded-full shadow-inner border relative ${isNight ? 'bg-indigo-900 border-indigo-800' : 'bg-yellow-50 border-yellow-100'}`}>
                        {/* Day: Sunrise Icon. Night: Sunset Icon (Start of night) */}
                        <div className={`absolute inset-0 blur-sm rounded-full animate-pulse-slow ${isNight ? 'bg-indigo-500/20' : 'bg-yellow-400/20'}`}></div>
                        {isNight ? <Moon className="w-8 h-8 text-orange-300 relative z-10" /> : <Sun className="w-8 h-8 text-yellow-500 relative z-10" />}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1 ${theme.subTextColor}`}>
                        <span className={`w-1 h-1 rounded-full ${isNight ? 'bg-indigo-400' : 'bg-temple-stone/30'}`}></span>
                        {isNight ? "Sunset" : "Horizon"}
                    </span>
                    <span className={`text-lg font-heading font-bold ${theme.textColor}`}>
                        {isNight ? sunset : sunrise}
                    </span>
                </div>

                {/* CENTER: ARC & DATE */}
                <div className="flex-1 flex flex-col items-center text-center space-y-4 w-full">
                    {/* SVG ARC */}
                    <div className="relative w-[300px] h-[150px]">
                        <svg width={width} height={height} className="overflow-visible">
                            <defs>
                                <linearGradient id="sunGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#fde047" stopOpacity="0.4" />
                                    <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
                                    <stop offset="100%" stopColor="#fde047" stopOpacity="0.4" />
                                </linearGradient>
                                <linearGradient id="moonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.4" />
                                    <stop offset="50%" stopColor="#e2e8f0" stopOpacity="0.9" />
                                    <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.4" />
                                </linearGradient>
                            </defs>

                            <path
                                d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                                fill="none"
                                stroke={theme.arcStroke}
                                strokeWidth="3"
                                strokeDasharray="8 6"
                                strokeLinecap="round"
                                className="transition-all duration-1000"
                            />

                            <g
                                transform={`translate(${celestialX}, ${celestialY})`}
                                style={{ transition: 'transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                            >
                                <circle r="20" fill={theme.glowColor} className="opacity-20 animate-pulse" />
                                <circle r="14" fill={theme.glowColor} className="opacity-40" />
                                <foreignObject x="-12" y="-12" width="24" height="24">
                                    {isNight ?
                                        <Moon className="w-6 h-6 text-sky-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] -rotate-12" /> :
                                        <Sun className="w-6 h-6 text-yellow-100 drop-shadow-md animate-spin-slow" style={{ animationDuration: '10s' }} />
                                    }
                                </foreignObject>
                            </g>
                        </svg>

                        <div className={`absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-20 ${theme.textColor}`} />
                    </div>

                    <h2 className={`text-3xl md:text-4xl font-heading font-bold tracking-wide drop-shadow-sm transition-colors duration-700 ${theme.textColor}`}>
                        {dateDisplay}
                    </h2>
                </div>

                {/* END POINT */}
                <div className="flex flex-col items-center gap-2">
                    <div className={`p-3 rounded-full shadow-inner border relative ${isNight ? 'bg-indigo-900 border-indigo-800' : 'bg-orange-50 border-orange-100'}`}>
                        <div className={`absolute inset-0 blur-sm rounded-full ${isNight ? 'bg-indigo-500/10' : 'bg-orange-400/10'}`}></div>
                        {isNight ? <Sun className="w-8 h-8 text-yellow-300 relative z-10" /> : <Moon className="w-8 h-8 text-orange-500 relative z-10" />}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1 ${theme.subTextColor}`}>
                        <span className={`w-1 h-1 rounded-full ${isNight ? 'bg-indigo-400' : 'bg-orange-400/30'}`}></span>
                        {isNight ? "Dawn" : "Dusk"}
                    </span>
                    <span className={`text-lg font-heading font-bold ${theme.textColor}`}>
                        {isNight ? sunrise : sunset}
                    </span>
                </div>

            </div>
        </div>
    );
};

export default CelestialCycle;
