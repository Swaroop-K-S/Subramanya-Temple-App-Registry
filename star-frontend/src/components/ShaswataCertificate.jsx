/**
 * ShaswataCertificate Component - A4 Print Certificate
 * =====================================================
 * A beautiful, professional certificate for Shaswata Pooja registration
 * Features: Personalized message, seva details, A4 print layout, PDF download
 */

import React, { useState, useRef } from 'react';
import { Download, Loader2, Printer, Sparkles, Calendar, MapPin, Phone, Star } from 'lucide-react';
import { formatDateReport } from '../utils/dateUtils';

const ShaswataCertificate = ({
    devotee,
    sevaDetails,
    receiptId,
    lang = 'EN',
    onClose
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const certificateRef = useRef(null);

    // Safe defaults
    const devoteeData = devotee || {};
    const sevaData = sevaDetails || {};

    // Date formatting
    const getDisplayDate = () => {
        if (sevaData.calendar === 'LUNAR') {
            return `${sevaData.date?.masa || ''} ${sevaData.date?.paksha || ''} ${sevaData.date?.tithi || ''}`.trim() || 'As per Tithi';
        }
        const month = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return `${sevaData.date?.day || 1} ${month[(sevaData.date?.month || 1) - 1]}`;
    };

    // Personalized message based on occasion
    const getPersonalizedMessage = () => {
        const occasion = devoteeData.occasion?.toLowerCase() || '';
        if (occasion.includes('birthday')) {
            return `May Lord Subramanya bless ${devoteeData.devotee_name || 'you'} with divine grace and longevity on this auspicious birthday celebration.`;
        }
        if (occasion.includes('anniversary')) {
            return `May Lord Subramanya shower eternal blessings upon your family on this sacred anniversary.`;
        }
        if (occasion.includes('memorial') || occasion.includes('shraddha')) {
            return `May the departed soul attain moksha and eternal peace through the blessings of Lord Subramanya.`;
        }
        return `May Lord Subramanya's divine grace illuminate your path and bless your family with peace and prosperity.`;
    };

    // Generate PDF
    const handleDownloadPDF = async () => {
        setIsGenerating(true);
        try {
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            const element = certificateRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#FFFFFF'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`Shaswata_Certificate_${receiptId || 'STAR'}.pdf`);
        } catch (err) {
            console.error("PDF Generation Failed:", err);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Browser Print
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-3 print:hidden z-50">
                <button
                    onClick={handleDownloadPDF}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
                >
                    {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                    {isGenerating ? 'Generating...' : 'Download PDF'}
                </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 font-bold rounded-xl shadow-lg hover:bg-gray-50 transition-all border border-gray-200"
                >
                    <Printer size={18} />
                    Print
                </button>
                <button
                    onClick={onClose}
                    className="px-4 py-2.5 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-all"
                >
                    Close
                </button>
            </div>

            {/* A4 Certificate */}
            <div
                ref={certificateRef}
                className="bg-white w-[210mm] min-h-[297mm] mx-auto shadow-2xl overflow-hidden print:shadow-none"
                style={{ fontFamily: "'Noto Serif', 'Noto Sans Kannada', serif" }}
            >
                {/* Decorative Border */}
                <div className="absolute inset-4 border-4 border-double border-amber-300/50 pointer-events-none" />
                <div className="absolute inset-6 border border-amber-200/30 pointer-events-none" />

                {/* Content Container */}
                <div className="relative p-12 flex flex-col min-h-[297mm]">

                    {/* Header Section */}
                    <div className="text-center mb-8">
                        {/* Temple Symbol */}
                        <div className="flex justify-center mb-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center shadow-lg border-2 border-amber-200">
                                <Sparkles className="w-10 h-10 text-amber-600" />
                            </div>
                        </div>

                        {/* Temple Name */}
                        <h1 className="text-3xl font-bold text-amber-800 leading-relaxed mb-1">
                            ಶ್ರೀ ಸುಬ್ರಹ್ಮಣ್ಯ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನ
                        </h1>
                        <h2 className="text-xl text-gray-600 uppercase tracking-[0.3em] font-medium">
                            Sri Subramanya Swamy Temple
                        </h2>
                        <p className="text-sm text-gray-400 mt-2 tracking-wider">
                            Tarikere - 577228, Karnataka
                        </p>

                        {/* Decorative Divider */}
                        <div className="flex items-center justify-center gap-4 my-6">
                            <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-300 to-amber-300" />
                            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                            <div className="h-px w-24 bg-gradient-to-l from-transparent via-amber-300 to-amber-300" />
                        </div>
                    </div>

                    {/* Certificate Title */}
                    <div className="text-center mb-8">
                        <h2 className="text-4xl font-black text-gray-800 tracking-wide">
                            SHASWATA SEVA
                        </h2>
                        <p className="text-2xl text-amber-600 font-bold mt-2 leading-relaxed">
                            ಶಾಶ್ವತ ಸೇವಾ ಪ್ರಮಾಣಪತ್ರ
                        </p>
                        <p className="text-sm text-gray-500 mt-2 uppercase tracking-widest">
                            Certificate of Perpetual Seva Registration
                        </p>
                    </div>

                    {/* Main Content */}
                    <div className="flex-grow space-y-8">

                        {/* Devotee Details Card */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-100">
                            <div className="grid grid-cols-2 gap-6">
                                {/* Devotee Name */}
                                <div className="col-span-2">
                                    <p className="text-xs text-amber-600 font-bold uppercase tracking-widest mb-2">
                                        ಭಕ್ತರ ಹೆಸರು / Devotee Name
                                    </p>
                                    <p className="text-3xl font-bold text-gray-800 border-b-2 border-dashed border-amber-200 pb-2">
                                        {devoteeData.devotee_name || 'Devotee'}
                                    </p>
                                </div>

                                {/* Gothra */}
                                <div>
                                    <p className="text-xs text-amber-600 font-bold uppercase tracking-widest mb-2">
                                        ಗೋತ್ರ / Gothra
                                    </p>
                                    <p className="text-xl font-semibold text-gray-700">
                                        {devoteeData.gothra || '-'}
                                    </p>
                                </div>

                                {/* Phone */}
                                <div>
                                    <p className="text-xs text-amber-600 font-bold uppercase tracking-widest mb-2">
                                        ದೂರವಾಣಿ / Phone
                                    </p>
                                    <p className="text-xl font-semibold text-gray-700 font-mono">
                                        {devoteeData.phone || '-'}
                                    </p>
                                </div>

                                {/* Address */}
                                <div className="col-span-2">
                                    <p className="text-xs text-amber-600 font-bold uppercase tracking-widest mb-2">
                                        ವಿಳಾಸ / Address
                                    </p>
                                    <p className="text-lg text-gray-700">
                                        {[devoteeData.address, devoteeData.area, devoteeData.pincode].filter(Boolean).join(', ') || '-'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Seva Details Card */}
                        <div className="bg-white rounded-2xl p-8 border-2 border-amber-200 shadow-inner">
                            <div className="grid grid-cols-2 gap-6">
                                {/* Annual Seva Date */}
                                <div className="col-span-2 text-center bg-amber-50 rounded-xl p-4">
                                    <p className="text-xs text-amber-600 font-bold uppercase tracking-widest mb-2">
                                        ವಾರ್ಷಿಕ ಪೂಜಾ ದಿನಾಂಕ / Annual Pooja Date
                                    </p>
                                    <p className="text-2xl font-bold text-amber-700">
                                        <Calendar className="inline-block mr-2 mb-1" size={24} />
                                        {getDisplayDate()}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {sevaData.calendar === 'LUNAR' ? 'As per Hindu Panchanga' : 'Every Year'}
                                    </p>
                                </div>

                                {/* Occasion */}
                                {devoteeData.occasion && (
                                    <div className="col-span-2 text-center">
                                        <p className="text-xs text-amber-600 font-bold uppercase tracking-widest mb-2">
                                            ಸಂದರ್ಭ / Occasion
                                        </p>
                                        <p className="text-xl font-semibold text-gray-700">
                                            {devoteeData.occasion}
                                        </p>
                                    </div>
                                )}

                                {/* Amount Paid */}
                                <div className="text-center">
                                    <p className="text-xs text-amber-600 font-bold uppercase tracking-widest mb-2">
                                        ಮೊತ್ತ / Amount
                                    </p>
                                    <p className="text-3xl font-black text-emerald-600">
                                        ₹5,000
                                    </p>
                                </div>

                                {/* Payment Mode */}
                                <div className="text-center">
                                    <p className="text-xs text-amber-600 font-bold uppercase tracking-widest mb-2">
                                        ಪಾವತಿ ವಿಧಾನ / Payment Mode
                                    </p>
                                    <p className="text-xl font-bold text-gray-700">
                                        {sevaData.payment_mode || 'CASH'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* What You Receive Section */}
                        <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-6 border border-violet-100">
                            <h3 className="text-lg font-bold text-violet-800 mb-4 flex items-center gap-2">
                                <Sparkles size={20} className="text-violet-500" />
                                ನಿಮ್ಮ ಶಾಶ್ವತ ಸೇವೆಯಲ್ಲಿ ಏನು ಸೇರಿದೆ / What's Included
                            </h3>
                            <ul className="grid grid-cols-2 gap-3 text-gray-700">
                                <li className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                    Annual Abhisheka Pooja
                                </li>
                                <li className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                    Special Archana in your name
                                </li>
                                <li className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                    Prasadam dispatch to your home
                                </li>
                                <li className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                    Annual reminder notification
                                </li>
                                <li className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                    Priority darshan on special days
                                </li>
                                <li className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                    Your name in temple records
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Personalized Blessing */}
                    <div className="mt-8 text-center border-t-2 border-dashed border-amber-200 pt-8">
                        <p className="text-xl font-serif italic text-amber-700 leading-relaxed">
                            "{getPersonalizedMessage()}"
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 flex justify-between items-end">
                        {/* Registration ID */}
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Registration ID</p>
                            <p className="font-mono font-bold text-gray-600 text-lg">STAR-{receiptId || Math.floor(Math.random() * 9000) + 1000}</p>
                            <p className="text-xs text-gray-400">{formatDateReport(new Date())}</p>
                        </div>

                        {/* Temple Seal Placeholder */}
                        <div className="text-center">
                            <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mx-auto">
                                <span className="text-xs text-gray-400 text-center">Temple<br />Seal</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Authorized Signature</p>
                        </div>
                    </div>

                    {/* Sanskrit Shloka */}
                    <div className="mt-8 text-center bg-amber-50 rounded-xl p-4">
                        <p className="text-lg font-bold text-amber-800 font-serif leading-relaxed">
                            || ॐ सुब्रह्मण्याय नमः ||
                        </p>
                        <p className="text-sm text-amber-600 mt-1">
                            || ಓಂ ಸುಬ್ರಹ್ಮಣ್ಯಾಯ ನಮಃ ||
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShaswataCertificate;
