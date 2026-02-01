
import React, { useState, useEffect } from 'react';
import { useTempleTime } from '../context/TimeContext';
import { useTheme } from '../context/ThemeContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { Calendar, Download, RefreshCcw, ArrowLeft, IndianRupee, CreditCard, Banknote } from 'lucide-react';
import { TRANSLATIONS } from './translations';
import api from '../services/api';

const COLORS = ['#F97316', '#8B5CF6', '#10B981', '#F43F5E'];

// Helper: Get Local YYYY-MM-DD
const getLocalDateStr = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const ReportsDashboard = ({ onBack, lang = 'EN' }) => {
    const t = TRANSLATIONS[lang];
    const { theme } = useTheme(); // Hook into ThemeContext
    // State
    const [dateRange, setDateRange] = useState({
        start: getLocalDateStr(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), // 1st of current month
        end: getLocalDateStr(new Date()) // Today
    });
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [error, setError] = useState(null);
    const { currentDate, isNewDay } = useTempleTime();

    // Fetch Report
    const fetchReport = async (start = dateRange.start, end = dateRange.end) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/reports?start_date=${start}&end_date=${end}`);
            setReportData(response.data);
        } catch (err) {
            console.error("Failed to fetch report:", err);
            setError("Failed to connect to server. Please ensure the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh at midnight (Reset view to Today)
    useEffect(() => {
        if (isNewDay) {
            console.log("Midnight Reset: Updates Reports to Today");
            const todayStr = getLocalDateStr(currentDate);

            // Reset both start & end to Today
            setDateRange({
                start: todayStr,
                end: todayStr
            });

            // Trigger fetch immediately with new range
            fetchReport(todayStr, todayStr);
        }
    }, [isNewDay, currentDate]);

    // Export CSV
    const handleExport = () => {
        const url = `http://127.0.0.1:8000/reports/export?start_date=${dateRange.start}&end_date=${dateRange.end}`;
        window.open(url, '_blank');
    };



    // Initial Fetch
    useEffect(() => {
        fetchReport();
    }, []);

    // Helper to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Prepare Pie Data
    const pieData = reportData ? [
        { name: 'Cash', value: reportData.financials.cash, color: '#FF9933' }, // Saffron for Cash
        { name: 'UPI', value: reportData.financials.upi, color: '#F59E0B' }   // Gold for UPI
    ].filter(d => d.value > 0) : [];

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen p-6 animate-in fade-in zoom-in duration-300 transition-colors duration-500">
            {/* Header with Date Picker */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <button onClick={onBack} className="text-sm font-semibold text-gray-500 hover:text-temple-saffron mb-2 flex items-center gap-1 transition-colors">
                        <ArrowLeft size={16} /> {lang === 'KN' ? 'ಹಿಂದಕ್ಕೆ' : 'Back to Dashboard'}
                    </button>
                    <h1 className="text-3xl font-bold font-heading text-temple-brown dark:text-amber-100 transition-colors duration-500">
                        {lang === 'KN' ? 'ಹಣಕಾಸು ವರದಿಗಳು' : 'Financial Reports'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track temple revenue and seva statistics</p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 items-end">
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-temple-sand dark:border-slate-700 flex items-center gap-3 transition-colors duration-500">
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Start Date</label>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="font-semibold text-temple-brown dark:text-amber-100 outline-none text-sm bg-transparent"
                            />
                        </div>
                        <div className="h-8 w-[1px] bg-temple-sand dark:bg-slate-700"></div>
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">End Date</label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="font-semibold text-temple-brown outline-none text-sm bg-transparent"
                            />
                        </div>
                    </div>

                    <button
                        onClick={fetchReport}
                        disabled={loading}
                        className="bg-temple-saffron hover:bg-temple-saffron-dark dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-temple-saffron/20 dark:shadow-none active:scale-95 transition-all flex items-center gap-2"
                    >
                        {loading ? <RefreshCcw size={20} className="animate-spin" /> : <RefreshCcw size={20} />}
                        {lang === 'KN' ? 'ಹುಡುಕಿ' : 'Generate'}
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                {loading && (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <RefreshCcw size={40} className="animate-spin text-orange-200 dark:text-orange-900" />
                        <p className="text-slate-400 dark:text-slate-500 font-medium italic">Gathering records...</p>
                    </div>
                )}

                {error && !loading && (
                    <div className="bg-red-50 border border-red-100 p-8 rounded-2xl text-center">
                        <p className="text-red-500 font-bold mb-4">{error}</p>
                        <button onClick={fetchReport} className="text-temple-saffron font-bold hover:underline">Try Again</button>
                    </div>
                )}

                {reportData && !loading && !error && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Total */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-temple-sand dark:border-slate-800 relative overflow-hidden transition-colors duration-500">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <IndianRupee size={80} className="text-temple-saffron" />
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">Total Collection</p>
                                <h3 className="text-4xl font-black text-temple-brown dark:text-amber-100">{formatCurrency(reportData.financials.total)}</h3>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">
                                    For {dateRange.start} to {dateRange.end}
                                </p>
                            </div>

                            {/* Cash */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-yellow-100 dark:border-yellow-900/30 transition-colors duration-500">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-600 dark:text-yellow-400">
                                        <Banknote size={20} />
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">Cash</p>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{formatCurrency(reportData.financials.cash)}</h3>
                            </div>

                            {/* UPI */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/30 transition-colors duration-500">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                                        <CreditCard size={20} />
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">UPI Online</p>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{formatCurrency(reportData.financials.upi)}</h3>
                            </div>
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Bar Chart - Seva Popularity */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col transition-colors duration-500">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6">Seva Popularity</h3>
                                <div className="h-[300px] w-full" style={{ minWidth: 0 }}>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={reportData.seva_stats.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#334155' : '#e5e7eb'} opacity={0.3} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} interval={0} />
                                            <RechartsTooltip
                                                contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderColor: 'var(--tooltip-border)', color: 'var(--tooltip-text)', borderRadius: '12px' }}
                                                itemStyle={{ color: theme === 'dark' ? '#CBD5E1' : '#F97316', fontWeight: 'bold' }}
                                                cursor={{ fill: '#334155', opacity: 0.2 }}
                                            />
                                            <Bar dataKey="count" fill={theme === 'dark' ? '#CBD5E1' : '#F97316'} radius={[0, 4, 4, 0]} barSize={20} name="Count" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Pie Chart - Payment Split */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col transition-colors duration-500">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6">Payment Method Split</h3>
                                <div className="h-[300px] w-full flex items-center justify-center" style={{ minWidth: 0 }}>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderColor: 'var(--tooltip-border)', color: 'var(--tooltip-text)', borderRadius: '12px' }} />
                                            <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-slate-500 dark:text-slate-400">{value}</span>} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden transition-colors duration-500">
                            <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-temple-sand/50 dark:bg-slate-900 flex justify-between items-center">
                                <h3 className="font-bold text-temple-brown dark:text-amber-100 text-sm uppercase tracking-wider">Detailed Breakdown</h3>
                                <button
                                    onClick={handleExport}
                                    className="text-temple-saffron hover:text-temple-saffron-dark text-xs font-bold flex items-center gap-1"
                                >
                                    <Download size={14} /> Export CSV
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">Seva Name</th>
                                            <th className="px-6 py-4 font-semibold text-center">Count</th>
                                            <th className="px-6 py-4 font-semibold text-right">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                        {reportData.seva_stats.map((seva, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{seva.name}</td>
                                                <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">{seva.count}</td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-300">{formatCurrency(seva.revenue)}</td>
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