import React, { useState, useEffect } from 'react';
import { useTempleTime } from '../context/TimeContext';
import { Calendar, Truck, MapPin, Printer, Filter, Search, ArrowLeft, Moon, Sparkles, Plus } from 'lucide-react';
import { OmniInput, OmniToggle } from './ui/Widgets';
import api from '../services/api';
import ShaswataForm from './ShaswataForm'; // [NEW] Embedded Booking Wizard

/* 
  PRASADAM DISPATCH DASHBOARD 
  Theme: Divine Glass 3.0 (Logistics)
*/

const PrasadamDispatch = ({ onBack, lang = 'EN' }) => {
    // --- STATE ---
    const { currentDate } = useTempleTime();
    const [selectedDate, setSelectedDate] = useState(() => {
        return currentDate.toISOString().split('T')[0];
    });

    const [loading, setLoading] = useState(false);
    const [pujas, setPujas] = useState([]);
    const [panchangam, setPanchangam] = useState(null); // [NEW] Panchang State
    const [isBookingOpen, setIsBookingOpen] = useState(false); // [NEW] Modal State
    const [filters, setFilters] = useState({
        onlyShashwata: true,
        searchQuery: ''
    });

    // --- FETCH DATA ---
    useEffect(() => {
        fetchDispatchList();
    }, [selectedDate]);

    const fetchDispatchList = async () => {
        setLoading(true);
        // Format YYYY-MM-DD -> DD-MM-YYYY for backend
        const [year, month, day] = selectedDate.split('-');
        const backendDate = `${day}-${month}-${year}`;

        try {
            const response = await api.get(`/daily-sankalpa?date_str=${backendDate}`);

            // Backend returns { pujas: [...], panchangam: {...} }
            if (response.data) {
                setPujas(response.data.pujas || []);
                setPanchangam(response.data.panchangam);
            }
        } catch (error) {
            console.error("Failed to fetch dispatch list", error);
        } finally {
            setLoading(false);
        }
    };

    // --- LOGIC ---
    const filteredPujas = pujas.filter(puja => {
        // 1. Shashwata Filter
        if (filters.onlyShashwata && puja.type === 'BOOKING') return false;

        // 2. Search Filter
        if (filters.searchQuery) {
            const q = filters.searchQuery.toLowerCase();
            return (
                puja.name?.toLowerCase().includes(q) ||
                puja.address?.toLowerCase().includes(q) ||
                puja.seva?.toLowerCase().includes(q)
            );
        }

        return true;
    });

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen p-6 animate-in fade-in zoom-in duration-300">

            {/* --- HEADER --- */}
            <header className="max-w-7xl mx-auto mb-10">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-temple-saffron transition-colors mb-4 font-bold text-sm">
                    <ArrowLeft size={16} /> Back to Home
                </button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black font-heading text-slate-800 dark:text-amber-100 mb-2">
                            Prasadam Dispatch
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Shashwata Seva Fulfillment & Logistics
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Date Picker (Glass Style) */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Calendar className="h-5 w-5 text-temple-saffron" />
                            </div>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="
                                    pl-10 pr-4 py-3 
                                    bg-white/50 dark:bg-slate-800/50 backdrop-blur-md
                                    border border-slate-200 dark:border-slate-700
                                    rounded-2xl font-bold text-slate-700 dark:text-slate-200
                                    focus:ring-2 focus:ring-temple-gold outline-none
                                    cursor-pointer
                                "
                            />
                        </div>

                        {/* NEW: Booking Button */}
                        <button
                            onClick={() => setIsBookingOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center gap-2 font-bold"
                        >
                            <Sparkles size={20} className="fill-indigo-300 text-indigo-200" />
                            <span>New Seva</span>
                        </button>

                        <button
                            onClick={handlePrint}
                            className="bg-temple-saffron hover:bg-orange-600 text-white p-3 rounded-2xl shadow-lg shadow-orange-500/30 transition-all active:scale-95"
                            title="Print Labels"
                        >
                            <Printer size={24} />
                        </button>
                    </div>
                </div>
            </header>

            {/* --- CONTROLS --- */}
            <div className="max-w-7xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Search */}
                <OmniInput
                    icon={Search}
                    placeholder="Search devotee or address..."
                    value={filters.searchQuery}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                />

                {/* Filters */}
                <div className="flex items-center gap-6 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                    <Filter className="text-slate-400" size={20} />
                    <OmniToggle
                        label="Only Shashwata Sevas"
                        checked={filters.onlyShashwata}
                        onChange={(checked) => setFilters(prev => ({ ...prev, onlyShashwata: checked }))}
                    />
                </div>
            </div>

            {/* --- PANCHANGAM BANNER --- */}
            {panchangam && (
                <div className="max-w-7xl mx-auto mb-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-[2rem] p-6 text-white shadow-xl border border-white/10 relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Calendar size={120} />
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-center md:text-left">
                                <p className="text-amber-400 font-bold uppercase tracking-widest text-xs mb-1">Daily Panchangam</p>
                                <h2 className="text-3xl font-black font-heading text-white">
                                    {panchangam.attributes.tithi}
                                </h2>
                                <p className="text-slate-300 font-medium text-lg mt-1">
                                    {panchangam.attributes.maasa} Maasa • {panchangam.attributes.paksha} Paksha
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center min-w-[100px] border border-white/10">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Nakshatra</p>
                                    <p className="font-bold text-amber-200 truncate">{panchangam.attributes.nakshatra}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center min-w-[100px] border border-white/10">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Yoga</p>
                                    <p className="font-bold text-amber-200 truncate">{panchangam.attributes.yoga}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- LIST --- */}
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="py-20 text-center">
                        <div className="inline-block animate-spin text-temple-saffron mb-4">
                            <Truck size={48} />
                        </div>
                        <p className="text-slate-500 font-medium">Finding scheduled deliveries...</p>
                    </div>
                ) : filteredPujas.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                        <Truck size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-bold text-slate-400">No Dispatches Found</h3>
                        <p className="text-slate-400">Try changing the date or filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2">
                        {filteredPujas.map((puja) => (
                            <div
                                key={puja.id}
                                className="
                                    bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl 
                                    rounded-[2rem] p-6 
                                    border border-slate-100 dark:border-white/5 
                                    shadow-sm hover:shadow-xl transition-all hover:-translate-y-1
                                    relative group overflow-hidden
                                "
                            >
                                {/* Top Strip */}
                                <div className={`absolute top-0 left-0 right-0 h-1.5 ${puja.type === 'BOOKING' ? 'bg-slate-400' : 'bg-gradient-to-r from-temple-gold to-temple-saffron'}`} />

                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight">
                                            {puja.name}
                                        </h3>
                                        <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1">
                                            {puja.phone || 'No Phone'}
                                        </p>
                                    </div>
                                    <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-xl text-orange-600 dark:text-orange-400">
                                        <MapPin size={20} />
                                    </div>
                                </div>

                                {/* Ritual Details Grid */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {puja.gothra && (
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Gothra</p>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{puja.gothra}</p>
                                        </div>
                                    )}
                                    {puja.rashi && (
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Rashi</p>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{puja.rashi}</p>
                                        </div>
                                    )}
                                    {puja.nakshatra && (
                                        <div className="col-span-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Nakshatra</p>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{puja.nakshatra}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Address Section */}
                                <div className="
                                    bg-slate-50 dark:bg-black/20 
                                    rounded-xl p-4 mb-4 
                                    min-h-[80px] flex flex-col justify-center
                                    border border-slate-100 dark:border-white/5
                                ">
                                    {puja.address ? (
                                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium whitespace-pre-wrap leading-relaxed">
                                            {puja.address}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-red-400 italic font-bold flex items-center gap-1">
                                            ⚠️ No Address Found
                                        </p>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Seva</p>
                                        <p className="text-sm font-bold text-temple-brown dark:text-amber-100 truncate max-w-[150px]" title={puja.seva}>
                                            {puja.seva}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Matching Logic</p>
                                        <div className={`flex items-center justify-end gap-1.5 text-xs font-bold ${puja.type === 'LUNAR' ? 'text-indigo-500 dark:text-indigo-400' :
                                            puja.type === 'GREGORIAN' ? 'text-emerald-600 dark:text-emerald-400' :
                                                'text-slate-500'
                                            }`}>
                                            {puja.type === 'LUNAR' && <Moon size={12} />}
                                            {puja.type === 'GREGORIAN' && <Calendar size={12} />}

                                            {puja.type === 'LUNAR' ? 'Vedic (Tithi)' :
                                                puja.type === 'GREGORIAN' ? 'Fixed Date' :
                                                    'One-Time'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page { margin: 0.5cm; }
                    body * {
                        visibility: hidden;
                    }
                    .animate-in {
                        animation: none !important;
                    }
                    .min-h-screen {
                        padding: 0 !important;
                    }
                    /* Only show list */
                    .max-w-7xl, .max-w-7xl * {
                        visibility: visible;
                    }
                    /* Hide headers, inputs, buttons */
                    header, button, input, .bg-white\\/40, .border-dashed {
                        display: none !important;
                    }
                }
            `}</style>

            {/* --- BOOKING WIZARD OVERLAY --- */}
            <ShaswataForm
                isOpen={isBookingOpen}
                onClose={() => setIsBookingOpen(false)}
                lang={lang}
                initialContext={{
                    date: selectedDate,
                    panchangam: panchangam
                }}
            />
        </div>
    );
};

export default PrasadamDispatch;
