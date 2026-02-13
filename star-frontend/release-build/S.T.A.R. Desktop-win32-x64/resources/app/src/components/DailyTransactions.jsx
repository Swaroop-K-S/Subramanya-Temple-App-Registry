import React, { useState, useEffect, useRef } from 'react';
import {
    Calendar, Printer, MessageCircle, Search, ArrowLeft,
    Filter, Download, Share2, Loader2, CheckCircle2, XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { OmniInput } from './ui/Widgets';
import { ReceiptPreview } from './ReceiptPreview';
import { TRANSLATIONS } from './translations';
import html2canvas from 'html2canvas';

const DailyTransactions = ({ lang = 'EN' }) => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');

    // Printing State
    const [reprintData, setReprintData] = useState(null); // Transaction to print
    const receiptRef = useRef();
    const [printing, setPrinting] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, [selectedDate]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/transactions?date=${selectedDate}`);
            setTransactions(response.data || []);
        } catch (err) {
            console.error("Fetch Error", err);
        } finally {
            setLoading(false);
        }
    };

    // --- REPRINT LOGIC ---
    const handleReprint = (transaction) => {
        setReprintData(transaction);
        // Modal opens automatically due to reprintData being set
    };

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
                setReprintData(null); // Clear after print
            });
        } catch (err) {
            console.error("Reprint Failed", err);
            alert("Reprint Failed");
        } finally {
            setPrinting(false);
        }
    };

    // --- WHATSAPP SHARE ---
    const handleWhatsApp = (t) => {
        const message = `*Receipt #${t.receipt_no}*\n` +
            `Devotee: ${t.devotee_name}\n` +
            `Seva: ${t.seva_name}\n` +
            `Amount: ₹${t.amount_paid}\n` +
            `Date: ${t.transaction_date}\n` +
            `Thank you for your visit to Subramanya Temple.`;

        const url = `https://wa.me/${t.phone_number || ''}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    // Filter Logic
    const filtered = transactions.filter(t =>
        t.devotee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.receipt_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.seva_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalCollection = filtered.reduce((acc, t) => acc + (t.amount_paid || 0), 0);

    return (
        <div className="min-h-screen p-4 md:p-8 pb-32 bg-slate-50 dark:bg-slate-900 transition-colors duration-500">

            {/* Header */}
            <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all text-slate-600 dark:text-slate-300"
                    >
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white">
                            Daily Transactions
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Manage bookings and reprints
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <Calendar className="text-orange-500 ml-2" size={20} />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-transparent border-none outline-none text-slate-700 dark:text-slate-200 font-bold"
                    />
                </div>
            </header>

            {/* Stats & Search */}
            <div className="max-w-7xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Card */}
                <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-lg shadow-orange-200 dark:shadow-none relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="opacity-80 font-medium mb-1">Total Collection</p>
                        <h2 className="text-4xl font-black">₹ {totalCollection.toLocaleString()}</h2>
                        <p className="text-sm mt-2 opacity-80">{filtered.length} Bookings</p>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                        <Download size={120} />
                    </div>
                </div>

                {/* Search Bar */}
                <div className="md:col-span-2">
                    <OmniInput
                        icon={Search}
                        placeholder="Search by Name, Receipt #, or Seva..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-full text-lg"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="max-w-7xl mx-auto bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-700">
                                <th className="p-6 text-sm font-bold text-slate-400 uppercase tracking-wider">Receipt #</th>
                                <th className="p-6 text-sm font-bold text-slate-400 uppercase tracking-wider">Time</th>
                                <th className="p-6 text-sm font-bold text-slate-400 uppercase tracking-wider">Devotee</th>
                                <th className="p-6 text-sm font-bold text-slate-400 uppercase tracking-wider">Seva</th>
                                <th className="p-6 text-sm font-bold text-slate-400 uppercase tracking-wider text-right">Amount</th>
                                <th className="p-6 text-sm font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-slate-400">
                                        <Loader2 className="animate-spin inline mr-2" /> Loading...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-slate-400">
                                        No transactions found for this date.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((t) => (
                                    <tr key={t.id || t.receipt_no} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                        <td className="p-6 font-mono font-bold text-slate-600 dark:text-slate-300">
                                            {t.receipt_no}
                                        </td>
                                        <td className="p-6 text-slate-500">
                                            {new Date(t.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="p-6 font-bold text-slate-800 dark:text-white">
                                            {t.devotee_name}
                                        </td>
                                        <td className="p-6 text-slate-600 dark:text-slate-300">
                                            {t.seva_name}
                                        </td>
                                        <td className="p-6 text-right font-bold text-slate-800 dark:text-white">
                                            ₹{t.amount_paid}
                                            <span className="block textxs text-slate-400 font-normal text-[10px] uppercase">
                                                {t.payment_mode}
                                            </span>
                                        </td>
                                        <td className="p-6 flex justify-center gap-3">
                                            <button
                                                onClick={() => handleReprint(t)}
                                                className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
                                                title="Reprint Receipt"
                                            >
                                                <Printer size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleWhatsApp(t)}
                                                className="p-2 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-full transition-colors"
                                                title="Share via WhatsApp"
                                            >
                                                <MessageCircle size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Reprint Preview Modal */}
            {reprintData && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Reprint Receipt</h3>
                            <button
                                onClick={() => setReprintData(null)}
                                className="text-slate-500 hover:text-red-500 transition-colors"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        {/* Preview Area */}
                        <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-slate-100 dark:bg-slate-900 custom-scrollbar">
                            <div className="origin-top transform scale-90 sm:scale-100">
                                <ReceiptPreview
                                    ref={receiptRef}
                                    transaction={{
                                        ...reprintData,
                                        date: reprintData.transaction_date // Map for preview
                                    }}
                                    seva={{ name_eng: reprintData.seva_name }}
                                    lang={lang}
                                />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-white dark:bg-slate-800 rounded-b-2xl">
                            <button
                                onClick={() => setReprintData(null)}
                                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => triggerPrint(reprintData)}
                                disabled={printing}
                                className="px-6 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold hover:shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all"
                            >
                                {printing ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />}
                                {printing ? 'Printing...' : 'Print'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default DailyTransactions;
