/**
 * BookingModal Component
 * ======================
 * Modal dialog for booking a seva with devotee information.
 */

import { useState } from 'react';
import { X, User, Phone, Sparkles, IndianRupee, CreditCard, Banknote, Loader2 } from 'lucide-react';
import { bookSeva } from '../services/api';

function BookingModal({ isOpen, onClose, seva }) {
    const [formData, setFormData] = useState({
        devotee_name: '',
        phone_number: '',
        gothra: '',
        nakshatra: '',
        payment_mode: 'CASH',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Don't render if not open or no seva selected
    if (!isOpen || !seva) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const bookingData = {
                ...formData,
                seva_id: seva.id,
                amount: parseFloat(seva.price) || 0,
            };

            const response = await bookSeva(bookingData);

            // Show success alert
            alert(`🙏 ${response.message}\n\nSeva: ${response.seva_name}\nAmount: ₹${response.amount_paid}\nReceipt: ${response.receipt_no}`);

            // Reset form and close modal
            setFormData({
                devotee_name: '',
                phone_number: '',
                gothra: '',
                nakshatra: '',
                payment_mode: 'CASH',
            });
            onClose();
        } catch (err) {
            console.error('Booking failed:', err);
            setError(err.response?.data?.detail || 'Booking failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white">Book Seva</h2>
                            <p className="text-orange-100 text-sm">{seva.name_eng}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/20 transition-colors"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Price Display */}
                    <div className="flex items-center justify-center gap-2 py-3 bg-green-50 rounded-lg">
                        <IndianRupee className="w-6 h-6 text-green-600" />
                        <span className="text-2xl font-bold text-green-700">
                            {parseFloat(seva.price) > 0 ? `₹${parseFloat(seva.price).toFixed(0)}` : 'Variable'}
                        </span>
                    </div>

                    {/* Devotee Name */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                            <User className="w-4 h-4" />
                            Devotee Name *
                        </label>
                        <input
                            type="text"
                            name="devotee_name"
                            value={formData.devotee_name}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter full name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        />
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                            <Phone className="w-4 h-4" />
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        />
                    </div>

                    {/* Gothra (Optional) */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                            <Sparkles className="w-4 h-4" />
                            Gothra (Optional)
                        </label>
                        <input
                            type="text"
                            name="gothra"
                            value={formData.gothra}
                            onChange={handleInputChange}
                            placeholder="e.g., Kashyapa, Bharadwaja"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        />
                    </div>

                    {/* Nakshatra (Optional) */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                            <Sparkles className="w-4 h-4" />
                            Nakshatra (Optional)
                        </label>
                        <input
                            type="text"
                            name="nakshatra"
                            value={formData.nakshatra}
                            onChange={handleInputChange}
                            placeholder="e.g., Ashwini, Bharani"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        />
                    </div>

                    {/* Payment Mode */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Payment Mode *
                        </label>
                        <div className="flex gap-4">
                            <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.payment_mode === 'CASH'
                                    ? 'border-green-500 bg-green-50 text-green-700'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}>
                                <input
                                    type="radio"
                                    name="payment_mode"
                                    value="CASH"
                                    checked={formData.payment_mode === 'CASH'}
                                    onChange={handleInputChange}
                                    className="hidden"
                                />
                                <Banknote className="w-5 h-5" />
                                <span className="font-medium">Cash</span>
                            </label>

                            <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.payment_mode === 'UPI'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}>
                                <input
                                    type="radio"
                                    name="payment_mode"
                                    value="UPI"
                                    checked={formData.payment_mode === 'UPI'}
                                    onChange={handleInputChange}
                                    className="hidden"
                                />
                                <CreditCard className="w-5 h-5" />
                                <span className="font-medium">UPI</span>
                            </label>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                🙏 Confirm Booking
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default BookingModal;
