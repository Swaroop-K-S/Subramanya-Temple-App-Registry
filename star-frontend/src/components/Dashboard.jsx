import React, { useState, useEffect } from 'react';
import {
    Calendar, Moon, Sun, Search, Filter,
    CheckCircle, Circle, MessageCircle, AlertCircle, Clock, Scroll, ChevronDown, ChevronUp, Star, CloudMoon,
    Flame, Droplets, Flower, Utensils, Crown, Sparkles,
    ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { TRANSLATIONS } from './translations';
import api from '../services/api';

const getSevaTheme = (sevaName) => {
    const name = (sevaName || '').toLowerCase();

    // Fire / Homa -> Orange
    if (name.includes('archane') || name.includes('homa') || name.includes('mangalarathi'))
        return { color: 'border-l-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', icon: <Flame size={16} className="text-orange-500" /> };

    // Water / Abhisheka -> Blue
    if (name.includes('abhisheka') || name.includes('theertha'))
        return { color: 'border-l-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', icon: <Droplets size={16} className="text-blue-500" /> };

    // Flower / Alankara -> Pink
    if (name.includes('alankara') || name.includes('pushpa'))
        return { color: 'border-l-pink-500', bg: 'bg-pink-50', text: 'text-pink-700', icon: <Flower size={16} className="text-pink-500" /> };

    // Food / Anna -> Amber
    if (name.includes('anna') || name.includes('prasada'))
        return { color: 'border-l-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', icon: <Utensils size={16} className="text-amber-500" /> };

    // Shaswata -> Violet
    if (name.includes('shaswata') || name.includes('subscription'))
        return { color: 'border-l-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', icon: <Calendar size={16} className="text-violet-500" /> };

    // Royal -> Indigo
    if (name.includes('mahapooja') || name.includes('sarva'))
        return { color: 'border-l-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', icon: <Crown size={16} className="text-indigo-500" /> };

    // Default -> Emerald
    return { color: 'border-l-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <Sparkles size={16} className="text-emerald-500" /> };
};

const Dashboard = ({ onBack, lang = 'EN' }) => {
    const t = TRANSLATIONS[lang];
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isSankalpaOpen, setIsSankalpaOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pujas, setPujas] = useState([]);
    const [monthlySevas, setMonthlySevas] = useState([]);
    const [panchangam, setPanchangam] = useState('');
    const [stats, setStats] = useState({ total: 0, lunar: 0, gregorian: 0 });
    const [processedIds, setProcessedIds] = useState(new Set()); // Local state for checked items

    useEffect(() => {
        fetchDailySankalpa();
    }, [selectedDate]);

    const fetchDailySankalpa = async () => {
        setLoading(true);
        try {
            // Handle both Date object and YYYY-MM-DD string
            let dObj = selectedDate;
            if (!(dObj instanceof Date)) {
                dObj = new Date(selectedDate);
            }

            // Convert to DD-MM-YYYY
            const day = String(dObj.getDate()).padStart(2, '0');
            const month = String(dObj.getMonth() + 1).padStart(2, '0');
            const year = dObj.getFullYear();
            const dateForApi = `${day}-${month}-${year}`;

            // Fetch with date_str query param
            const response = await api.get(`/daily-sankalpa?date_str=${dateForApi}`);
            const data = response.data;

            setPujas(data.pujas || []);
            // Assuming backend now returns nested panchang object: { masa, paksha, tithi, nakshatra, description }
            setPanchangam(data.panchangam || {});

            // Calculate Stats
            const total = (data.pujas || []).length;
            const lunar = (data.pujas || []).filter(p => p.type === 'LUNAR').length;
            const gregorian = (data.pujas || []).filter(p => p.type === 'GREGORIAN').length;

            setStats({ total, lunar, gregorian });

        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleProcessed = (id) => {
        setProcessedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    const openWhatsApp = (phone, name, seva) => {
        const message = `Namaste ${name}, your ${seva} seva has been performed today at S.T.A.R. Temple.`;
        window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="bg-slate-50 min-h-screen p-6 animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <button onClick={onBack} className="text-sm font-semibold text-gray-500 hover:text-orange-600 mb-2 flex items-center gap-1 transition-colors">
                        <ChevronLeft size={16} /> Back to Home
                    </button>
                    <h1 className="text-3xl font-bold font-heading text-slate-800">Operations Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage daily sevas and priest schedules</p>
                </div>

                {/* Date Picker */}
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
                    <Calendar size={20} className="text-orange-500 ml-2" />
                    <input
                        type="date"
                        value={selectedDate instanceof Date ? selectedDate.toISOString().split('T')[0] : selectedDate}
                        onChange={handleDateChange}
                        className="outline-none text-slate-700 font-medium bg-transparent cursor-pointer"
                    />
                </div>
            </div>

            {/* Daily Panchangam Card */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className={`rounded-2xl border p-6 shadow-sm relative overflow-hidden transition-colors duration-500
                    ${panchangam.is_adhika ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200' : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100'}
                `}>
                    {/* Decorative Background Elements */}
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 
                        ${panchangam.is_adhika ? 'bg-red-100/50' : 'bg-orange-100/50'}
                    `} />

                    {/* Main Header Section */}
                    <div className="flex flex-col md:flex-row items-center justify-between z-10 relative">
                        <div className="flex items-center gap-5 w-full md:w-auto">
                            <div className={`w-16 h-16 rounded-full bg-gradient-to-br shadow-lg flex items-center justify-center text-white shrink-0
                                ${panchangam.is_adhika ? 'from-red-400 to-orange-500 shadow-red-200' : 'from-orange-400 to-amber-500 shadow-orange-200'}
                            `}>
                                <Moon size={32} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <p className={`text-xs font-bold uppercase tracking-wider ${panchangam.is_adhika ? 'text-red-600' : 'text-orange-600'}`}>
                                        Daily Panchangam
                                    </p>
                                    {panchangam.is_adhika && (
                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded-full border border-red-200">
                                            {t.extraMonth}
                                        </span>
                                    )}
                                </div>

                                <h2 className="text-2xl font-bold text-slate-800 leading-tight">
                                    {panchangam.is_adhika && <span className="text-red-600">{t.adhika} </span>}
                                    {panchangam.maasa} {panchangam.paksha} {panchangam.tithi}
                                </h2>
                                <div className="flex items-center gap-2 text-slate-600 text-sm mt-1 font-medium">
                                    <span className="flex items-center gap-1">
                                        <Sun size={14} className={panchangam.is_adhika ? "text-red-500" : "text-amber-500"} />
                                        {panchangam.maasa} {t.masa}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span className="flex items-center gap-1">
                                        <Sparkles size={14} className="text-violet-500" />
                                        {panchangam.nakshatra} {t.nakshatra}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-8 text-right">
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">{t.paksha}</p>
                                <p className="text-lg font-bold text-slate-700">{panchangam.paksha || "-"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">{t.tithi}</p>
                                <p className="text-lg font-bold text-slate-700">{panchangam.tithi || "-"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className={`my-5 border-t ${panchangam.is_adhika ? 'border-red-200/60' : 'border-orange-200/50'}`} />

                    {/* Detailed Grid Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 z-10 relative">
                        {/* Sun Schedule */}
                        <div className="flex flex-col justify-center gap-3 bg-white/40 p-4 rounded-xl border border-white/50 shadow-sm backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <Sun className="text-orange-500 shrink-0" size={20} />
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t.sunrise}</p>
                                    <p className="font-semibold text-slate-700">{panchangam.sunrise || "-"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Moon className="text-indigo-400 shrink-0" size={20} />
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t.sunset}</p>
                                    <p className="font-semibold text-slate-700">{panchangam.sunset || "-"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Inauspicious Times */}
                        <div className="flex flex-col justify-center gap-3 bg-white/40 p-4 rounded-xl border border-white/50 shadow-sm backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <Circle className="text-slate-800 shrink-0" size={20} />
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t.rahukala}</p>
                                    <p className="font-semibold text-slate-700">{panchangam.rahukala || "-"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <AlertCircle className="text-red-500 shrink-0" size={20} />
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t.yamaganda}</p>
                                    <p className="font-semibold text-slate-700">{panchangam.yamaganda || "-"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Vedic Limbs & Moonrise */}
                        <div className="flex flex-col justify-center gap-2 bg-white/40 p-4 rounded-xl border border-white/50 shadow-sm backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <Star className="text-purple-500 shrink-0" size={16} />
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 w-12">{t.yoga}</p>
                                    <p className="font-semibold text-slate-700 text-sm truncate">{panchangam.yoga || "-"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Sparkles className="text-pink-500 shrink-0" size={16} />
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 w-12">{t.karana}</p>
                                    <p className="font-semibold text-slate-700 text-sm truncate">{panchangam.karana || "-"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <CloudMoon className="text-indigo-500 shrink-0" size={16} />
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 w-12">{t.moonrise}</p>
                                    <p className="font-semibold text-slate-700 text-sm">{panchangam.moonrise || "-"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sankalpa Helper Section */}
                    <div className="mt-5 z-20 relative border-t border-orange-200/30 pt-4">
                        <button
                            onClick={() => setIsSankalpaOpen(!isSankalpaOpen)}
                            className="flex items-center gap-2 text-xs font-bold text-orange-700 bg-orange-100 hover:bg-orange-200 px-4 py-2 rounded-lg transition-colors w-full md:w-auto justify-center"
                        >
                            <Scroll size={16} />
                            {t.showSankalpa}
                            {isSankalpaOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {isSankalpaOpen && panchangam.maasa && (
                            <div className="mt-3 bg-orange-50/90 p-5 rounded-xl border border-orange-200 text-orange-900 font-serif text-sm leading-relaxed shadow-inner animate-in fade-in slide-in-from-top-2">
                                <p className="font-bold mb-2 uppercase text-[10px] tracking-widest text-orange-400 border-b border-orange-200 pb-1">{t.dailySankalpa}</p>
                                <p>
                                    "Shubhe Shobhane Muhurthe, Aद्य Brahmanah Dviteeya Parardhe, Shweta Varaha Kalpe, Vaivasvata Manvantare, Ashtavimshatitame Kaliyuge, Prathama Pade, Jambu Dvipe, Bharata Varshe, Bharata Khande, Meroh Dakshine Parshve... <br /><br />
                                    <strong>{selectedDate.getFullYear()}</strong> Namaka Samvatsare,
                                    <strong> {selectedDate.getMonth() < 6 ? 'Uttarayane' : 'Dakshinayane'}</strong>,
                                    <strong> {panchangam.maasa}</strong> Mase,
                                    <strong> {panchangam.paksha}</strong> Pakshe,
                                    <strong> {panchangam.tithi}</strong> Tithau,
                                    <strong> {['Bhanu', 'Indu', 'Bhauma', 'Saumya', 'Guru', 'Bhrigu', 'Sthira'][selectedDate.getDay()]}</strong> Vasara Yuktayam,
                                    <strong> {panchangam.nakshatra}</strong> Nakshatra Yuktayam, <br />
                                    <strong> {panchangam.yoga}</strong> Yoga,
                                    <strong> {panchangam.karana}</strong> Karana, <br />
                                    Evam Guna Visheshana Vishishtayam, Asyam Shubha Tithau, Asmakam Saha Kutumbanam..."
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                {/* Total Sevas Card */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-orange-100 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Sevas</p>
                        <p className="text-4xl font-bold text-slate-800 mt-1">{stats.total}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                        <Sparkles className="text-orange-500" size={24} />
                    </div>
                </div>

                {/* Lunar Events Card */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-violet-100 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Lunar Events</p>
                        <p className="text-4xl font-bold text-violet-700 mt-1">{stats.lunar}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center">
                        <Moon className="text-violet-500" size={24} />
                    </div>
                </div>

                {/* Fixed Dates Card */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Fixed Dates</p>
                        <p className="text-4xl font-bold text-blue-700 mt-1">{stats.gregorian}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                        <Calendar className="text-blue-500" size={24} />
                    </div>
                </div>
            </div>

            {/* Main List */}
            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 text-lg">Scheduled Sevas</h3>
                    <div className="text-xs text-slate-400 font-medium bg-white px-3 py-1 rounded-full border border-gray-100">
                        {pujas.length} records • {selectedDate instanceof Date ? selectedDate.toLocaleDateString() : selectedDate}
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                        <Loader2 size={32} className="animate-spin mb-3 text-orange-500" />
                        <p>Loading schedule...</p>
                    </div>
                ) : pujas.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                        <div className="inline-block p-4 rounded-full bg-slate-50 mb-3">
                            <Calendar size={32} />
                        </div>
                        <p>No sevas scheduled for this date.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold w-16 text-center">Done?</th>
                                    <th className="px-6 py-4 font-semibold w-16 text-center">Type</th>
                                    <th className="px-6 py-4 font-semibold">Devotee Name</th>
                                    <th className="px-6 py-4 font-semibold">Seva</th>
                                    <th className="px-6 py-4 font-semibold">Gothra</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pujas.map((puja) => {
                                    const theme = getSevaTheme(puja.seva);
                                    const uniqueKey = `${puja.type}-${puja.id}`;
                                    const isDone = processedIds.has(uniqueKey);

                                    return (
                                        <tr
                                            key={uniqueKey}
                                            className={`hover:bg-slate-50 transition-all duration-200 border-l-[6px] ${theme.color} ${isDone ? 'bg-gray-50/50' : ''}`}
                                        >
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => toggleProcessed(uniqueKey)}
                                                    className={`transition-all duration-200 transform active:scale-90 ${isDone ? 'text-green-500' : 'text-gray-200 hover:text-green-400'}`}
                                                >
                                                    {isDone ? <CheckCircle size={24} className="fill-green-50" /> : <Circle size={24} />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500" title={puja.type}>
                                                    {puja.type === 'LUNAR' ? <Moon size={16} className="text-violet-400" /> : <Calendar size={16} className="text-blue-400" />}
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 font-medium transition-all duration-300 ${isDone ? 'text-gray-400 line-through decoration-gray-300' : 'text-slate-800'}`}>
                                                {puja.name}
                                                <div className={`text-xs font-normal mt-0.5 ${isDone ? 'text-gray-300 no-underline' : 'text-gray-400'}`}>
                                                    {puja.phone}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${theme.bg} ${theme.text} ${theme.color.replace('border-l-', 'border-')}`}>
                                                    {theme.icon}
                                                    {puja.seva}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 text-slate-600 ${isDone ? 'opacity-40' : ''}`}>
                                                {puja.gothra || <span className="text-gray-300 italic">None</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => openWhatsApp(puja.phone, puja.name, puja.seva)}
                                                    className="text-green-500 hover:text-white hover:bg-green-500 p-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-green-200"
                                                    title="Send WhatsApp Update"
                                                >
                                                    <MessageCircle size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
