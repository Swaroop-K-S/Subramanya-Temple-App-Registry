/**
 * ShaswataForm Component
 * ======================
 * Form for creating Shaswata (Perpetual Puja) subscriptions.
 * Supports both Fixed Date (Gregorian) and Lunar Date (Hindu Calendar) modes.
 */

import { useState } from 'react';
import {
    Calendar, Moon, User, Phone, FileText,
    Loader2, CheckCircle2, ChevronDown, Sparkles
} from 'lucide-react';
import { MAASA_LIST, PAKSHA_LIST, TITHI_LIST, ENGLISH_MONTHS } from './constants';

// API base URL
const API_BASE = 'http://127.0.0.1:8000';

function ShaswataForm({ onSuccess }) {
    // Form mode: 'GREGORIAN' or 'LUNAR'
    const [mode, setMode] = useState('GREGORIAN');

    // Common fields
    const [formData, setFormData] = useState({
        devotee_name: '',
        phone_number: '',
        notes: '',
        seva_id: 7, // Default to Shaswata Puje seva
        amount: 5000, // Default amount
        payment_mode: 'CASH',
    });

    // Gregorian date fields
    const [gregorianDate, setGregorianDate] = useState({
        event_day: '',
        event_month: '',
    });

    // Lunar date fields
    const [lunarDate, setLunarDate] = useState({
        maasa: '',
        paksha: '',
        tithi: '',
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Handle common field changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle Gregorian date changes
    const handleDateChange = (e) => {
        const dateValue = e.target.value; // Format: YYYY-MM-DD
        if (dateValue) {
            const [year, month, day] = dateValue.split('-');
            setGregorianDate({
                event_day: parseInt(day, 10),
                event_month: parseInt(month, 10),
            });
        }
    };

    // Handle lunar date dropdown changes
    const handleLunarChange = (e) => {
        const { name, value } = e.target;
        setLunarDate(prev => ({ ...prev, [name]: value }));
    };

    // Submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Build request body based on mode
            const requestBody = {
                devotee_name: formData.devotee_name,
                phone_number: formData.phone_number,
                seva_id: formData.seva_id,
                amount: formData.amount,
                payment_mode: formData.payment_mode,
                notes: formData.notes || null,
                subscription_type: mode,
            };

            if (mode === 'GREGORIAN') {
                if (!gregorianDate.event_day || !gregorianDate.event_month) {
                    throw new Error('Please select a date');
                }
                requestBody.event_day = gregorianDate.event_day;
                requestBody.event_month = gregorianDate.event_month;
            } else {
                if (!lunarDate.maasa || !lunarDate.paksha || !lunarDate.tithi) {
                    throw new Error('Please select Maasa, Paksha, and Tithi');
                }
                requestBody.maasa = lunarDate.maasa;
                requestBody.paksha = lunarDate.paksha;
                requestBody.tithi = lunarDate.tithi;
            }

            // Make API call
            const response = await fetch(`${API_BASE}/shaswata/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Subscription failed');
            }

            const result = await response.json();

            // Show success
            setSuccess({
                subscriptionId: result.subscription_id,
                devotee: result.devotee_name,
                seva: result.seva_name,
                date: mode === 'LUNAR' ? result.lunar_date : result.gregorian_date,
                receiptNo: result.receipt_no,
            });

            // Reset form
            setFormData({
                devotee_name: '',
                phone_number: '',
                notes: '',
                seva_id: 7,
                amount: 5000,
                payment_mode: 'CASH',
            });
            setGregorianDate({ event_day: '', event_month: '' });
            setLunarDate({ maasa: '', paksha: '', tithi: '' });

            // Callback
            if (onSuccess) onSuccess(result);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Get formatted date string for display in date input
    const getDateInputValue = () => {
        if (gregorianDate.event_day && gregorianDate.event_month) {
            const day = String(gregorianDate.event_day).padStart(2, '0');
            const month = String(gregorianDate.event_month).padStart(2, '0');
            return `2026-${month}-${day}`;
        }
        return '';
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-500 px-6 py-5">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-yellow-300" />
                    <div>
                        <h2 className="text-2xl font-bold text-white">Shaswata Puje</h2>
                        <p className="text-purple-200 text-sm">Perpetual Annual Subscription</p>
                    </div>
                </div>
            </div>

            {/* Mode Toggle Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    type="button"
                    onClick={() => setMode('GREGORIAN')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-semibold transition-all ${mode === 'GREGORIAN'
                            ? 'bg-orange-50 text-orange-700 border-b-3 border-orange-500'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    <Calendar className="w-5 h-5" />
                    📅 Fixed Date (Birthday)
                </button>
                <button
                    type="button"
                    onClick={() => setMode('LUNAR')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-semibold transition-all ${mode === 'LUNAR'
                            ? 'bg-indigo-50 text-indigo-700 border-b-3 border-indigo-500'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    <Moon className="w-5 h-5" />
                    🌙 Lunar Date (Tithi)
                </button>
            </div>

            {/* Success Message */}
            {success && (
                <div className="mx-6 mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-green-800">
                                🙏 Shaswata Subscription Created!
                            </h3>
                            <div className="mt-2 text-sm text-green-700 space-y-1">
                                <p><strong>Subscription ID:</strong> #{success.subscriptionId}</p>
                                <p><strong>Devotee:</strong> {success.devotee}</p>
                                <p><strong>Seva:</strong> {success.seva}</p>
                                <p><strong>Annual Date:</strong> {success.date}</p>
                                <p><strong>Receipt:</strong> {success.receiptNo}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">

                {/* Devotee Name */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                        <User className="w-4 h-4 text-gray-500" />
                        Devotee Name *
                    </label>
                    <input
                        type="text"
                        name="devotee_name"
                        value={formData.devotee_name}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter full name"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    />
                </div>

                {/* Phone Number */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                        <Phone className="w-4 h-4 text-gray-500" />
                        Phone Number *
                    </label>
                    <input
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleInputChange}
                        required
                        placeholder="10-digit mobile number"
                        pattern="[0-9]{10}"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    />
                </div>

                {/* Conditional Date Section */}
                <div className={`p-4 rounded-xl ${mode === 'GREGORIAN' ? 'bg-orange-50' : 'bg-indigo-50'}`}>
                    <h3 className={`font-semibold mb-3 ${mode === 'GREGORIAN' ? 'text-orange-800' : 'text-indigo-800'}`}>
                        {mode === 'GREGORIAN' ? '📅 Select Annual Date' : '🌙 Select Lunar Date'}
                    </h3>

                    {mode === 'GREGORIAN' ? (
                        /* Fixed Date Picker */
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Date (Day &amp; Month) *
                            </label>
                            <input
                                type="date"
                                onChange={handleDateChange}
                                value={getDateInputValue()}
                                className="w-full px-4 py-2.5 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
                            />
                            <p className="text-xs text-orange-600 mt-1">
                                Only day and month will be used (year is ignored)
                            </p>
                        </div>
                    ) : (
                        /* Lunar Date Dropdowns */
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Maasa */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Maasa (Month) *
                                </label>
                                <div className="relative">
                                    <select
                                        name="maasa"
                                        value={lunarDate.maasa}
                                        onChange={handleLunarChange}
                                        required={mode === 'LUNAR'}
                                        className="w-full px-4 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white appearance-none cursor-pointer"
                                    >
                                        <option value="">Select Maasa</option>
                                        {MAASA_LIST.map((m) => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Paksha */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Paksha *
                                </label>
                                <div className="relative">
                                    <select
                                        name="paksha"
                                        value={lunarDate.paksha}
                                        onChange={handleLunarChange}
                                        required={mode === 'LUNAR'}
                                        className="w-full px-4 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white appearance-none cursor-pointer"
                                    >
                                        <option value="">Select Paksha</option>
                                        {PAKSHA_LIST.map((p) => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Tithi */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Tithi *
                                </label>
                                <div className="relative">
                                    <select
                                        name="tithi"
                                        value={lunarDate.tithi}
                                        onChange={handleLunarChange}
                                        required={mode === 'LUNAR'}
                                        className="w-full px-4 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white appearance-none cursor-pointer"
                                    >
                                        <option value="">Select Tithi</option>
                                        {TITHI_LIST.map((t) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Amount and Payment Mode */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Amount (₹) *
                        </label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleInputChange}
                            required
                            min="1"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Payment Mode *
                        </label>
                        <div className="relative">
                            <select
                                name="payment_mode"
                                value={formData.payment_mode}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white appearance-none cursor-pointer"
                            >
                                <option value="CASH">💵 Cash</option>
                                <option value="UPI">📱 UPI</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                        <FileText className="w-4 h-4 text-gray-500" />
                        Notes (Optional)
                    </label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="e.g., Father's Shraddha, Daughter's Birthday Puja..."
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
                    />
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        ❌ {error}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Creating Subscription...
                        </>
                    ) : (
                        <>
                            ✨ Create Shaswata Subscription
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

export default ShaswataForm;
