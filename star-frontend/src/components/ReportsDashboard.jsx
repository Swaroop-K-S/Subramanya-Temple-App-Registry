import React, { useState, useEffect, useRef } from 'react';
import { Download, Search, Calendar } from 'lucide-react';
import api from '../services/api';

const ReportsDashboard = () => {
    // Helper: Get today's LOCAL date string (YYYY-MM-DD)
    // FIX: .toISOString() uses UTC, which shows yesterday's date if late at night in US/early in India
    const getToday = () => {
        const today = new Date();
        const year = today.getFullYear();
        // Month is 0-indexed
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Helper: Convert YYYY-MM-DD (Input) to DD-MM-YYYY (API)
    const formatDateForApi = (isoDate) => {
        if (!isoDate) return null;
        const [year, month, day] = isoDate.split('-');
        return `${day}-${month}-${year}`;
    };

    // Helper: Format Date for Display (DD-MM-YYYY)
    const formatDateDisplay = (isoDateString) => {
        if (!isoDateString) return "";
        const date = new Date(isoDateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    // --- STATE MANAGEMENT ---

    // 1. INPUT STATE: Strictly controls the input fields
    const [startDate, setStartDate] = useState(getToday());
    const [endDate, setEndDate] = useState(getToday());

    // 2. ACTIVE REPORT STATE: Trigger for API
    const [activeRange, setActiveRange] = useState({
        start: getToday(),
        end: getToday()
    });

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Refs for picking (Optional UX)
    const startInputRef = useRef(null);
    const endInputRef = useRef(null);

    // --- HANDLERS ---

    const handleSearch = () => {
        if (!startDate || !endDate) {
            alert("Please select both dates.");
            return;
        }
        // Commit inputs to active state
        setActiveRange({ start: startDate, end: endDate });
    };

    const applyQuickFilter = (type) => {
        const today = new Date();
        // Logic for Quick Filters (Using Local Time)
        const getIso = (d) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const end = getIso(today);
        let start = end;

        if (type === 'week') {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            start = getIso(d);
        } else if (type === 'month') {
            const d = new Date();
            d.setDate(1); // 1st of this month
            start = getIso(d);
        }

        // Update UI
        setStartDate(start);
        setEndDate(end);
        // Trigger Search
        setActiveRange({ start, end });
    };

    // --- API EFFECTS ---

    useEffect(() => {
        fetchReport();
    }, [activeRange]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            // Transform YYYY-MM-DD -> DD-MM-YYYY for Backend
            const apiStart = formatDateForApi(activeRange.start);
            const apiEnd = formatDateForApi(activeRange.end);

            console.log(`Fetching: ${apiStart} -> ${apiEnd}`);
            const response = await api.get(`/reports/collection?start_date=${apiStart}&end_date=${apiEnd}`);
            setReportData(response.data);
        } catch (error) {
            console.error("Error fetching report:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            const apiStart = formatDateForApi(activeRange.start);
            const apiEnd = formatDateForApi(activeRange.end);

            const response = await api.get(`/reports/export?start_date=${apiStart}&end_date=${apiEnd}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `STAR_Report_${apiStart}_to_${apiEnd}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert("Download failed!");
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="p-6 max-w-6xl mx-auto min-h-screen bg-gray-50">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Financial Reports</h1>
                    <p className="text-gray-500 mt-1">Daily collection track & analytics</p>
                </div>
                <button
                    onClick={handleDownload}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-md transition-all active:scale-95"
                >
                    <Download size={18} /> Download Excel
                </button>
            </div>

            {/* CONTROLS */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-8">
                <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">

                    {/* Quick Filters */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-500 mr-2">Quick:</span>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button onClick={() => applyQuickFilter('today')} className="px-4 py-1.5 text-sm font-medium rounded-md text-gray-700 hover:bg-white hover:shadow-sm">Today</button>
                            <button onClick={() => applyQuickFilter('week')} className="px-4 py-1.5 text-sm font-medium rounded-md text-gray-700 hover:bg-white hover:shadow-sm">This Week</button>
                            <button onClick={() => applyQuickFilter('month')} className="px-4 py-1.5 text-sm font-medium rounded-md text-gray-700 hover:bg-white hover:shadow-sm">This Month</button>
                        </div>
                    </div>

                    {/* Date Inputs */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <span className="text-sm font-bold text-gray-500">Range:</span>

                        <div className="relative flex items-center">
                            <input
                                ref={startInputRef}
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border border-gray-300 rounded-l-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-36 cursor-pointer"
                            />
                            <button onClick={() => startInputRef.current?.showPicker()} className="bg-gray-200 hover:bg-gray-300 border border-l-0 border-gray-300 p-2 rounded-r-md text-gray-600">
                                <Calendar size={16} />
                            </button>
                        </div>

                        <span className="text-gray-400 font-medium">to</span>

                        <div className="relative flex items-center">
                            <input
                                ref={endInputRef}
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="border border-gray-300 rounded-l-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-36 cursor-pointer"
                            />
                            <button onClick={() => endInputRef.current?.showPicker()} className="bg-gray-200 hover:bg-gray-300 border border-l-0 border-gray-300 p-2 rounded-r-md text-gray-600">
                                <Calendar size={16} />
                            </button>
                        </div>

                        <button
                            onClick={handleSearch}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md shadow-sm transition-colors flex items-center justify-center gap-2 font-bold"
                        >
                            <Search size={18} /> Go
                        </button>
                    </div>
                </div>
            </div>

            {/* DASHBOARD DATA */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading Report...</p>
                </div>
            ) : reportData ? (
                <div className="animate-fade-in">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white border-l-4 border-green-500 p-6 rounded-xl shadow-md">
                            <p className="text-gray-500 text-sm font-semibold uppercase">Total Cash</p>
                            <h3 className="text-3xl font-bold text-gray-800 mt-2">{formatCurrency(reportData.summary.cash)}</h3>
                        </div>
                        <div className="bg-white border-l-4 border-blue-500 p-6 rounded-xl shadow-md">
                            <p className="text-gray-500 text-sm font-semibold uppercase">Total UPI</p>
                            <h3 className="text-3xl font-bold text-gray-800 mt-2">{formatCurrency(reportData.summary.upi)}</h3>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
                            <p className="text-orange-100 text-sm font-bold uppercase tracking-wider">Grand Total</p>
                            <h3 className="text-4xl font-extrabold mt-2">{formatCurrency(reportData.summary.total)}</h3>
                            <p className="text-sm mt-2 opacity-80">{reportData.summary.transaction_count} receipts</p>
                        </div>
                    </div>

                    {/* Transactions */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Transactions</h3>
                            <span className="text-xs bg-gray-700 px-3 py-1 rounded-full text-gray-300">
                                {formatDateForApi(activeRange.start)} - {formatDateForApi(activeRange.end)}
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Date & Time</th>
                                        <th className="px-6 py-4">Receipt</th>
                                        <th className="px-6 py-4">Devotee</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4 text-center">Mode</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {reportData.transactions.length > 0 ? (
                                        reportData.transactions.map((t) => (
                                            <tr key={t.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                    {formatDateDisplay(t.created_at || t.transaction_date)}
                                                    <span className="text-xs ml-2 text-gray-400">
                                                        {new Date(t.created_at || t.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-gray-600">{t.id}</td>
                                                <td className="px-6 py-4 font-medium text-gray-800">{t.devotee_name}</td>
                                                <td className="px-6 py-4 font-bold text-gray-800">{formatCurrency(t.amount)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${t.payment_mode === 'UPI' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                        {t.payment_mode}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5" className="text-center py-10 text-gray-500">No data found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default ReportsDashboard;