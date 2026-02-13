import React, { useState, useEffect } from 'react';
import { useTempleTime } from '../context/TimeContext';
import { Calendar, Truck, MapPin, Printer, Filter, Search, ArrowLeft, Moon, Sun, Sparkles, Plus, Check, Package, Send, X, MessageCircle } from 'lucide-react';
import { OmniInput, OmniToggle } from './ui/Widgets';
import api from '../services/api';
import ShaswataForm from './ShaswataForm'; // [NEW] Embedded Booking Wizard
import { MASAS, PAKSHAS_BILINGUAL, TITHIS_BILINGUAL } from './constants'; // [NEW] For Panchangam Selector

/* 
  SHASWATA POOJA DASHBOARD 
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
    const [allSubscriptions, setAllSubscriptions] = useState([]); // [NEW] All subscriptions for global search
    const [searchLoading, setSearchLoading] = useState(false); // [NEW] Search loading state
    const [panchangam, setPanchangam] = useState(null); // [NEW] Panchang State
    const [isBookingOpen, setIsBookingOpen] = useState(false); // [NEW] Modal State
    const [filters, setFilters] = useState({
        searchQuery: ''
    });

    // === [NEW] SELECTOR MODE: CALENDAR (Gregorian) or PANCHANGAM (Lunar) ===
    const [selectorMode, setSelectorMode] = useState('CALENDAR'); // 'CALENDAR' | 'PANCHANGAM'
    const [lunarFilter, setLunarFilter] = useState({
        masa: '',
        paksha: '',
        tithi: ''
    });
    const [panchangamDropdownOpen, setPanchangamDropdownOpen] = useState(false); // [NEW] Controls panchangam popup

    // === ACTION STATUS TRACKING ===
    // Stores { [pujaId]: { poojaPerformed: boolean, dispatched: boolean } }
    const [actionStatus, setActionStatus] = useState({});

    // === CONFIRMATION MODAL STATE ===
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: null, // 'pooja' or 'dispatch'
        puja: null
    });

    // === PENDING FEEDBACK COUNT (Automation Badge) ===
    const [pendingFeedbackCount, setPendingFeedbackCount] = useState(0);

    // --- FETCH DATA ---
    useEffect(() => {
        fetchDispatchList();
    }, [selectedDate]);

    // Fetch pending feedback count on mount
    useEffect(() => {
        const fetchPendingFeedback = async () => {
            try {
                const response = await api.get('/subscriptions/pending-feedback');
                setPendingFeedbackCount(response.data?.length || 0);
            } catch (error) {
                console.error("Failed to fetch pending feedback:", error);
            }
        };
        fetchPendingFeedback();
    }, []);

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

                // [NEW] Sync Dropdowns with Calendar Date
                // If the user picked a date, pre-fill the dropdowns with that date's panchangam
                if (response.data.panchangam && selectorMode === 'CALENDAR') {
                    setLunarFilter({
                        masa: response.data.panchangam.attributes.maasa,
                        paksha: response.data.panchangam.attributes.paksha,
                        tithi: response.data.panchangam.attributes.tithi
                    });
                }
            }
        } catch (error) {
            console.error("Failed to fetch dispatch list", error);
        } finally {
            setLoading(false);
        }
    };

    // [NEW] Fetch ALL subscriptions for global search
    const fetchAllSubscriptions = async () => {
        setSearchLoading(true);
        try {
            const response = await api.get('/shaswata/list', { params: { active_only: true } });
            setAllSubscriptions(response.data || []);
        } catch (error) {
            console.error("Failed to fetch all subscriptions", error);
        } finally {
            setSearchLoading(false);
        }
    };

    // Fetch all subscriptions on mount for search
    useEffect(() => {
        fetchAllSubscriptions();
    }, []);

    // [NEW] Normalize subscription data from /shaswata/list to match card display fields
    const normalizeSubscription = (sub) => ({
        ...sub,
        // Map shaswata/list fields to card-expected fields
        name: sub.name || sub.devotee_name || sub.full_name_en || 'Unknown',
        phone: sub.phone || sub.phone_number || null,
        seva: sub.seva || sub.seva_name || 'Shaswata Seva',
        type: sub.type || sub.subscription_type || 'LUNAR',
        // Derive scheduled_date from lunar_date or gregorian_date
        scheduled_date: sub.scheduled_date || sub.lunar_date || sub.gregorian_date || null
    });

    // [NEW] Reverse Sync: Panchangam Selection -> Calendar Date
    // [NEW] Reverse Sync: Panchangam Selection -> Calendar Date
    useEffect(() => {
        const syncDate = async () => {
            // Only run if strict panchangam selection is active
            if (selectorMode === 'PANCHANGAM' && lunarFilter.masa && lunarFilter.paksha && lunarFilter.tithi) {
                console.log("Attempting reverse sync for:", lunarFilter);

                // Fuzzy match helper
                const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

                // 1. Try to find a subscription with a matching lunar date string
                const match = allSubscriptions.find(sub => {
                    const subLunar = normalize(sub.lunar_date);
                    const m = normalize(lunarFilter.masa);
                    const p = normalize(lunarFilter.paksha);
                    let t = normalize(lunarFilter.tithi);

                    if (t === 'shashthi') t = 'shasti'; // Alias handling
                    const tVariant = t === 'shasti' ? 'shashthi' : t;

                    const hasMasa = subLunar.includes(m);
                    const hasPaksha = subLunar.includes(p);
                    const hasTithi = subLunar.includes(t) || subLunar.includes(tVariant);

                    return hasMasa && hasPaksha && hasTithi && (sub.scheduled_date || sub.gregorian_date);
                });

                if (match) {
                    const rawDate = match.scheduled_date || match.gregorian_date;
                    console.log("Found subscription match:", rawDate);

                    // Simple Parse for Match
                    let newDate = null;
                    if (rawDate.match(/^\d{2}-\d{2}-\d{4}$/)) {
                        const [d, m, y] = rawDate.split('-');
                        newDate = `${y}-${m}-${d}`;
                    } else if (rawDate.match(/^[a-zA-Z]{3,}\s\d{1,2}$/)) {
                        // Parse "Feb 7"
                        const [monStr, dayStr] = rawDate.split(/\s+/);
                        const months = { 'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06', 'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12' };
                        const m = months[monStr.toLowerCase().substring(0, 3)];
                        const d = dayStr.padStart(2, '0');
                        if (m) newDate = `${new Date().getFullYear()}-${m}-${d}`;
                    }

                    if (newDate && newDate !== selectedDate) setSelectedDate(newDate);
                    return;
                }

                // 2. API Fallback: If no subscription found, ask the Oracle
                console.log("No subscription match. Asking backend Oracle...");
                try {
                    const response = await api.get('/panchangam/find', {
                        params: {
                            masa: lunarFilter.masa,
                            paksha: lunarFilter.paksha,
                            tithi: lunarFilter.tithi,
                            year: new Date().getFullYear()
                        }
                    });

                    if (response.data && response.data.date) {
                        console.log("Oracle returned date:", response.data.date);
                        if (response.data.date !== selectedDate) {
                            setSelectedDate(response.data.date);
                        }
                    }
                } catch (error) {
                    console.warn("Oracle could not find date:", error);
                }
            }
        };

        syncDate();
    }, [lunarFilter, selectorMode, allSubscriptions]);

    // --- LOGIC ---
    // Determine data source based on mode and search
    const getDataSource = () => {
        if (filters.searchQuery.length > 0) {
            return allSubscriptions; // Global search uses all subscriptions
        }
        if (selectorMode === 'PANCHANGAM' && (lunarFilter.masa || lunarFilter.paksha || lunarFilter.tithi)) {
            return allSubscriptions; // Panchangam mode uses all subscriptions with lunar filter
        }
        return pujas; // Calendar mode uses date-filtered pujas
    };

    const rawDisplayData = getDataSource();
    const displayData = rawDisplayData.map(normalizeSubscription);

    const filteredPujas = displayData.filter(puja => {
        // 1. Only show Shaswata subscriptions (exclude regular bookings)
        if (puja.type === 'BOOKING') return false;

        // 2. Search Filter (takes priority)
        if (filters.searchQuery) {
            const q = filters.searchQuery.toLowerCase();
            return (
                puja.name?.toLowerCase().includes(q) ||
                puja.devotee_name?.toLowerCase().includes(q) ||
                puja.full_name?.toLowerCase().includes(q) ||
                puja.address?.toLowerCase().includes(q) ||
                puja.phone?.toLowerCase().includes(q) ||
                puja.seva?.toLowerCase().includes(q) ||
                puja.gothra?.toLowerCase().includes(q)
            );
        }

        // 3. PANCHANGAM Mode: Filter by Lunar Date (Masa/Paksha/Tithi)
        if (selectorMode === 'PANCHANGAM') {
            // Only filter LUNAR subscriptions
            if (puja.type !== 'LUNAR' && puja.subscription_type !== 'LUNAR') return false;

            const lunarDate = puja.lunar_date?.toLowerCase() || '';

            // Match against each filter component
            if (lunarFilter.masa && !lunarDate.includes(lunarFilter.masa.toLowerCase())) return false;
            if (lunarFilter.paksha && !lunarDate.includes(lunarFilter.paksha.toLowerCase())) return false;
            if (lunarFilter.tithi && !lunarDate.includes(lunarFilter.tithi.toLowerCase())) return false;

            return true;
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

    // === MESSAGING UTILS (Temple OS Communication Hub) ===
    const generateMessage = (type, devotee, seva, dateInfo) => {
        const phone = "9448066755"; // Temple Admin/Contact
        const greeting = `Namaste ${devotee},`;

        switch (type) {
            case 'REMINDER':
                return `${greeting} today (${dateInfo}) your Shaswata Seva (${seva}) will be performed at Kukke Subramanya Temple. May the Lord bless you.`;
            case 'DISPATCH':
                return `${greeting} your ${seva} has been performed successfully. The Prasadam has been dispatched to your address. It will arrive within 3-5 days. For queries, contact ${phone}.`;
            case 'FEEDBACK':
                return `${greeting} checking if you received the Prasadam for your ${seva}. May Subramanya Swamy's blessings be with you.`;
            default:
                return '';
        }
    };

    const handleSendMessage = (type, puja) => {
        const msg = generateMessage(type, puja.name, puja.seva, puja.date_info);
        const url = `https://wa.me/91${puja.phone}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    // === AUTOMATION API CALLS (Stage 3) ===
    const handleLogDispatch = async (puja) => {
        try {
            await api.patch(`/subscriptions/${puja.id}/dispatch`);
            // Update local state
            setActionStatus(prev => ({
                ...prev,
                [puja.id]: { ...prev[puja.id], dispatched: true }
            }));
            // Open WhatsApp with dispatch message
            handleSendMessage('DISPATCH', puja);
        } catch (error) {
            console.error("Failed to log dispatch:", error);
            alert("Failed to log dispatch. Please try again.");
        }
    };

    const handleLogFeedback = async (puja) => {
        try {
            await api.patch(`/subscriptions/${puja.id}/feedback`);
            // Open WhatsApp with feedback message
            handleSendMessage('FEEDBACK', puja);
        } catch (error) {
            console.error("Failed to log feedback:", error);
            alert("Failed to log feedback. Please try again.");
        }
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
                            Shaswata Pooja
                        </h1>
                        <div className="flex items-center gap-3">
                            <p className="text-slate-500 dark:text-slate-400 font-medium">
                                Shashwata Seva Fulfillment & Logistics
                            </p>
                            {/* Pending Feedback Badge */}
                            {pendingFeedbackCount > 0 && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-full animate-pulse">
                                    <MessageCircle size={12} />
                                    {pendingFeedbackCount} Pending Feedback
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
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

                        {/* Panchangam Display (Same style as Date Picker) */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Moon className="h-5 w-5 text-indigo-500" />
                            </div>
                            <button
                                onClick={() => setPanchangamDropdownOpen(!panchangamDropdownOpen)}
                                className={`
                                    pl-10 pr-4 py-3 min-w-[200px]
                                    bg-white/50 dark:bg-slate-800/50 backdrop-blur-md
                                    border ${panchangamDropdownOpen ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-slate-200 dark:border-slate-700'}
                                    rounded-2xl font-bold text-slate-700 dark:text-slate-200
                                    hover:border-indigo-400 transition-all cursor-pointer
                                    text-left flex items-center justify-between gap-2
                                `}
                            >
                                <span className="truncate text-sm">
                                    {lunarFilter.masa && lunarFilter.paksha && lunarFilter.tithi
                                        ? `${lunarFilter.masa} • ${lunarFilter.paksha} • ${lunarFilter.tithi}`
                                        : panchangam
                                            ? `${panchangam.attributes.maasa} • ${panchangam.attributes.paksha} • ${panchangam.attributes.tithi}`
                                            : 'Select Panchangam...'}
                                </span>
                                <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${panchangamDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Panchangam Dropdown Popup */}
                            {panchangamDropdownOpen && (
                                <div className="absolute top-full mt-2 left-0 z-50 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 duration-200">
                                    <p className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest text-xs mb-4">Select Panchangam</p>

                                    {/* Masa */}
                                    <div className="mb-3">
                                        <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1 block">Masa (Month)</label>
                                        <select
                                            value={lunarFilter.masa}
                                            onChange={(e) => {
                                                setLunarFilter(prev => ({ ...prev, masa: e.target.value }));
                                                if (e.target.value) setSelectorMode('PANCHANGAM');
                                            }}
                                            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="">All Masas</option>
                                            {MASAS.map(m => (
                                                <option key={m.en} value={m.en}>{m.en} ({m.kn})</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Paksha */}
                                    <div className="mb-3">
                                        <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1 block">Paksha (Fortnight)</label>
                                        <select
                                            value={lunarFilter.paksha}
                                            onChange={(e) => {
                                                setLunarFilter(prev => ({ ...prev, paksha: e.target.value }));
                                                if (e.target.value) setSelectorMode('PANCHANGAM');
                                            }}
                                            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="">All Pakshas</option>
                                            {PAKSHAS_BILINGUAL.map(p => (
                                                <option key={p.en} value={p.en}>{p.en} ({p.kn})</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Tithi */}
                                    <div className="mb-4">
                                        <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1 block">Tithi (Lunar Day)</label>
                                        <select
                                            value={lunarFilter.tithi}
                                            onChange={(e) => {
                                                setLunarFilter(prev => ({ ...prev, tithi: e.target.value }));
                                                if (e.target.value) setSelectorMode('PANCHANGAM');
                                            }}
                                            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="">All Tithis</option>
                                            {TITHIS_BILINGUAL.map(t => (
                                                <option key={t.en} value={t.en}>{t.en} ({t.kn})</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPanchangamDropdownOpen(false)}
                                            className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all"
                                        >
                                            Done
                                        </button>
                                        <button
                                            onClick={() => {
                                                setLunarFilter({ masa: '', paksha: '', tithi: '' });
                                                setSelectorMode('CALENDAR');
                                            }}
                                            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                            )}
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

            {/* --- CONTROLS (Search Only) --- */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <OmniInput
                        icon={Search}
                        placeholder="Search devotee or address..."
                        value={filters.searchQuery}
                        onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                    />

                    {/* Active Filter Indicator */}
                    {selectorMode === 'PANCHANGAM' && (lunarFilter.masa || lunarFilter.paksha || lunarFilter.tithi) && (
                        <div className="flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 px-4 py-3 rounded-2xl">
                            <Moon size={16} className="text-indigo-600 dark:text-indigo-400" />
                            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                                Panchangam Filter: {lunarFilter.masa || '•'} • {lunarFilter.paksha || '•'} • {lunarFilter.tithi || '•'}
                            </span>
                            <button
                                onClick={() => {
                                    setLunarFilter({ masa: '', paksha: '', tithi: '' });
                                    setSelectorMode('CALENDAR');
                                }}
                                className="ml-auto text-indigo-500 hover:text-indigo-700"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

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
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Scheduled Date</p>
                                        <div className={`flex items-center justify-end gap-1.5 text-xs font-bold ${puja.type === 'LUNAR' ? 'text-indigo-500 dark:text-indigo-400' :
                                            puja.type === 'GREGORIAN' ? 'text-emerald-600 dark:text-emerald-400' :
                                                'text-slate-500'
                                            }`}>
                                            {puja.type === 'LUNAR' && <Moon size={12} />}
                                            {puja.type === 'GREGORIAN' && <Calendar size={12} />}

                                            <span className="truncate max-w-[120px]" title={puja.date_info}>
                                                {puja.date_info || (puja.type === 'LUNAR' ? 'Vedic (Tithi)' : 'Fixed Date')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* === COMMUNICATION HUB (Stage 1, 2, 3) === */}
                                <div className="mb-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3 border border-slate-100 dark:border-white/5">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Devotee Communication</p>
                                    <div className="flex gap-2">
                                        {/* Stage 1: Reminder (Before/On Seva Day) */}
                                        {!isPoojaPerformed(puja.id) && (
                                            <button
                                                onClick={() => handleSendMessage('REMINDER', puja)}
                                                className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                <MessageCircle size={14} /> Send Reminder
                                            </button>
                                        )}

                                        {/* Stage 2 & 3: Dispatch & Feedback (After Seva) */}
                                        {isPoojaPerformed(puja.id) && (
                                            <>
                                                {/* Stage 2: Dispatch Update - Uses API + WhatsApp */}
                                                {!isDispatched(puja.id) && (
                                                    <button
                                                        onClick={() => handleLogDispatch(puja)}
                                                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors"
                                                    >
                                                        <Send size={14} /> Dispatch & Notify
                                                    </button>
                                                )}

                                                {/* Stage 3: Feedback (Only shown if Dispatched) - Uses API + WhatsApp */}
                                                {isDispatched(puja.id) && (
                                                    <button
                                                        onClick={() => handleLogFeedback(puja)}
                                                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300 text-xs font-bold rounded-lg hover:bg-purple-100 transition-colors"
                                                    >
                                                        <MessageCircle size={14} /> Ask Feedback
                                                    </button>
                                                )}
                                            </>
                                        )}
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
