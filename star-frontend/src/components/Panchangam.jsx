import React, { useState, useEffect, useRef } from 'react';
import {
    Sun, Moon, ShieldAlert, Sparkles, ScrollText, Copy, Check,
    Calendar, RefreshCw, MapPin, Star, AlertTriangle, Printer,
    ChevronLeft, ChevronRight, Compass, Clock, Eye, Leaf, PartyPopper, Info
} from 'lucide-react';
import api from '../services/api';
import { TRANSLATIONS } from './translations';
import CelestialCycle from './CelestialCycle';
import MoonPhase3D from './MoonPhase3D';
import { useTempleTime } from '../context/TimeContext';

// ═══════════════════════════════════════════════════════════════
// ICON MAP for Pancha-Anga Cards
// ═══════════════════════════════════════════════════════════════
const ANGA_ICONS = {
    Tithi: '🌙',
    Nakshatra: '⭐',
    Yoga: '☸️',
    Karana: '⚡',
    Maasa: '📅',
    Paksha: '🌓',
};

// Moon phase emoji map
const MOON_EMOJI = {
    'Full Moon': '🌕',
    'New Moon': '🌑',
    'Waxing Crescent': '🌒',
    'First Quarter': '🌓',
    'Waxing Gibbous': '🌔',
    'Waning Gibbous': '🌖',
    'Last Quarter': '🌗',
    'Waning Crescent': '🌘',
    'Nearly Full': '🌔',
    'Nearly New': '🌘',
};

// ═══════════════════════════════════════════════════════════════
// SECTION DIVIDER
// ═══════════════════════════════════════════════════════════════
const SectionTitle = ({ icon, title, subtitle, color = "text-temple-saffron" }) => (
    <div className="flex items-center gap-3 mb-4">
        <div className={`text-xl ${color}`}>{icon}</div>
        <div>
            <h3 className="font-heading font-bold text-lg text-temple-brown dark:text-amber-100 leading-tight">{title}</h3>
            {subtitle && <p className="text-[10px] uppercase tracking-widest text-temple-stone/40 dark:text-slate-500 font-bold">{subtitle}</p>}
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-temple-saffron/20 to-transparent dark:from-orange-500/10 ml-2" />
    </div>
);

// ═══════════════════════════════════════════════════════════════
// ANGA CARD COMPONENT (with optional Glossary Tooltip)
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// ANGA CARD COMPONENT (with dynamic glows & hierarchical sizing)
// ═══════════════════════════════════════════════════════════════
const AngaCard = ({ icon, label, value, glossary, isPrimary = false }) => {
    // Dynamic border/glow based on astrological nature
    let statusClass = "border-amber-500/10 dark:border-white/5 hover:border-temple-saffron/30 dark:hover:border-orange-500/30";
    if (glossary && glossary.nature) {
        if (glossary.nature.includes('Very Auspicious')) {
            statusClass = "border-emerald-500/40 dark:border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.12)] hover:border-emerald-500/60 dark:hover:border-emerald-400/50";
        } else if (glossary.nature.includes('Auspicious')) {
            statusClass = "border-green-500/30 dark:border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.08)] hover:border-green-500/50 dark:hover:border-green-400/40";
        } else if (glossary.nature.includes('Inauspicious')) {
            statusClass = "border-red-500/40 dark:border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.12)] hover:border-red-500/60 dark:hover:border-red-400/50";
        }
    }

    return (
        <div className={`
            relative overflow-hidden p-6 rounded-3xl
            bg-white/80 dark:bg-slate-900/40 backdrop-blur-md
            flex flex-col items-center text-center justify-center
            transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-xl group
            ${isPrimary ? 'min-h-[140px] col-span-2' : 'min-h-[110px] col-span-1'}
            ${statusClass}
            border
        `}>
            {/* Background watermark icon */}
            <span className={`
                absolute -bottom-3 -right-3 select-none pointer-events-none opacity-[0.05] dark:opacity-[0.07]
                group-hover:opacity-[0.10] transition-opacity duration-500
                ${isPrimary ? 'text-7xl group-hover:scale-110 transition-transform' : 'text-5xl'}
            `}>
                {icon}
            </span>
            
            <p className="text-[10px] font-bold text-temple-brown/60 dark:text-amber-100/60 uppercase tracking-[0.15em] mb-2 z-10">{label}</p>
            
            <p className={`
                font-bold text-temple-saffron dark:text-orange-400 font-heading group-hover:scale-[1.03] transition-transform z-10
                ${isPrimary ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'}
            `}>
                {value || '-'}
            </p>
            
            {/* Glossary Tooltip */}
            {glossary && (
                <div className="mt-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-[10px] text-temple-stone/60 dark:text-slate-400 italic leading-snug">{glossary.meaning}</p>
                    <span className={`inline-block mt-1 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        glossary.nature?.includes('Very Auspicious') ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' :
                        glossary.nature?.includes('Auspicious') ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' :
                        glossary.nature?.includes('Inauspicious') ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' :
                        'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}>{glossary.nature}</span>
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// MINI STAT CARD (for Sun/Moon Rashi, Moonrise, etc.)
// ═══════════════════════════════════════════════════════════════
const MiniStatCard = ({ icon: Icon, iconColor, label, value }) => (
    <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-md p-4 border border-amber-500/10 dark:border-white/5 rounded-3xl flex flex-col items-center text-center justify-center min-h-[95px] group hover:-translate-y-0.5 hover:border-temple-saffron/20 hover:shadow-md transition-all duration-300">
        <Icon className={`w-5 h-5 ${iconColor} mb-2 group-hover:scale-110 transition-transform duration-300`} />
        <p className="text-[9px] font-bold text-temple-brown/50 dark:text-amber-100/50 uppercase tracking-[0.15em] mb-1">{label}</p>
        <p className="text-base font-bold text-temple-saffron dark:text-orange-400 font-heading">{value || '-'}</p>
    </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
const Panchangam = ({ lang = 'EN' }) => {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.EN;
    const { currentDate, isNewDay } = useTempleTime();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSankalpa, setShowSankalpa] = useState(false);
    const [copied, setCopied] = useState(false);
    const printRef = useRef(null);

    const [selectedDate, setSelectedDate] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    });

    // Midnight Watcher
    useEffect(() => {
        if (isNewDay) {
            setSelectedDate(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`);
        }
    }, [isNewDay, currentDate]);

    useEffect(() => { fetchPanchangam(); }, [selectedDate, lang]);

    const fetchPanchangam = async () => {
        try {
            setLoading(true);
            setError(null);
            const [year, month, day] = selectedDate.split('-');
            // Pass lang param to backend for localized data
            const response = await api.get(`/daily-sankalpa?date_str=${day}-${month}-${year}&lang=${lang}`);
            setData(response.data.panchangam);
        } catch (err) {
            console.error("Error fetching panchangam:", err);
            setError(t.failedToLoadAlmanac || "Failed to load Divine Almanac");
        } finally {
            setLoading(false);
        }
    };

    const handleCopySankalpa = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const navigateDate = (direction) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + direction);
        setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    };

    const goToToday = () => {
        const now = new Date();
        setSelectedDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
    };

    const isToday = () => {
        const now = new Date();
        return selectedDate === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    const handlePrint = () => {
        window.print();
    };

    const formatDateDisplay = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    // ─── Loading State ───
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
                <div className="relative">
                    <div className="animate-[spin_3s_linear_infinite]">
                        <Sun className="w-16 h-16 text-temple-saffron opacity-60" />
                    </div>
                    <div className="absolute inset-0 animate-[ping_2s_ease-out_infinite]">
                        <Sun className="w-16 h-16 text-temple-saffron opacity-10" />
                    </div>
                </div>
                <p className="mt-6 text-temple-brown dark:text-amber-100 font-heading font-bold animate-pulse text-lg">{t.loadingAlmanac || "Loading Divine Almanac..."}</p>
                <p className="text-[10px] text-temple-stone/40 dark:text-slate-500 mt-1 uppercase tracking-widest">{t.calculatingPositions || "Calculating celestial positions"}</p>
            </div>
        );
    }

    // ─── Error State ───
    if (error || !data) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 text-center bg-red-50 dark:bg-red-950/30 rounded-3xl border border-red-100 dark:border-red-900/30 shadow-lg">
                <ShieldAlert className="w-14 h-14 mx-auto mb-4 text-red-400 opacity-60" />
                <p className="font-heading font-bold text-lg text-red-700 dark:text-red-300">{error || "Data unavailable"}</p>
                <p className="text-xs text-red-400 mt-1">{t.checkConnection || "Please check your connection"}</p>
                <button onClick={fetchPanchangam} className="mt-6 px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20">
                    {t.tryAgain || "Try Again"}
                </button>
            </div>
        );
    }

    const generateSankalpaString = () => {
        if (!data) return "";
        const a = data.attributes || {};
        return `Mama upātta, samastha duritha kshyathwara sri parameshwara prithiartham, subhe shobane muhurthe – ādhyabrahmanaha – dwithiye pararthe – swetha varaha kalpe – vaivasvatha manvanthare – ashtā vimsathi thithame kaliyuge – prathame pade – jambudwepe – bharata varshe bharatha kande – merohe – dakshine parswe – sakabdhe – asmin varthamane vyavharike – prabhavadhi nāma sashtya samvathsaranām madye – ${a.samvatsara || ''} Nāma Samvatsare – ${a.ayana || ''} Ayane – ${a.ritu || ''} Rithou – ${a.maasa || ''} Mase – ${a.paksha || ''} Pakshe – ${a.tithi || ''} Thithou – ${a.vasara_sanskrit || ''} Vasara Yuktayam – ${a.nakshatra || ''} Nakshatra Yuktayam – Subha Yoga – Subha Karana Evam Guna Visheshana Vishishtayam – Subha Thithou...`;
    };

    const sankalpaText = generateSankalpaString();
    const mc = data.moon_cycle;

    return (
        <div ref={printRef} className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-700 print:p-2 print:max-w-none">

            {/* ═══════════════════════════════════════════════
                TOOLBAR: Date Nav + Location + Actions
               ═══════════════════════════════════════════════ */}
            <div className="flex flex-wrap justify-between items-center gap-3 print:hidden">
                {/* Location Badge */}
                {data.meta && (
                    <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/60 dark:border-slate-700/40">
                        <MapPin className="w-3 h-3 text-temple-saffron" />
                        <span className="text-[11px] font-bold text-temple-brown/60 dark:text-slate-400">
                            {data.meta.location?.lat && data.meta.location?.lon && (
                                parseFloat(data.meta.location.lat).toFixed(3) === "12.675" && parseFloat(data.meta.location.lon).toFixed(3) === "75.337"
                                ? "Kukke Subramanya, KA"
                                : "Temple Office"
                            )} ({data.meta.location?.lat}°N, {data.meta.location?.lon}°E)
                        </span>
                        <span className="px-1.5 py-0.5 bg-temple-saffron/10 dark:bg-orange-900/25 rounded text-temple-saffron text-[9px] font-bold uppercase tracking-wider">
                            {data.meta.ayanamsa_mode}
                        </span>
                    </div>
                )}

                {/* Date Navigation */}
                <div className="flex items-center gap-2">
                    <button onClick={() => navigateDate(-1)} className="p-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/60 dark:border-slate-700/40 rounded-xl text-temple-stone/50 dark:text-slate-400 hover:text-temple-saffron transition-all hover:bg-white dark:hover:bg-slate-800" title="Previous Day">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Calendar className="w-3.5 h-3.5 text-temple-stone/40" />
                        </div>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="pl-9 pr-3 py-2 bg-white/50 backdrop-blur-sm border border-white/60 dark:bg-slate-800/50 dark:border-slate-700/40 rounded-xl text-sm font-bold text-temple-brown dark:text-amber-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-temple-saffron/40 cursor-pointer hover:bg-white/80 dark:hover:bg-slate-800 transition-all"
                        />
                    </div>
                    <button onClick={() => navigateDate(1)} className="p-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/60 dark:border-slate-700/40 rounded-xl text-temple-stone/50 dark:text-slate-400 hover:text-temple-saffron transition-all hover:bg-white dark:hover:bg-slate-800" title="Next Day">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    {!isToday() && (
                        <button onClick={goToToday} className="px-3 py-2 bg-temple-saffron/10 dark:bg-orange-900/20 border border-temple-saffron/20 dark:border-orange-800/30 rounded-xl text-[11px] font-bold text-temple-saffron hover:bg-temple-saffron/20 transition-all">
                            {t.today || "Today"}
                        </button>
                    )}

                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

                    <button onClick={fetchPanchangam} className="p-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/60 dark:border-slate-700/40 rounded-xl text-temple-stone/40 dark:text-slate-500 hover:text-temple-saffron transition-all hover:rotate-180 duration-500" title="Refresh">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={handlePrint} className="p-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/60 dark:border-slate-700/40 rounded-xl text-temple-stone/40 dark:text-slate-500 hover:text-temple-saffron transition-all" title="Print">
                        <Printer className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════
                FESTIVAL BANNER (Multi-festival, Conditional)
               ═══════════════════════════════════════════════ */}
            {data.festivals?.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/40 p-5 shadow-sm animate-in slide-in-from-top duration-500">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                            <Star className="w-6 h-6 text-amber-500 animate-pulse" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-[0.15em]">{t.todaysObservances || "Today's Observances"}</p>
                            <p className="text-lg font-heading font-bold text-amber-800 dark:text-amber-200">
                                {data.festivals.map(f => f.name_en).join(' • ')}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 ml-14">
                        {data.festivals.map((f, i) => (
                            <div key={i} className="group relative flex items-center gap-1.5 bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-amber-200/60 dark:border-amber-800/30 cursor-default">
                                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{f.name_kn}</span>
                                <Info className="w-3 h-3 text-amber-400/60" />
                                {/* Hover tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white dark:bg-slate-800 shadow-xl rounded-lg p-2.5 border border-amber-100 dark:border-slate-700 text-left opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                                    <p className="text-[10px] text-temple-stone/70 dark:text-slate-300 leading-tight">{f.significance}</p>
                                    <span className="text-[8px] font-bold uppercase tracking-wider text-amber-500 mt-1 block">{f.type}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════
                CELESTIAL ARC (Sunrise / Sunset)
               ═══════════════════════════════════════════════ */}
            <CelestialCycle
                sunrise={data.sun_cycle?.sunrise}
                sunset={data.sun_cycle?.sunset}
                dateDisplay={formatDateDisplay(selectedDate)}
            />

            {/* ═══════════════════════════════════════════════
                VEDIC CONTEXT STRIP (Samvatsara, Ayana, Ritu)
               ═══════════════════════════════════════════════ */}
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 py-3 px-4 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-white/40 dark:border-slate-700/30">
                {[
                    { label: 'Samvatsara', value: data.attributes?.samvatsara },
                    { label: 'Ayana', value: data.attributes?.ayana },
                    { label: 'Ṛitu', value: data.attributes?.ritu },
                    { label: 'Vāsara', value: data.attributes?.vasara_sanskrit },
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-temple-stone/40 dark:text-slate-500 uppercase tracking-[0.12em]">{item.label}</span>
                        <span className="text-sm font-heading font-bold text-temple-brown dark:text-amber-100">{item.value || '-'}</span>
                        {i < 3 && <span className="hidden md:block text-temple-stone/15 dark:text-slate-700 ml-4">•</span>}
                    </div>
                ))}
            </div>

            {/* ═══════════════════════════════════════════════
                PANCHA-ANGA GRID (The 5 Limbs + Maasa)
               ═══════════════════════════════════════════════ */}
            <div>
                <SectionTitle icon="🕉️" title={t.panchaAnga || "Pancha-Aṅga"} subtitle={t.fiveLimbs || "The Five Limbs of the Day"} />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    {[
                        { label: 'Tithi', value: data.attributes?.tithi, glossaryKey: 'tithi', isPrimary: true },
                        { label: 'Nakshatra', value: data.attributes?.nakshatra, isPrimary: true },
                        { label: 'Yoga', value: data.attributes?.yoga, glossaryKey: 'yoga' },
                        { label: 'Karana', value: data.attributes?.karana, glossaryKey: 'karana' },
                        { label: 'Maasa', value: data.attributes?.maasa },
                        { label: 'Paksha', value: data.attributes?.paksha },
                    ].map((item, i) => (
                        <AngaCard key={i} icon={ANGA_ICONS[item.label]} label={item.label} value={item.value} glossary={item.glossaryKey ? data.glossary?.[item.glossaryKey] : null} isPrimary={item.isPrimary} />
                    ))}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════
                ZODIAC POSITIONS & TIME MARKERS
               ═══════════════════════════════════════════════ */}
            <div>
                <SectionTitle icon="🔭" title={t.celestialPositions || "Celestial Positions"} subtitle={t.grahaChandra || "Graha & Chandra"} color="text-indigo-500" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MiniStatCard icon={Sun} iconColor="text-amber-500" label="Sūrya Rāshi" value={data.attributes?.sun_rashi} />
                    <MiniStatCard icon={Moon} iconColor="text-blue-400" label="Chandra Rāshi" value={data.attributes?.moon_rashi} />
                    <MiniStatCard icon={Eye} iconColor="text-indigo-400" label="Moonrise" value={data.sun_cycle?.moonrise} />
                    <MiniStatCard icon={Eye} iconColor="text-slate-400" label="Moonset" value={data.sun_cycle?.moonset} />
                </div>
            </div>

            {/* ═══════════════════════════════════════════════
                MOON CYCLE WIDGET
               ═══════════════════════════════════════════════ */}
            {mc && (
                <div>
                    <SectionTitle icon="🌙" title={t.chandraCycle || "Chandra Chakra"} subtitle={t.moonPhaseCycle || "Moon Phase & Cycle"} color="text-violet-500" />

                    {/* Deep-space night card */}
                    <div className="relative overflow-hidden rounded-[2rem] border border-indigo-900/40 dark:border-indigo-800/30 shadow-[0_20px_50px_-15px_rgba(30,27,75,0.55)]" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #1a1040 35%, #0d1b40 70%, #080d1e 100%)' }}>

                        {/* Animated star field */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {[...Array(30)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute rounded-full bg-white"
                                    style={{
                                        top: `${5 + (i * 37 % 90)}%`,
                                        left: `${3 + (i * 53 % 94)}%`,
                                        width: `${0.8 + (i % 3) * 0.6}px`,
                                        height: `${0.8 + (i % 3) * 0.6}px`,
                                        opacity: 0.15 + (i % 5) * 0.12,
                                        animation: `twinkle ${2 + (i % 4)}s ${(i * 0.3) % 3}s ease-in-out infinite`,
                                    }}
                                />
                            ))}
                        </div>

                        {/* Nebula glows */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(40px)' }} />
                        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', filter: 'blur(35px)' }} />

                        <div className="relative z-10 p-6 md:p-8">
                            <div className="flex flex-col md:flex-row items-center gap-8">

                                {/* ── 3D MOON ── */}
                                <div className="flex flex-col items-center text-center gap-3">
                                    <MoonPhase3D
                                        illumination={mc.illumination}
                                        elongation={mc.elongation ?? 90}
                                        phaseEn={mc.phase_en || ''}
                                        size={130}
                                    />
                                    <div className="space-y-0.5">
                                        <p className="text-base font-heading font-bold text-white tracking-wide">{mc.phase}</p>
                                        <p className="text-[10px] text-indigo-300/70 uppercase tracking-[0.18em] font-semibold">{mc.phase_en}</p>
                                    </div>
                                </div>

                                {/* ── DETAILS ── */}
                                <div className="flex-1 w-full space-y-5">

                                    {/* Illumination bar */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-bold text-indigo-200/60 uppercase tracking-[0.14em]">{t.illumination || "Illumination"}</span>
                                            <span className="text-sm font-bold text-violet-300 font-heading">{mc.illumination}%</span>
                                        </div>
                                        <div className="h-2.5 bg-indigo-950/80 rounded-full overflow-hidden shadow-inner border border-indigo-900/40">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                                style={{
                                                    width: `${mc.illumination}%`,
                                                    background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #c4b5fd)'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Lunar cycle stats */}
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        {[
                                            {
                                                label: 'Paksha',
                                                // mc.paksha added in v2; fall back to data.attributes.paksha
                                                value: mc.paksha || data.attributes?.paksha || '-',
                                                icon: '☽'
                                            },
                                            {
                                                label: 'Tithi',
                                                // mc.tithi_number added in v2; fall back to tithi name from attributes
                                                value: mc.tithi_number != null
                                                    ? `${mc.tithi_number}/30`
                                                    : (data.attributes?.tithi || '-'),
                                                icon: '📅'
                                            },
                                            {
                                                label: 'Cycle Day',
                                                // mc.days_since_new_moon added in v2; show illumination as proxy until cache refreshes
                                                value: mc.days_since_new_moon != null
                                                    ? `${mc.days_since_new_moon}d`
                                                    : (mc.illumination != null ? `~${Math.round(mc.illumination / 3.33)}d` : '-'),
                                                icon: '🔄'
                                            },
                                        ].map((s, i) => (
                                            <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/8 hover:border-indigo-500/30 transition-all duration-300">
                                                <p className="text-lg mb-0.5">{s.icon}</p>
                                                <p className="text-[9px] font-bold text-indigo-300/60 uppercase tracking-[0.12em] mb-1">{s.label}</p>
                                                <p className="text-sm font-bold text-white font-heading">{s.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Next Purnima / Amavasya */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl p-3 border border-amber-500/20 hover:border-amber-400/40 transition-all duration-300" style={{ background: 'rgba(251,191,36,0.06)' }}>
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <span className="text-sm">🌕</span>
                                                <p className="text-[9px] font-bold text-amber-400/70 uppercase tracking-[0.12em]">Hunnime</p>
                                            </div>
                                            <p className="text-sm font-bold text-amber-100 font-heading">
                                                {new Date(mc.next_purnima).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </p>
                                            <p className="text-[10px] text-amber-400/60 mt-0.5">
                                                {mc.days_to_purnima === 0 ? '🎉 Today!' : `in ${mc.days_to_purnima} days`}
                                            </p>
                                        </div>
                                        <div className="rounded-xl p-3 border border-slate-500/20 hover:border-slate-400/40 transition-all duration-300" style={{ background: 'rgba(148,163,184,0.06)' }}>
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <span className="text-sm">🌑</span>
                                                <p className="text-[9px] font-bold text-slate-400/70 uppercase tracking-[0.12em]">Amavasye</p>
                                            </div>
                                            <p className="text-sm font-bold text-slate-200 font-heading">
                                                {new Date(mc.next_amavasya).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </p>
                                            <p className="text-[10px] text-slate-400/60 mt-0.5">
                                                {mc.days_to_amavasya === 0 ? '🎉 Today!' : `in ${mc.days_to_amavasya} days`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════
                AUSPICIOUS TIMES (Green Zone)
               ═══════════════════════════════════════════════ */}
            {data.auspicious && (data.auspicious.abhijit_muhurtha || data.auspicious.amrit_kalam) && (
                <div>
                    <SectionTitle icon={<Leaf className="w-5 h-5 text-emerald-500" />} title={t.shubhaKala || "Shubha Kāla"} subtitle={t.auspiciousWindows || "Auspicious Windows"} color="text-emerald-500" />
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/15 rounded-2xl border border-emerald-100/80 dark:border-emerald-900/30 p-6 shadow-sm relative overflow-hidden">
                        {/* Subtle sparkle pattern */}
                        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            {data.auspicious.abhijit_muhurtha && (
                                <div className="text-center bg-white/50 dark:bg-slate-900/30 rounded-xl p-4 border border-emerald-100/50 dark:border-emerald-900/20 group">
                                    <span className="block text-[9px] font-bold text-emerald-500 dark:text-emerald-400/70 uppercase tracking-[0.12em] mb-1">Abhijit Muhūrtha</span>
                                    <span className="font-heading font-bold text-lg text-emerald-700 dark:text-emerald-200">{data.auspicious.abhijit_muhurtha}</span>
                                    <p className="text-[9px] text-emerald-500/50 dark:text-emerald-500/40 mt-1 italic opacity-0 group-hover:opacity-100 transition-opacity">{t.abhijitDescription || "Universally auspicious midday window"}</p>
                                </div>
                            )}
                            {data.auspicious.amrit_kalam && (
                                <div className="text-center bg-white/50 dark:bg-slate-900/30 rounded-xl p-4 border border-emerald-100/50 dark:border-emerald-900/20 group">
                                    <span className="block text-[9px] font-bold text-emerald-500 dark:text-emerald-400/70 uppercase tracking-[0.12em] mb-1">Amṛit Kālam</span>
                                    <span className="font-heading font-bold text-lg text-emerald-700 dark:text-emerald-200">{data.auspicious.amrit_kalam}</span>
                                    <p className="text-[9px] text-emerald-500/50 dark:text-emerald-500/40 mt-1 italic opacity-0 group-hover:opacity-100 transition-opacity">{t.amritDescription || "Nectar time — excellent for new beginnings"}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════
                INAUSPICIOUS TIMES (Red Zone)
               ═══════════════════════════════════════════════ */}
            <div>
                <SectionTitle icon={<ShieldAlert className="w-5 h-5 text-red-500" />} title={t.ashubhaKala || "Ashubha Kāla"} subtitle={t.inauspiciousPeriods || "Inauspicious Periods"} color="text-red-500" />
                <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/15 rounded-2xl border border-red-100/80 dark:border-red-900/30 p-6 space-y-5 shadow-sm relative overflow-hidden">
                    {/* Subtle background pattern */}
                    <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ef4444 10px, #ef4444 11px)' }} />

                    {/* Rahu / Yama / Gulika */}
                    <div className="grid grid-cols-3 gap-4 relative z-10">
                        {[
                            { label: 'Rāhukāla', value: data.inauspicious?.rahu },
                            { label: 'Yamagaṇḍa', value: data.inauspicious?.yama },
                            { label: 'Gulika', value: data.inauspicious?.gulika },
                        ].map((item, i) => (
                            <div key={i} className="text-center bg-white/40 dark:bg-slate-900/30 rounded-xl p-3 border border-red-100/50 dark:border-red-900/20">
                                <span className="block text-[9px] font-bold text-red-400 dark:text-red-400/70 uppercase tracking-[0.12em] mb-1">{item.label}</span>
                                <span className="font-heading font-bold text-lg text-red-700 dark:text-red-200">{item.value || '-'}</span>
                            </div>
                        ))}
                    </div>

                    {/* Durmuhurtham */}
                    {data.inauspicious?.durmuhurtham?.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-red-200/40 dark:border-red-800/20 relative z-10">
                            <div className="flex items-center gap-1.5 text-red-500/60 dark:text-red-400/50">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span className="text-[9px] font-bold uppercase tracking-[0.12em]">Durmuhūrtham</span>
                            </div>
                            {data.inauspicious.durmuhurtham.map((period, i) => (
                                <span key={i} className="font-heading font-bold text-sm text-red-600 dark:text-red-300 bg-red-100/70 dark:bg-red-900/25 px-3 py-1 rounded-lg border border-red-200/50 dark:border-red-800/20">
                                    {period}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════
                SANKALPA MANTRA
               ═══════════════════════════════════════════════ */}
            <div className="text-center pt-6 pb-8 print:hidden">
                {!showSankalpa ? (
                    <button
                        onClick={() => setShowSankalpa(true)}
                        className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-temple-saffron to-amber-500 text-white rounded-2xl font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-1 transition-all duration-300 group"
                    >
                        <ScrollText className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        <span>{t.generateSankalpa || "Generate Daily Sankalpa"}</span>
                    </button>
                ) : (
                    <div className="max-w-3xl mx-auto bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-amber-500/10 dark:border-white/5 rounded-[2rem] p-8 md:p-10 border-t-4 border-t-temple-saffron animate-in slide-in-from-bottom duration-500 text-left relative shadow-2xl">
                        <button
                            onClick={() => handleCopySankalpa(sankalpaText)}
                            className="absolute top-4 right-4 p-2 text-temple-stone/30 dark:text-slate-600 hover:text-temple-saffron transition-colors rounded-lg hover:bg-orange-50 dark:hover:bg-slate-800"
                            title="Copy to clipboard"
                        >
                            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                        </button>

                        <div className="text-center mb-8">
                            <Sparkles className="w-8 h-8 text-temple-saffron mx-auto mb-3 opacity-70" />
                            <h3 className="font-heading font-bold text-2xl text-temple-brown dark:text-amber-100">{t.dailySankalpaMantra || "Daily Sankalpa Mantra"}</h3>
                            <div className="h-1 w-16 bg-gradient-to-r from-temple-saffron/30 to-amber-400/30 mx-auto mt-4 rounded-full" />
                        </div>

                        <div className="bg-temple-surface/30 dark:bg-slate-800/40 p-6 rounded-xl border border-temple-saffron/10 dark:border-slate-700 shadow-inner">
                            <p className="text-base md:text-lg font-heading leading-relaxed text-center text-temple-ink/70 dark:text-slate-300 italic">
                                "{sankalpaText}"
                            </p>
                        </div>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => setShowSankalpa(false)}
                                className="text-[10px] font-bold text-temple-stone/30 dark:text-slate-600 hover:text-temple-saffron uppercase tracking-[0.15em] transition-colors"
                            >
                                {t.closeSankalpa || "Close Sankalpa"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default Panchangam;
