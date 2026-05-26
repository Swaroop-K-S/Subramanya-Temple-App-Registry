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
            const html2canvasModule = await import('html2canvas-pro');
            const html2canvas = html2canvasModule.default || html2canvasModule;
            const jsPDFModule = await import('jspdf');
            const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;

            // Wait for all web fonts to be fully loaded and parsed before rendering
            await document.fonts.ready;

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
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-start p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            {/* Action Buttons - sticky/accessible at top for mobile/narrow viewports */}
            <div className="w-full max-w-[210mm] mb-4 flex justify-end gap-3 print:hidden z-50">
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

            {/* Scroll wrapper to prevent clipping on narrow viewports */}
            <div className="w-full overflow-x-auto flex justify-center py-4 print:py-0">
                {/* A4 Certificate */}
                <div
                    ref={certificateRef}
                    className="relative bg-gradient-to-b from-[#FFFDF9] via-[#FAF6EE] to-[#FFFDF9] w-[210mm] h-[297mm] shadow-2xl overflow-hidden print:shadow-none certificate-container flex-shrink-0"
                >
                    {/* Background Watermark Mandala */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
                        <svg className="w-[120mm] h-[120mm] text-amber-600" viewBox="0 0 100 100" fill="currentColor">
                            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" fill="none" />
                            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.5" fill="none" />
                            <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="0.5" fill="none" />
                            <polygon points="50,5 63,30 90,37 68,56 75,83 50,70 25,83 32,56 10,37 37,30" fill="none" stroke="currentColor" strokeWidth="0.5" />
                            <polygon points="50,15 59,35 80,40 64,53 69,73 50,63 31,73 36,53 20,40 41,35" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        </svg>
                    </div>

                    {/* Decorative Border */}
                    <div className="absolute inset-4 border-4 border-double border-amber-300/50 pointer-events-none" />
                    <div className="absolute inset-6 border border-amber-200/30 pointer-events-none" />

                    {/* Corner Ornaments */}
                    <div className="absolute top-8 left-8 w-16 h-16 pointer-events-none text-amber-600/40">
                        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M 0,0 L 100,0 M 0,0 L 0,100" strokeWidth="4" />
                            <path d="M 15,15 C 45,15 45,45 15,45 Z" />
                            <path d="M 25,25 C 35,25 35,35 25,35 Z" fill="currentColor" />
                            <circle cx="50" cy="15" r="3" fill="currentColor" />
                            <circle cx="15" cy="50" r="3" fill="currentColor" />
                        </svg>
                    </div>
                    <div className="absolute top-8 right-8 w-16 h-16 pointer-events-none text-amber-600/40 transform rotate-90">
                        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M 0,0 L 100,0 M 0,0 L 0,100" strokeWidth="4" />
                            <path d="M 15,15 C 45,15 45,45 15,45 Z" />
                            <path d="M 25,25 C 35,25 35,35 25,35 Z" fill="currentColor" />
                            <circle cx="50" cy="15" r="3" fill="currentColor" />
                            <circle cx="15" cy="50" r="3" fill="currentColor" />
                        </svg>
                    </div>


                    {/* Content Container */}
                    <div className="relative p-8 flex flex-col justify-between h-full">

                        {/* Top Section Group */}
                        <div>
                            {/* Header Section */}
                            <div className="text-center mb-1">
                                {/* Temple Symbol */}
                                <div className="flex justify-center mb-1.5">
                                    <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center shadow-md border border-amber-200">
                                        <Sparkles className="w-6 h-6 text-amber-600" />
                                    </div>
                                </div>

                                {/* Temple Name */}
                                <h1 className="text-xl font-bold text-amber-800 leading-relaxed mb-0.5 certificate-kannada-heading">
                                    ಶ್ರೀ ಸುಬ್ರಹ್ಮಣ್ಯ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನ
                                </h1>
                                <h2 className="text-sm text-gray-600 uppercase tracking-[0.2em] font-semibold">
                                    Sri Subramanya Swamy Temple
                                </h2>
                                <p className="text-[11px] text-gray-400 mt-0.5 tracking-wider font-semibold font-sans">
                                    Tarikere - 577228, Karnataka
                                </p>

                                {/* Decorative Divider */}
                                <div className="flex items-center justify-center gap-2.5 my-2">
                                    <div className="h-px w-14 bg-gradient-to-r from-transparent via-amber-300 to-amber-300" />
                                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                    <div className="h-px w-14 bg-gradient-to-l from-transparent via-amber-300 to-amber-300" />
                                </div>
                            </div>

                            {/* Certificate Title */}
                            <div className="text-center mb-2">
                                <h2 className="text-2xl font-black text-gray-800 tracking-wide leading-none">
                                    SHASWATA SEVA
                                </h2>
                                <p className="text-lg text-amber-600 font-bold mt-1 leading-none certificate-kannada-heading">
                                    ಶಾಶ್ವತ ಸೇವಾ ಪ್ರಮಾಣಪತ್ರ
                                </p>
                                <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-widest font-sans">
                                    Certificate of Perpetual Seva Registration
                                </p>
                            </div>
                        </div>

                        {/* Middle Section Group (Cards) */}
                        <div className="space-y-3">
                            {/* Devotee Details Card */}
                            <div className="bg-gradient-to-br from-[#FFFDF9] via-[#FAF6EE] to-[#FFFDF9] rounded-2xl p-4 border border-amber-200/60 shadow-md relative overflow-hidden">
                                {/* Side saffron ribbon effect */}
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-500 to-amber-500" />
                                
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Devotee Name */}
                                    <div className="col-span-2">
                                        <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest mb-0.5 certificate-kannada-text">
                                            ಭಕ್ತರ ಹೆಸರು / Devotee Name
                                        </p>
                                        <p className="text-xl font-bold text-gray-800 border-b border-dashed border-amber-200 pb-0.5">
                                            {devoteeData.devotee_name || 'Devotee'}
                                        </p>
                                    </div>

                                    {/* Gothra */}
                                    <div>
                                        <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest mb-0.5 certificate-kannada-text">
                                            ಗೋತ್ರ / Gothra
                                        </p>
                                        <p className="text-sm font-semibold text-gray-700">
                                            {devoteeData.gothra || '-'}
                                        </p>
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest mb-0.5 certificate-kannada-text">
                                            ದೂರವಾಣಿ / Phone
                                        </p>
                                        <p className="text-sm font-semibold text-gray-700 font-mono">
                                            {devoteeData.phone || '-'}
                                        </p>
                                    </div>

                                    {/* Address */}
                                    <div className="col-span-2">
                                        <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest mb-0.5 certificate-kannada-text">
                                            ವಿಳಾಸ / Address
                                        </p>
                                        <p className="text-xs text-gray-700 certificate-address-text">
                                            {[devoteeData.address, devoteeData.area, devoteeData.pincode].filter(Boolean).join(', ') || '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Seva Details Card */}
                            <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-md relative overflow-hidden">
                                {/* Side gold ribbon effect */}
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 to-yellow-500" />
                                
                                <div className="grid grid-cols-2 gap-2.5">
                                    {/* Annual Seva Date */}
                                    <div className="col-span-2 text-center bg-amber-50/70 rounded-xl p-2 border border-amber-100">
                                        <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest mb-0.5 certificate-kannada-text">
                                            ವಾರ್ಷಿಕ ಪೂಜಾ ದಿನಾಂಕ / Annual Pooja Date
                                        </p>
                                        <p className="text-lg font-bold text-amber-700">
                                            <Calendar className="inline-block mr-1 mb-0.5" size={16} />
                                            {getDisplayDate()}
                                        </p>
                                        <p className="text-[9px] text-gray-500 font-sans">
                                            {sevaData.calendar === 'LUNAR' ? 'As per Hindu Panchanga' : 'Every Year'}
                                        </p>
                                    </div>

                                    {/* Occasion */}
                                    {devoteeData.occasion && (
                                        <div className="col-span-2 text-center">
                                            <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest mb-0.5 certificate-kannada-text">
                                                ಸಂದರ್ಭ / Occasion
                                            </p>
                                            <p className="text-base font-semibold text-gray-700">
                                                {devoteeData.occasion}
                                            </p>
                                        </div>
                                    )}

                                    {/* Amount Paid */}
                                    <div className="text-center">
                                        <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest mb-0.5 certificate-kannada-text">
                                            ಮೊತ್ತ / Amount
                                        </p>
                                        <p className="text-xl font-black text-emerald-600">
                                            ₹5,000
                                        </p>
                                    </div>

                                    {/* Payment Mode */}
                                    <div className="text-center">
                                        <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest mb-0.5 certificate-kannada-text">
                                            ಪಾವತಿ ವಿಧಾನ / Payment Mode
                                        </p>
                                        <p className="text-base font-bold text-gray-700">
                                            {sevaData.payment_mode || 'CASH'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* What You Receive Section */}
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-3.5 border border-amber-100/70 font-sans">
                                <h3 className="text-xs font-bold text-amber-900 mb-1.5 flex items-center gap-1.5 certificate-kannada-text">
                                    <Sparkles size={14} className="text-orange-500 fill-orange-100" />
                                    ನಿಮ್ಮ ಶಾಶ್ವತ ಸೇವೆಯಲ್ಲಿ ಏನು ಸೇರಿದೆ / What's Included
                                </h3>
                                <ul className="grid grid-cols-2 gap-1.5 text-amber-950 font-medium text-[11px]">
                                    <li className="flex items-center gap-1.5">
                                        <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
                                        Annual Abhisheka Pooja
                                    </li>
                                    <li className="flex items-center gap-1.5">
                                        <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
                                        Special Archana in your name
                                    </li>
                                    <li className="flex items-center gap-1.5">
                                        <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
                                        Prasadam dispatch to your home
                                    </li>
                                    <li className="flex items-center gap-1.5">
                                        <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
                                        Annual reminder notification
                                    </li>
                                    <li className="flex items-center gap-1.5">
                                        <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
                                        Priority darshan on special days
                                    </li>
                                    <li className="flex items-center gap-1.5">
                                        <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
                                        Your name in temple records
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Bottom Section Group */}
                        <div className="space-y-3">
                            {/* Personalized Blessing */}
                            <div className="text-center border-t border-amber-200/60 pt-2.5 pb-2.5">
                                <p className="text-sm font-serif italic text-amber-700 leading-relaxed">
                                    "{getPersonalizedMessage()}"
                                </p>
                            </div>

                            {/* Footer Signatures */}
                            <div className="flex justify-between items-end mb-2">
                                {/* Registration ID & Verification QR */}
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 p-0.5 bg-white border border-amber-200 rounded-lg flex items-center justify-center shadow-sm">
                                        <svg viewBox="0 0 100 100" className="w-full h-full text-amber-900">
                                            <rect x="0" y="0" width="25" height="25" fill="currentColor" />
                                            <rect x="5" y="5" width="15" height="15" fill="white" />
                                            <rect x="10" y="10" width="5" height="5" fill="currentColor" />
                                            
                                            <rect x="75" y="0" width="25" height="25" fill="currentColor" />
                                            <rect x="80" y="5" width="15" height="15" fill="white" />
                                            <rect x="85" y="10" width="5" height="5" fill="currentColor" />
                                            
                                            <rect x="0" y="75" width="25" height="25" fill="currentColor" />
                                            <rect x="5" y="80" width="15" height="15" fill="white" />
                                            <rect x="10" y="85" width="5" height="5" fill="currentColor" />
                                            
                                            <rect x="35" y="5" width="10" height="5" fill="currentColor" />
                                            <rect x="55" y="0" width="5" height="15" fill="currentColor" />
                                            <rect x="40" y="20" width="15" height="10" fill="currentColor" />
                                            
                                            <rect x="5" y="35" width="5" height="10" fill="currentColor" />
                                            <rect x="20" y="45" width="10" height="5" fill="currentColor" />
                                            
                                            <rect x="35" y="35" width="20" height="20" fill="currentColor" />
                                            <rect x="40" y="40" width="10" height="10" fill="white" />
                                            
                                            <rect x="65" y="35" width="15" height="5" fill="currentColor" />
                                            <rect x="75" y="45" width="20" height="15" fill="currentColor" />
                                            
                                            <rect x="35" y="65" width="15" height="10" fill="currentColor" />
                                            <rect x="55" y="70" width="15" height="20" fill="currentColor" />
                                            <rect x="75" y="75" width="10" height="5" fill="currentColor" />
                                            <rect x="80" y="85" width="15" height="10" fill="currentColor" />
                                        </svg>
                                    </div>
                                    <div className="font-sans">
                                        <p className="text-[8px] text-amber-600 font-bold uppercase tracking-widest">Registration ID</p>
                                        <p className="font-mono font-bold text-amber-800 text-xs leading-none">STAR-{receiptId || Math.floor(Math.random() * 9000) + 1000}</p>
                                        <p className="text-[9px] text-gray-500 font-semibold mt-0.5">{formatDateReport(new Date())}</p>
                                        <p className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Verified Registry
                                        </p>
                                    </div>
                                </div>

                                {/* Gold Foil Seal */}
                                <div className="text-center relative select-none">
                                    <div className="relative w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 flex items-center justify-center shadow-md border border-amber-600/50">
                                        <div className="absolute inset-1 rounded-full border border-amber-600/30 border-dashed" />
                                        <div className="absolute inset-2 rounded-full border border-amber-700/20" />
                                        
                                        <div className="text-center text-[6px] font-bold text-amber-900 tracking-tighter leading-none z-10 flex flex-col items-center justify-center">
                                            <Sparkles className="w-4.5 h-4.5 text-amber-950 mb-0.5 opacity-70" />
                                            <span className="uppercase text-[5px]">SUBRAMANYA TEMPLE</span>
                                            <span className="text-[5.5px] opacity-75">OFFICIAL SEAL</span>
                                        </div>
                                        
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none" />
                                    </div>
                                    <p className="text-[8px] text-amber-800 font-bold mt-1 font-sans">Authorized Signature</p>
                                </div>
                            </div>

                            {/* Sanskrit Shloka Banner */}
                            <div className="relative text-center py-2 px-5 bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5 border-y border-amber-300/40 rounded-xl shadow-inner overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-600 to-amber-500 opacity-70" />
                                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-600 to-amber-500 opacity-70" />
                                
                                <p className="text-base font-bold text-amber-900 font-serif tracking-wider leading-relaxed">
                                    || ॐ सुब्रह्मण्याय नमः ||
                                </p>
                                <p className="text-xs text-amber-700 font-semibold mt-0.5 certificate-kannada-text">
                                    || ಓಂ ಸುಬ್ರಹ್ಮಣ್ಯಾಯ ನಮಃ ||
                                </p>
                            </div>
                        </div>
                    </div>
                {/* End of Certificate */}
                </div>
            </div>
            {/* End of Scroll Wrapper */}
        </div>
    );
};

export default ShaswataCertificate;
