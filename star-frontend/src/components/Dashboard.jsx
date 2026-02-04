import React, { useState, useEffect } from 'react';
import { useTempleTime } from '../context/TimeContext';
import {
    Calendar, Moon, Sun, Search, Filter,
    CheckCircle, Circle, MessageCircle, AlertCircle, Clock, Scroll, ChevronDown, ChevronUp, Star, CloudMoon,
    Flame, Droplets, Flower, Utensils, Crown, Sparkles,
    ChevronLeft, ChevronRight, Loader2, IndianRupee, MapPin, PartyPopper, Plus
} from 'lucide-react';
import { TRANSLATIONS } from './translations';
import api from '../services/api';
// Omni-UI Components (Assuming they accept className overrides)
import { OmniInput, OmniDropdown } from './ui/Widgets';
import BookingModal from './BookingModal';

// --- COSMIC THEME ENGINE (v3.0) ---
const getSevaTheme = (sevaName) => {
    const name = (sevaName || '').toLowerCase();

    // Theme Objects with Tailwind v4 classes or custom CSS variables
    // Fire / Homa -> Ember / Amber
    if (name.includes('archane') || name.includes('homa') || name.includes('mangalarathi'))
        return {
            glass: 'from-orange-50/40 via-amber-50/20 to-transparent dark:from-orange-900/10 dark:to-transparent',
            border: 'border-orange-200/50 dark:border-orange-700/30',
            iconBg: 'bg-gradient-to-br from-orange-100 to-amber-200 text-orange-700 dark:from-orange-900 dark:to-amber-900 dark:text-orange-200',
            glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(234,88,12,0.3)]'
        };
    // Water / Abhisheka -> Cyan / Sky
    if (name.includes('abhisheka') || name.includes('theertha') || name.includes('panchamrutha'))
        return {
            glass: 'from-cyan-50/40 via-blue-50/20 to-transparent dark:from-cyan-900/10 dark:to-transparent',
            border: 'border-cyan-200/50 dark:border-cyan-700/30',
            iconBg: 'bg-gradient-to-br from-cyan-100 to-blue-200 text-cyan-700 dark:from-cyan-900 dark:to-blue-900 dark:text-cyan-200',
            glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(8,145,178,0.3)]'
        };
    // Nature / Alankara -> Rose / Pink
    if (name.includes('alankara') || name.includes('pushpa') || name.includes('flower'))
        return {
            glass: 'from-rose-50/40 via-pink-50/20 to-transparent dark:from-rose-900/10 dark:to-transparent',
            border: 'border-rose-200/50 dark:border-rose-700/30',
            iconBg: 'bg-gradient-to-br from-rose-100 to-pink-200 text-rose-700 dark:from-rose-900 dark:to-pink-900 dark:text-rose-200',
            glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(225,29,72,0.3)]'
        };

    // Default -> Slate / Starlight
    return {
        glass: 'from-slate-50/40 via-gray-50/20 to-transparent dark:from-slate-800/10 dark:to-transparent',
        border: 'border-slate-200/50 dark:border-slate-700/30',
        iconBg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
        glow: 'group-hover:shadow-lg'
    };
};

const Dashboard = ({ onBack, lang = 'EN', isHome = false }) => {
    const t = TRANSLATIONS[lang];
    const { currentDate } = useTempleTime();

    const [sevas, setSevas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [selectedSevaForBooking, setSelectedSevaForBooking] = useState(null);

    // Initial Load Animation State
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        // Trigger entrance animations
        setTimeout(() => setShowContent(true), 100);

        const fetchCatalog = async () => {
            setLoading(true);
            try {
                const response = await api.get('/sevas');
                setSevas(response.data || []);
            } catch (err) {
                console.error("Catalog Fetch Error", err);
            } finally {
                setTimeout(() => setLoading(false), 800);
            }
        };
        fetchCatalog();
    }, []);

    const filteredSevas = sevas.filter(seva => {
        const matchSearch = seva.name_eng?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            seva.name_kan?.includes(searchTerm);
        const matchCat = categoryFilter === 'ALL' || seva.name_eng?.toUpperCase().includes(categoryFilter);
        return matchSearch && matchCat;
    });

    return (
        <div className={`
            min-h-screen p-4 md:p-8 pb-32 transition-opacity duration-700
            ${showContent ? 'opacity-100' : 'opacity-0'}
        `}>

            {/* Header Section - Golden Ratio Spacing */}
            <header className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row md:items-end justify-between gap-10 relative z-20 px-4 md:px-0">
                <div className="flex items-center gap-8">
                    {!isHome && (
                        <button
                            onClick={onBack}
                            className="
                                box-content p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 
                                backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50
                                hover:scale-105 active:scale-95 transition-all duration-300
                                group shadow-sm hover:shadow-md
                            "
                        >
                            <ChevronLeft className="text-slate-600 dark:text-slate-300 group-hover:-translate-x-1 transition-transform" />
                        </button>
                    )}

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold tracking-widest text-temple-saffron uppercase">
                                Divine Offerings
                            </span>
                            <div className="h-px w-12 bg-temple-saffron/30"></div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black font-heading tracking-tight">
                            <span className="text-gradient-gold drop-shadow-sm">
                                {t.bookSeva || "Seva Booking"}
                            </span>
                        </h1>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="w-full md:w-72 relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-temple-gold to-temple-saffron rounded-2xl opacity-0 group-focus-within:opacity-20 transition-opacity duration-500 blur-lg"></div>
                        <OmniInput
                            icon={Search}
                            placeholder="Find Seva..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white/70 dark:bg-slate-900/70"
                        />
                    </div>
                    <div className="w-full md:w-48 hidden md:block">
                        <OmniDropdown
                            label="Category"
                            value={categoryFilter}
                            onChange={setCategoryFilter}
                            options={[
                                { label: 'All Sevas', value: 'ALL' },
                                { label: 'Archana', value: 'ARCHANA' },
                                { label: 'Abhisheka', value: 'ABHISHEKA' },
                                { label: 'Homa', value: 'HOMA' },
                            ]}
                        />
                    </div>
                </div>
            </header>

            {/* SEVA GRID */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-1000">

                {loading ? (
                    // Skeleton Loading
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i}
                            className="h-56 rounded-[2rem] bg-slate-100/50 dark:bg-slate-800/50 animate-pulse relative overflow-hidden border border-white/20"
                            style={{ animationDelay: `${i * 100}ms` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shine" />
                        </div>
                    ))
                ) : filteredSevas.length > 0 ? (
                    filteredSevas.map((seva, index) => {
                        const theme = getSevaTheme(seva.name_eng);
                        return (
                            <div
                                key={seva.id}
                                onClick={() => setSelectedSevaForBooking(seva)}
                                style={{ animationDelay: `${index * 100}ms` }}
                                className={`
                                    group relative cursor-pointer 
                                    rounded-[2rem] p-[1px]
                                    opacity-0 animate-reveals
                                    transition-all duration-500 ease-out
                                    hover:-translate-y-2
                                `}
                            >
                                {/* Gradient Border Container */}
                                <div className={`
                                    absolute inset-0 rounded-[2rem] bg-gradient-to-br ${theme.glass} opacity-50 group-hover:opacity-100 transition-opacity
                                `}></div>

                                {/* Main Card Content */}
                                <div className={`
                                    relative h-full rounded-[2rem] p-6 lg:p-8
                                    bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl
                                    border ${theme.border}
                                    shadow-sm ${theme.glow}
                                    flex flex-col justify-between
                                    overflow-hidden
                                `}>
                                    {/* Background Decor */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-bl-full pointer-events-none opacity-50"></div>

                                    {/* Header & Icon */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`
                                            w-14 h-14 rounded-2xl flex items-center justify-center
                                            ${theme.iconBg} shadow-md
                                            group-hover:scale-110 group-hover:rotate-6 transition-all duration-500
                                        `}>
                                            <Sparkles size={24} className="animate-pulse-slow" />
                                        </div>

                                        {/* Action Button (Hidden until hover) */}
                                        <div className="
                                            w-10 h-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900
                                            flex items-center justify-center opacity-0 scale-75 
                                            group-hover:opacity-100 group-hover:scale-100 
                                            transition-all duration-300 shadow-lg
                                        ">
                                            <Plus size={20} />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div>
                                        <h3 className={`
                                            text-2xl font-black font-heading leading-tight mb-2
                                            bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300
                                            bg-clip-text text-transparent
                                        `}>
                                            {lang === 'KN'
                                                ? <span className="lang-kn leading-relaxed">{seva.name_kan}</span>
                                                : seva.name_eng
                                            }
                                        </h3>

                                        <div className="flex items-end justify-between mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">
                                                    Dakshina
                                                </span>
                                                <div className="flex items-center gap-1 font-display font-bold text-2xl text-temple-green dark:text-temple-green">
                                                    <span className="text-lg">₹</span>
                                                    {seva.price}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 animate-in fade-in zoom-in-95">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                            <Search size={40} className="opacity-50" />
                        </div>
                        <h3 className="text-xl font-heading font-bold text-slate-600 dark:text-slate-300 mb-2">
                            No offerings found
                        </h3>
                        <p className="max-w-xs text-center">
                            Try adjusting your search terms or category filters.
                        </p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {selectedSevaForBooking && (
                <BookingModal
                    isOpen={!!selectedSevaForBooking}
                    onClose={() => setSelectedSevaForBooking(null)}
                    seva={selectedSevaForBooking}
                    lang={lang}
                />
            )}
        </div>
    );
};

export default Dashboard;
