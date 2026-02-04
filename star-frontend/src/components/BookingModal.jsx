import React, { useState, useEffect, useRef } from 'react';
import { X, User, Phone, Sparkles, Star, Moon, Loader2, Calendar, Printer, CheckCircle2, ArrowRight, IndianRupee } from 'lucide-react';
import { ReactTransliterate } from 'react-transliterate';
import 'react-transliterate/dist/index.css';
import { bookSeva } from '../services/api';
import api from '../services/api';
import { NAKSHATRAS, RASHIS } from './constants';
import Receipt from './Receipt';
import { useReactToPrint } from 'react-to-print';
import { TRANSLATIONS } from './translations';

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
    });
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [transaction, setTransaction] = useState(null);
    const t = TRANSLATIONS[lang];

    // Printer
    const receiptRef = useRef();
    const handlePrint = useReactToPrint({
        content: () => receiptRef.current,
        documentTitle: `Receipt-${transaction?.receipt_no || 'New'}`,
        onAfterPrint: () => onClose(),
    });

    // --- AUTO-FILL LOGIC ---
    useEffect(() => {
        if (!isOpen) {
            setTransaction(null);
            setFormData({
                devotee_name: '',
                phone_number: '',
                gothra: '',
                nakshatra: '', rashi: '',
                seva_date: todayStr, payment_mode: 'CASH'
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

    if (!isOpen || !seva) return null;

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
                amount: parseFloat(seva.price) || 0
            };
            const response = await bookSeva(bookingData);
            setTransaction(response);

            // Level 11: Auto-Print
            import('../utils/thermalPrinter').then(module => {
                module.printToThermal(response, seva, lang)
                    .catch(err => console.warn("Printer Error", err));
            });
        } catch (err) {
            console.error(err);
            alert('Booking failed.');
        } finally {
            setLoading(false);
        }
    };

    // --- RECEIPT VIEW (Unchanged Logic, just container style tweak) ---
    if (transaction) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300" />
                <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                    <div className="bg-gray-50 px-8 py-4 flex justify-between items-center border-b">
                        <h2 className="font-bold text-gray-700 flex items-center gap-2">
                            <CheckCircle2 className="text-green-500" size={24} />
                            {t?.bookingSuccessful || "Booking Successful"}
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                                <Printer size={18} /> Print Invoice
                            </button>
                            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X size={24} className="text-gray-500" />
                            </button>
                        </div>
                    </div>
                    <div className="p-8 bg-gray-100/50 max-h-[80vh] overflow-y-auto">
                        <div ref={receiptRef}>
                            <Receipt transaction={transaction} seva={seva} lang={lang} />
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
                            <IndianRupee className="w-6 h-6" />
                            <span className="text-4xl font-black tracking-tight">{seva.price}</span>
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
                                    className="peer w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder-transparent"
                                    placeholder="Phone"
                                    maxLength={10}
                                    required
                                />
                                <label className="absolute left-10 top-3 text-gray-400 text-xs transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-focus:top-1 peer-focus:text-[10px] peer-focus:text-orange-500">Phone Number</label>
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

                        {/* Gothra */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                {t?.gothra || "Gothra"}
                            </label>
                            <div className="relative">
                                <Sparkles className="absolute left-3 top-3.5 text-gray-400 z-10 w-5 h-5" />
                                {lang === 'KN' ? (
                                    <ReactTransliterate
                                        renderComponent={(props) => (
                                            <input {...props} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all" />
                                        )}
                                        value={formData.gothra}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, gothra: text }))}
                                        lang="kn"
                                        placeholder="Type Gothra..."
                                        containerStyles={{ position: 'relative' }}
                                        activeItemStyles={{ backgroundColor: '#f97316', color: 'white' }}
                                    />
                                ) : (
                                    <input
                                        name="gothra"
                                        value={formData.gothra}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                        placeholder="Enter Gothra"
                                    />
                                )}
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
                                    onClick={() => setFormData(p => ({ ...p, payment_mode: mode }))}
                                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${formData.payment_mode === mode ? 'bg-white text-gray-800 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>

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
