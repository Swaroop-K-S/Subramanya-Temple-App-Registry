import React, { useState, useEffect, useRef } from 'react';
import { X, User, Phone, Sparkles, Star, Moon, Loader2, Calendar, Printer } from 'lucide-react';
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

    // Common input CSS classes
    const inputClasses = "w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-sm";

    // Ref for printing
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
                        // Use Kannada name if in KN mode, otherwise English
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
                        setSuccessMsg("✨ Devotee details found!");
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
                // For backward compatibility with backend
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
        } catch (err) {
            console.error(err);
            alert('Booking failed. Please check the console.');
        } finally {
            setLoading(false);
        }
    };

    // --- RECEIPT VIEW ---
    if (transaction) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">

                    {/* Actions Bar */}
                    <div className="bg-gray-100 px-6 py-3 flex justify-between items-center border-b">
                        <h2 className="font-bold text-gray-700 flex items-center gap-2">
                            <Sparkles className="text-orange-500" size={18} />
                            {t?.bookingSuccessful || "Booking Successful"}
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm">
                                <Printer size={18} /> Print
                            </button>
                            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* Printable Area */}
                    <div className="p-8 bg-gray-50 overflow-y-auto max-h-[80vh]">
                        <div ref={receiptRef}>
                            <Receipt transaction={transaction} seva={seva} lang={lang} />
                        </div>
                    </div>

                </div>
            </div>
        );
    }

    // --- BOOKING FORM VIEW ---
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white">{t?.bookNow || "Book Seva"}</h2>
                        <p className="text-orange-100 text-sm">{lang === 'KN' && seva.name_kan ? seva.name_kan : seva.name_eng}</p>
                    </div>
                    <button onClick={onClose}><X className="text-white" size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Phone & Date Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{t?.phone || "Phone Number"}</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="tel"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="9876543210"
                                    maxLength={10}
                                    required
                                />
                                {searching && <Loader2 className="absolute right-3 top-3 animate-spin text-orange-500" size={18} />}
                                {!searching && successMsg && <Sparkles className="absolute right-3 top-3 text-green-500" size={18} />}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{t?.date || "Seva Date"}</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="date"
                                    name="seva_date"
                                    value={formData.seva_date}
                                    onChange={handleInputChange}
                                    min={todayStr}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Smart Devotee Name Input */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                            {t?.name || "Devotee Name"}
                            <span className="ml-2 text-orange-400 text-[10px]">
                                {lang === 'KN' ? '(ಟೈಪ್ ಮಾಡಿ → ಕನ್ನಡ)' : '(English)'}
                            </span>
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-gray-400 z-10" size={18} />
                            {lang === 'KN' ? (
                                <ReactTransliterate
                                    renderComponent={(props) => (
                                        <input {...props} className={inputClasses} required />
                                    )}
                                    value={formData.devotee_name}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, devotee_name: text }))}
                                    lang="kn"
                                    placeholder="Type in English → ಕನ್ನಡ"
                                    enabled={true}
                                    containerStyles={{ position: 'relative' }}
                                    activeItemStyles={{ backgroundColor: '#f97316', color: 'white' }}
                                />
                            ) : (
                                <input
                                    type="text"
                                    name="devotee_name"
                                    value={formData.devotee_name}
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                    placeholder="Enter devotee name"
                                    required
                                />
                            )}
                        </div>
                    </div>

                    {/* Smart Gothra Input */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                            {t?.gothra || "Gothra"}
                            <span className="ml-2 text-orange-400 text-[10px]">
                                {lang === 'KN' ? '(ಟೈಪ್ ಮಾಡಿ → ಕನ್ನಡ)' : '(English)'}
                            </span>
                        </label>
                        <div className="relative">
                            <Sparkles className="absolute left-3 top-3 text-gray-400 z-10" size={18} />
                            {lang === 'KN' ? (
                                <ReactTransliterate
                                    renderComponent={(props) => (
                                        <input {...props} className={inputClasses} />
                                    )}
                                    value={formData.gothra}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, gothra: text }))}
                                    lang="kn"
                                    placeholder="Type in English → ಕನ್ನಡ"
                                    enabled={true}
                                    containerStyles={{ position: 'relative' }}
                                    activeItemStyles={{ backgroundColor: '#f97316', color: 'white' }}
                                />
                            ) : (
                                <input
                                    type="text"
                                    name="gothra"
                                    value={formData.gothra}
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                    placeholder="Enter gothra"
                                />
                            )}
                        </div>
                    </div>

                    {/* Nakshatra & Rashi */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{t?.nakshatra || "Nakshatra"}</label>
                            <div className="relative">
                                <Star className="absolute left-3 top-3 text-gray-400" size={18} />
                                <select name="nakshatra" value={formData.nakshatra} onChange={handleInputChange} className="w-full pl-10 py-2.5 border border-gray-300 rounded-lg outline-none bg-white">
                                    <option value="">{lang === 'KN' ? 'ನಕ್ಷತ್ರ ಆಯ್ಕೆಮಾಡಿ' : 'Select Star'}</option>
                                    {NAKSHATRAS && NAKSHATRAS.map(n => (
                                        <option key={n.en} value={n.en}>
                                            {lang === 'KN' ? n.kn : n.en}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{t?.rashi || "Rashi"}</label>
                            <div className="relative">
                                <Moon className="absolute left-3 top-3 text-gray-400" size={18} />
                                <select name="rashi" value={formData.rashi} onChange={handleInputChange} className="w-full pl-10 py-2.5 border border-gray-300 rounded-lg outline-none bg-white">
                                    <option value="">{lang === 'KN' ? 'ರಾಶಿ ಆಯ್ಕೆಮಾಡಿ' : 'Select Zodiac'}</option>
                                    {RASHIS && RASHIS.map(r => (
                                        <option key={r.en} value={r.en}>
                                            {lang === 'KN' ? r.kn : r.en}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Payment Mode */}
                    <div className="flex gap-3 pt-2">
                        {['CASH', 'UPI'].map(mode => (
                            <button key={mode} type="button" onClick={() => setFormData(p => ({ ...p, payment_mode: mode }))} className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all ${formData.payment_mode === mode ? (mode === 'CASH' ? 'border-green-500 bg-green-50 text-green-700' : 'border-blue-500 bg-blue-50 text-blue-700') : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                {t && t[mode.toLowerCase()] ? t[mode.toLowerCase()] : mode}
                            </button>
                        ))}
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-3 mt-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold rounded-lg shadow-lg hover:shadow-orange-200 transition-all flex justify-center items-center gap-2">
                        {loading ? <Loader2 className="animate-spin" /> : (t?.bookNow || 'Confirm Booking')}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default BookingModal;
