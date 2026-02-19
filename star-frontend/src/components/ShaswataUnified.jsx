import React, { useState, useEffect, useCallback } from 'react';
import { useTempleTime } from '../context/TimeContext';
import {
    Calendar, Truck, MapPin, Printer, Search, ArrowLeft, Moon, Sparkles, Plus,
    Check, Package, Send, X, MessageCircle, Edit3, CheckCircle2, Clock,
    RefreshCw, AlertTriangle, Zap, Eye, Loader2, ClipboardCheck, Phone,
    Filter, ChevronDown
} from 'lucide-react';
import { OmniInput } from './ui/Widgets';
import api from '../services/api';
import ShaswataForm from './ShaswataForm';
import { MASAS, PAKSHAS_BILINGUAL, TITHIS_BILINGUAL } from './constants';

/*
  SHASWATA UNIFIED — Combined Lifecycle + Search + Booking
  =========================================================
  Tab 1: Dashboard  (Kanban lifecycle from ShaswataManager)
  Tab 2: Search     (Calendar/Panchangam search from PrasadamDispatch)
  Tab 3: Follow-Up  (Delivery checks)
*/

const STATUS_CONFIG = {
    PENDING: { label: 'Pending', icon: Clock, gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/30' },
    DISPATCHED: { label: 'Dispatched', icon: Truck, gradient: 'from-blue-400 to-indigo-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800/30' },
    DELIVERED: { label: 'Delivered', icon: CheckCircle2, gradient: 'from-emerald-400 to-green-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/30' },
    NOT_RECEIVED: { label: 'Not Received', icon: AlertTriangle, gradient: 'from-red-400 to-rose-500', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800/30' },
};

const ShaswataUnified = ({ onBack, lang = 'EN' }) => {
    // ===================== SHARED STATE =====================
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [toast, setToast] = useState(null);

    // ===================== DASHBOARD STATE (Kanban) =====================
    const [events, setEvents] = useState([]);
    const [pendingChecks, setPendingChecks] = useState([]);
    const [dashLoading, setDashLoading] = useState(true);
    const [populateLoading, setPopulateLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState({});
    const [daysFilter, setDaysFilter] = useState(30);

    // ===================== SEARCH STATE (Calendar/Panchangam) =====================
    const { currentDate } = useTempleTime();
    const [selectedDate, setSelectedDate] = useState(() => currentDate.toISOString().split('T')[0]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [pujas, setPujas] = useState([]);
    const [allSubscriptions, setAllSubscriptions] = useState([]);
    const [panchangam, setPanchangam] = useState(null);
    const [selectorMode, setSelectorMode] = useState('CALENDAR');
    const [lunarFilter, setLunarFilter] = useState({ masa: '', paksha: '', tithi: '' });
    const [panchangamDropdownOpen, setPanchangamDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionStatus, setActionStatus] = useState({});
    const [addressConfirmStatus, setAddressConfirmStatus] = useState({});
    const [editingAddress, setEditingAddress] = useState(null);
    const [editAddressForm, setEditAddressForm] = useState({ address: '', area: '', pincode: '' });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, puja: null });

    // ===================== TOAST =====================
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // ===================== DASHBOARD DATA =====================
    const fetchDashboard = useCallback(async () => {
        setDashLoading(true);
        try {
            const [evRes, chkRes] = await Promise.all([
                api.get(`/shaswata/upcoming?days=${daysFilter}`),
                api.get('/shaswata/pending-delivery-checks')
            ]);
            setEvents(evRes.data?.events || []);
            setPendingChecks(chkRes.data?.pending || []);
        } catch (e) { showToast('Failed to load dashboard', 'error'); }
        finally { setDashLoading(false); }
    }, [daysFilter]);

    useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

    // ===================== SEARCH DATA =====================
    const fetchSearchData = async () => {
        setSearchLoading(true);
        const [y, m, d] = selectedDate.split('-');
        try {
            const res = await api.get(`/daily-sankalpa?date_str=${d}-${m}-${y}`);
            if (res.data) {
                setPujas(res.data.pujas || []);
                setPanchangam(res.data.panchangam);
                if (res.data.panchangam && selectorMode === 'CALENDAR') {
                    setLunarFilter({
                        masa: res.data.panchangam.attributes.maasa,
                        paksha: res.data.panchangam.attributes.paksha,
                        tithi: res.data.panchangam.attributes.tithi
                    });
                }
            }
        } catch (e) { console.error('Search fetch failed', e); }
        finally { setSearchLoading(false); }
    };

    const fetchAllSubs = async () => {
        try {
            const r = await api.get('/shaswata/list', { params: { active_only: true } });
            setAllSubscriptions(r.data || []);
        } catch (e) { console.error('Sub fetch failed', e); }
    };

    useEffect(() => { if (activeTab === 'search') fetchSearchData(); }, [selectedDate, activeTab]);
    useEffect(() => { fetchAllSubs(); }, []);

    // ===================== DASHBOARD ACTIONS =====================
    const handlePopulate = async () => {
        setPopulateLoading(true);
        try {
            const r = await api.post(`/shaswata/events/populate?days=${daysFilter}`);
            showToast(`${r.data.events_created} events created, ${r.data.events_skipped} existed`);
            fetchDashboard();
        } catch (e) { showToast('Population failed', 'error'); }
        finally { setPopulateLoading(false); }
    };

    const handleEventAction = async (eventId, action, params = {}) => {
        setActionLoading(p => ({ ...p, [eventId]: action }));
        try {
            if (action === 'dispatch') await api.post(`/shaswata/events/${eventId}/dispatch`, null, { params: { dispatch_ref: params.ref } });
            else if (action === 'reminder') await api.post(`/shaswata/events/${eventId}/send-reminder`);
            else if (action === 'check') await api.post(`/shaswata/events/${eventId}/send-delivery-check`);
            else if (action === 'feedback') await api.post(`/shaswata/events/${eventId}/delivery-feedback`, null, { params: { received: params.received, notes: params.notes } });
            showToast(action === 'dispatch' ? 'Dispatched!' : action === 'reminder' ? 'Reminder sent!' : action === 'check' ? 'Check sent!' : params.received ? 'Confirmed!' : 'Followup created');
            fetchDashboard();
        } catch (e) { showToast(`${action} failed`, 'error'); }
        finally { setActionLoading(p => ({ ...p, [eventId]: null })); }
    };

    // ===================== SEARCH HELPERS =====================
    const normSub = (s) => ({
        ...s, name: s.name || s.devotee_name || s.full_name_en || 'Unknown',
        phone: s.phone || s.phone_number, seva: s.seva || s.seva_name || 'Shaswata Seva',
        type: s.type || s.subscription_type || 'LUNAR'
    });

    const getSearchData = () => {
        if (searchQuery.length > 0) return allSubscriptions;
        if (selectorMode === 'PANCHANGAM' && (lunarFilter.masa || lunarFilter.paksha || lunarFilter.tithi)) return allSubscriptions;
        return pujas;
    };

    const filteredSearch = getSearchData().map(normSub).filter(p => {
        if (p.type === 'BOOKING') return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return [p.name, p.devotee_name, p.address, p.phone, p.seva, p.gothra].some(f => f?.toLowerCase().includes(q));
        }
        if (selectorMode === 'PANCHANGAM') {
            if (p.type !== 'LUNAR' && p.subscription_type !== 'LUNAR') return false;
            const ld = p.lunar_date?.toLowerCase() || '';
            if (lunarFilter.masa && !ld.includes(lunarFilter.masa.toLowerCase())) return false;
            if (lunarFilter.paksha && !ld.includes(lunarFilter.paksha.toLowerCase())) return false;
            if (lunarFilter.tithi && !ld.includes(lunarFilter.tithi.toLowerCase())) return false;
        }
        return true;
    });

    // ===================== SEARCH ACTION HANDLERS =====================
    const generateMsg = (type, name, seva, dateInfo, addr) => {
        const ph = "9448066755";
        const g = `Namaste ${name},`;
        if (type === 'REMINDER') return `${g} today (${dateInfo}) your Shaswata Seva (${seva}) will be performed at Kukke Subramanya Temple. May the Lord bless you.`;
        if (type === 'DISPATCH') return `${g} your ${seva} has been performed successfully. The Prasadam has been dispatched to your address. It will arrive within 3-5 days. For queries, contact ${ph}.`;
        if (type === 'FEEDBACK') return `${g} checking if you received the Prasadam for your ${seva}. May Subramanya Swamy's blessings be with you.`;
        if (type === 'ADDRESS_CONFIRM') return `${g} your Shaswata Seva (${seva}) is scheduled for tomorrow (${dateInfo}) at Kukke Subramanya Temple. Please confirm your address for Prasadam delivery:\n\n📍 ${addr || 'No address on file'}\n\nReply "Confirmed" or send updated address. ${ph} 🙏`;
        return '';
    };

    const sendWA = (type, puja) => {
        const m = generateMsg(type, puja.name, puja.seva, puja.date_info, puja.address);
        window.open(`https://wa.me/91${puja.phone}?text=${encodeURIComponent(m)}`, '_blank');
    };

    const handleSearchDispatch = async (puja) => {
        try {
            await api.post('/shaswata/dispatch-adhoc', {
                subscription_id: puja.id,
                dispatch_date: selectedDate,
                dispatch_method: 'POST'
            });
            setActionStatus(p => ({ ...p, [puja.id]: { ...p[puja.id], dispatched: true } }));
            sendWA('DISPATCH', puja);
            showToast('Dispatched successfully');
        } catch (e) { showToast('Dispatch failed', 'error'); }
    };

    const handleSearchFeedback = async (puja) => {
        try {
            await api.patch(`/subscriptions/${puja.id}/feedback`);
            sendWA('FEEDBACK', puja);
        } catch (e) { showToast('Feedback failed', 'error'); }
    };

    const handleConfirmAddr = async (puja) => {
        try {
            await api.patch(`/devotees/${puja.devotee_id}/confirm-address`);
            setAddressConfirmStatus(p => ({ ...p, [puja.devotee_id]: { confirmed: true } }));
        } catch (e) { showToast('Address confirm failed', 'error'); }
    };

    const handleUpdateAddr = async (puja) => {
        try {
            const p = new URLSearchParams();
            if (editAddressForm.address) p.append('address', editAddressForm.address);
            if (editAddressForm.area) p.append('area', editAddressForm.area);
            if (editAddressForm.pincode) p.append('pincode', editAddressForm.pincode);
            await api.patch(`/devotees/${puja.devotee_id}/confirm-address?${p.toString()}`);
            setAddressConfirmStatus(pr => ({ ...pr, [puja.devotee_id]: { confirmed: true } }));
            setEditingAddress(null);
            setEditAddressForm({ address: '', area: '', pincode: '' });
            fetchSearchData();
        } catch (e) { showToast('Address update failed', 'error'); }
    };

    const getAddrStatus = (puja) => {
        const l = addressConfirmStatus[puja.devotee_id];
        if (l?.confirmed || puja.address_confirmed) return 'confirmed';
        if (l?.sent || puja.confirmation_sent) return 'pending';
        return 'not_sent';
    };

    const isPoojaPerformed = (id) => actionStatus[id]?.poojaPerformed || false;
    const isDispatched = (id) => actionStatus[id]?.dispatched || false;

    // ===================== COMPUTED =====================
    const pendingEvents = events.filter(e => e.status === 'PENDING');
    const dispatchedEvents = events.filter(e => e.status === 'DISPATCHED');
    const deliveredEvents = events.filter(e => e.status === 'DELIVERED');
    const todayStr = new Date().toISOString().split('T')[0];
    const todayEvents = events.filter(e => e.scheduled_date === todayStr);

    // ===================== TABS =====================
    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: Eye, count: events.length },
        { id: 'search', label: 'Search & Dispatch', icon: Search, count: filteredSearch.length },
        { id: 'followup', label: 'Follow-Up', icon: MessageCircle, count: pendingChecks.length, alert: pendingChecks.length > 0 },
    ];

    // ===================== RENDER =====================
    return (
        <div className="min-h-screen p-6 animate-in fade-in zoom-in duration-300">

            {/* === HEADER === */}
            <header className="max-w-7xl mx-auto mb-8">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-temple-saffron transition-colors mb-4 font-bold text-sm">
                    <ArrowLeft size={16} /> Back to Home
                </button>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black font-heading text-slate-800 dark:text-amber-100 mb-2">
                            Shaswata Seva
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Lifecycle • Search • Booking • Delivery
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {activeTab === 'dashboard' && (
                            <>
                                <select value={daysFilter} onChange={e => setDaysFilter(Number(e.target.value))}
                                    className="px-4 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-temple-gold outline-none cursor-pointer">
                                    <option value={7}>7 Days</option><option value={15}>15 Days</option><option value={30}>30 Days</option><option value={60}>60 Days</option>
                                </select>
                                <button onClick={handlePopulate} disabled={populateLoading}
                                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center gap-2 font-bold disabled:opacity-50">
                                    {populateLoading ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />} Populate
                                </button>
                            </>
                        )}
                        <button onClick={() => setIsBookingOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center gap-2 font-bold">
                            <Sparkles size={20} className="fill-indigo-300 text-indigo-200" /> New Seva
                        </button>
                        <button onClick={activeTab === 'dashboard' ? fetchDashboard : fetchSearchData} disabled={dashLoading || searchLoading}
                            className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-3 rounded-2xl text-slate-600 dark:text-slate-300 hover:text-temple-saffron transition-all active:scale-95">
                            <RefreshCw size={20} className={(dashLoading || searchLoading) ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </header>

            {/* === TABS === */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap
                                ${activeTab === t.id
                                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-lg border border-slate-200 dark:border-slate-700'
                                    : 'bg-white/30 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60'}`}>
                            <t.icon size={18} /> {t.label}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-black
                                ${t.alert ? 'bg-red-500 text-white animate-pulse'
                                    : activeTab === t.id ? 'bg-temple-saffron/20 text-temple-saffron'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                {t.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* === CONTENT === */}
            <div className="max-w-7xl mx-auto">

                {/* -------- DASHBOARD TAB -------- */}
                {activeTab === 'dashboard' && (
                    <div className="animate-in fade-in duration-300">
                        {dashLoading ? <LoadingSpinner /> : (
                            <>
                                {/* KPI Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    <KPICard label="Today's Sevas" value={todayEvents.length} icon={Sparkles} color="amber" />
                                    <KPICard label="Pending" value={pendingEvents.length} icon={Clock} color="orange" />
                                    <KPICard label="In Transit" value={dispatchedEvents.length} icon={Truck} color="blue" />
                                    <KPICard label="Delivery Checks" value={pendingChecks.length} icon={AlertTriangle} color="red" alert={pendingChecks.length > 0} />
                                </div>

                                {/* Event Grid (Pending first, then Dispatched, then Delivered) */}
                                <h2 className="text-lg font-black text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                                    <Calendar size={20} className="text-temple-saffron" /> All Events ({events.length})
                                </h2>
                                {events.length === 0 ? <EmptyState message="No events. Click 'Populate' to generate the schedule." />
                                    : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {events.map(ev => <EventCard key={ev.event_id} event={ev} onAction={handleEventAction} loading={actionLoading} />)}
                                    </div>
                                }
                            </>
                        )}
                    </div>
                )}

                {/* -------- SEARCH TAB -------- */}
                {activeTab === 'search' && (
                    <div className="animate-in fade-in duration-300">
                        {/* Search Controls */}
                        <div className="flex flex-wrap items-center gap-4 mb-6">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Calendar className="h-5 w-5 text-temple-saffron" /></div>
                                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                                    className="pl-10 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-temple-gold outline-none cursor-pointer" />
                            </div>
                            {/* Panchangam Selector */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Moon className="h-5 w-5 text-indigo-500" /></div>
                                <button onClick={() => setPanchangamDropdownOpen(!panchangamDropdownOpen)}
                                    className={`pl-10 pr-4 py-3 min-w-[200px] bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border ${panchangamDropdownOpen ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-slate-200 dark:border-slate-700'} rounded-2xl font-bold text-slate-700 dark:text-slate-200 hover:border-indigo-400 transition-all cursor-pointer text-left flex items-center justify-between gap-2`}>
                                    <span className="truncate text-sm">
                                        {lunarFilter.masa && lunarFilter.paksha && lunarFilter.tithi
                                            ? `${lunarFilter.masa} • ${lunarFilter.paksha} • ${lunarFilter.tithi}`
                                            : panchangam ? `${panchangam.attributes.maasa} • ${panchangam.attributes.paksha} • ${panchangam.attributes.tithi}` : 'Select Panchangam...'}
                                    </span>
                                    <ChevronDown size={16} className={`transition-transform ${panchangamDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {panchangamDropdownOpen && (
                                    <div className="absolute top-full mt-2 left-0 z-50 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 duration-200">
                                        <p className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest text-xs mb-4">Select Panchangam</p>
                                        {[{ label: 'Masa', key: 'masa', opts: MASAS.map(m => ({ v: m.en, l: `${m.en} (${m.kn})` })) },
                                        { label: 'Paksha', key: 'paksha', opts: PAKSHAS_BILINGUAL.map(p => ({ v: p.en, l: `${p.en} (${p.kn})` })) },
                                        { label: 'Tithi', key: 'tithi', opts: TITHIS_BILINGUAL.map(t => ({ v: t.en, l: `${t.en} (${t.kn})` })) }
                                        ].map(f => (
                                            <div key={f.key} className="mb-3">
                                                <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">{f.label}</label>
                                                <select value={lunarFilter[f.key]} onChange={e => { setLunarFilter(p => ({ ...p, [f.key]: e.target.value })); if (e.target.value) setSelectorMode('PANCHANGAM'); }}
                                                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
                                                    <option value="">All</option>
                                                    {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                                                </select>
                                            </div>
                                        ))}
                                        <div className="flex gap-2">
                                            <button onClick={() => setPanchangamDropdownOpen(false)} className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all">Done</button>
                                            <button onClick={() => { setLunarFilter({ masa: '', paksha: '', tithi: '' }); setSelectorMode('CALENDAR'); }} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300 transition-all">Clear</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <OmniInput icon={Search} placeholder="Search devotee or address..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>
                            <button onClick={() => window.print()} className="bg-temple-saffron hover:bg-orange-600 text-white p-3 rounded-2xl shadow-lg shadow-orange-500/30 transition-all active:scale-95" title="Print">
                                <Printer size={20} />
                            </button>
                        </div>

                        {/* Active Filter Indicator */}
                        {selectorMode === 'PANCHANGAM' && (lunarFilter.masa || lunarFilter.paksha || lunarFilter.tithi) && (
                            <div className="flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 px-4 py-3 rounded-2xl mb-6">
                                <Moon size={16} className="text-indigo-600 dark:text-indigo-400" />
                                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                                    Panchangam: {lunarFilter.masa || '•'} • {lunarFilter.paksha || '•'} • {lunarFilter.tithi || '•'}
                                </span>
                                <button onClick={() => { setLunarFilter({ masa: '', paksha: '', tithi: '' }); setSelectorMode('CALENDAR'); }} className="ml-auto text-indigo-500 hover:text-indigo-700"><X size={16} /></button>
                            </div>
                        )}

                        {/* Search Results */}
                        {searchLoading ? <LoadingSpinner />
                            : filteredSearch.length === 0 ? <EmptyState message="No subscriptions found. Try changing the date or filters." />
                                : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2">
                                    {filteredSearch.map(puja => (
                                        <SearchCard key={puja.id} puja={puja}
                                            isPoojaPerformed={isPoojaPerformed} isDispatched={isDispatched}
                                            getAddrStatus={getAddrStatus} onSendWA={sendWA}
                                            onDispatch={handleSearchDispatch} onFeedback={handleSearchFeedback}
                                            onConfirmAddr={handleConfirmAddr} onUpdateAddr={handleUpdateAddr}
                                            editingAddress={editingAddress} setEditingAddress={setEditingAddress}
                                            editAddressForm={editAddressForm} setEditAddressForm={setEditAddressForm}
                                            onPooja={(p) => setActionStatus(pr => ({ ...pr, [p.id]: { ...pr[p.id], poojaPerformed: true } }))}
                                        />
                                    ))}
                                </div>
                        }
                    </div>
                )}

                {/* -------- FOLLOW-UP TAB -------- */}
                {activeTab === 'followup' && (
                    <div className="animate-in fade-in duration-300">
                        {pendingChecks.length === 0 ? <EmptyState message="No delivery checks pending! All devotees contacted." />
                            : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pendingChecks.map(c => (
                                    <FollowUpCard key={c.event_id} check={c} onAction={handleEventAction} loading={actionLoading} />
                                ))}
                            </div>
                        }
                    </div>
                )}
            </div>

            {/* === TOAST === */}
            {toast && (
                <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm animate-in slide-in-from-bottom-4 duration-300
                    ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    <div className="flex items-center gap-2">
                        {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />} {toast.message}
                    </div>
                </div>
            )}

            {/* === BOOKING WIZARD === */}
            <ShaswataForm isOpen={isBookingOpen} onClose={() => { setIsBookingOpen(false); fetchDashboard(); fetchAllSubs(); }}
                lang={lang} initialContext={{ date: selectedDate, panchangam }} />

            {/* === PRINT STYLES === */}
            <style>{`@media print { @page { margin: 0.5cm; } body * { visibility: hidden; } .max-w-7xl, .max-w-7xl * { visibility: visible; } header, button, input, select { display: none !important; } }`}</style>
        </div>
    );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const LoadingSpinner = () => (
    <div className="py-20 text-center">
        <Loader2 size={48} className="mx-auto text-temple-saffron animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading...</p>
    </div>
);

const EmptyState = ({ message }) => (
    <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
        <ClipboardCheck size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-bold text-slate-400 dark:text-slate-500">{message}</h3>
    </div>
);

const KPICard = ({ label, value, icon: Icon, color, alert }) => {
    const c = { amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400', orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400', blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400', red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' }[color] || '';
    return (
        <div className={`${c.split(' ').slice(0, 2).join(' ')} rounded-2xl p-5 border border-white/20 dark:border-white/5 transition-all hover:scale-[1.02] ${alert ? 'ring-2 ring-red-500/50 animate-pulse' : ''}`}>
            <div className="flex items-center justify-between mb-3"><Icon size={24} className={c.split(' ').slice(2).join(' ')} />{alert && <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />}</div>
            <p className={`text-3xl font-black ${c.split(' ').slice(2).join(' ')}`}>{value}</p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">{label}</p>
        </div>
    );
};

const EventCard = ({ event, onAction, loading }) => {
    const cfg = STATUS_CONFIG[event.status] || STATUS_CONFIG.PENDING;
    const Icon = cfg.icon;
    const ld = loading[event.event_id];
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
    return (
        <div className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[1.5rem] p-5 border ${cfg.border} shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${cfg.gradient}`} />
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 truncate">{event.devotee_name}</h3>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5"><Phone size={10} /> {event.phone || 'No phone'}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${cfg.bg} ${cfg.text}`}><Icon size={12} />{cfg.label}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg"><p className="text-[10px] uppercase font-bold text-slate-400">Seva</p><p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{event.seva_name}</p></div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg"><p className="text-[10px] uppercase font-bold text-slate-400">Scheduled</p><p className="text-xs font-bold text-slate-700 dark:text-slate-300">{fmtDate(event.scheduled_date)}</p></div>
            </div>
            {event.address && <div className="bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-lg mb-3"><p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1"><MapPin size={10} /> Address</p><p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">{event.address}</p></div>}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                {event.status === 'PENDING' && <>
                    <Btn label="Remind" icon={MessageCircle} color="blue" loading={ld === 'reminder'} onClick={() => onAction(event.event_id, 'reminder')} />
                    <Btn label="Dispatch" icon={Send} color="emerald" loading={ld === 'dispatch'} onClick={() => onAction(event.event_id, 'dispatch')} />
                </>}
                {event.status === 'DISPATCHED' && <>
                    <Btn label="Check" icon={Package} color="purple" loading={ld === 'check'} onClick={() => onAction(event.event_id, 'check')} />
                    <Btn label="Received ✓" icon={CheckCircle2} color="emerald" loading={ld === 'feedback'} onClick={() => onAction(event.event_id, 'feedback', { received: true })} />
                    <Btn label="Not Received" icon={AlertTriangle} color="red" loading={ld === 'feedback'} onClick={() => onAction(event.event_id, 'feedback', { received: false, notes: 'Not received' })} />
                </>}
                {event.status === 'DELIVERED' && <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold"><CheckCircle2 size={14} /> Complete</div>}
            </div>
        </div>
    );
};

const FollowUpCard = ({ check, onAction, loading }) => {
    const ld = loading[check.event_id];
    return (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[1.5rem] p-5 border border-red-200 dark:border-red-800/30 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-orange-500" />
            <div className="flex justify-between items-start mb-3">
                <div><h3 className="font-bold text-base text-slate-800 dark:text-slate-100">{check.devotee_name}</h3><p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5"><Phone size={10} /> {check.phone}</p></div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-[10px] font-black uppercase animate-pulse"><AlertTriangle size={12} />{check.days_since_dispatch}d</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg"><p className="text-[10px] uppercase font-bold text-slate-400">Seva</p><p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{check.seva_name}</p></div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg"><p className="text-[10px] uppercase font-bold text-slate-400">Dispatched</p><p className="text-xs font-bold text-slate-700 dark:text-slate-300">{new Date(check.dispatch_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p></div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                <Btn label="Send Check" icon={MessageCircle} color="blue" loading={ld === 'check'} onClick={() => onAction(check.event_id, 'check')} />
                <Btn label="Received ✓" icon={CheckCircle2} color="emerald" loading={ld === 'feedback'} onClick={() => onAction(check.event_id, 'feedback', { received: true })} />
                <Btn label="Not Received" icon={AlertTriangle} color="red" loading={ld === 'feedback'} onClick={() => onAction(check.event_id, 'feedback', { received: false, notes: 'Not received' })} />
                {check.phone && <a href={`https://wa.me/91${check.phone}?text=${encodeURIComponent(`🙏 Namaste ${check.devotee_name}! Did you receive the Prasadam for ${check.seva_name}? Reply YES/NO.`)}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-2 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 text-xs font-bold rounded-xl hover:bg-green-100 transition-colors"><Send size={12} /> WhatsApp</a>}
            </div>
        </div>
    );
};

const SearchCard = ({ puja, isPoojaPerformed, isDispatched, getAddrStatus, onSendWA, onDispatch, onFeedback, onConfirmAddr, onUpdateAddr, editingAddress, setEditingAddress, editAddressForm, setEditAddressForm, onPooja }) => (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-6 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 relative group overflow-hidden">
        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-temple-gold to-temple-saffron`} />
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight">{puja.name}</h3>
                <p className="text-xs font-bold text-slate-400 mt-1">{puja.phone || 'No Phone'}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                    {puja.occasion && <span className="inline-flex items-center gap-1 px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-bold rounded-lg">🎉 {puja.occasion}</span>}
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-lg ${puja.type === 'LUNAR' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'}`}>
                        {puja.type === 'LUNAR' ? '🌙 Panchangam' : '📅 Calendar'}
                    </span>
                </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-xl text-orange-600 dark:text-orange-400"><MapPin size={20} /></div>
        </div>
        {/* Address */}
        <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl mb-3">
            <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1"><MapPin size={10} /> Delivery Address</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{puja.address || 'Not provided'}{puja.area ? `, ${puja.area}` : ''}{puja.pincode ? ` - ${puja.pincode}` : ''}</p>
            {getAddrStatus(puja) === 'confirmed' && <span className="inline-flex items-center gap-1 mt-1 text-emerald-500 text-[10px] font-bold"><CheckCircle2 size={10} /> Verified</span>}
        </div>
        {/* Seva/Date */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-3 mb-3">
            <div><p className="text-[10px] uppercase font-bold text-slate-400">Seva</p><p className="text-sm font-bold text-temple-brown dark:text-amber-100 truncate max-w-[150px]">{puja.seva}</p></div>
            <div className="text-right"><p className="text-[10px] uppercase font-bold text-slate-400">Date Info</p><p className="text-xs font-bold text-slate-500">{puja.date_info || puja.lunar_date || 'N/A'}</p></div>
        </div>
        {/* Actions */}
        <div className="flex flex-wrap gap-2 mb-3">
            {getAddrStatus(puja) !== 'confirmed' && puja.phone && <button onClick={() => onSendWA('ADDRESS_CONFIRM', puja)} className="flex items-center gap-1 px-3 py-2 bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300 text-xs font-bold rounded-xl hover:bg-amber-100 transition-colors"><MapPin size={12} /> Confirm Address</button>}
            {!isPoojaPerformed(puja.id) && <button onClick={() => onSendWA('REMINDER', puja)} className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors"><MessageCircle size={12} /> Remind</button>}
            {!isDispatched(puja.id) && <button onClick={() => { onPooja(puja); onDispatch(puja); }} className="flex items-center gap-1 px-3 py-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-colors"><Send size={12} /> Dispatch</button>}
            {isDispatched(puja.id) && <button onClick={() => onFeedback(puja)} className="flex items-center gap-1 px-3 py-2 bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300 text-xs font-bold rounded-xl hover:bg-purple-100 transition-colors"><MessageCircle size={12} /> Feedback</button>}
            {isDispatched(puja.id) && <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold"><CheckCircle2 size={12} /> Dispatched</span>}
        </div>
    </div>
);

const Btn = ({ label, icon: Icon, color, loading, onClick }) => {
    const cm = { blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100', emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-100', red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100', purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 hover:bg-purple-100' };
    return <button onClick={onClick} disabled={loading} className={`flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl transition-colors ${cm[color] || cm.blue} ${loading ? 'opacity-50 cursor-wait' : ''}`}>{loading ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}{label}</button>;
};

export default ShaswataUnified;
