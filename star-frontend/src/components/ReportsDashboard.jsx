import React, { useState, useEffect } from 'react';
import { Download, Calendar, Search } from 'lucide-react';
import api from '../services/api';

const ReportsDashboard = () => {
    // Dates initialized to TODAY
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    // --- HELPER: Quick Date Setters ---
    const setRange = (type) => {
        const today = new Date();
        const end = today.toISOString().split('T')[0];
        let start = end;

        if (type === 'today') {
            // Start is today
        } else if (type === 'week') {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            start = d.toISOString().split('T')[0];
        } else if (type === 'month') {
            const d = new Date();
            d.setDate(1); // 1st of this month
            start = d.toISOString().split('T')[0];
        }

        setStartDate(start);
        setEndDate(end);
    };

    // --- API CALL ---
    const fetchReport = async () => {
        setLoading(true);
        try {
            // Send dates as query params
            const response = await api.get(`/reports/collection?start_date=${startDate}&end_date=${endDate}`);
            setReportData(response.data);
        } catch (error) {
            console.error("Report Error:", error);
            alert("Failed to load report.");
        } finally {
            setLoading(false);
        }
    };

    // Auto-load when dates change
    useEffect(() => {
        fetchReport();
    }, [startDate, endDate]);

    // --- DOWNLOAD LOGIC ---
    const handleDownload = async () => {
        try {
            const response = await api.get(`/reports/export?start_date=${startDate}&end_date=${endDate}`, {
                responseType: 'blob', // Important for files
            });

            // Create a hidden link to trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `STAR_Report_${startDate}_to_${endDate}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert("Download failed!");
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* HEADER & CONTROLS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Financial Reports</h1>
                    <p className="text-sm text-gray-500">Track collections and download statements</p>
                </div>

                <div className="flex gap-2">
                    <button onClick={handleDownload} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 font-semibold shadow-sm">
                        <Download size={18} /> Download Excel
                    </button>
                </div>
            </div>

            {/* FILTER BAR */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

                    {/* Quick Buttons */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setRange('today')} className="px-4 py-1.5 text-sm font-medium rounded-md hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm">Today</button>
                        <button onClick={() => setRange('week')} className="px-4 py-1.5 text-sm font-medium rounded-md hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm">This Week</button>
                        <button onClick={() => setRange('month')} className="px-4 py-1.5 text-sm font-medium rounded-md hover:bg-white hover:shadow-sm transition-all focus:bg-white focus:shadow-sm">This Month</button>
                    </div>

                    {/* Custom Range Inputs */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-500">Custom:</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border rounded px-2 py-1.5 text-sm"
                        />
                        <span className="text-gray-400">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border rounded px-2 py-1.5 text-sm"
                        />
                        <button onClick={fetchReport} className="bg-orange-500 text-white p-1.5 rounded hover:bg-orange-600">
                            <Search size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* SUMMARY CARDS */}
            {reportData && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
                            <p className="text-green-600 font-bold text-sm uppercase">Total Cash</p>
                            <h3 className="text-3xl font-bold text-gray-800 mt-1">₹{reportData.summary.cash}</h3>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
                            <p className="text-blue-600 font-bold text-sm uppercase">Total UPI</p>
                            <h3 className="text-3xl font-bold text-gray-800 mt-1">₹{reportData.summary.upi}</h3>
                        </div>
                        <div className="bg-orange-500 text-white p-6 rounded-xl shadow-lg transform scale-105">
                            <p className="font-bold text-sm uppercase opacity-90">Grand Total</p>
                            <h3 className="text-4xl font-bold mt-1">₹{reportData.summary.total}</h3>
                            <p className="text-xs mt-2 opacity-80">{reportData.transactions.length} receipts generated</p>
                        </div>
                    </div>

                    {/* TRANSACTIONS TABLE */}
                    <div className="bg-white rounded-lg shadow border overflow-hidden">
                        <div className="bg-gray-800 text-white px-6 py-3 flex justify-between items-center">
                            <h3 className="font-bold">Transaction Details</h3>
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Time</th>
                                    <th className="px-6 py-3">Receipt #</th>
                                    <th className="px-6 py-3">Devotee</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Mode</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {reportData.transactions.length > 0 ? (
                                    reportData.transactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 text-gray-500">
                                                {new Date(t.created_at).toLocaleDateString()} <span className="text-xs ml-1">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </td>
                                            <td className="px-6 py-3 font-mono text-xs">{t.id}</td>
                                            <td className="px-6 py-3 font-medium text-gray-800">{t.devotee_name}</td>
                                            <td className="px-6 py-3 font-bold">₹{t.amount}</td>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${t.payment_mode === 'UPI' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                    {t.payment_mode}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-8 text-gray-400">No transactions found in this date range.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default ReportsDashboard;