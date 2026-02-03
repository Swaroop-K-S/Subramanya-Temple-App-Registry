import React from 'react';
import { Flower } from 'lucide-react';
import { NAKSHATRAS, RASHIS } from './constants';
import { formatDateReport } from '../utils/dateUtils';

const Receipt = ({ transaction, seva, lang }) => {
    // Safety Guard
    if (!transaction) return <div className="p-4 text-red-500">No receipt data available</div>;
    if (!seva) return null;

    // Safe Defaults using Optional Chaining
    const receipt_no = transaction?.receipt_no || '---';
    const amount_paid = transaction?.amount_paid || 0;
    const payment_mode = transaction?.payment_mode || '-';
    // Use optional chaining for date access
    const date = transaction?.date;

    // Bilingual Labels
    const labels = {
        receiptNo: { EN: "Receipt No", KN: "ರಸೀದಿ ಸಂಖ್ಯೆ" },
        date: { EN: "Date", KN: "ದಿನಾಂಕ" },
        devoteeName: { EN: "Devotee Name", KN: "ಭಕ್ತರ ಹೆಸರು" },
        sevaName: { EN: "Seva Name", KN: "ಸೇವೆಯ ಹೆಸರು" },
        amount: { EN: "Amount", KN: "ಮೊತ್ತ" },
        paymentMode: { EN: "Payment Mode", KN: "ಪಾವತಿ ವಿಧಾನ" },
        gothra: { EN: "Gothra", KN: "ಗೋತ್ರ" },
        nakshatra: { EN: "Nakshatra", KN: "ನಕ್ಷತ್ರ" },
        rashi: { EN: "Raashi", KN: "ರಾಶಿ" },
        phone: { EN: "Phone", KN: "ದೂರವಾಣಿ" },
    };

    const getLabel = (key) => `${labels[key].KN} / ${labels[key].EN}`;

    // Helper to translate stored English values to Kannada for display
    const getTranslatedValue = (value, list) => {
        if (!value) return '-';
        if (lang !== 'KN') return value; // Return English if not in KN mode
        const item = list.find(i => i.en === value);
        return item ? item.kn : value;
    };

    // Helper to get the correct bilingual name based on language
    const getBilingualName = () => {
        if (lang === 'KN') {
            return transaction?.devotee_name_kn || transaction?.devotee_name_en || transaction?.devotee_name || '-';
        }
        return transaction?.devotee_name_en || transaction?.devotee_name_kn || transaction?.devotee_name || '-';
    };

    // Helper to get the correct bilingual gothra based on language
    const getBilingualGothra = () => {
        if (lang === 'KN') {
            return transaction?.gothra_kn || transaction?.gothra_en || transaction?.gothra || '-';
        }
        return transaction?.gothra_en || transaction?.gothra_kn || transaction?.gothra || '-';
    };

    return (
        <div id="printable-receipt" className="bg-white p-8 max-w-2xl mx-auto border-2 border-orange-200 rounded-xl relative overflow-hidden">
            {/* Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <Flower size={400} />
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="text-center border-b-2 border-orange-100 pb-6 mb-6">
                    <div className="flex justify-center mb-2">
                        <Flower className="w-10 h-10 text-orange-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-orange-800 font-heading mb-1">
                        ಶ್ರೀ ಸುಬ್ರಹ್ಮಣ್ಯ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನ
                    </h1>
                    <h2 className="text-lg font-semibold text-gray-600 uppercase tracking-widest text-sm">
                        Sri Subramanya Swamy Temple
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Tarikere - 577228</p>
                </div>

                {/* Receipt Details Header */}
                <div className="flex justify-between items-center mb-8 bg-orange-50 p-3 rounded-lg border border-orange-100">
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">{getLabel('receiptNo')}</p>
                        <p className="font-mono font-bold text-lg text-gray-800">#{receipt_no}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 font-bold uppercase">{getLabel('date')}</p>
                        <p className="font-mono font-bold text-gray-800">
                            {formatDateReport(date || new Date())}
                        </p>
                    </div>
                </div>

                {/* Main Content Info Grid */}
                <div className="grid grid-cols-2 gap-y-6 gap-x-8 mb-8">

                    {/* Devotee Name */}
                    <div className="col-span-2">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{getLabel('devoteeName')}</p>
                        <p className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-1">
                            {getBilingualName()}
                        </p>
                    </div>

                    {/* Seva Name - Bilingual Highlight */}
                    <div className="col-span-2 bg-gradient-to-r from-orange-50 to-white p-4 rounded-lg border-l-4 border-orange-400">
                        <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mb-2">{getLabel('sevaName')}</p>
                        <div className="flex flex-col">
                            {seva.name_kan && (
                                <span className="text-2xl font-black text-gray-900 leading-none mb-1">
                                    {seva.name_kan}
                                </span>
                            )}
                            <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                {seva.name_eng}
                            </span>
                        </div>
                    </div>

                    {/* Optional Details with Translation Lookup */}
                    {(transaction?.gothra || transaction?.gothra_en || transaction?.nakshatra || transaction?.rashi) && (
                        <>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{getLabel('gothra')}</p>
                                <p className="font-semibold text-gray-800">{getBilingualGothra()}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{getLabel('nakshatra')}</p>
                                <p className="font-semibold text-gray-800">
                                    {getTranslatedValue(transaction?.nakshatra, NAKSHATRAS)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{getLabel('rashi')}</p>
                                <p className="font-semibold text-gray-800">
                                    {getTranslatedValue(transaction?.rashi, RASHIS)}
                                </p>
                            </div>
                        </>
                    )}

                    {/* Amount */}
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{getLabel('amount')}</p>
                        <p className="text-xl font-bold text-gray-900">₹ {amount_paid}</p>
                    </div>

                    {/* Payment Mode */}
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{getLabel('paymentMode')}</p>
                        <div className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs font-bold text-gray-600">
                            {payment_mode}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-dashed border-gray-300 text-center">
                    <p className="text-lg font-bold text-orange-800 font-serif italic mb-2">
                        || ಸರ್ವೇ ಜನಾ ಸುಖಿನೋ ಭವಂತು ||
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                        May all beings be happy
                    </p>
                </div>

                {/* Cut Line */}
                <div className="mt-8 flex items-center gap-4 opacity-30">
                    <div className="h-px bg-gray-900 flex-1"></div>
                    <span className="text-xs">✂</span>
                    <div className="h-px bg-gray-900 flex-1"></div>
                </div>

            </div>
        </div>
    );
};

export default Receipt;
