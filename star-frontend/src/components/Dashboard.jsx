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
// Omni-UI Components
import { OmniInput, OmniDropdown, OmniToggle } from './ui/Widgets';
// Modals
import BookingModal from './BookingModal';

// --- VEDIC GLASS THEME ENGINE ---
const getSevaTheme = (sevaName) => {
    const name = (sevaName || '').toLowerCase();
    // Fire / Homa -> Ember / Amber
    if (name.includes('archane') || name.includes('homa') || name.includes('mangalarathi'))
        return {
            card: 'bg-gradient-to-br from-orange-50/80 to-amber-100/30 border-orange-200 dark:from-orange-900/20 dark:to-slate-900',
            iconBg: 'bg-orange-100 text-orange-600',
            accent: 'text-orange-700'
        };
    // Water / Abhisheka -> Cyan / Sky
    if (name.includes('abhisheka') || name.includes('theertha') || name.includes('panchamrutha'))
        return {
            card: 'bg-gradient-to-br from-cyan-50/80 to-blue-100/30 border-cyan-200 dark:from-cyan-900/20 dark:to-slate-900',
            iconBg: 'bg-cyan-100 text-cyan-600',
            accent: 'text-cyan-700'
        };
    // Nature / Alankara -> Rose / Pink
    if (name.includes('alankara') || name.includes('pushpa') || name.includes('flower'))
        return {
            card: 'bg-gradient-to-br from-rose-50/80 to-pink-100/30 border-rose-200 dark:from-rose-900/20 dark:to-slate-900',
            iconBg: 'bg-rose-100 text-rose-600',
            accent: 'text-rose-700'
        };
    // Default -> Slate Glass
    return {
        card: 'bg-gradient-to-br from-slate-50/80 to-gray-100/30 border-slate-200 dark:from-slate-800/30 dark:to-slate-900',
        iconBg: 'bg-slate-100 text-slate-600',
        accent: 'text-slate-700'
    };
};

const getLocalDateStr = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const Dashboard = ({ onBack, lang = 'EN' }) => {
    const t = TRANSLATIONS[lang];
    const { currentDate } = useTempleTime(); // The Midnight Watcher Source

    // State
    const [selectedDate, setSelectedDate] = useState(currentDate);
    const [sevas, setSevas] = useState([]); // Master Catalog
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');

    // Selection for Booking
    const [selectedSevaForBooking, setSelectedSevaForBooking] = useState(null);

    // --- MIDNIGHT WATCHER SYNC ---
    useEffect(() => {
        setSelectedDate(currentDate);
    }, [currentDate]);

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchCatalog = async () => {
            setLoading(true);
            try {
                // In a real app we might fetch catalog separately mostly static
                // Using existing /sevas endpoint if available or hardcoded for demo
                // simulating fetch
                const response = await api.get('/sevas');
                setSevas(response.data || []);
            } catch (err) {
                console.error("Catalog Fetch Error", err);
            } finally {
                // Artificial delay for Skeleton Demo
                setTimeout(() => setLoading(false), 800);
            }
        };
        fetchCatalog();
    }, []);

    // --- FILTER ---
    const filteredSevas = sevas.filter(seva => {
        const matchSearch = seva.name_eng?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            seva.name_kan?.includes(searchTerm);
        const matchCat = categoryFilter === 'ALL' || seva.name_eng?.toUpperCase().includes(categoryFilter); // Simple heuristic
        return matchSearch && matchCat;
    });

    return (
        <div className="min-h-screen p-4 md:p-8 animate-in fade-in duration-500 pb-32">

            {/* Header: Omni-Input & Navigation */}
            <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all hover:-translate-x-1">
                        <ChevronLeft className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black font-heading text-slate-800 dark:text-white tracking-tight">
                            {t.bookSeva || "Seva Booking"}
                        </h1>
                        <p className="text-slate-500 font-medium">Select a divine offering</p>
                    </div>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <div className="w-full md:w-64">
                        <OmniInput
                            icon={Search}
                            placeholder="Find Seva..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Dummy Filter for Demo */}
                    <div className="w-40 hidden md:block">
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

            {/* SEVA GRID SYSTEM (CSS SUBGRID LOGIC) */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {loading ? (
                    // --- SKELETON LOADERS (PULSE GRID) ---
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-48 rounded-3xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-pulse relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 animate-shine opacity-50" />
                        </div>
                    ))
                ) : filteredSevas.length > 0 ? (
                    filteredSevas.map((seva) => {
                        const theme = getSevaTheme(seva.name_eng);
                        return (
                            <div
                                key={seva.id}
                                onClick={() => setSelectedSevaForBooking(seva)}
                                className={`
                                    relative group cursor-pointer 
                                    rounded-3xl p-6 
                                    border ${theme.card} 
                                    backdrop-blur-md shadow-sm hover:shadow-2xl 
                                    transition-all duration-500 ease-out 
                                    hover:-translate-y-2 hover:scale-[1.02]
                                `}
                            >
                                {/* Floating Icon */}
                                <div className={`
                                    absolute top-6 right-6 w-12 h-12 rounded-2xl 
                                    flex items-center justify-center 
                                    ${theme.iconBg} shadow-sm 
                                    group-hover:rotate-12 transition-transform duration-500
                                `}>
                                    <Sparkles size={20} />
                                </div>

                                <div className="mt-2">
                                    <div className="h-20 flex items-start pr-12">
                                        <h3 className={`text-xl font-black font-heading leading-tight ${theme.accent} dark:text-slate-100`}>
                                            {lang === 'KN' ? seva.name_kan : seva.name_eng}
                                        </h3>
                                    </div>

                                    <div className="flex items-end justify-between mt-4 border-t border-slate-400/10 pt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dakshina</span>
                                            <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-black text-2xl">
                                                <IndianRupee size={20} strokeWidth={3} />
                                                {seva.price}
                                            </div>
                                        </div>

                                        <button className="bg-slate-900 text-white p-3 rounded-xl opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-400">
                        <Search size={48} className="mb-4 opacity-50" />
                        <p className="text-lg font-medium">No sevas found matching your search.</p>
                    </div>
                )}

            </div>

            {/* MODAL INJECTION */}
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
