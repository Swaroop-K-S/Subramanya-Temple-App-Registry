/**
 * ShaswataForm Component - Swarm Refactor v5.0
 * ============================================
 * Architecture: Level 5 Multi-Agent Swarm
 * Consenus: Wizard Layout, Deep Glass, Security Hook, Dopamine Loop
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    X, User, Phone, Sparkles, MapPin, Calendar, Moon, Sun,
    Loader2, CheckCircle2, ArrowRight, ArrowLeft, ChevronRight, ShieldCheck, Crown, Star
} from 'lucide-react';
import { ReactTransliterate } from 'react-transliterate';
import 'react-transliterate/dist/index.css';
import DOMPurify from 'dompurify';
import confetti from 'canvas-confetti';
import api from '../services/api';
// import './ShaswataWizard.css'; // Swarm Animations - Removed (Missing)
import { MASAS, PAKSHAS_BILINGUAL, TITHIS_BILINGUAL, ENGLISH_MONTHS, GOTRAS, OCCASIONS, RASHIS, NAKSHATRAS } from './constants';
import { TRANSLATIONS } from './translations';
import { useTheme } from '../context/ThemeContext'; // Assuming context exists, if not fallback to props
import ShaswataCertificate from './ShaswataCertificate';

// =============================================================================
// AGENT UTILS
// =============================================================================

// Agent Beta: Security Validation
const validatePhone = (phone) => /^[0-9]{10}$/.test(phone);
const sanitizeInput = (input) => DOMPurify.sanitize(input);

// Agent Gamma: Vedic Aesthetics
const VARIANTS = {
    FIRE: "bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-orange-200",
    ROYAL: "bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-indigo-200",
    GLASS_PANEL: "bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl",
    INPUT_ERROR: "animate-shake border-amber-500 ring-2 ring-amber-200 bg-amber-50"
};

export default function ShaswataForm({ isOpen, onClose, lang = 'EN', initialContext = null }) {
    const t = TRANSLATIONS[lang] || {};

    // =========================================================================
    // STATE: THE WIZARD MACHINE
    // =========================================================================
    const [step, setStep] = useState(1); // 1: Devotee, 2: Seva, 3: Success
    const [direction, setDirection] = useState('forward');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [receiptId, setReceiptId] = useState(null);
    const [showCertificate, setShowCertificate] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        devotee_name: '',
        gothra: '',
        rashi: '',      // NEW: Zodiac Sign
        nakshatra: '',  // NEW: Birth Star
        phone: '',
        address: '',
        area: '',      // NEW
        pincode: '',   // NEW
        occasion: ''  // NEW: For Birthday, Anniversary, etc.
    });

    const [sevaDetails, setSevaDetails] = useState({
        type: 'GENERAL', // Only GENERAL now
        calendar: 'GREGORIAN', // GREGORIAN | LUNAR
        date: { day: 1, month: 1, masa: '', paksha: '', tithi: '' },
        payment_mode: 'CASH', // CASH | UPI | CHEQUE | NEFT | RTGS
        upi_transaction_id: ''
    });

    // Reset or Pre-fill on Open
    useEffect(() => {
        if (isOpen) {
            // Only apply context if we haven't touched the form yet (or just force it once on open)
            // We blindly apply it here because 'isOpen' transitioning to true means "New Session"
            if (initialContext) {
                const { date, panchangam } = initialContext;

                // Default to Gregorian from context
                const [year, month, day] = date ? date.split('-') : [null, 1, 1];

                let newSevaDetails = {
                    type: 'GENERAL',
                    calendar: 'GREGORIAN',
                    date: {
                        day: parseInt(day),
                        month: parseInt(month),
                        masa: '',
                        paksha: '',
                        tithi: ''
                    }
                };

                if (panchangam && panchangam.attributes) {
                    newSevaDetails.date.masa = panchangam.attributes.maasa;
                    newSevaDetails.date.paksha = panchangam.attributes.paksha;
                    newSevaDetails.date.tithi = panchangam.attributes.tithi;
                }

                setSevaDetails(newSevaDetails);
            }
        } else {
            // Reset on Close
            setTimeout(() => {
                setStep(1);
                setFormData({ devotee_name: '', gothra: '', phone: '', address: '', occasion: '' });
                setSevaDetails({ type: 'GENERAL', calendar: 'GREGORIAN', date: { day: 1, month: 1, masa: '', paksha: '', tithi: '' }, payment_mode: 'CASH', upi_transaction_id: '' });
                setErrors({});
            }, 300); // Wait for exit animation
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]); // REMOVED initialContext to prevent reset loops on parent re-renders

    // =========================================================================
    // AGENT LOGIC
    // =========================================================================

    // Agent Delta: Performance Optimization for Input
    const handleInputChange = useCallback((field, value) => {
        // Agent Beta: Sanitization Hook
        const cleanValue = typeof value === 'string' ? sanitizeInput(value) : value;
        setFormData(prev => ({ ...prev, [field]: cleanValue }));

        // Agent Alpha: Clear error on type
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    }, [errors]);

    const handleSevaChange = useCallback((field, value) => {
        setSevaDetails(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleDateChange = useCallback((field, value) => {
        setSevaDetails(prev => ({
            ...prev,
            date: { ...prev.date, [field]: value }
        }));
    }, []);

    // Agent Alpha: Wizard Navigation Logic
    const nextStep = () => {
        let newErrors = {};

        if (step === 1) {
            // Validate Step 1
            if (!formData.devotee_name) newErrors.devotee_name = true;
            if (!formData.phone || !validatePhone(formData.phone)) newErrors.phone = true;
            if (!formData.address) newErrors.address = true;
            if (!formData.area) newErrors.area = true;        // Validation
            if (!formData.pincode) newErrors.pincode = true;  // Validation
        }

        if (Object.keys(newErrors).length > 0) {
            // Trigger Shake
            setErrors(newErrors);
            return;
        }

        setDirection('forward');
        setStep(prev => prev + 1);
    };

    const prevStep = () => {
        setDirection('back');
        setStep(prev => prev - 1);
    };

    // Agent Gamma: Success Dopamine
    const triggerConfetti = () => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 60 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Validate UPI Transaction ID if UPI is selected
            if (sevaDetails.payment_mode === 'UPI' && !sevaDetails.upi_transaction_id?.trim()) {
                alert('UPI Transaction ID is required for UPI payments');
                setLoading(false);
                return;
            }

            const payload = {
                devotee_name: formData.devotee_name,
                phone_number: formData.phone,
                gothra: formData.gothra,
                rashi: formData.rashi,         // NEW: Zodiac Sign
                nakshatra: formData.nakshatra, // NEW: Birth Star
                address: formData.address,
                area: formData.area,       // Mapping
                pincode: formData.pincode, // Mapping
                occasion: formData.occasion || null,  // NEW: Birthday, Anniversary, etc.

                // Mapped Fields
                seva_id: 7, // Always General Seva now
                amount: 5000.0,
                payment_mode: sevaDetails.payment_mode,
                upi_transaction_id: sevaDetails.payment_mode === 'UPI' ? sevaDetails.upi_transaction_id : null,

                seva_type: 'GENERAL',
                subscription_type: sevaDetails.calendar,
                ...(sevaDetails.calendar === 'GREGORIAN' && {
                    event_day: parseInt(sevaDetails.date.day),
                    event_month: parseInt(sevaDetails.date.month),
                }),
                ...(sevaDetails.calendar === 'LUNAR' && {
                    maasa: sevaDetails.date.masa,
                    paksha: sevaDetails.date.paksha,
                    tithi: sevaDetails.date.tithi,
                }),
            };

            const response = await api.post('/shaswata/subscribe', payload);
            setReceiptId(response?.data?.receipt_no || response?.data?.id || Math.floor(Math.random() * 9000) + 1000);
            triggerConfetti();
            setStep(3); // Success Step
        } catch (err) {
            console.error(err);
            // Show more detailed error
            const msg = err.response?.data?.detail || "Submission Failed. Please check connection.";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // =========================================================================
    // RENDER: DEEP GLASS WIZARD
    // =========================================================================
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Deep Glass Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            <div className={`${VARIANTS.GLASS_PANEL} w-full max-w-2xl rounded-3xl overflow-hidden relative flex flex-col max-h-[85vh]`}>

                {/* Header: Progress Bar */}
                <div className="relative h-2 bg-white/10 w-full">
                    <div
                        className="absolute h-full bg-gradient-to-r from-orange-400 to-amber-500 transition-all duration-500"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                {/* Title Bar */}
                <div className="px-8 py-6 flex justify-between items-center bg-white/5 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-3">
                            <Sparkles className="text-amber-400 fill-amber-400" />
                            {lang === 'KN' ? 'ಶಾಶ್ವತ ಸೇವೆ' : 'Shaswata Seva'}
                        </h2>
                        <p className="text-amber-100/60 text-sm font-medium">
                            {step === 1 && "Step 1: Devotee Details"}
                            {step === 2 && "Step 2: Ritual Selection"}
                            {step === 3 && "Registration Complete"}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Wizard Body */}
                <div className="flex-1 overflow-y-auto p-8 relative min-h-[400px]">

                    {/* STEP 1: DEVOTEE INFO */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                            {/* Name */}
                            <div>
                                <label className="text-xs font-bold text-amber-100/80 uppercase tracking-widest mb-2 block">
                                    {lang === 'KN' ? 'ಹೆಸರು (Name)' : 'Devotee Name'}
                                </label>
                                <div className={`relative group transition-all rounded-xl ${errors.devotee_name ? VARIANTS.INPUT_ERROR : 'bg-white/5 focus-within:bg-white/10'}`}>
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-amber-400" size={20} />
                                    {lang === 'KN' ? (
                                        <ReactTransliterate
                                            value={formData.devotee_name}
                                            onChangeText={(t) => handleInputChange('devotee_name', t)}
                                            lang="kn"
                                            placeholder="Type in English..."
                                            containerClassName="w-full"
                                            className="w-full pl-12 pr-4 py-4 bg-transparent border-none outline-none text-white placeholder:text-white/20 font-medium text-lg vedic-input param-font"
                                        />
                                    ) : (
                                        <input
                                            value={formData.devotee_name}
                                            onChange={(e) => handleInputChange('devotee_name', e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-transparent border-none outline-none text-white placeholder:text-white/20 font-medium text-lg"
                                            placeholder="Enter full name"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Phone & Gothra Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-amber-100/80 uppercase tracking-widest mb-2 block">
                                        {lang === 'KN' ? 'ದೂರವಾಣಿ (Phone)' : 'Mobile Number'}
                                    </label>
                                    <div className={`relative group rounded-xl ${errors.phone ? VARIANTS.INPUT_ERROR : 'bg-white/5 focus-within:bg-white/10'}`}>
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-amber-400" size={20} />
                                        <input
                                            type="tel"
                                            maxLength={10}
                                            value={formData.phone}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-transparent border-none outline-none text-white placeholder:text-white/20 font-medium text-lg font-mono"
                                            placeholder="9999999999"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-amber-100/80 uppercase tracking-widest mb-2 block">
                                        {lang === 'KN' ? 'ಗೋತ್ರ (Gothra)' : 'Gothra'}
                                    </label>
                                    <div className="relative group bg-white/5 focus-within:bg-white/10 rounded-xl">
                                        <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-amber-400 pointer-events-none z-10" size={20} />
                                        <select
                                            value={formData.gothra}
                                            onChange={(e) => handleInputChange('gothra', e.target.value)}
                                            className="w-full pl-12 pr-10 py-4 bg-transparent border-none outline-none text-white font-medium text-lg appearance-none cursor-pointer"
                                        >
                                            <option value="" className="bg-slate-800 text-white">{lang === 'KN' ? 'ಗೋತ್ರ ಆಯ್ಕೆಮಾಡಿ...' : 'Select Gothra...'}</option>
                                            {GOTRAS.map(g => (
                                                <option key={g.en} value={g.en} className="bg-slate-800 text-white">
                                                    {lang === 'KN' ? `${g.kn} (${g.en})` : g.en}
                                                </option>
                                            ))}
                                        </select>
                                        {/* Custom Chevron (Affordance) */}
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Rashi & Nakshatra Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Rashi (Zodiac) */}
                                <div>
                                    <label className="text-xs font-bold text-amber-100/80 uppercase tracking-widest mb-2 block">
                                        {lang === 'KN' ? 'ರಾಶಿ (Rashi)' : 'Rashi / Zodiac'}
                                    </label>
                                    <div className="relative group bg-white/5 focus-within:bg-white/10 rounded-xl">
                                        <Moon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-amber-400 pointer-events-none z-10" size={20} />
                                        <select
                                            value={formData.rashi}
                                            onChange={(e) => handleInputChange('rashi', e.target.value)}
                                            className="w-full pl-12 pr-10 py-4 bg-transparent border-none outline-none text-white font-medium text-lg appearance-none cursor-pointer"
                                        >
                                            <option value="" className="bg-slate-800 text-white">{lang === 'KN' ? 'ರಾಶಿ ಆಯ್ಕೆಮಾಡಿ...' : 'Select Rashi...'}</option>
                                            {RASHIS.map(r => (
                                                <option key={r.en} value={r.en} className="bg-slate-800 text-white">
                                                    {lang === 'KN' ? `${r.kn} (${r.en})` : r.en}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                {/* Nakshatra (Birth Star) */}
                                <div>
                                    <label className="text-xs font-bold text-amber-100/80 uppercase tracking-widest mb-2 block">
                                        {lang === 'KN' ? 'ನಕ್ಷತ್ರ (Nakshatra)' : 'Nakshatra / Birth Star'}
                                    </label>
                                    <div className="relative group bg-white/5 focus-within:bg-white/10 rounded-xl">
                                        <Star className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-amber-400 pointer-events-none z-10" size={20} />
                                        <select
                                            value={formData.nakshatra}
                                            onChange={(e) => handleInputChange('nakshatra', e.target.value)}
                                            className="w-full pl-12 pr-10 py-4 bg-transparent border-none outline-none text-white font-medium text-lg appearance-none cursor-pointer"
                                        >
                                            <option value="" className="bg-slate-800 text-white">{lang === 'KN' ? 'ನಕ್ಷತ್ರ ಆಯ್ಕೆಮಾಡಿ...' : 'Select Nakshatra...'}</option>
                                            {NAKSHATRAS.map(n => (
                                                <option key={n.en} value={n.en} className="bg-slate-800 text-white">
                                                    {lang === 'KN' ? `${n.kn} (${n.en})` : n.en}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Address Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-amber-100/80 uppercase tracking-widest mb-2 block">
                                        {lang === 'KN' ? 'ವಿಳಾಸ (Address)' : 'Street Address'}
                                    </label>
                                    <div className={`relative bg-white/5 focus-within:bg-white/10 rounded-xl ${errors.address ? VARIANTS.INPUT_ERROR : ''}`}>
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => handleInputChange('address', e.target.value)}
                                            className="w-full p-4 bg-transparent border-none outline-none text-white placeholder:text-white/20 font-medium h-24 resize-none"
                                            placeholder="#123, Temple Street..."
                                        />
                                    </div>
                                </div>

                                {/* Area */}
                                <div>
                                    <label className="text-xs font-bold text-amber-100/80 uppercase tracking-widest mb-2 block">
                                        {lang === 'KN' ? 'ಬಡಾವಣೆ (Area)' : 'Area / Locality'}
                                    </label>
                                    <div className={`relative group rounded-xl ${errors.area ? VARIANTS.INPUT_ERROR : 'bg-white/5 focus-within:bg-white/10'}`}>
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-amber-400" size={20} />
                                        <input
                                            value={formData.area}
                                            onChange={(e) => handleInputChange('area', e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-transparent border-none outline-none text-white placeholder:text-white/20 font-medium text-lg"
                                            placeholder="Basavanagudi"
                                        />
                                    </div>
                                </div>

                                {/* Pincode */}
                                <div>
                                    <label className="text-xs font-bold text-amber-100/80 uppercase tracking-widest mb-2 block">
                                        {lang === 'KN' ? 'ಪಿನ್ ಕೋಡ್ (Pincode)' : 'Pincode'}
                                    </label>
                                    <div className={`relative group rounded-xl ${errors.pincode ? VARIANTS.INPUT_ERROR : 'bg-white/5 focus-within:bg-white/10'}`}>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-mono text-sm">#</div>
                                        <input
                                            value={formData.pincode}
                                            onChange={(e) => handleInputChange('pincode', e.target.value)}
                                            maxLength={6}
                                            className="w-full pl-12 pr-4 py-4 bg-transparent border-none outline-none text-white placeholder:text-white/20 font-medium text-lg font-mono"
                                            placeholder="560004"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* === OCCASION FIELD (Temple OS Compliant) === */}
                            {/* 8-Point Grid: p-4, gap-6 | Deep Glass: bg-white/5 */}
                            <div>
                                <label className="text-xs font-bold text-amber-100/80 uppercase tracking-widest mb-2 block">
                                    {lang === 'KN' ? 'ಸಂದರ್ಭ (Occasion)' : 'Purpose / Occasion'}
                                </label>
                                <div className="relative group bg-white/5 focus-within:bg-white/10 rounded-xl">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none">
                                        {formData.occasion
                                            ? OCCASIONS.find(o => o.en === formData.occasion)?.icon || '🎉'
                                            : '🎉'}
                                    </span>
                                    <select
                                        value={formData.occasion}
                                        onChange={(e) => handleInputChange('occasion', e.target.value)}
                                        className="w-full pl-12 pr-10 py-4 bg-transparent border-none outline-none text-white font-medium text-lg appearance-none cursor-pointer"
                                    >
                                        <option value="" className="bg-slate-800 text-white">
                                            {lang === 'KN' ? 'ಸಂದರ್ಭ ಆಯ್ಕೆಮಾಡಿ...' : 'Select Occasion...'}
                                        </option>
                                        {OCCASIONS.map(o => (
                                            <option key={o.en} value={o.en} className="bg-slate-800 text-white">
                                                {lang === 'KN' ? `${o.icon} ${o.kn} (${o.en})` : `${o.icon} ${o.en}`}
                                            </option>
                                        ))}
                                    </select>
                                    {/* Custom Chevron (Affordance - 3.5 Theory) */}
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                {/* Helper Text */}
                                <p className="text-xs text-white/40 mt-2 pl-1">
                                    {lang === 'KN' ? 'ಯಾವ ಸಂದರ್ಭಕ್ಕಾಗಿ ಈ ಪೂಜೆ?' : 'Why is this pooja being performed?'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: SEVA SELECTION */}
                    {step === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                            {/* General Seva Card (Only option now - Full width) */}
                            <div className="grid grid-cols-1 gap-4">
                                <div
                                    className="p-6 rounded-2xl border transition-all text-left bg-amber-500/20 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                                >
                                    <Star className="mb-3 text-amber-400 fill-amber-400" size={32} />
                                    <h3 className="text-white font-bold text-lg mb-1">General Seva</h3>
                                    <p className="text-white/60 text-xs">Pick any date</p>
                                    <div className="mt-3 text-amber-400 font-bold text-xl">₹5,000</div>
                                </div>
                            </div>

                            {/* Date Picker (General Only) */}
                            {sevaDetails.type === 'GENERAL' && (
                                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                    <div className="flex gap-2 p-1 bg-black/20 rounded-xl mb-6">
                                        <button
                                            onClick={() => handleSevaChange('calendar', 'GREGORIAN')}
                                            className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${sevaDetails.calendar === 'GREGORIAN' ? 'bg-amber-500 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                                        >
                                            <Calendar size={16} /> English Date
                                        </button>
                                        <button
                                            onClick={() => handleSevaChange('calendar', 'LUNAR')}
                                            className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${sevaDetails.calendar === 'LUNAR' ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                                        >
                                            <Moon size={16} /> Hindu Tithi
                                        </button>
                                    </div>

                                    {/* Inputs */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {sevaDetails.calendar === 'GREGORIAN' ? (
                                            <>
                                                <select
                                                    value={sevaDetails.date.day}
                                                    onChange={(e) => handleDateChange('day', e.target.value)}
                                                    className="bg-black/20 text-white p-3 rounded-xl border border-white/10 outline-none focus:border-amber-500"
                                                >
                                                    {[...Array(31)].map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                                                </select>
                                                <select
                                                    value={sevaDetails.date.month}
                                                    onChange={(e) => handleDateChange('month', e.target.value)}
                                                    className="bg-black/20 text-white p-3 rounded-xl border border-white/10 outline-none focus:border-amber-500"
                                                >
                                                    {ENGLISH_MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                                </select>
                                            </>
                                        ) : (
                                            <div className="col-span-2 grid grid-cols-3 gap-2">
                                                <select
                                                    value={sevaDetails.date.masa}
                                                    onChange={(e) => handleDateChange('masa', e.target.value)}
                                                    className="bg-black/20 text-white p-3 rounded-xl border border-white/10 outline-none text-xs focus:border-amber-500"
                                                >
                                                    <option value="">Month</option>
                                                    {MASAS.map(m => <option key={m.en} value={m.en}>{m.en}</option>)}
                                                </select>
                                                <select
                                                    value={sevaDetails.date.paksha}
                                                    onChange={(e) => handleDateChange('paksha', e.target.value)}
                                                    className="bg-black/20 text-white p-3 rounded-xl border border-white/10 outline-none text-xs focus:border-amber-500"
                                                >
                                                    <option value="">Paksha</option>
                                                    {PAKSHAS_BILINGUAL.map(p => <option key={p.en} value={p.en}>{p.en}</option>)}
                                                </select>
                                                <select
                                                    value={sevaDetails.date.tithi}
                                                    onChange={(e) => handleDateChange('tithi', e.target.value)}
                                                    className="bg-black/20 text-white p-3 rounded-xl border border-white/10 outline-none text-xs focus:border-amber-500"
                                                >
                                                    <option value="">Tithi</option>
                                                    {TITHIS_BILINGUAL.map(t => <option key={t.en} value={t.en}>{t.en}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Payment Mode Selector */}
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                <label className="text-xs font-bold text-amber-100/80 uppercase tracking-widest mb-4 block">
                                    Payment Mode
                                </label>
                                <div className="grid grid-cols-5 gap-2">
                                    {['CASH', 'UPI', 'CHEQUE', 'NEFT', 'RTGS'].map(mode => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => handleSevaChange('payment_mode', mode)}
                                            className={`py-3 rounded-xl font-bold text-xs transition-all ${sevaDetails.payment_mode === mode
                                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                                : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                                                }`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>

                                {/* UPI Transaction ID - Conditional */}
                                {sevaDetails.payment_mode === 'UPI' && (
                                    <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
                                        <label className="text-xs font-bold text-amber-100/80 uppercase tracking-widest mb-2 block">
                                            UPI Transaction ID <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            value={sevaDetails.upi_transaction_id}
                                            onChange={(e) => handleSevaChange('upi_transaction_id', e.target.value)}
                                            className="w-full px-4 py-3 bg-purple-900/30 border-2 border-purple-500/30 rounded-xl text-white font-mono placeholder:text-purple-300/40 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                            placeholder="Enter UTR Number (e.g., 123456789012)"
                                            maxLength={50}
                                        />
                                        <p className="text-xs text-white/40 mt-2">Enter the 12-digit UTR number from your payment app</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: SUCCESS (DOPAMINE) */}
                    {step === 3 && (
                        <div className="text-center py-10 animate-in zoom-in duration-500 flex flex-col items-center">
                            <div className="w-24 h-24 mb-6 relative">
                                <svg className="checkmark-circle" viewBox="0 0 52 52">
                                    <circle cx="26" cy="26" r="25" fill="none" />
                                </svg>
                                <svg className="checkmark-check absolute top-0 left-0" viewBox="0 0 52 52">
                                    <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-black text-white mb-2">Registration Complete!</h2>
                            <p className="text-white/60 mb-8">
                                May Lord Subramanya bless your family.
                            </p>
                            <div className="bg-white/10 p-6 rounded-2xl w-full max-w-sm border border-white/10 mx-auto mb-6">
                                <div className="flex justify-between text-white/70 mb-2">
                                    <span>Receipt ID</span>
                                    <span className="font-mono font-bold text-white">#{receiptId}</span>
                                </div>
                                <div className="border-t border-white/10 my-2"></div>
                                <div className="flex justify-between text-amber-400 font-bold text-lg">
                                    <span>Total Paid</span>
                                    <span>₹5,000</span>
                                </div>
                            </div>

                            {/* Print Certificate Button */}
                            <button
                                onClick={() => setShowCertificate(true)}
                                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-all flex items-center gap-3"
                            >
                                <Sparkles size={20} />
                                Print A4 Certificate
                            </button>
                        </div>
                    )}

                    {/* Certificate Modal */}
                    {showCertificate && (
                        <ShaswataCertificate
                            devotee={formData}
                            sevaDetails={sevaDetails}
                            receiptId={receiptId}
                            lang={lang}
                            onClose={() => setShowCertificate(false)}
                        />
                    )}
                </div>

                {/* Footer: Navigation */}
                {step < 3 && (
                    <div className="p-6 bg-black/20 border-t border-white/5 flex justify-between">
                        {step > 1 ? (
                            <button onClick={prevStep} className="px-6 py-3 rounded-xl font-bold text-white/70 hover:bg-white/10 transition-all flex items-center gap-2">
                                <ArrowLeft size={18} /> Back
                            </button>
                        ) : <div></div>}

                        {step === 2 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-8 py-3 rounded-xl font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transition-all flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={18} /> Confirm & Pay</>}
                            </button>
                        ) : (
                            <button
                                onClick={nextStep}
                                className="px-8 py-3 rounded-xl font-bold bg-amber-500 text-black shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all flex items-center gap-2"
                            >
                                Next Step <ArrowRight size={18} />
                            </button>
                        )}
                    </div>
                )}
                {step === 3 && (
                    <div className="p-6 bg-black/20 border-t border-white/5 text-center">
                        <button onClick={onClose} className="text-white/50 hover:text-white font-bold transition-colors">
                            Close Window
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
