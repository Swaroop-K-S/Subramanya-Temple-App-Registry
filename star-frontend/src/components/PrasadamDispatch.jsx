import React, { useState, useEffect } from 'react';
import { useTempleTime } from '../context/TimeContext';
import { Calendar, Truck, MapPin, Printer, Filter, Search, ArrowLeft, Moon, Sparkles, Plus, Check, Package, Send, X } from 'lucide-react';
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

    // === ACTION STATUS TRACKING ===
    // Stores { [pujaId]: { poojaPerformed: boolean, dispatched: boolean } }
    const [actionStatus, setActionStatus] = useState({});

    // === CONFIRMATION MODAL STATE ===
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: null, // 'pooja' or 'dispatch'
        puja: null
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

    // === ACTION HANDLERS (Temple OS Compliant) ===
    const openConfirmModal = (type, puja) => {
        setConfirmModal({ isOpen: true, type, puja });
    };

    const closeConfirmModal = () => {
        setConfirmModal({ isOpen: false, type: null, puja: null });
    };

    const handleConfirmAction = () => {
        const { type, puja } = confirmModal;
        if (!puja) return;

        setActionStatus(prev => ({
            ...prev,
            [puja.id]: {
                ...prev[puja.id],
                ...(type === 'pooja' ? { poojaPerformed: true } : { dispatched: true })
            }
        }));
        closeConfirmModal();
    };

    // Check status helpers
    const isPoojaPerformed = (pujaId) => actionStatus[pujaId]?.poojaPerformed || false;
    const isDispatched = (pujaId) => actionStatus[pujaId]?.dispatched || false;

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
                                        {/* === OCCASION & BOOKING TYPE BADGES === */}
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {/* Occasion Badge */}
                                            {puja.occasion && (
                                                <span className="
                                                    inline-flex items-center gap-1 px-2 py-1 
                                                    bg-violet-100 dark:bg-violet-900/30 
                                                    text-violet-700 dark:text-violet-300 
                                                    text-xs font-bold rounded-lg
                                                ">
                                                    🎉 {puja.occasion}
                                                </span>
                                            )}
                                            {/* Subscription Type Badge */}
                                            {puja.type !== 'BOOKING' && (
                                                <span className={`
                                                    inline-flex items-center gap-1 px-2 py-1 
                                                    text-xs font-bold rounded-lg
                                                    ${puja.type === 'LUNAR'
                                                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                                        : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                                    }
                                                `}>
                                                    {puja.type === 'LUNAR' ? '🌙 Panchangam' : '📅 Calendar'}
                                                </span>
                                            )}
                                        </div>
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
                                <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4 mb-4">
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

                                {/* === ACTION BUTTONS (Temple OS Compliant) === */}
                                {/* 8-Point Grid: gap-4 = 16px, p-3 = 12px */}
                                {/* Affordance Theory: Shadows + Gradients for clickability */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Pooja Performed Button */}
                                    <button
                                        onClick={() => openConfirmModal('pooja', puja)}
                                        disabled={isPoojaPerformed(puja.id)}
                                        className={`
                                            flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm
                                            transition-all duration-300 active:scale-95
                                            ${isPoojaPerformed(puja.id)
                                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 cursor-default'
                                                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5'
                                            }
                                        `}
                                    >
                                        <Check size={16} className={isPoojaPerformed(puja.id) ? '' : 'animate-pulse'} />
                                        <span>{isPoojaPerformed(puja.id) ? 'Pooja Done' : 'Mark Complete'}</span>
                                    </button>

                                    {/* Dispatch Prasadam Button */}
                                    <button
                                        onClick={() => openConfirmModal('dispatch', puja)}
                                        disabled={!isPoojaPerformed(puja.id) || isDispatched(puja.id)}
                                        className={`
                                            flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm
                                            transition-all duration-300 active:scale-95
                                            ${isDispatched(puja.id)
                                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 cursor-default'
                                                : !isPoojaPerformed(puja.id)
                                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-temple-gold to-temple-saffron text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:-translate-y-0.5'
                                            }
                                        `}
                                    >
                                        <Package size={16} />
                                        <span>{isDispatched(puja.id) ? 'Dispatched' : 'Dispatch'}</span>
                                    </button>
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

            {/* === CONFIRMATION MODAL (Temple OS Deep Glass) === */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={closeConfirmModal}
                    />

                    {/* Modal Card - Deep Glass Physics */}
                    <div className="
                        relative z-10 w-full max-w-md
                        bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl
                        rounded-3xl p-8
                        border border-white/20 dark:border-white/10
                        shadow-2xl
                        animate-in zoom-in-95 slide-in-from-bottom-4 duration-300
                    ">
                        {/* Close Button */}
                        <button
                            onClick={closeConfirmModal}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <X size={20} />
                        </button>

                        {/* Icon Header */}
                        <div className={`
                            w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center
                            ${confirmModal.type === 'pooja'
                                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30'
                                : 'bg-gradient-to-br from-temple-gold to-temple-saffron shadow-lg shadow-amber-500/30'
                            }
                        `}>
                            {confirmModal.type === 'pooja'
                                ? <Check size={32} className="text-white" />
                                : <Package size={32} className="text-white" />
                            }
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl font-black font-heading text-center text-slate-800 dark:text-white mb-2">
                            {confirmModal.type === 'pooja'
                                ? 'Confirm Pooja Performed'
                                : 'Dispatch Prasadam'
                            }
                        </h3>

                        {/* Devotee Name */}
                        <p className="text-center text-slate-500 dark:text-slate-400 mb-6">
                            For <span className="font-bold text-slate-700 dark:text-slate-200">{confirmModal.puja?.name}</span>
                        </p>

                        {/* Message */}
                        <div className={`
                            p-4 rounded-2xl mb-6 text-center
                            ${confirmModal.type === 'pooja'
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30'
                                : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30'
                            }
                        `}>
                            {confirmModal.type === 'pooja' ? (
                                <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                                    ✨ The sacred pooja has been performed successfully.
                                    <br />A notification will be sent to the devotee.
                                </p>
                            ) : (
                                <p className="text-amber-700 dark:text-amber-300 font-medium">
                                    📦 Prasadam will be shipped to the devotee's address.
                                    <br />
                                    <span className="font-bold">Expected delivery: 3-5 days</span>
                                </p>
                            )}
                        </div>

                        {/* Action Buttons - 8pt Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={closeConfirmModal}
                                className="
                                    py-3 px-6 rounded-xl font-bold
                                    bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300
                                    hover:bg-slate-200 dark:hover:bg-slate-700 transition-all
                                    active:scale-95
                                "
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                className={`
                                    py-3 px-6 rounded-xl font-bold text-white
                                    transition-all active:scale-95
                                    ${confirmModal.type === 'pooja'
                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50'
                                        : 'bg-gradient-to-r from-temple-gold to-temple-saffron shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50'
                                    }
                                `}
                            >
                                {confirmModal.type === 'pooja' ? 'Confirm' : 'Send Prasadam'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
