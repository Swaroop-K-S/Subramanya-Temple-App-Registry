import React, { useState, useEffect } from 'react';
import { useTempleTime } from '../context/TimeContext';
import { useTheme } from '../context/ThemeContext';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { Calendar, Download, RefreshCcw, ArrowLeft, IndianRupee, CreditCard, Banknote, FileText, TrendingUp, Users, Activity } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TRANSLATIONS } from './translations';
import api from '../services/api';
import { formatDateReport } from '../utils/dateUtils';

// --- VISUAL CONSTANTS ---
const COLORS = {
    saffron: '#F97316',
    gold: '#F59E0B',
    emerald: '#10B981',
    rose: '#F43F5E',
    slate: '#64748B',
    white: '#FFFFFF',
    purple: '#8B5CF6',
    blue: '#3B82F6',
    indigo: '#6366F1'
};

const CHART_PALETTE = [COLORS.saffron, COLORS.emerald, COLORS.blue, COLORS.purple, COLORS.rose, COLORS.gold];

// --- CUSTOM TOOLTIP ---
const CustomTooltip = ({ active, payload, label, isDarkMode }) => {
    if (active && payload && payload.length) {
        return (
            <div className={`
                p-4 rounded-xl shadow-2xl backdrop-blur-xl border
                ${isDarkMode ? 'bg-slate-900/90 border-white/10 text-white' : 'bg-white/90 border-white/40 text-slate-800'}
            `}>
                {label && <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">{label}</p>}
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload.fill }}></div>
                        <p className="text-sm font-bold">
                            <span className="opacity-70">{entry.name}:</span> {
                                entry.name.toLowerCase().includes('revenue') || entry.name.toLowerCase().includes('total')
                                    ? `₹${Number(entry.value).toLocaleString('en-IN')}`
                                    : entry.value
                            }
                        </p>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// --- CHARTS ---

// 1. Divine Area Chart (Daily Trends) - Cosmic Purple/Blue
const DivineTrendChart = ({ data, isDarkMode }) => (
    <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#E2E8F0'} opacity={0.3} />
            <XAxis
                dataKey="date"
                hide
                interval="preserveStartEnd"
            />
            <YAxis tick={false} axisLine={false} />
            <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
            <Area
                type="monotone"
                dataKey="revenue"
                stroke={COLORS.blue}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                strokeWidth={3}
                animationDuration={1500}
                animationEasing="ease-out"
                name="Revenue"
            />
        </AreaChart>
    </ResponsiveContainer>
);

// 2. Horizontal Bar Chart (Top Sevas) - Distinct Colors
const TopSevasChart = ({ data, isDarkMode }) => (
    <ResponsiveContainer width="100%" height={300}>
        <BarChart layout="vertical" data={data} margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkMode ? '#334155' : '#E2E8F0'} opacity={0.3} />
            <XAxis type="number" hide />
            <YAxis
                dataKey="name"
                type="category"
                width={120}
                tick={{ fontSize: 11, fill: isDarkMode ? '#CBD5E1' : '#475569', fontWeight: 600 }}
                interval={0}
            />
            <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} cursor={{ fill: isDarkMode ? '#334155' : '#F1F5F9', opacity: 0.4 }} />
            <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={20} animationDuration={1200} name="Revenue">
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                ))}
            </Bar>
        </BarChart>
    </ResponsiveContainer>
);

// 3. Payment Mode Donut - Distinct Colors
const PaymentDonut = ({ data, isDarkMode }) => (
    <ResponsiveContainer width="100%" height={300}>
        <PieChart>
            <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
            >
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
            </Pie>
            <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
        </PieChart>
    </ResponsiveContainer>
);


// --- MAIN COMPONENT ---
const ReportsDashboard = ({ onBack, lang = 'EN' }) => {
    const t = TRANSLATIONS[lang];
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

    // State
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [error, setError] = useState(null);
    const { currentDate, isNewDay } = useTempleTime();

    // Fetch Logic
    const fetchReport = async (start = dateRange.start, end = dateRange.end) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/reports?start_date=${start}&end_date=${end}`);
            setReportData(response.data);
        } catch (err) {
            console.error("Fetch Error:", err);
            setError("Could not retrieve temple data.");
        } finally {
            setLoading(false);
        }
    };

    // Initial Load & Midnight Reset
    useEffect(() => { fetchReport(); }, []);
    useEffect(() => {
        if (isNewDay) {
            const today = new Date().toISOString().split('T')[0];
            setDateRange({ start: today, end: today });
            fetchReport(today, today);
        }
    }, [isNewDay]);

    // Formatters
    const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);

    // Derived Data for Charts
    const pieData = reportData ? [
        { name: 'Cash', value: reportData.financials.cash, color: COLORS.gold },      // Gold for Cash
        { name: 'UPI', value: reportData.financials.upi, color: COLORS.emerald }      // Emerald for UPI
    ].filter(d => d.value > 0) : [];

    const trendData = reportData?.daily_trends || [];

    // Exports
    const handlePdfExport = async () => {
        if (!reportData) return;

        try {
            // 1. Fetch Detailed Transaction Data
            // Fix: Backend expects DD-MM-YYYY
            const formatDateForApi = (isoDate) => {
                const [y, m, d] = isoDate.split('-');
                return `${d}-${m}-${y}`;
            };
            const response = await api.get(`/reports/collection?start_date=${formatDateForApi(dateRange.start)}&end_date=${formatDateForApi(dateRange.end)}`);
            const detailedData = response.data;
            const transactions = detailedData.transactions || [];

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;

            // Helper: Text Centering
            const centerText = (text, y) => {
                const textWidth = doc.getStringUnitWidth(text) * doc.internal.getFontSize() / doc.internal.scaleFactor;
                const x = (pageWidth - textWidth) / 2;
                doc.text(text, x, y);
            };

            // Helper: Formatting
            const formatForPdf = (amt) => `Rs. ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amt)}`;

            // --- PAGE 1: OVERVIEW ---

            // Header
            doc.setFillColor(249, 115, 22); // Temple Saffron
            doc.rect(0, 0, pageWidth, 20, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('SHREE SUBRAMANYA TEMPLE', 14, 13);

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(14);
            doc.text('Financial Report - Overview', 14, 30);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 36);
            doc.text(`Period: ${formatDateReport(dateRange.start)} to ${formatDateReport(dateRange.end)}`, 14, 42);

            let finalY = 45;

            // 1. Financial Summary
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('1. Financial Summary', 14, finalY + 10);

            autoTable(doc, {
                startY: finalY + 12,
                head: [['Category', 'Amount']],
                body: [
                    ['Total Collection', formatForPdf(reportData.financials.total)],
                    ['Cash Collection', formatForPdf(reportData.financials.cash)],
                    ['UPI Collection', formatForPdf(reportData.financials.upi)],
                    ['Total Receipts', reportData.seva_stats.reduce((acc, s) => acc + s.count, 0).toString()]
                ],
                theme: 'striped',
                headStyles: { fillColor: [64, 64, 64] },
                columnStyles: { 0: { fontStyle: 'bold', width: 80 }, 1: { halign: 'right' } },
                margin: { left: 14 }
            });

            finalY = doc.lastAutoTable.finalY + 10;

            // 2. Seva Breakdown
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('2. Top Sevas', 14, finalY);

            autoTable(doc, {
                startY: finalY + 2,
                head: [['Seva Name', 'Count', 'Revenue']],
                body: reportData.seva_stats.slice(0, 10).map(s => [s.name, s.count, formatForPdf(s.revenue)]),
                theme: 'grid',
                headStyles: { fillColor: [249, 115, 22] }, // Saffron
                columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } },
            });

            // --- DAILY PAGES ---

            // Group transactions by Date
            const groupedByDate = transactions.reduce((acc, tx) => {
                const dateStr = tx.time.split(' ')[0]; // Extract YYYY-MM-DD
                if (!acc[dateStr]) acc[dateStr] = [];
                acc[dateStr].push(tx);
                return acc;
            }, {});

            // Sort dates
            const sortedDates = Object.keys(groupedByDate).sort();

            for (const dateKey of sortedDates) {
                doc.addPage();

                // Page Header
                doc.setFillColor(59, 130, 246); // Blue for Daily Pages
                doc.rect(0, 0, pageWidth, 15, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(`Daily Report: ${formatDateReport(dateKey)}`, 14, 10);

                // Calculate Daily Total
                const dailyTxns = groupedByDate[dateKey];
                const dailyTotal = dailyTxns.reduce((sum, t) => sum + t.amount, 0);

                doc.setTextColor(0, 0, 0);
                doc.setFontSize(10);
                doc.text(`Total Collection: ${formatForPdf(dailyTotal)}  |  Receipts: ${dailyTxns.length}`, 14, 25);

                // Transaction Table
                autoTable(doc, {
                    startY: 30,
                    head: [['Receipt', 'Devotee', 'Seva', 'Mode', 'Amount']],
                    body: dailyTxns.map(t => [
                        t.receipt_no,
                        t.devotee_name,
                        t.seva_name,
                        t.payment_mode,
                        formatForPdf(t.amount)
                    ]),
                    theme: 'plain',
                    headStyles: { fillColor: [226, 232, 240], textColor: 0, fontStyle: 'bold' },
                    columnStyles: { 4: { halign: 'right' } },
                    styles: { fontSize: 9, cellPadding: 2 }
                });
            }

            // --- FOOTER ---
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                centerText(`Page ${i} of ${pageCount} - Divine Analytics System`, 290);
            }

            doc.save(`Temple_Report_${dateRange.start}_Detailed.pdf`);
        } catch (err) {
            console.error("PDF Export Failed:", err);
            alert("Failed to export PDF. Check console for details.");
        }
    };

    const handleExport = () => {
        const url = `http://127.0.0.1:8000/reports/export?start_date=${dateRange.start}&end_date=${dateRange.end}&t=${new Date().getTime()}`;
        window.open(url, '_blank');
    };

    return (
        <div className="min-h-screen w-full p-6 animate-in fade-in zoom-in duration-500 bg-slate-50 dark:!bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">

            {/* --- HEADER --- */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <button onClick={onBack} className="text-sm font-semibold text-slate-500 hover:text-temple-saffron mb-2 flex items-center gap-1 transition-colors">
                        <ArrowLeft size={16} /> {lang === 'KN' ? 'ಹಿಂದಕ್ಕೆ' : 'Back to Dashboard'}
                    </button>
                    <h1 className="text-4xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-temple-brown to-temple-saffron dark:from-amber-100 dark:to-orange-200">
                        {lang === 'KN' ? 'ದೈವಿಕ ವರದಿಗಳು' : 'Divine Analytics'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Insight into temple prosperity and devotee engagement</p>
                </div>

                {/* Date Controls */}
                <div className="glass-card p-2 flex items-center gap-2 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-lg border border-white/20">
                    <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 outline-none p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" />
                    <span className="text-slate-400">to</span>
                    <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 outline-none p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" />
                    <button onClick={() => fetchReport()} disabled={loading}
                        className="bg-temple-saffron hover:bg-orange-600 text-white p-2.5 rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all mx-1">
                        <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-8">
                {/* --- KPI CARDS --- */}
                {reportData && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* 1. Total Collection (Hero) */}
                        <div className="md:col-span-1 relative overflow-hidden rounded-[2.5rem] p-8 shadow-2xl transition-all hover:scale-[1.02] duration-500 group">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 opacity-90"></div>
                            <div className="absolute -right-10 -top-10 text-white/10 group-hover:scale-110 transition-transform duration-700">
                                <IndianRupee size={180} />
                            </div>
                            <div className="relative z-10 text-white">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80 mb-1">Total Collection</p>
                                <h2 className="text-5xl font-black font-heading mb-4 drop-shadow-sm">{formatCurrency(reportData.financials.total)}</h2>
                                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold">
                                    <TrendingUp size={12} /> +12% vs last period
                                </div>
                            </div>
                        </div>

                        {/* 2. Total Devotees */}
                        <div className="glass-card p-6 flex flex-col justify-between hover:border-temple-saffron/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-blue-100/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Sevas</p>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                                        {reportData.seva_stats.reduce((acc, curr) => acc + curr.count, 0)}
                                    </h3>
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[70%] rounded-full"></div>
                            </div>
                        </div>

                        {/* 3. Avg Transaction */}
                        <div className="glass-card p-6 flex flex-col justify-between hover:border-emerald-500/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Avg. Ticket</p>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                                        {formatCurrency(reportData.financials.total / (reportData.seva_stats.reduce((acc, curr) => acc + curr.count, 0) || 1))}
                                    </h3>
                                </div>
                            </div>
                            <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[45%] rounded-full"></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- CHARTS ROW 1 --- */}
                {reportData && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Trend Chart (2/3 width) */}
                        <div className="lg:col-span-2 glass-card p-6 relative flex flex-col min-h-[400px]">
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2">
                                <TrendingUp size={18} className="text-blue-500" /> Revenue Trend
                            </h3>
                            <div className="flex-1 w-full min-h-0">
                                <DivineTrendChart data={trendData} isDarkMode={isDarkMode} />
                            </div>
                        </div>

                        {/* Payment Split (1/3 width) */}
                        <div className="glass-card p-6 flex flex-col min-h-[400px]">
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2">
                                <CreditCard size={18} className="text-emerald-500" /> Modes
                            </h3>
                            <div className="flex-1 w-full min-h-0 flex items-center justify-center relative">
                                <PaymentDonut data={pieData} isDarkMode={isDarkMode} />
                                {/* Center Text */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-xs text-slate-400 uppercase font-bold">Total</span>
                                    <span className="text-xl font-black text-slate-700 dark:text-slate-200">{formatCurrency(reportData.financials.total)}</span>
                                </div>
                            </div>
                            <div className="flex justify-center gap-4 mt-4">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.gold }}></div> Cash
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.emerald }}></div> UPI
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TOP SEVAS ROW --- */}
                {reportData && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Sevas Bar Chart */}
                        <div className="glass-card p-6 min-h-[400px] flex flex-col">
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-6">Top Performing Sevas</h3>
                            <div className="flex-1 w-full">
                                <TopSevasChart data={reportData.seva_stats.slice(0, 5)} isDarkMode={isDarkMode} />
                            </div>
                        </div>

                        {/* Recent Activity / Detailed List */}
                        <div className="glass-card overflow-hidden flex flex-col min-h-[400px]">
                            <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                <h3 className="font-bold text-slate-700 dark:text-slate-200">Detailed Breakdown</h3>
                                <div className="flex gap-2">
                                    <button onClick={handlePdfExport} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-red-500 transition-colors">
                                        <FileText size={18} />
                                    </button>
                                    <button onClick={handleExport} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-green-500 transition-colors">
                                        <Download size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-y-auto flex-1 max-h-[300px]">
                                <table className="w-full text-left text-sm">
                                    <thead className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10 shadow-sm">
                                        <tr>
                                            <th className="px-6 py-3 font-bold text-slate-500 dark:text-slate-400">Seva</th>
                                            <th className="px-6 py-3 font-bold text-center text-slate-500 dark:text-slate-400">Qty</th>
                                            <th className="px-6 py-3 font-bold text-right text-slate-500 dark:text-slate-400">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {reportData.seva_stats.map((s, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300 group-hover:text-temple-saffron transition-colors">{s.name}</td>
                                                <td className="px-6 py-3 text-center text-slate-500">{s.count}</td>
                                                <td className="px-6 py-3 text-right font-bold text-slate-700 dark:text-slate-200">{formatCurrency(s.revenue)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsDashboard;