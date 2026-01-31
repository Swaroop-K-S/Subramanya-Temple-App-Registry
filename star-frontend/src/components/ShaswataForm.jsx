/**
 * ShaswataForm Component - Enhanced Dual Calendar Version
 * =========================================================
 * Perpetual Puja Subscription Form with:
 * 1. GENERAL: User selects custom date (Gregorian OR Lunar)
 * 2. BRAHMACHARI: Fixed Rathotsava date (no selection needed)
 * 
 * Features:
 * - Dual Calendar Toggle (English Date vs Hindu Tithi)
 * - Smart Input with ReactTransliterate for bilingual Name/Gothra
 * - Beautiful glassmorphism UI with animated transitions
 */

import React, { useState, useEffect } from 'react';
import {
    X, User, Phone, Sparkles, MapPin, Calendar, Moon, Sun,
    Loader2, CheckCircle2, Info, Star, Crown
} from 'lucide-react';
import { ReactTransliterate } from 'react-transliterate';
import 'react-transliterate/dist/index.css';
import api from '../services/api';
import { MASAS, PAKSHAS_BILINGUAL, TITHIS_BILINGUAL, ENGLISH_MONTHS } from './constants';
import { TRANSLATIONS } from './translations';

function ShaswataForm({ isOpen, onClose, lang = 'EN' }) {
    const t = TRANSLATIONS[lang];

    // =========================================================================
    // CSS CLASSES - Premium UI Styling
    // =========================================================================
    const inputBase = "w-full pl-10 pr-4 py-3 border-2 rounded-xl outline-none transition-all duration-200 text-sm font-medium";
    const inputNormal = `${inputBase} border-gray-200 bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-100`;
    const selectBase = "w-full py-3 px-4 border-2 rounded-xl outline-none bg-white text-sm font-medium transition-all duration-200";
    const selectNormal = `${selectBase} border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100`;
    const labelClass = "text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block";

    // =========================================================================
    // STATE MANAGEMENT
    // =========================================================================
    const [sevaType, setSevaType] = useState('GENERAL');       // GENERAL | BRAHMACHARI
    const [calendarType, setCalendarType] = useState('GREGORIAN'); // GREGORIAN | LUNAR

    const [dateDetails, setDateDetails] = useState({
        day: 1,
        month: 1,
        masa: '',
        paksha: '',
        tithi: ''
    });

    const [formData, setFormData] = useState({
        devotee_name: '',
        gothra: '',
        phone: '',
        address: ''
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSevaType('GENERAL');
            setCalendarType('GREGORIAN');
            setDateDetails({ day: 1, month: 1, masa: '', paksha: '', tithi: '' });
            setFormData({ devotee_name: '', gothra: '', phone: '', address: '' });
            setSuccess(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // =========================================================================
    // HANDLERS
    // =========================================================================
    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleDateChange = (field, value) => {
        setDateDetails(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Determine subscription_type based on selections
            let subscriptionType = 'RATHOTSAVA';
            if (sevaType === 'GENERAL') {
                subscriptionType = calendarType; // 'GREGORIAN' or 'LUNAR'
            }

            const payload = {
                devotee_name: formData.devotee_name,
                phone_number: formData.phone,
                gothra: formData.gothra,
                address: formData.address,
                seva_type: sevaType,
                subscription_type: subscriptionType,
                // Include date fields based on type
                ...(sevaType === 'GENERAL' && calendarType === 'GREGORIAN' && {
                    event_day: parseInt(dateDetails.day),
                    event_month: parseInt(dateDetails.month),
                }),
                ...(sevaType === 'GENERAL' && calendarType === 'LUNAR' && {
                    maasa: dateDetails.masa,
                    paksha: dateDetails.paksha,
                    tithi: dateDetails.tithi,
                }),
            };

            await api.post('/shaswata/subscribe', payload);
            setSuccess(true);
        } catch (err) {
            console.error('Subscription failed:', err);
            alert(lang === 'KN' ? 'ಚಂದಾದಾರಿಕೆ ವಿಫಲವಾಗಿದೆ.' : 'Subscription failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // =========================================================================
    // SUCCESS VIEW
    // =========================================================================
    if (success) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
                <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                        <CheckCircle2 className="text-white" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {lang === 'KN' ? '🙏 ಚಂದಾದಾರಿಕೆ ಯಶಸ್ವಿ!' : '🙏 Subscription Successful!'}
                    </h2>
                    <p className="text-gray-500 mb-6">
                        {lang === 'KN'
                            ? 'ನಿಮ್ಮ ಶಾಶ್ವತ ಪೂಜೆ ನೋಂದಣಿಯಾಗಿದೆ.'
                            : 'Your perpetual puja has been registered.'}
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold rounded-xl shadow-lg"
                    >
                        {lang === 'KN' ? 'ಮುಚ್ಚಿ' : 'Close'}
                    </button>
                </div>
            </div>
        );
    }

    // =========================================================================
    // MAIN FORM VIEW
    // =========================================================================
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Container */}
            <div className="relative bg-gradient-to-b from-white to-gray-50 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-white/50">

                {/* ============ HEADER ============ */}
                <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-6 py-5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur">
                            <Sparkles className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{t?.shaswataTitle || "Perpetual Puja"}</h2>
                            <p className="text-violet-200 text-sm">{lang === 'KN' ? 'ಶಾಶ್ವತ ಸೇವೆ ನೋಂದಣಿ' : 'Annual subscription'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <X className="text-white" size={24} />
                    </button>
                </div>

                {/* ============ FORM BODY ============ */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

                    {/* ============ SECTION 1: SEVA TYPE SELECTION ============ */}
                    <div>
                        <label className={labelClass}>{t?.selectType || "Select Seva Type"}</label>
                        <div className="grid grid-cols-2 gap-4">

                            {/* GENERAL Card */}
                            <div
                                onClick={() => setSevaType('GENERAL')}
                                className={`cursor-pointer p-5 rounded-2xl border-2 transition-all duration-300 ${sevaType === 'GENERAL'
                                        ? 'border-violet-500 bg-gradient-to-br from-violet-50 to-purple-50 shadow-lg shadow-violet-100 scale-[1.02]'
                                        : 'border-gray-200 bg-white hover:border-violet-300 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`p-2 rounded-xl ${sevaType === 'GENERAL' ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        <Star size={20} />
                                    </div>
                                    <span className={`font-bold ${sevaType === 'GENERAL' ? 'text-violet-700' : 'text-gray-700'}`}>
                                        {t?.generalPooja || "General Pooja"}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mb-3">
                                    {lang === 'KN' ? 'ನಿಮ್ಮ ಆಯ್ಕೆಯ ದಿನಾಂಕದಂದು ಸೇವೆ' : 'Puja on your selected date'}
                                </p>
                                <div className="text-xl font-bold text-violet-600">₹5,000</div>
                            </div>

                            {/* BRAHMACHARI Card */}
                            <div
                                onClick={() => setSevaType('BRAHMACHARI')}
                                className={`cursor-pointer p-5 rounded-2xl border-2 transition-all duration-300 ${sevaType === 'BRAHMACHARI'
                                        ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-lg shadow-amber-100 scale-[1.02]'
                                        : 'border-gray-200 bg-white hover:border-amber-300 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`p-2 rounded-xl ${sevaType === 'BRAHMACHARI' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        <Crown size={20} />
                                    </div>
                                    <span className={`font-bold ${sevaType === 'BRAHMACHARI' ? 'text-amber-700' : 'text-gray-700'}`}>
                                        {t?.brahmachariPooja || "Brahmachari Pooja"}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mb-3">
                                    {lang === 'KN' ? 'ರಥೋತ್ಸವದ ದಿನ ಸೇವೆ' : 'Puja on Rathotsava day'}
                                </p>
                                <div className="text-xl font-bold text-amber-600">₹2,500</div>
                            </div>
                        </div>
                    </div>

                    {/* ============ SECTION 2: DATE SELECTION (CONDITIONAL) ============ */}
                    {sevaType === 'GENERAL' ? (
                        <div className="space-y-4">
                            <label className={labelClass}>{t?.dateSelection || "Select Occasion Date"}</label>

                            {/* ===== DUAL CALENDAR TOGGLE ===== */}
                            <div className="flex rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
                                <button
                                    type="button"
                                    onClick={() => setCalendarType('GREGORIAN')}
                                    className={`flex-1 py-3 px-4 font-semibold transition-all flex items-center justify-center gap-2 ${calendarType === 'GREGORIAN'
                                            ? 'bg-blue-500 text-white shadow-lg'
                                            : 'bg-transparent text-gray-500 hover:bg-gray-100'
                                        }`}
                                >
                                    <Calendar size={18} />
                                    📅 {lang === 'KN' ? 'ಇಂಗ್ಲಿಷ್ ದಿನಾಂಕ' : 'English Date'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCalendarType('LUNAR')}
                                    className={`flex-1 py-3 px-4 font-semibold transition-all flex items-center justify-center gap-2 ${calendarType === 'LUNAR'
                                            ? 'bg-amber-500 text-white shadow-lg'
                                            : 'bg-transparent text-gray-500 hover:bg-gray-100'
                                        }`}
                                >
                                    <Moon size={18} />
                                    🌙 {lang === 'KN' ? 'ಹಿಂದೂ ತಿಥಿ' : 'Hindu Tithi'}
                                </button>
                            </div>

                            {/* ===== DATE DROPDOWNS ===== */}
                            <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 shadow-sm">
                                {calendarType === 'GREGORIAN' ? (
                                    // GREGORIAN: Day & Month
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>{t?.eventDay || "Day"}</label>
                                            <select
                                                value={dateDetails.day}
                                                onChange={(e) => handleDateChange('day', e.target.value)}
                                                className={selectNormal}
                                            >
                                                {[...Array(31)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>{t?.eventMonth || "Month"}</label>
                                            <select
                                                value={dateDetails.month}
                                                onChange={(e) => handleDateChange('month', e.target.value)}
                                                className={selectNormal}
                                            >
                                                {ENGLISH_MONTHS.map(m => (
                                                    <option key={m.value} value={m.value}>{m.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    // LUNAR: Masa, Paksha, Tithi
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className={labelClass}>{t?.masa || "Masa"}</label>
                                            <select
                                                value={dateDetails.masa}
                                                onChange={(e) => handleDateChange('masa', e.target.value)}
                                                className={selectNormal}
                                                required
                                            >
                                                <option value="">{lang === 'KN' ? '-- ಆಯ್ಕೆ --' : '-- Select --'}</option>
                                                {MASAS.map(m => (
                                                    <option key={m.en} value={m.en}>
                                                        {lang === 'KN' ? m.kn : m.en}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>{t?.paksha || "Paksha"}</label>
                                            <select
                                                value={dateDetails.paksha}
                                                onChange={(e) => handleDateChange('paksha', e.target.value)}
                                                className={selectNormal}
                                                required
                                            >
                                                <option value="">{lang === 'KN' ? '-- ಆಯ್ಕೆ --' : '-- Select --'}</option>
                                                {PAKSHAS_BILINGUAL.map(p => (
                                                    <option key={p.en} value={p.en}>
                                                        {lang === 'KN' ? p.kn : p.en}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>{t?.tithi || "Tithi"}</label>
                                            <select
                                                value={dateDetails.tithi}
                                                onChange={(e) => handleDateChange('tithi', e.target.value)}
                                                className={selectNormal}
                                                required
                                            >
                                                <option value="">{lang === 'KN' ? '-- ಆಯ್ಕೆ --' : '-- Select --'}</option>
                                                {TITHIS_BILINGUAL.map(ti => (
                                                    <option key={ti.en} value={ti.en}>
                                                        {lang === 'KN' ? ti.kn : ti.en}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // ===== BRAHMACHARI: RATHOTSAVA INFO BOX =====
                        <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl text-white shadow-lg">
                                    <Info size={28} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-amber-800 text-lg mb-2 flex items-center gap-2">
                                        🎉 {lang === 'KN' ? 'ರಥೋತ್ಸವ ಪೂಜೆ' : 'Rathotsava Puja'}
                                    </h4>
                                    <p className="text-amber-700">
                                        {t?.rathotsavaMsg || "This Seva is performed annually on the auspicious day of Rathotsava. No date selection required."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============ SECTION 3: DEVOTEE DETAILS ============ */}
                    <div className="space-y-4">
                        <h3 className={labelClass}>
                            {lang === 'KN' ? '👤 ಭಕ್ತರ ವಿವರಗಳು' : '👤 Devotee Details'}
                        </h3>

                        {/* Phone */}
                        <div>
                            <label className={labelClass}>{t?.phone || "Phone Number"}</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleFormChange('phone', e.target.value)}
                                    className={inputNormal}
                                    placeholder="9876543210"
                                    maxLength={10}
                                    required
                                />
                            </div>
                        </div>

                        {/* Name - Smart Input */}
                        <div>
                            <label className={labelClass}>
                                {t?.name || "Name"}
                                {lang === 'KN' && <span className="ml-2 text-violet-400 text-[10px]">(ಟೈಪ್ → ಕನ್ನಡ)</span>}
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                                {lang === 'KN' ? (
                                    <ReactTransliterate
                                        renderComponent={(props) => (
                                            <input {...props} className={inputNormal} required />
                                        )}
                                        value={formData.devotee_name}
                                        onChangeText={(text) => handleFormChange('devotee_name', text)}
                                        lang="kn"
                                        placeholder="Type in English → ಕನ್ನಡ"
                                        enabled={true}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={formData.devotee_name}
                                        onChange={(e) => handleFormChange('devotee_name', e.target.value)}
                                        className={inputNormal}
                                        placeholder="Enter devotee name"
                                        required
                                    />
                                )}
                            </div>
                        </div>

                        {/* Gothra - Smart Input */}
                        <div>
                            <label className={labelClass}>
                                {t?.gothra || "Gothra"}
                                {lang === 'KN' && <span className="ml-2 text-violet-400 text-[10px]">(ಟೈಪ್ → ಕನ್ನಡ)</span>}
                            </label>
                            <div className="relative">
                                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                                {lang === 'KN' ? (
                                    <ReactTransliterate
                                        renderComponent={(props) => (
                                            <input {...props} className={inputNormal} />
                                        )}
                                        value={formData.gothra}
                                        onChangeText={(text) => handleFormChange('gothra', text)}
                                        lang="kn"
                                        placeholder="Type in English → ಕನ್ನಡ"
                                        enabled={true}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={formData.gothra}
                                        onChange={(e) => handleFormChange('gothra', e.target.value)}
                                        className={inputNormal}
                                        placeholder="Enter gothra"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label className={labelClass}>{t?.address || "Address"}</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-4 text-gray-400" size={18} />
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => handleFormChange('address', e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100 text-sm min-h-[100px] resize-none"
                                    placeholder={lang === 'KN' ? 'ವಿಳಾಸ ನಮೂದಿಸಿ...' : 'Enter address...'}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ============ SUBMIT BUTTON ============ */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 font-bold text-lg rounded-2xl shadow-xl transition-all flex justify-center items-center gap-3 ${sevaType === 'BRAHMACHARI'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-amber-200 hover:scale-[1.02]'
                                : 'bg-gradient-to-r from-violet-600 to-purple-700 text-white hover:shadow-purple-200 hover:scale-[1.02]'
                            }`}
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={24} />
                        ) : (
                            <>
                                <Sparkles size={20} />
                                {t?.subscribeBtn || 'Subscribe Forever'}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ShaswataForm;
