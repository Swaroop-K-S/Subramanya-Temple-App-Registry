import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Calendar, Printer, MessageCircle, Search, ArrowLeft,
    Filter, Download, Share2, Loader2, CheckCircle2, XCircle,
    ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown,
    TrendingUp, IndianRupee, CreditCard, Banknote, X,
    Keyboard, BarChart3, User, Check, Copy, ClipboardCheck,
    StickyNote, LayoutList, LayoutGrid, RotateCcw, History,
    Pencil
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ReceiptPreview } from './ReceiptPreview';
import html2canvas from 'html2canvas';

// ─────────────────────────────────────────────────
// HOURLY CHART (Pure SVG Bars)
// ─────────────────────────────────────────────────
const HourlyChart = ({ data }) => {
    if (!data || data.length === 0) return (
        <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            <BarChart3 className="mr-2 opacity-50" size={16} />
            No activity yet today
        </div>
    );
    const maxCount = Math.max(...data.map(d => d.count), 1);
    return (
        <div className="flex items-end gap-1 h-full px-2 pb-1">
            {data.map((d, i) => {
                const height = Math.max(4, (d.count / maxCount) * 100);
                return (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1" title={`${d.hour}:00 — ${d.count} bookings, ₹${d.total}`}>
                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{d.count}</span>
                        <div className="w-full rounded-t-md bg-gradient-to-t from-orange-500 to-amber-400 transition-all duration-700 ease-out"
                            style={{ height: `${height}%`, minHeight: '4px', maxWidth: '32px' }} />
                        <span className="text-[9px] text-slate-400">{d.hour}h</span>
                    </div>
                );
            })}
        </div>
    );
};

// ─────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, subtext, gradient, iconColor }) => (
    <div className={`rounded-2xl p-5 ${gradient} shadow-lg relative overflow-hidden group transition-transform hover:scale-[1.02] duration-300`}>
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
                <Icon size={18} className={iconColor || "opacity-80"} />
                <p className="text-sm font-semibold opacity-80">{label}</p>
            </div>
            <h2 className="text-3xl font-black tracking-tight">{value}</h2>
            {subtext && <p className="text-xs mt-1 opacity-70">{subtext}</p>}
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-10 transform group-hover:scale-110 transition-transform duration-500">
            <Icon size={80} />
        </div>
    </div>
);

// ─────────────────────────────────────────────────
// SORT ICON
// ─────────────────────────────────────────────────
const SortIcon = ({ column, current }) => {
    if (!current.startsWith(column)) return <ArrowUpDown size={12} className="opacity-30" />;
    return current.endsWith('asc')
        ? <ArrowUp size={12} className="text-orange-500" />
        : <ArrowDown size={12} className="text-orange-500" />;
};

// ─────────────────────────────────────────────────
// TOAST (Bottom-center pop-up notification)
// ─────────────────────────────────────────────────
const Toast = ({ message, visible }) => (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl bg-slate-800 text-white text-sm font-bold shadow-2xl
        flex items-center gap-2 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <ClipboardCheck size={16} className="text-green-400" />
        {message}
    </div>
);


// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════
const DailyTransactions = ({ lang = 'EN' }) => {
    const navigate = useNavigate();

    // DATA STATE
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState(null);
    const [sevas, setSevas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const LIMIT = 50;

    // FILTER STATE
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('');
    const [sevaFilter, setSevaFilter] = useState('');
    const [sortBy, setSortBy] = useState('time_desc');

    // PHASE 2 STATE
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [compactView, setCompactView] = useState(false);
    const [toast, setToast] = useState({ message: '', visible: false });
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editNoteValue, setEditNoteValue] = useState('');
    const [contextMenu, setContextMenu] = useState(null); // { x, y, transaction }

    // UI STATE
    const [reprintData, setReprintData] = useState(null);
    const receiptRef = useRef();
    const [printing, setPrinting] = useState(false);
    const searchRef = useRef();
    const noteInputRef = useRef();

    // ─── TOAST HELPER ────────────────────────────
    const showToast = (msg) => {
        setToast({ message: msg, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2000);
    };

    // ─── DATA FETCHING ────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const skip = (page - 1) * LIMIT;
            const params = new URLSearchParams({
                date: selectedDate,
                skip: skip.toString(),
                limit: LIMIT.toString(),
                sort_by: sortBy
            });
            if (paymentFilter) params.set('payment_mode', paymentFilter);
            if (sevaFilter) params.set('seva_id', sevaFilter);

            const [txRes, statsRes] = await Promise.all([
                api.get(`/transactions?${params}`),
                api.get(`/transactions/stats?date=${selectedDate}`)
            ]);

            const txData = txRes.data;
            setTransactions(txData.transactions || []);
            setTotal(txData.total || 0);
            setPages(txData.pages || 1);
            setHasMore(txData.has_more || false);
            setStats(statsRes.data);
        } catch (err) {
            console.error("Fetch Error", err);
        } finally {
            setLoading(false);
        }
    }, [selectedDate, page, paymentFilter, sevaFilter, sortBy]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { api.get('/sevas').then(r => setSevas(r.data || [])).catch(() => { }); }, []);

    // ─── DATE NAVIGATION ──────────────────────────
    const shiftDate = (days) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(d.toISOString().split('T')[0]);
        setPage(1);
        setSelectedIds(new Set());
    };
    const isToday = selectedDate === new Date().toISOString().split('T')[0];

    // ─── SORT TOGGLE ──────────────────────────────
    const toggleSort = (column) => {
        const map = { time: ['time_desc', 'time_asc'], amount: ['amount_desc', 'amount_asc'], name: ['name_asc', 'time_desc'] };
        const [primary, secondary] = map[column] || ['time_desc', 'time_asc'];
        setSortBy(prev => prev === primary ? secondary : primary);
        setPage(1);
    };

    // ─── KEYBOARD SHORTCUTS ───────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); shiftDate(-1); }
            if (e.key === 'ArrowRight' && !isToday) { e.preventDefault(); shiftDate(1); }
            if (e.key === 'Escape') { setContextMenu(null); setEditingNoteId(null); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [selectedDate, isToday]);

    // Close context menu on click outside
    useEffect(() => {
        const handler = () => setContextMenu(null);
        window.addEventListener('click', handler);
        return () => window.removeEventListener('click', handler);
    }, []);

    // ─── FILTERED (client-side search on fetched page) ───
    const filtered = transactions.filter(t =>
        t.devotee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.receipt_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.seva_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ─── BULK SELECT ──────────────────────────────
    const allSelected = filtered.length > 0 && filtered.every(t => selectedIds.has(t.id));
    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map(t => t.id)));
        }
    };
    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // ─── ACTIONS ──────────────────────────────────
    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        showToast(`Copied: ${text}`);
    };



    const handleSaveNote = async () => {
        if (editingNoteId === null) return;
        try {
            await api.put(`/transactions/${editingNoteId}/note?note=${encodeURIComponent(editNoteValue)}`);
            setTransactions(prev => prev.map(t => t.id === editingNoteId ? { ...t, notes: editNoteValue } : t));
            setEditingNoteId(null);
            showToast('Note saved');
        } catch (err) {
            showToast('Failed to save note');
        }
    };

    const handleReprint = (t) => setReprintData(t);

    const triggerPrint = async (transaction) => {
        if (!receiptRef.current) return;
        setPrinting(true);
        try {
            const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true });
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const fd = new FormData();
                fd.append('file', blob, `reprint_${transaction.receipt_no}.png`);
                await api.post('/print/image', fd);
                alert("Receipt sent to printer!");
                setReprintData(null);
            });
        } catch (err) {
            alert("Reprint Failed");
        } finally { setPrinting(false); }
    };

    const handleWhatsApp = (t) => {
        const message = `*Receipt #${t.receipt_no}*\nDevotee: ${t.devotee_name}\nSeva: ${t.seva_name}\nAmount: ₹${t.amount_paid}\nDate: ${t.transaction_date}\nThank you for your visit to Subramanya Temple.`;
        window.open(`https://wa.me/${t.phone_number || ''}?text=${encodeURIComponent(message)}`, '_blank');
    };



    const handleExport = () => {
        window.open(`${api.defaults.baseURL}/transactions/export?date=${selectedDate}`, '_blank');
    };

    const handleContextMenu = (e, t) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, transaction: t });
    };

    const handleRepeatBooking = (t) => {
        setContextMenu(null);
        // Navigate to dashboard with pre-fill data in URL params
        navigate(`/?prefill_name=${encodeURIComponent(t.devotee_name)}&prefill_seva=${t.seva_id}&prefill_phone=${t.phone_number || ''}`);
    };

    // ─── FORMAT HELPERS ───────────────────────────
    const formatTime = (dateStr) => {
        try { return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
        catch { return '—'; }
    };
    const formatDate = (dateStr) => {
        try {
            const d = new Date(dateStr + 'T00:00:00');
            return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        } catch { return dateStr; }
    };

    const cellPad = compactView ? 'px-4 py-2' : 'p-5';
    const textSize = compactView ? 'text-xs' : 'text-sm';


    // ═══════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════
    return (
        <div className="min-h-screen p-4 md:p-8 pb-32 bg-slate-50 dark:bg-slate-900 transition-colors duration-500">

            {/* ─── HEADER ─── */}
            <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all text-slate-600 dark:text-slate-300">
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white">Daily Transactions</h1>
                        <p className="text-slate-500 text-sm flex items-center gap-2">
                            {formatDate(selectedDate)}
                            {isToday && <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-[10px] font-bold uppercase">Today</span>}
                        </p>
                    </div>
                </div>

                {/* Date Navigation + Density */}
                <div className="flex items-center gap-2">
                    <button onClick={() => shiftDate(-1)}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all text-slate-600 dark:text-slate-300"
                        title="Previous Day (←)"><ChevronLeft size={20} /></button>

                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <Calendar className="text-orange-500" size={18} />
                        <input type="date" value={selectedDate}
                            onChange={(e) => { setSelectedDate(e.target.value); setPage(1); }}
                            className="bg-transparent border-none outline-none text-slate-700 dark:text-slate-200 font-bold text-sm" />
                    </div>

                    <button onClick={() => shiftDate(1)} disabled={isToday}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Next Day (→)"><ChevronRight size={20} /></button>

                    {!isToday && (
                        <button onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setPage(1); }}
                            className="px-3 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors shadow-sm">Today</button>
                    )}

                    {/* Density Toggle */}
                    <button onClick={() => setCompactView(v => !v)}
                        className={`p-2.5 rounded-xl shadow-sm transition-all border ${compactView
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-orange-300'}`}
                        title={compactView ? 'Switch to Comfort View' : 'Switch to Compact View'}>
                        {compactView ? <LayoutList size={18} /> : <LayoutGrid size={18} />}
                    </button>
                </div>
            </header>

            {/* ─── STATS CARDS ─── */}
            <div className="max-w-7xl mx-auto mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={IndianRupee} label="Total Collection"
                    value={`₹ ${(stats?.total_amount || 0).toLocaleString()}`}
                    subtext={`${stats?.booking_count || 0} Bookings`}
                    gradient="bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-orange-200 dark:shadow-none" />
                <StatCard icon={Banknote} label="Cash"
                    value={`₹ ${(stats?.cash_total || 0).toLocaleString()}`}
                    gradient="bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700"
                    iconColor="text-green-500" />
                <StatCard icon={CreditCard} label="UPI"
                    value={`₹ ${(stats?.upi_total || 0).toLocaleString()}`}
                    gradient="bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700"
                    iconColor="text-purple-500" />
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-lg min-h-[120px]">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-orange-500" />
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Hourly Trend</p>
                    </div>
                    <div className="h-20"><HourlyChart data={stats?.hourly_trend} /></div>
                </div>
            </div>

            {/* ─── FILTER BAR ─── */}
            <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input ref={searchRef} type="text" placeholder='Search by Name, Receipt, or Seva...  ( / )'
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 
                                 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none
                                 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all text-sm font-medium" />
                </div>
                <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
                    className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none text-sm font-medium cursor-pointer focus:ring-2 focus:ring-orange-500/50">
                    <option value="">All Payments</option>
                    <option value="CASH">💵 Cash Only</option>
                    <option value="UPI">📱 UPI Only</option>
                </select>
                <select value={sevaFilter} onChange={(e) => { setSevaFilter(e.target.value); setPage(1); }}
                    className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none text-sm font-medium cursor-pointer focus:ring-2 focus:ring-orange-500/50">
                    <option value="">All Sevas</option>
                    {sevas.map(s => <option key={s.id} value={s.id}>{s.name_eng}</option>)}
                </select>
                <button onClick={handleExport}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors font-bold text-sm shadow-sm">
                    <Download size={16} /> Export CSV
                </button>
            </div>

            {/* ─── SEVA BREAKDOWN PILLS ─── */}
            {stats?.seva_breakdown?.length > 0 && (
                <div className="max-w-7xl mx-auto mb-6 flex flex-wrap gap-2">
                    {stats.seva_breakdown.map((s, i) => (
                        <button key={i}
                            onClick={() => { setSevaFilter(prev => prev == s.seva_id ? '' : String(s.seva_id)); setPage(1); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200
                                ${sevaFilter == s.seva_id
                                    ? 'bg-orange-500 text-white shadow-md shadow-orange-200 dark:shadow-none'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-orange-300'}`}>
                            {s.seva_name} • {s.count} • ₹{Number(s.total).toLocaleString()}
                        </button>
                    ))}
                </div>
            )}

            {/* ─── DATA TABLE ─── */}
            <div className="max-w-7xl mx-auto bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                                {/* Checkbox column */}
                                <th className={`${cellPad} w-10`}>
                                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500 cursor-pointer" />
                                </th>
                                <th className={`${cellPad} text-xs font-bold text-slate-400 uppercase tracking-wider`}>Receipt #</th>
                                <th className={`${cellPad} text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-orange-500 transition-colors select-none`}
                                    onClick={() => toggleSort('time')}>
                                    <span className="flex items-center gap-1">Time <SortIcon column="time" current={sortBy} /></span>
                                </th>
                                <th className={`${cellPad} text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-orange-500 transition-colors select-none`}
                                    onClick={() => toggleSort('name')}>
                                    <span className="flex items-center gap-1">Devotee <SortIcon column="name" current={sortBy} /></span>
                                </th>
                                <th className={`${cellPad} text-xs font-bold text-slate-400 uppercase tracking-wider`}>Seva</th>
                                <th className={`${cellPad} text-xs font-bold text-slate-400 uppercase tracking-wider text-right cursor-pointer hover:text-orange-500 transition-colors select-none`}
                                    onClick={() => toggleSort('amount')}>
                                    <span className="flex items-center justify-end gap-1">Amount <SortIcon column="amount" current={sortBy} /></span>
                                </th>
                                <th className={`${cellPad} text-xs font-bold text-slate-400 uppercase tracking-wider text-center`}>Staff</th>
                                <th className={`${cellPad} text-xs font-bold text-slate-400 uppercase tracking-wider text-center`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {loading ? (
                                <tr><td colSpan="8" className="p-16 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2" /> Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="8" className="p-16 text-center">
                                    <Calendar size={40} className="inline text-slate-300 dark:text-slate-600 mb-2" />
                                    <p className="text-slate-400 font-medium">No transactions found</p>
                                    <p className="text-slate-400 text-sm">Try different filters</p>
                                </td></tr>
                            ) : (
                                filtered.map((t) => {
                                    const isSelected = selectedIds.has(t.id);
                                    return (
                                        <tr key={t.id || t.receipt_no}
                                            onContextMenu={(e) => handleContextMenu(e, t)}
                                            className={`transition-colors group ${isSelected
                                                ? 'bg-orange-50/60 dark:bg-orange-900/10'
                                                : 'hover:bg-orange-50/30 dark:hover:bg-slate-700/30'}`}>

                                            {/* Checkbox */}
                                            <td className={cellPad}>
                                                <input type="checkbox" checked={isSelected}
                                                    onChange={() => toggleSelect(t.id)}
                                                    className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500 cursor-pointer" />
                                            </td>

                                            {/* Receipt # (Clickable to copy) */}
                                            <td className={cellPad}>
                                                <button onClick={() => handleCopy(t.receipt_no)}
                                                    className="font-mono font-bold text-sm text-slate-600 dark:text-slate-300 hover:text-orange-500 transition-colors flex items-center gap-1 group/copy"
                                                    title="Click to copy">
                                                    {t.receipt_no}
                                                    <Copy size={12} className="opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                                                </button>
                                            </td>

                                            {/* Time */}
                                            <td className={`${cellPad} ${textSize} text-slate-500 dark:text-slate-400`}>
                                                {formatTime(t.transaction_date)}
                                            </td>

                                            {/* Devotee + Smart Details */}
                                            <td className={cellPad}>
                                                <p className={`font-bold ${textSize} text-slate-800 dark:text-white`}>{t.devotee_name}</p>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {t.phone_number && <span className="text-[10px] text-slate-400">{t.phone_number}</span>}
                                                    {t.gothra_en && <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">{t.gothra_en}</span>}
                                                    {t.nakshatra && <span className="text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded">★ {t.nakshatra}</span>}
                                                </div>
                                            </td>

                                            {/* Seva */}
                                            <td className={`${cellPad} ${textSize} text-slate-600 dark:text-slate-300`}>
                                                {t.seva_name}
                                            </td>

                                            {/* Amount */}
                                            <td className={`${cellPad} text-right`}>
                                                <span className={`font-bold ${textSize} text-slate-800 dark:text-white`}>
                                                    ₹{Number(t.amount_paid).toLocaleString()}
                                                </span>
                                                <span className={`block text-[10px] uppercase font-semibold ${t.payment_mode === 'UPI' ? 'text-purple-500' : 'text-green-500'}`}>
                                                    {t.payment_mode}
                                                </span>
                                            </td>

                                            {/* Staff (Booked By) */}
                                            <td className={`${cellPad} text-center`}>
                                                <div className="flex items-center justify-center gap-1" title={`${t.booked_by || 'unknown'} (${t.booked_by_role || ''})`}>
                                                    <User size={12} className="text-slate-400" />
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium capitalize">{t.booked_by || '—'}</span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className={cellPad}>
                                                <div className="flex justify-center gap-1">
                                                    {/* Note */}
                                                    <button onClick={() => { setEditingNoteId(t.id); setEditNoteValue(t.notes || ''); }}
                                                        className={`p-1.5 rounded-lg transition-all ${t.notes
                                                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10'
                                                            : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'}`}
                                                        title="Edit note">
                                                        <StickyNote size={16} />
                                                    </button>
                                                    {/* Reprint */}
                                                    <button onClick={() => handleReprint(t)}
                                                        className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-colors"
                                                        title="Reprint"><Printer size={16} /></button>
                                                    {/* WhatsApp */}
                                                    <button onClick={() => handleWhatsApp(t)}
                                                        className="p-1.5 text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors"
                                                        title="WhatsApp"><MessageCircle size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {total > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                        <p className="text-sm text-slate-500">
                            Showing <b>{((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)}</b> of <b>{total}</b>
                        </p>
                        <div className="flex items-center gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1.5 rounded-lg text-sm font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-30 transition-colors">Prev</button>
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{page} / {pages}</span>
                            <button disabled={!hasMore} onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1.5 rounded-lg text-sm font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-30 transition-colors">Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Keyboard Shortcut Hint */}
            <div className="max-w-7xl mx-auto mt-4 flex items-center justify-center gap-4 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Keyboard size={12} /> <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono">/</kbd> Search</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono">←</kbd><kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono">→</kbd> Navigate</span>
                <span className="flex items-center gap-1">Right-click row for more</span>
            </div>


            {/* ─── FLOATING BULK ACTION BAR ─── */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-700 text-white
                    rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4 animate-[slideUp_0.3s_ease-out]">
                    <span className="text-sm font-bold">
                        <span className="text-orange-400">{selectedIds.size}</span> selected
                    </span>
                    <div className="w-px h-5 bg-slate-600" />
                    <button onClick={() => {
                        // Bulk print — for now, print each selected
                        const selected = filtered.filter(t => selectedIds.has(t.id));
                        selected.forEach(t => handleReprint(t));
                        showToast(`${selected.length} receipts queued`);
                    }} className="flex items-center gap-1.5 text-sm font-medium hover:text-orange-400 transition-colors">
                        <Printer size={16} /> Print
                    </button>
                    <button onClick={() => {
                        const selected = filtered.filter(t => selectedIds.has(t.id));
                        selected.forEach(t => handleWhatsApp(t));
                    }} className="flex items-center gap-1.5 text-sm font-medium hover:text-green-400 transition-colors">
                        <MessageCircle size={16} /> WhatsApp
                    </button>
                    <button onClick={() => setSelectedIds(new Set())}
                        className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                        <X size={16} /> Clear
                    </button>
                </div>
            )}


            {/* ─── CONTEXT MENU (Right-Click) ─── */}
            {contextMenu && (
                <div className="fixed z-50 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 min-w-[180px]"
                    style={{ left: contextMenu.x, top: contextMenu.y }}>
                    <button onClick={() => handleRepeatBooking(contextMenu.transaction)}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                        <RotateCcw size={14} /> Repeat Booking
                    </button>
                    <button onClick={() => { handleCopy(contextMenu.transaction.receipt_no); setContextMenu(null); }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                        <Copy size={14} /> Copy Receipt #
                    </button>
                    <button onClick={() => { handleReprint(contextMenu.transaction); setContextMenu(null); }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                        <Printer size={14} /> Reprint Receipt
                    </button>

                </div>
            )}


            {/* ─── INLINE NOTE EDIT MODAL ─── */}
            {editingNoteId !== null && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Pencil className="text-amber-500" size={20} />
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Edit Note</h3>
                        </div>
                        <textarea ref={noteInputRef} value={editNoteValue}
                            onChange={(e) => setEditNoteValue(e.target.value)}
                            placeholder="e.g., Prasadam Collected, Special Request..."
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700
                                     text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none resize-none h-24
                                     focus:ring-2 focus:ring-amber-500/50"
                            autoFocus />
                        <div className="flex justify-end gap-3 mt-4">
                            <button onClick={() => setEditingNoteId(null)}
                                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold transition-colors">Cancel</button>
                            <button onClick={handleSaveNote}
                                className="px-6 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors flex items-center gap-2">
                                <Check size={16} /> Save
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* ─── REPRINT MODAL ─── */}
            {reprintData && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Reprint Receipt</h3>
                            <button onClick={() => setReprintData(null)} className="text-slate-500 hover:text-red-500"><XCircle size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-slate-100 dark:bg-slate-900">
                            <div className="origin-top transform scale-90 sm:scale-100">
                                <ReceiptPreview ref={receiptRef}
                                    transaction={{ ...reprintData, date: reprintData.transaction_date }}
                                    seva={{ name_eng: reprintData.seva_name }} lang={lang} />
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-white dark:bg-slate-800 rounded-b-2xl">
                            <button onClick={() => setReprintData(null)}
                                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold">Cancel</button>
                            <button onClick={() => triggerPrint(reprintData)} disabled={printing}
                                className="px-6 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold hover:shadow-lg disabled:opacity-50 flex items-center gap-2">
                                {printing ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />}
                                {printing ? 'Printing...' : 'Print'}
                            </button>
                        </div>
                    </div>
                </div>
            )}





            {/* ─── TOAST ─── */}
            <Toast message={toast.message} visible={toast.visible} />

        </div>
    );
};

export default DailyTransactions;
