/**
 * S.T.A.R. Reports Dashboard — Divine Analytics
 * ===============================================
 * 10-Feature Analytics Dashboard with:
 *  1. Smart Date Presets
 *  2. Period Comparison (Growth ▲/▼)
 *  3. Peak Hours Heatmap
 *  4. Seva Category Analysis
 *  5. Payment Reconciliation (Cash vs UPI)
 *  6. Shaswata vs Daily Split
 *  7. Thermal Printer Summary
 *  8. Average Transaction Value Trend
 *  9. Rich Excel Export
 * 10. Interactive Drill-Down
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line
} from 'recharts';
import {
    Calendar, TrendingUp, TrendingDown, IndianRupee, Clock, Download,
    Printer, FileSpreadsheet, ChevronDown, ChevronUp, ArrowUpRight,
    ArrowDownRight, Minus, Sun, Moon, Users, BarChart3, PieChart as PieIcon,
    RefreshCw, X, Filter, Zap, Eye
} from 'lucide-react';
import api from '../services/api';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6', '#f59e0b'];
const HOUR_LABELS = [
    '12a', '1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a', '9a', '10a', '11a',
    '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p', '10p', '11p'
];

function formatCurrency(num) {
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
    return `₹${num.toFixed(0)}`;
}

function formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getPresetDates(preset) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (preset) {
        case 'today': return { start: today, end: today };
        case 'yesterday': {
            const y = new Date(today); y.setDate(y.getDate() - 1);
            return { start: y, end: y };
        }
        case 'this_week': {
            const d = today.getDay();
            const start = new Date(today); start.setDate(today.getDate() - d);
            return { start, end: today };
        }
        case 'last_week': {
            const d = today.getDay();
            const end = new Date(today); end.setDate(today.getDate() - d - 1);
            const start = new Date(end); start.setDate(end.getDate() - 6);
            return { start, end };
        }
        case 'this_month': {
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            return { start, end: today };
        }
        case 'last_month': {
            const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const end = new Date(today.getFullYear(), today.getMonth(), 0);
            return { start, end };
        }
        default: return { start: today, end: today };
    }
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function ReportsDashboard({ onBack }) {
    const [startDate, setStartDate] = useState(formatDate(new Date()));
    const [endDate, setEndDate] = useState(formatDate(new Date()));
    const [activePreset, setActivePreset] = useState('today');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [drillDown, setDrillDown] = useState(null); // { seva_name, transactions[] }
    const [drillLoading, setDrillLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    // ── Fetch Report Data ──
    const fetchReport = useCallback(async (s, e) => {
        setLoading(true);
        setError(null);
        setDrillDown(null);
        try {
            const res = await api.get(`/reports?start_date=${s}&end_date=${e}`);
            setData(res.data);
        } catch (err) {
            console.error('Report fetch error:', err);
            setError(err.response?.data?.detail || 'Failed to load report');
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Initial Load ──
    useEffect(() => {
        fetchReport(startDate, endDate);
    }, []);

    // ── Preset Click ──
    const handlePreset = (preset) => {
        setActivePreset(preset);
        const { start, end } = getPresetDates(preset);
        const s = formatDate(start);
        const e = formatDate(end);
        setStartDate(s);
        setEndDate(e);
        fetchReport(s, e);
    };

    // ── Manual Date Change ──
    const handleDateApply = () => {
        setActivePreset(null);
        fetchReport(startDate, endDate);
    };

    // ── Drill Down (Click a seva bar) ──
    const handleDrillDown = async (sevaName) => {
        if (drillDown?.seva_name === sevaName) { setDrillDown(null); return; }
        setDrillLoading(true);
        try {
            const res = await api.get(`/reports/collection?start_date=${startDate}&end_date=${endDate}`);
            const filtered = res.data.transactions.filter(t => t.seva_name === sevaName);
            setDrillDown({ seva_name: sevaName, transactions: filtered });
        } catch (err) {
            console.error('Drill-down error:', err);
        } finally {
            setDrillLoading(false);
        }
    };

    // ── Excel Export ──
    const handleExcelExport = async () => {
        setExporting(true);
        try {
            const res = await api.get(`/reports/export/excel?start_date=${startDate}&end_date=${endDate}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `Temple_Report_${startDate}_to_${endDate}.xlsx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Excel export error:', err);
        } finally {
            setExporting(false);
        }
    };

    // ── Thermal Print ──
    const handleThermalPrint = () => {
        if (!data) return;
        const printWindow = window.open('', '_blank', 'width=320,height=600');
        const fin = data.financials;
        const comp = data.comparison;
        const sevas = data.seva_stats?.slice(0, 8) || [];

        printWindow.document.write(`
      <html><head><title>Daily Summary</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { width:280px; font-family:'Courier New',monospace; font-size:11px; padding:8px; color:#000; }
        .center { text-align:center; }
        .line { border-top:1px dashed #000; margin:6px 0; }
        .row { display:flex; justify-content:space-between; padding:2px 0; }
        .bold { font-weight:bold; }
        .big { font-size:14px; font-weight:bold; }
        .title { font-size:12px; font-weight:bold; letter-spacing:1px; }
      </style></head><body>
        <div class="center title">SHREE SUBRAMANYA TEMPLE</div>
        <div class="center" style="font-size:9px;margin-top:2px;">Kukke, Karnataka</div>
        <div class="line"></div>
        <div class="center bold">DAILY SUMMARY</div>
        <div class="center" style="font-size:10px;">${startDate}${startDate !== endDate ? ' to ' + endDate : ''}</div>
        <div class="line"></div>
        <div class="row big"><span>TOTAL</span><span>₹${fin.total.toLocaleString()}</span></div>
        <div class="line"></div>
        <div class="row"><span>Cash</span><span>₹${fin.cash.toLocaleString()} (${fin.cash_pct}%)</span></div>
        <div class="row"><span>UPI</span><span>₹${fin.upi.toLocaleString()} (${fin.upi_pct}%)</span></div>
        <div class="row"><span>Bookings</span><span>${fin.tx_count}</span></div>
        <div class="row"><span>Avg Ticket</span><span>₹${fin.atv}</span></div>
        <div class="line"></div>
        <div class="center bold" style="margin-bottom:4px;">SEVA BREAKDOWN</div>
        ${sevas.map(s => `<div class="row"><span>${s.name.substring(0, 18)}</span><span>${s.count} | ₹${s.revenue.toLocaleString()}</span></div>`).join('')}
        <div class="line"></div>
        <div class="center" style="font-size:8px;margin-top:4px;">Printed: ${new Date().toLocaleString()}</div>
        <div class="center" style="font-size:8px;">S.T.A.R. System v2.0</div>
      </body></html>
    `);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 500);
    };

    // ─────────────────────────────────────────────
    // RENDER HELPERS
    // ─────────────────────────────────────────────

    const ChangeIndicator = ({ value }) => {
        if (value === 0) return <span className="flex items-center gap-1 text-slate-400"><Minus size={14} /> 0%</span>;
        if (value > 0) return <span className="flex items-center gap-1 text-emerald-500 font-semibold"><ArrowUpRight size={14} /> +{value}%</span>;
        return <span className="flex items-center gap-1 text-red-500 font-semibold"><ArrowDownRight size={14} /> {value}%</span>;
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                {payload.map((p, i) => (
                    <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
                        {p.name}: {typeof p.value === 'number' ? (p.name.includes('Revenue') || p.name.includes('revenue') ? formatCurrency(p.value) : p.value) : p.value}
                    </p>
                ))}
            </div>
        );
    };

    // ─────────────────────────────────────────────
    // MAIN RENDER
    // ─────────────────────────────────────────────
    const fin = data?.financials;
    const comp = data?.comparison;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* ── HEADER ── */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <BarChart3 className="text-orange-500" size={28} />
                        Divine Analytics
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Temple performance insights & financial reports
                    </p>
                </div>

                {/* Export Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={handleThermalPrint}
                        disabled={!data}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        <Printer size={16} /> Print
                    </button>
                    <button
                        onClick={handleExcelExport}
                        disabled={!data || exporting}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                    >
                        <FileSpreadsheet size={16} /> {exporting ? 'Exporting...' : 'Excel'}
                    </button>
                </div>
            </div>

            {/* ── DATE PRESETS ── */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    {[
                        { key: 'today', label: 'Today' },
                        { key: 'yesterday', label: 'Yesterday' },
                        { key: 'this_week', label: 'This Week' },
                        { key: 'last_week', label: 'Last Week' },
                        { key: 'this_month', label: 'This Month' },
                        { key: 'last_month', label: 'Last Month' },
                    ].map(p => (
                        <button
                            key={p.key}
                            onClick={() => handlePreset(p.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${activePreset === p.key
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-orange-500/30 outline-none"
                        />
                        <span className="text-slate-400 text-sm">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-orange-500/30 outline-none"
                        />
                    </div>
                    <button
                        onClick={handleDateApply}
                        className="px-4 py-1.5 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
                    >
                        Apply
                    </button>
                </div>
            </div>

            {/* ── LOADING / ERROR ── */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <RefreshCw className="animate-spin text-orange-500" size={32} />
                </div>
            )}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {data && !loading && (
                <>
                    {/* ── KPI CARDS ── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Total Collection */}
                        <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-5 rounded-2xl text-white shadow-lg shadow-orange-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium opacity-80">Total Collection</span>
                                <IndianRupee size={18} className="opacity-70" />
                            </div>
                            <div className="text-2xl font-bold">{formatCurrency(fin.total)}</div>
                            <div className="mt-2 text-xs flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full w-fit">
                                <ChangeIndicator value={comp.total_change} />
                                <span className="opacity-70 ml-1">vs prev</span>
                            </div>
                        </div>

                        {/* Bookings Count */}
                        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Bookings</span>
                                <Users size={18} className="text-blue-500" />
                            </div>
                            <div className="text-2xl font-bold text-slate-800 dark:text-white">{fin.tx_count}</div>
                            <div className="mt-2 text-xs"><ChangeIndicator value={comp.count_change} /></div>
                        </div>

                        {/* Average Ticket Value */}
                        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Avg. Ticket</span>
                                <Zap size={18} className="text-purple-500" />
                            </div>
                            <div className="text-2xl font-bold text-slate-800 dark:text-white">₹{fin.atv}</div>
                            <div className="mt-2 text-xs"><ChangeIndicator value={comp.atv_change} /></div>
                        </div>

                        {/* Shaswata Active */}
                        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Shaswata Active</span>
                                <Sun size={18} className="text-amber-500" />
                            </div>
                            <div className="text-2xl font-bold text-slate-800 dark:text-white">{data.shaswata_active}</div>
                            <div className="mt-2 text-xs text-slate-400">Perpetual subscriptions</div>
                        </div>
                    </div>

                    {/* ── PAYMENT SPLIT (Cash vs UPI) ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                <PieIcon size={16} className="text-orange-500" /> Payment Split
                            </h3>
                            <div className="flex items-center gap-6">
                                <div className="w-32 h-32">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Cash', value: fin.cash },
                                                    { name: 'UPI', value: fin.upi },
                                                ]}
                                                cx="50%" cy="50%" innerRadius={35} outerRadius={55}
                                                dataKey="value" stroke="none"
                                            >
                                                <Cell fill="#f97316" />
                                                <Cell fill="#3b82f6" />
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-sm">
                                            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                                            <span className="text-slate-600 dark:text-slate-400">Cash</span>
                                        </span>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-slate-800 dark:text-white">{formatCurrency(fin.cash)}</span>
                                            <span className="text-xs text-slate-400 ml-2">({fin.cash_pct}%)</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-sm">
                                            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                            <span className="text-slate-600 dark:text-slate-400">UPI</span>
                                        </span>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-slate-800 dark:text-white">{formatCurrency(fin.upi)}</span>
                                            <span className="text-xs text-slate-400 ml-2">({fin.upi_pct}%)</span>
                                        </div>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500 rounded-full transition-all duration-700" style={{ width: `${fin.cash_pct}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── PEAK HOURS HEATMAP ── */}
                        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                <Clock size={16} className="text-purple-500" /> Peak Hours
                            </h3>
                            <div className="h-36">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={(data.hourly_heatmap || []).filter(h => h.hour >= 5 && h.hour <= 21)} barSize={14}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                                        <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={h => HOUR_LABELS[h]} />
                                        <YAxis tick={{ fontSize: 10 }} width={30} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="bookings" name="Bookings" radius={[4, 4, 0, 0]}>
                                            {(data.hourly_heatmap || []).filter(h => h.hour >= 5 && h.hour <= 21).map((entry, i) => {
                                                const maxBookings = Math.max(...(data.hourly_heatmap || []).map(h => h.bookings), 1);
                                                const intensity = entry.bookings / maxBookings;
                                                const color = intensity > 0.7 ? '#f97316' : intensity > 0.3 ? '#fb923c' : '#fdba74';
                                                return <Cell key={i} fill={color} />;
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* ── REVENUE TREND (Area Chart) ── */}
                    {data.daily_trends?.length > 1 && (
                        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                <TrendingUp size={16} className="text-emerald-500" /> Revenue Trend
                            </h3>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.daily_trends}>
                                        <defs>
                                            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
                                                <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                                        <YAxis tick={{ fontSize: 10 }} width={50} tickFormatter={v => formatCurrency(v)} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#f97316" strokeWidth={2.5} fill="url(#revenueGrad)" />
                                        <Line type="monotone" dataKey="count" name="Bookings" stroke="#3b82f6" strokeWidth={1.5} dot={false} yAxisId={0} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* ── SEVA BREAKDOWN (Interactive Bar Chart + Drill-Down) ── */}
                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                            <BarChart3 size={16} className="text-orange-500" /> Seva Performance
                            <span className="text-xs text-slate-400 font-normal ml-auto">(Click a bar to drill down)</span>
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={(data.seva_stats || []).slice(0, 10)}
                                    layout="vertical"
                                    onClick={(e) => { if (e?.activePayload?.[0]) handleDrillDown(e.activePayload[0].payload.name); }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => formatCurrency(v)} />
                                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="revenue" name="Revenue" radius={[0, 6, 6, 0]} barSize={20}>
                                        {(data.seva_stats || []).slice(0, 10).map((entry, i) => (
                                            <Cell
                                                key={i}
                                                fill={drillDown?.seva_name === entry.name ? '#ea580c' : COLORS[i % COLORS.length]}
                                                opacity={drillDown?.seva_name === entry.name ? 1 : 0.8}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* ── DRILL-DOWN TABLE ── */}
                        {drillDown && (
                            <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-2">
                                        <Eye size={14} /> {drillDown.seva_name} — {drillDown.transactions.length} bookings
                                    </h4>
                                    <button onClick={() => setDrillDown(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                                {drillLoading ? (
                                    <div className="flex justify-center py-4"><RefreshCw className="animate-spin text-orange-500" size={20} /></div>
                                ) : (
                                    <div className="max-h-60 overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                                    <th className="text-left py-2 px-2">Receipt</th>
                                                    <th className="text-left py-2 px-2">Devotee</th>
                                                    <th className="text-right py-2 px-2">Amount</th>
                                                    <th className="text-center py-2 px-2">Mode</th>
                                                    <th className="text-right py-2 px-2">Time</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {drillDown.transactions.map((t, i) => (
                                                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-orange-50/50 dark:hover:bg-slate-800/50">
                                                        <td className="py-2 px-2 font-mono text-xs text-slate-600 dark:text-slate-400">{t.receipt_no}</td>
                                                        <td className="py-2 px-2 text-slate-800 dark:text-white">{t.devotee_name}</td>
                                                        <td className="py-2 px-2 text-right font-semibold text-slate-800 dark:text-white">₹{t.amount}</td>
                                                        <td className="py-2 px-2 text-center">
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${t.payment_mode === 'CASH' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                                                {t.payment_mode}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-2 text-right text-xs text-slate-500">{t.time.includes(' ') ? t.time.split(' ')[1]?.substring(0, 8) : t.time.substring(11, 19)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── DETAILED BREAKDOWN TABLE ── */}
                    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                            Seva Summary Table
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                                        <th className="text-left py-3 px-3">#</th>
                                        <th className="text-left py-3 px-3">Seva</th>
                                        <th className="text-right py-3 px-3">Count</th>
                                        <th className="text-right py-3 px-3">Revenue</th>
                                        <th className="text-right py-3 px-3">% Share</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data.seva_stats || []).map((s, i) => (
                                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-orange-50/30 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3 px-3 text-slate-400">{i + 1}</td>
                                            <td className="py-3 px-3 text-slate-800 dark:text-white font-medium">{s.name}</td>
                                            <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-300">{s.count}</td>
                                            <td className="py-3 px-3 text-right font-semibold text-slate-800 dark:text-white">₹{s.revenue.toLocaleString()}</td>
                                            <td className="py-3 px-3 text-right text-slate-500 dark:text-slate-400">
                                                {fin.total > 0 ? ((s.revenue / fin.total) * 100).toFixed(1) : 0}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10">
                                        <td className="py-3 px-3"></td>
                                        <td className="py-3 px-3 font-bold text-slate-800 dark:text-white">TOTAL</td>
                                        <td className="py-3 px-3 text-right font-bold text-slate-800 dark:text-white">{fin.tx_count}</td>
                                        <td className="py-3 px-3 text-right font-bold text-orange-600 dark:text-orange-400">₹{fin.total.toLocaleString()}</td>
                                        <td className="py-3 px-3 text-right font-bold">100%</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
