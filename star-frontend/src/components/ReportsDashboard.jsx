
import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { Calendar, Download, RefreshCcw, ArrowLeft, IndianRupee, CreditCard, Banknote } from 'lucide-react';
import api from '../services/api';

const COLORS = ['#F97316', '#8B5CF6', '#10B981', '#F43F5E'];

const ReportsDashboard = ({ onBack }) => {
    // State
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // 1st of current month
        end: new Date().toISOString().split('T')[0] // Today
    });
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [error, setError] = useState(null);

    // Fetch Report
    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/reports?start_date=${dateRange.start}&end_date=${dateRange.end}`);
            setReportData(response.data);
        } catch (err) {
            console.error("Failed to fetch report:", err);
            setError("Failed to connect to server. Please ensure the backend is running.");
        } finally {
            setLoading(false);
        }
    };

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
        { name: 'Cash', value: reportData.financials.cash, color: '#F59E0B' }, // Amber for Cash
        { name: 'UPI', value: reportData.financials.upi, color: '#10B981' }   // Emerald for UPI
    ].filter(d => d.value > 0) : [];

    return (
        <div className="bg-slate-50 min-h-screen p-6 animate-in fade-in zoom-in duration-300">
            {/* Header with Date Picker */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <button onClick={onBack} className="text-sm font-semibold text-gray-500 hover:text-orange-600 mb-2 flex items-center gap-1 transition-colors">
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold font-heading text-slate-800">Financial Reports</h1>
                    <p className="text-slate-500 text-sm mt-1">Track temple revenue and seva statistics</p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 items-end">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Start Date</label>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="font-semibold text-slate-700 outline-none text-sm bg-transparent"
                            />
                        </div>
                        <div className="h-8 w-[1px] bg-gray-200"></div>
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">End Date</label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="font-semibold text-slate-700 outline-none text-sm bg-transparent"
                            />
                        </div>
                    </div>

                    <button
                        onClick={fetchReport}
                        disabled={loading}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-orange-200 active:scale-95 transition-all flex items-center gap-2"
                    >
                        {loading ? <RefreshCcw size={20} className="animate-spin" /> : <RefreshCcw size={20} />}
                        Generate
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                {loading && (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <RefreshCcw size={40} className="animate-spin text-orange-200" />
                        <p className="text-slate-400 font-medium italic">Gathering records...</p>
                    </div>
                )}

                {error && !loading && (
                    <div className="bg-red-50 border border-red-100 p-8 rounded-2xl text-center">
                        <p className="text-red-500 font-bold mb-4">{error}</p>
                        <button onClick={fetchReport} className="text-orange-600 font-bold hover:underline">Try Again</button>
                    </div>
                )}

                {reportData && !loading && !error && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Total */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <IndianRupee size={80} className="text-orange-500" />
                                </div>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1">Total Collection</p>
                                <h3 className="text-4xl font-black text-slate-800">{formatCurrency(reportData.financials.total)}</h3>
                                <p className="text-xs text-slate-400 mt-2 font-medium">
                                    For {dateRange.start} to {dateRange.end}
                                </p>
                            </div>

                            {/* Cash */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-yellow-100">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                                        <Banknote size={20} />
                                    </div>
                                    <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Cash</p>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(reportData.financials.cash)}</h3>
                            </div>

                            {/* UPI */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                        <CreditCard size={20} />
                                    </div>
                                    <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">UPI Online</p>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(reportData.financials.upi)}</h3>
                            </div>
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Bar Chart - Seva Popularity */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                                <h3 className="text-lg font-bold text-slate-800 mb-6">Seva Popularity</h3>
                                <div className="flex-1 min-h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={reportData.seva_stats.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} interval={0} />
                                            <RechartsTooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                itemStyle={{ color: '#f97316', fontWeight: 'bold' }}
                                            />
                                            <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={20} name="Count" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Pie Chart - Payment Split */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                                <h3 className="text-lg font-bold text-slate-800 mb-6">Payment Method Split</h3>
                                <div className="flex-1 min-h-[300px] flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
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
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Detailed Breakdown</h3>
                                <button
                                    onClick={handleExport}
                                    className="text-orange-600 hover:text-orange-700 text-xs font-bold flex items-center gap-1"
                                >
                                    <Download size={14} /> Export CSV
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white text-slate-500 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">Seva Name</th>
                                            <th className="px-6 py-4 font-semibold text-center">Count</th>
                                            <th className="px-6 py-4 font-semibold text-right">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {reportData.seva_stats.map((seva, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 font-medium text-slate-800">{seva.name}</td>
                                                <td className="px-6 py-4 text-center text-slate-600">{seva.count}</td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-700">{formatCurrency(seva.revenue)}</td>
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