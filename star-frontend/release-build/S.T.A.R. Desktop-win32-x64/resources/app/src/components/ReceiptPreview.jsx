import React from 'react';
import { TRANSLATIONS } from './translations';
import { GOTRAS, NAKSHATRAS, RASHIS } from './constants';

export const ReceiptPreview = React.forwardRef(({ transaction, seva, lang = 'EN' }, ref) => {
    if (!transaction || !seva) return null;

    const t = TRANSLATIONS[lang];
    const isKn = lang === 'KN';

    // Helper for bilingual labels
    const label = (en, kn) => isKn ? kn : en;
    const value = (val) => val || '-';

    // Helper to map EN values to KN
    const mapToKn = (list, val) => {
        if (!val) return '';
        const item = list.find(i => i.en.toLowerCase() === val.toLowerCase());
        return item ? item.kn : val;
    };

    // Map Payment Mode
    const paymentMode = isKn
        ? (transaction.payment_mode === 'CASH' ? 'ನಗದು' : 'ಆನ್‌ಲೈನ್ / UPI')
        : transaction.payment_mode;

    // Helper for Date Format DD-MM-YYYY
    const formatDate = (dateStr) => {
        if (!dateStr) return new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };

    return (
        <div
            ref={ref}
            id="receipt-preview"
            className="bg-[#ffffff] text-[#000000] font-sans p-4 mx-auto shadow-none"
            style={{
                width: '380px', // Optimal for ~80mm thermal receipt
                minHeight: '400px',
                fontSize: '14px',
                lineHeight: '1.4'
            }}
        >
            {/* Header */}
            <div className="text-center space-y-1 mb-4">
                <h1 className="font-bold text-lg leading-tight">
                    ಬ್ರಾಹ್ಮಣ ಸೇವಾ ಸಮಿತಿ (ರಿ.)
                </h1>
                <p className="text-xs">
                    ದೇವರಪ್ಪ ಬೀದಿ, ತರೀಕೆರೆ - 577228
                </p>
                <p className="font-semibold text-sm">
                    ಶ್ರೀ ಸುಬ್ರಹ್ಮಣ್ಯೇಶ್ವರ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನ
                </p>
                <div className="border-b-2 border-dashed border-[#000000] my-2 opacity-50" />
            </div>

            {/* Receipt Details */}
            <div className="space-y-1 mb-2 text-sm">
                <div className="flex justify-between">
                    <span>{label("Receipt No:", "ರಶೀದಿ ಸಂಖ್ಯೆ:")}</span>
                    <span className="font-bold">{transaction.receipt_no}</span>
                </div>
                <div className="flex justify-between">
                    <span>{label("Booking Date:", "ಬುಕ್ಕಿಂಗ್ ದಿನಾಂಕ:")}</span>
                    <span>{formatDate(transaction.booking_date || transaction.date)}</span>
                </div>
            </div>

            <div className="border-b border-dashed border-[#000000] my-2 opacity-30" />

            {/* Seva Name */}
            <div className="text-center py-2">
                <h2 className="font-bold text-xl leading-tight">
                    {isKn ? (transaction.seva_name || seva.name_kan || seva.name_eng) : (seva.name_eng || transaction.seva_name)}
                </h2>
            </div>

            <div className="border-b border-dashed border-[#000000] my-2 opacity-30" />

            {/* Devotee Details */}
            <div className="space-y-2 mt-2">
                <div className="grid grid-cols-3">
                    <span className="col-span-1 text-[#4b5563]">{label("Devotee:", "ಭಕ್ತರು:")}</span>
                    <span className="col-span-2 font-bold text-right break-words">{transaction.devotee_name}</span>
                </div>
                {transaction.gothra && (
                    <div className="grid grid-cols-3">
                        <span className="col-span-1 text-[#4b5563]">{label("Gothra:", "ಗೋತ್ರ:")}</span>
                        <span className="col-span-2 text-right">
                            {isKn ? mapToKn(GOTRAS, transaction.gothra) : transaction.gothra}
                        </span>
                    </div>
                )}
                {transaction.nakshatra && (
                    <div className="grid grid-cols-3">
                        <span className="col-span-1 text-[#4b5563]">{label("Nakshatra:", "ನಕ್ಷತ್ರ:")}</span>
                        <span className="col-span-2 text-right">
                            {isKn ? mapToKn(NAKSHATRAS, transaction.nakshatra) : transaction.nakshatra}
                        </span>
                    </div>
                )}
                {transaction.rashi && (
                    <div className="grid grid-cols-3">
                        <span className="col-span-1 text-[#4b5563]">{label("Rashi:", "ರಾಶಿ:")}</span>
                        <span className="col-span-2 text-right">
                            {isKn ? mapToKn(RASHIS, transaction.rashi) : transaction.rashi}
                        </span>
                    </div>
                )}
            </div>

            <div className="border-b border-dashed border-[#000000] my-2 opacity-30" />

            {/* Seva Date */}
            <div className="flex justify-between items-center py-2 text-sm border-b border-dashed border-[#000000] mb-2 pb-2">
                <span className="font-bold">{label("Seva Date:", "ಸೇವಾ ದಿನಾಂಕ:")}</span>
                <span className="font-black text-lg">{formatDate(transaction.seva_date)}</span>
            </div>

            {/* Amount */}
            <div className="flex justify-between items-center py-2">
                <span className="font-bold text-base">{label("Amount Paid:", "ಪಾವತಿಸಿದ ಮೊತ್ತ:")}</span>
                <span className="font-black text-2xl">₹ {transaction.amount_paid}</span>
            </div>
            <div className="flex justify-between text-xs text-[#6b7280]">
                <span>{label("Mode:", "ವಿಧಾನ:")}</span>
                <span>{paymentMode}</span>
            </div>

            <div className="border-b-2 border-dashed border-[#000000] my-4 opacity-50" />

            {/* Footer */}
            <div className="text-center space-y-1 mb-8">
                <p className="font-bold text-sm">ಸರ್ವೇ ಜನಾಃ ಸುಖಿನೋ ಭವಂತು</p>
                <p className="text-xs">Thank You</p>
            </div>

            {/* Conditional Footer Note (Abhisheka/Mangalarathi) */}
            {(() => {
                // Prioritize English name for logic checks
                const typeName = (seva?.name_eng || transaction.seva_name || '').toLowerCase();
                const rawName = (transaction.seva_name || '').toLowerCase();

                let note = null;
                if (typeName.includes('abhisheka') || typeName.includes('panchamrutha') || rawName.includes('ಅಭಿಷೇಕ') || typeName.includes('rudra')) {
                    note = isKn ? "ಅಭಿಷೇಕ: ಬೆಳಿಗ್ಗೆ 9.00 | ಮಂಗಳಾರತಿ: 11.00 / 7.00" : "Abhisheka: 9.00 AM | Mangalarathi: 11.00 AM / 7.00 PM";
                } else if (typeName.includes('mangalarathi') || typeName.includes('mangalarati') || rawName.includes('ಮಂಗಳಾರತಿ')) {
                    note = isKn ? "ಮಂಗಳಾರತಿ: ಬೆಳಿಗ್ಗೆ 11.00 / ಸಂಜೆ 7.00" : "Mangalarathi: 11.00 AM / 7.00 PM";
                }

                if (note) {
                    return (
                        <div className="text-center text-xs font-semibold mb-2 mt-2 px-2 border-t border-dotted border-[#9ca3af] pt-1">
                            {note}
                        </div>
                    );
                }
            })()}

            {/* Copy Label Placeholder (Filled conceptually by printer count, or we can render 'Devotee Copy') */}
            <div className="text-center text-xs border border-black p-1 rounded">
                ** DEVOTEE COPY **
            </div>
        </div>
    );
});
