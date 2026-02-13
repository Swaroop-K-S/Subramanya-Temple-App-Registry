import React, { useState, useEffect, useRef } from 'react';
import { X, User, Phone, Sparkles, Star, Moon, Loader2, Calendar, Printer, CheckCircle2, ArrowRight, IndianRupee } from 'lucide-react';
import { ReactTransliterate } from 'react-transliterate';
import 'react-transliterate/dist/index.css';
import { bookSeva } from '../services/api';
import api from '../services/api';
import { NAKSHATRAS, RASHIS, GOTRAS } from './constants';
import { TRANSLATIONS } from './translations';
import html2canvas from 'html2canvas';
import { ReceiptPreview } from './ReceiptPreview';

function BookingModal({ isOpen, onClose, seva, lang = 'EN' }) {
    const todayStr = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = useState({
        devotee_name: '',
        phone_number: '',
        gothra: '',
        nakshatra: '',
        rashi: '',
        seva_date: todayStr,
        payment_mode: 'CASH',
        upi_transaction_id: '',
        custom_amount: '',
    });
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [transaction, setTransaction] = useState(null);
    const t = TRANSLATIONS[lang];
    const receiptRef = useRef();
    const [receiptData, setReceiptData] = useState(null);
    const [printStatus, setPrintStatus] = useState('idle');

    // --- AUTO-FILL LOGIC ---
    useEffect(() => {
        if (!isOpen) {
            setTransaction(null);
            setPrintStatus('idle');
            setFormData({
                devotee_name: '',
                phone_number: '',
                gothra: '',
                nakshatra: '', rashi: '',
                seva_date: todayStr, payment_mode: 'CASH',
                upi_transaction_id: '',
                custom_amount: '',
            });
        }
        const checkPhone = async () => {
            if (formData.phone_number.length === 10) {
                setSearching(true);
                try {
                    const response = await api.get(`/devotees/${formData.phone_number}`);
                    if (response.data) {
                        const name = lang === 'KN'
                            ? (response.data.full_name_kn || response.data.full_name_en || response.data.full_name || '')
                            : (response.data.full_name_en || response.data.full_name || '');
                        const gothra = lang === 'KN'
                            ? (response.data.gothra_kn || response.data.gothra_en || response.data.gothra || '')
                            : (response.data.gothra_en || response.data.gothra || '');
                        setFormData(prev => ({
                            ...prev,
                            devotee_name: name,
                            gothra: gothra,
                            nakshatra: response.data.nakshatra || '',
                            rashi: response.data.rashi || '',
                        }));
                        setSuccessMsg("✨ Found!");
                        setTimeout(() => setSuccessMsg(''), 3000);
                    }
                } catch (err) { } finally { setSearching(false); }
            }
        };
        const timer = setTimeout(checkPhone, 500);
        return () => clearTimeout(timer);
    }, [formData.phone_number, isOpen, lang]);

    // --- ABHISHEKA LOGIC (Auto-Date to Tomorrow) ---
    useEffect(() => {
        if (isOpen && seva?.name_eng) {
            const name = seva.name_eng.toLowerCase();
            if (name.includes('abhisheka')) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tmrStr = tomorrow.toISOString().split('T')[0];
                setFormData(prev => ({ ...prev, seva_date: tmrStr }));
            }
        }
    }, [isOpen, seva]);

    if (!isOpen || !seva) return null;

    const handleInputChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

    // Helper: Check if seva allows custom amount (General Seva, Anna Dhana Nidhi)
    const allowsCustomAmount = () => {
        if (!seva?.name_eng) return false;
        const name = seva.name_eng.toLowerCase();
        // Match: "general", "anna dhana", "annadhan", "anna dana", "samanya", "nidhi"
        return name.includes('general') ||
            name.includes('anna') ||
            name.includes('annadhan') ||
            name.includes('nidhi') ||
            name.includes('samanya');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const bookingData = {
                ...formData,
                devotee_name: formData.devotee_name,
                devotee_name_en: lang === 'EN' ? formData.devotee_name : '',
                devotee_name_kn: lang === 'KN' ? formData.devotee_name : '',
                gothra: formData.gothra,
                gothra_en: lang === 'EN' ? formData.gothra : '',
                gothra_kn: lang === 'KN' ? formData.gothra : '',
                seva_id: seva.id,
                amount: allowsCustomAmount() && formData.custom_amount
                    ? parseFloat(formData.custom_amount)
                    : parseFloat(seva.price) || 0,
                upi_transaction_id: formData.payment_mode === 'UPI' ? formData.upi_transaction_id : null
            };
            const response = await bookSeva(bookingData);
            setTransaction(response);

            // Auto-trigger preview
            // Prepare Receipt Data
            setReceiptData({
                receipt_no: response.receipt_no,
                booking_date: response.transaction_date || todayStr,
                seva_date: response.seva_date || formData.seva_date,
                seva_name: lang === 'KN' ? (seva.name_kan || seva.name_eng) : seva.name_eng,
                devotee_name: response.devotee_name || formData.devotee_name,
                gothra: response.gothra || formData.gothra,
                nakshatra: response.nakshatra || formData.nakshatra,
                rashi: response.rashi || formData.rashi,
                amount_paid: response.amount_paid || bookingData.amount,
                payment_mode: response.payment_mode || bookingData.payment_mode
            });

        } catch (err) {
            console.error(err);
            alert('Booking failed.');
        } finally {
            setLoading(false);
        }
    };

    // --- PRINT HANDLER (Frontend Generation) ---
    // Using printStatus state: 'idle', 'printing', 'success', 'error'

    const handleThermalPrint = async () => {
        if (!receiptRef.current) return;
        setPrintStatus('printing');

        try {
            // 1. Capture inner HTML 
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                backgroundColor: "#ffffff",
                useCORS: true
            });

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    setPrintStatus('error');
                    return;
                }

                // 2. Send Blob to Backend
                const fd = new FormData();
                fd.append('file', blob, `receipt_${transaction?.receipt_no || 'new'}.png`);

                try {
                    await api.post('/print/image', fd, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    setPrintStatus('success');
                } catch (printErr) {
                    console.error("Printing failed", printErr);
                    setPrintStatus('error');
                }
            });

        } catch (err) {
            console.error("Capture failed", err);
            setPrintStatus('error');
        }
    };

    // Auto-Print Trigger
    useEffect(() => {
        if (transaction && receiptRef.current && printStatus === 'idle') {
            const timer = setTimeout(() => {
                handleThermalPrint();
            }, 800);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transaction]); // Only run when transaction is set

    // --- SUCCESS VIEW (Cleaned up) ---
    if (transaction) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300" />

                <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 p-8 text-center flex flex-col items-center max-h-[90vh]">

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all duration-200 z-10"
                    >
                        <X size={20} />
                    </button>

                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shrink-0 animate-bounce">
                        <CheckCircle2 className="text-green-600 w-10 h-10" />
                    </div>

                    <h2 className="text-2xl font-black text-gray-800 mb-2 shrink-0">
                        {t?.bookingSuccessful || "Booking Successful!"}
                    </h2>
                    <p className="text-gray-500 mb-4 shrink-0">
                        Receipt #{transaction.receipt_no}
                    </p>

                    {/* Receipt Preview (Visible + Scrollable) */}
                    <div className="my-4 border-2 border-dashed border-gray-300 rounded-2xl p-2 bg-gray-50 w-full flex justify-center shrink-0 shadow-sm overflow-y-auto max-h-[400px] custom-scrollbar">
                        <div className="origin-top transform scale-90 sm:scale-100">
                            <ReceiptPreview
                                ref={receiptRef}
                                transaction={receiptData}
                                seva={seva}
                                lang={lang}
                            />
                        </div>
                    </div>

                    {/* STATUS & CONTROLS */}
                    <div className="w-full shrink-0 pt-4 space-y-4">

                        {/* Status Message */}
                        <div className="h-8 flex items-center justify-center">
                            {printStatus === 'printing' && (
                                <div className="flex items-center gap-2 text-orange-600 font-bold animate-pulse">
                                    <Printer size={20} /> <span>Printing...</span>
                                </div>
                            )}
                            {printStatus === 'success' && (
                                <div className="flex items-center gap-2 text-green-600 font-bold animate-in fade-in slide-in-from-bottom-2">
                                    <CheckCircle2 size={20} /> <span>Sent to Printer!</span>
                                </div>
                            )}
                            {printStatus === 'error' && (
                                <div className="flex items-center gap-2 text-red-600 font-bold">
                                    <X size={20} /> <span>Print Failed</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleThermalPrint}
                                disabled={printStatus === 'printing'}
                                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <Printer size={18} /> Print Again
                            </button>

                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200"
                            >
                                Close & New
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    // --- OMNI-UI BOOKING FORM ---
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 isolate">
            {/* Backdrop with Neural Blur */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose} />

            {/* Modal Card - Deep Glass Physics */}
            <div className="relative w-full max-w-4xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-white/10 ring-1 ring-white/20 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col md:flex-row h-[85vh] md:h-auto">

                {/* Left Column: Seva Details (Visual Anchor) */}
                <div className="w-full md:w-1/3 bg-gradient-to-br from-amber-50 to-orange-100/50 p-8 flex flex-col justify-between border-r border-orange-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-6">
                            <Sparkles className="text-orange-500 w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 font-heading leading-tight mb-2">
                            {lang === 'KN' && seva.name_kan ? seva.name_kan : seva.name_eng}
                        </h2>
                        <span className="inline-block px-3 py-1 bg-orange-200/50 text-orange-800 text-xs font-bold rounded-lg uppercase tracking-wider mb-6">
                            Verified Seva
                        </span>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-600">
                                <Calendar className="w-5 h-5 text-orange-400" />
                                <span className="font-medium text-sm">Valid for {formData.seva_date}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600">
                                <User className="w-5 h-5 text-orange-400" />
                                <span className="font-medium text-sm">Single Devotee</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-8">
                        <p className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-1">Total Amount</p>
                        <div className="flex items-center gap-1 text-emerald-600">
                            {allowsCustomAmount() ? (
                                <span className="text-2xl font-bold text-emerald-500">Custom Amount</span>
                            ) : (
                                <>
                                    <IndianRupee className="w-6 h-6" />
                                    <span className="text-4xl font-black tracking-tight">{seva.price}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Input Form */}
                <div className="w-full md:w-2/3 p-8 flex flex-col h-full overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-700">Devotee Details</h3>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-6 h-6 text-gray-400 hover:text-red-500" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-6">

                        {/* Phone & Date */}
                        <div className="grid grid-cols-2 gap-5">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500" />
                                </div>
                                <input
                                    type="tel"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                    placeholder="Phone Number"
                                    maxLength={10}
                                    required
                                />
                                {searching && <Loader2 className="absolute right-3 top-3.5 animate-spin text-orange-500 w-4 h-4" />}
                                {!searching && successMsg && <CheckCircle2 className="absolute right-3 top-3.5 text-green-500 w-4 h-4" />}
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500" />
                                </div>
                                <input
                                    type="date"
                                    name="seva_date"
                                    value={formData.seva_date}
                                    onChange={handleInputChange}
                                    min={todayStr}
                                    className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Name (Transliterate) */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                                <span>{t?.name || "Devotee Name"}</span>
                                <span className="text-orange-500">{lang === 'KN' ? 'English → Kannada' : 'English'}</span>
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 text-gray-400 z-10 w-5 h-5" />
                                {lang === 'KN' ? (
                                    <ReactTransliterate
                                        renderComponent={(props) => (
                                            <input {...props} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all" required />
                                        )}
                                        value={formData.devotee_name}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, devotee_name: text }))}
                                        lang="kn"
                                        placeholder="Type Name..."
                                        containerStyles={{ position: 'relative' }}
                                        activeItemStyles={{ backgroundColor: '#f97316', color: 'white' }}
                                    />
                                ) : (
                                    <input
                                        name="devotee_name"
                                        value={formData.devotee_name}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                        placeholder="Enter Name"
                                        required
                                    />
                                )}
                            </div>
                        </div>

                        {/* Gothra Dropdown - Deep Glass Style */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                {t?.gothra || "Gothra"}
                            </label>
                            <div className="relative">
                                <Sparkles className="absolute left-3 top-3.5 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                                <select
                                    name="gothra"
                                    value={formData.gothra}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none appearance-none transition-all text-gray-700 font-medium cursor-pointer hover:bg-gray-100"
                                >
                                    <option value="">{lang === 'KN' ? 'ಗೋತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ...' : 'Select Gothra...'}</option>
                                    {GOTRAS.map(g => (
                                        <option key={g.en} value={g.en}>
                                            {lang === 'KN' ? `${g.kn} (${g.en})` : g.en}
                                        </option>
                                    ))}
                                </select>
                                {/* Custom Chevron (Affordance) */}
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Nakshatra / Rashi Grid */}
                        <div className="grid grid-cols-2 gap-5">
                            <div className="relative">
                                <Star className="absolute left-3 top-3.5 text-gray-400 w-5 h-5 pointer-events-none" />
                                <select name="nakshatra" value={formData.nakshatra} onChange={handleInputChange} className="w-full pl-10 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none appearance-none">
                                    <option value="">{lang === 'KN' ? 'ನಕ್ಷತ್ರ' : 'Nakshatra'}</option>
                                    {NAKSHATRAS.map(n => <option key={n.en} value={n.en}>{lang === 'KN' ? n.kn : n.en}</option>)}
                                </select>
                            </div>
                            <div className="relative">
                                <Moon className="absolute left-3 top-3.5 text-gray-400 w-5 h-5 pointer-events-none" />
                                <select name="rashi" value={formData.rashi} onChange={handleInputChange} className="w-full pl-10 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none appearance-none">
                                    <option value="">{lang === 'KN' ? 'ರಾಶಿ' : 'Rashi'}</option>
                                    {RASHIS.map(r => <option key={r.en} value={r.en}>{lang === 'KN' ? r.kn : r.en}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Payment Mode toggles */}
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            {['CASH', 'UPI'].map(mode => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, payment_mode: mode, upi_transaction_id: mode === 'CASH' ? '' : p.upi_transaction_id }))}
                                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${formData.payment_mode === mode ? 'bg-white text-gray-800 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>

                        {/* Custom Amount Input - Shows only for General/Annadhan Nidhi */}
                        {allowsCustomAmount() && (
                            <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                                    <span>{lang === 'KN' ? 'ಇಚ್ಛೆಯ ಮೊತ್ತ' : 'Custom Amount'}</span>
                                    <span className="text-emerald-500 font-normal">{lang === 'KN' ? 'ಐಚ್ಛಿಕ' : 'Optional'}</span>
                                </label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-3.5 text-emerald-500 w-5 h-5" />
                                    <input
                                        type="number"
                                        name="custom_amount"
                                        value={formData.custom_amount}
                                        onChange={handleInputChange}
                                        min="1"
                                        step="1"
                                        className="w-full pl-10 pr-4 py-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-emerald-800 font-bold text-lg placeholder-emerald-300"
                                        placeholder="Enter your amount (₹)"
                                    />
                                </div>
                                <p className="text-xs text-gray-400">Enter the amount you wish to donate</p>
                            </div>
                        )}

                        {/* UPI Transaction ID Field - Shows only when UPI is selected */}
                        {formData.payment_mode === 'UPI' && (
                            <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    UPI Transaction ID <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        name="upi_transaction_id"
                                        value={formData.upi_transaction_id}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-purple-50 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-mono text-purple-800 placeholder-purple-300"
                                        placeholder="Enter UPI Transaction ID (e.g., 123456789012)"
                                        required
                                        minLength={6}
                                        maxLength={50}
                                    />
                                </div>
                                <p className="text-xs text-gray-400">Enter the 12-digit UTR number from your payment app</p>
                            </div>
                        )}

                        {/* Omni Action Button */}
                        <div className="pt-2 sticky bottom-0 bg-white/50 backdrop-blur-sm -mx-2 px-2 pb-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 rounded-xl font-black tracking-wide text-white shadow-xl flex justify-center items-center gap-2 transform active:scale-95 transition-all
                                    ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-orange-500/30 hover:scale-[1.01]"}
                                `}
                            >
                                {loading ? <Loader2 className="animate-spin" /> : (
                                    <>
                                        <span>CONFIRM BOOKING</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default BookingModal;
