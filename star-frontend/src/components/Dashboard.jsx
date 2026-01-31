import React, { useState, useEffect } from 'react';
import {
    Calendar, Moon, Sun, Search, Filter,
    CheckCircle, Circle, MessageCircle, AlertCircle, Clock, Scroll, ChevronDown, ChevronUp, Star, CloudMoon,
    Flame, Droplets, Flower, Utensils, Crown, Sparkles,
    ChevronLeft, ChevronRight, Loader2, IndianRupee, MapPin, PartyPopper
} from 'lucide-react';
import { TRANSLATIONS } from './translations';
import api from '../services/api';

const getSevaTheme = (sevaName) => {
    const name = (sevaName || '').toLowerCase();

    // Fire / Homa -> Saffron
    if (name.includes('archane') || name.includes('homa') || name.includes('mangalarathi'))
        return { color: 'border-l-temple-saffron', bg: 'bg-orange-50', text: 'text-temple-saffron-dark', icon: <Flame size={16} className="text-temple-saffron" /> };

    // Water / Abhisheka -> Sky/Cyan
    if (name.includes('abhisheka') || name.includes('theertha'))
        return { color: 'border-l-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700', icon: <Droplets size={16} className="text-cyan-500" /> };

    // Flower / Alankara -> Rose/Pink
    if (name.includes('alankara') || name.includes('pushpa'))
        return { color: 'border-l-rose-400', bg: 'bg-rose-50', text: 'text-rose-700', icon: <Flower size={16} className="text-rose-400" /> };

    // Food / Anna -> Gold
    if (name.includes('anna') || name.includes('prasada'))
        return { color: 'border-l-temple-gold', bg: 'bg-amber-50', text: 'text-amber-800', icon: <Utensils size={16} className="text-temple-gold" /> };

    // Shaswata -> Brown/Stone
    if (name.includes('shaswata') || name.includes('subscription'))
        return { color: 'border-l-temple-brown', bg: 'bg-stone-50', text: 'text-temple-brown', icon: <Calendar size={16} className="text-temple-brown" /> };

    // Royal -> Indigo/Crown
    if (name.includes('mahapooja') || name.includes('sarva'))
        return { color: 'border-l-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', icon: <Crown size={16} className="text-indigo-500" /> };

    // Default -> Saffron
    return { color: 'border-l-temple-saffron', bg: 'bg-orange-50', text: 'text-temple-saffron-dark', icon: <Sparkles size={16} className="text-temple-saffron" /> };
};

const Dashboard = ({ onBack, lang = 'EN' }) => {
    const t = TRANSLATIONS[lang];
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isSankalpaOpen, setIsSankalpaOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pujas, setPujas] = useState([]);
    const [panchangam, setPanchangam] = useState({});
    const [stats, setStats] = useState({
        total: 0,
        revenue: 0,
        active: 0,
        festivals: []
    });
    const [processedIds, setProcessedIds] = useState(new Set());

    useEffect(() => {
        fetchDailySankalpa();
    }, [selectedDate]);

    const fetchDailySankalpa = async () => {
        setLoading(true);
        try {
            let dObj = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);

            const day = String(dObj.getDate()).padStart(2, '0');
            const month = String(dObj.getMonth() + 1).padStart(2, '0');
            const year = dObj.getFullYear();
            const dateForApi = `${day}-${month}-${year}`;

            const response = await api.get(`/daily-sankalpa?date_str=${dateForApi}`);
            const data = response.data;

            setPujas(data.pujas || []);
            setPanchangam(data.panchangam || {});

            // Calculate Stats from backend data
            setStats({
                total: (data.pujas || []).length,
                revenue: data.revenue || 0,
                active: (data.pujas || []).filter(p => !processedIds.has(`${p.type}-${p.id}`)).length,
                festivals: data.festivals || []
            });

        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Update active count when processedIds change
    useEffect(() => {
        setStats(prev => ({
            ...prev,
            active: pujas.filter(p => !processedIds.has(`${p.type}-${p.id}`)).length
        }));
    }, [processedIds, pujas]);

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

    const formatCurrency = (amt) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amt);
    };

    const openWhatsApp = (phone, name, seva) => {
        const message = `Namaste ${name}, your ${seva} seva has been performed today at S.T.A.R. Temple.`;
        window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="min-h-screen p-4 md:p-8 animate-in fade-in duration-500 overflow-x-hidden">
            {/* 1. Header: Transparent Namaste Welcome */}
            <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 bg-white/50 backdrop-blur-md rounded-full hover:bg-temple-saffron hover:text-white transition-all shadow-sm border border-white/50"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black font-heading text-temple-brown drop-shadow-sm flex items-center gap-2">
                            <span className="text-temple-saffron">Namaste,</span> {lang === 'KN' ? 'ಸ್ವಾಗತ' : 'Welcome'}
                        </h1>
                        <p className="text-slate-600 font-medium opacity-80">{t.appSubtitle} Temple Registry</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white/70 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-temple-gold/20 flex items-center gap-3 pr-4">
                        <div className="p-2 bg-temple-saffron rounded-xl text-white shadow-md shadow-temple-saffron/20">
                            <Calendar size={20} />
                        </div>
                        <input
                            type="date"
                            value={selectedDate instanceof Date ? selectedDate.toISOString().split('T')[0] : selectedDate}
                            onChange={handleDateChange}
                            className="bg-transparent outline-none font-bold text-temple-brown cursor-pointer text-sm"
                        />
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto space-y-8">

                {/* 2. Stats Row: 4 Glassmorphic Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Bookings', value: stats.total, icon: <Scroll />, color: 'text-temple-saffron' },
                        { label: 'Revenue', value: formatCurrency(stats.revenue), icon: <IndianRupee />, color: 'text-temple-saffron' },
                        { label: 'Active Sevas', value: stats.active, icon: <Sparkles />, color: 'text-temple-saffron' },
                        { label: 'Upcoming Festivals', value: stats.festivals[0] || 'Daily Routine', icon: <PartyPopper />, color: 'text-temple-saffron' }
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-temple-gold/30 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex items-center justify-between group overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-temple-saffron/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500" />
                            <div>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className={`text-2xl font-black ${stat.label === 'Upcoming Festivals' ? 'text-lg text-temple-brown' : 'text-slate-800'}`}>{stat.value}</p>
                            </div>
                            <div className={`p-4 bg-temple-sand rounded-2xl ${stat.color} shadow-inner transition-transform group-hover:rotate-12`}>
                                {React.cloneElement(stat.icon, { size: 32 })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 3. Panchang Card (Highlight) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-5">
                        <div className="bg-gradient-to-br from-temple-saffron to-temple-saffron-dark rounded-3xl p-8 shadow-2xl shadow-temple-saffron/30 text-white relative overflow-hidden h-full flex flex-col justify-between transition-all duration-300 hover:-translate-y-1">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Moon size={160} className="rotate-12" />
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-tighter">
                                        {lang === 'KN' ? 'ದೈನಂದಿನ ಪಂಚಾಂಗ' : 'Daily Panchangam'}
                                    </div>
                                    {panchangam.is_adhika && (
                                        <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black">
                                            {t.extraMonth}
                                        </div>
                                    )}
                                </div>
                                <h2 className="text-4xl font-black mb-2 font-heading tracking-tight leading-none italic">
                                    {panchangam.maasa} {panchangam.paksha}
                                </h2>
                                <h3 className="text-xl font-bold opacity-90 mb-6">
                                    {panchangam.tithi} {t.tithi} • {panchangam.nakshatra}
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                                        <div className="flex items-center gap-2 text-white/60 text-[10px] font-black uppercase mb-1">
                                            <Sun size={12} /> {t.sunrise}
                                        </div>
                                        <p className="font-black text-lg">{panchangam.sunrise || "-"}</p>
                                    </div>
                                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                                        <div className="flex items-center gap-2 text-white/60 text-[10px] font-black uppercase mb-1">
                                            <AlertCircle size={12} /> {t.rahukala}
                                        </div>
                                        <p className="font-black text-lg">{panchangam.rahukala || "-"}</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsSankalpaOpen(!isSankalpaOpen)}
                                className="mt-8 flex items-center justify-center gap-2 py-4 bg-white text-temple-saffron font-black rounded-2xl shadow-lg hover:bg-temple-sand transition-all group"
                            >
                                <Scroll size={20} className="group-hover:rotate-12 transition-transform" />
                                {lang === 'KN' ? 'ಪುರೋಹಿತರ ಸಂಕಲ್ಪ' : 'Show Priest Sankalpa'}
                                {isSankalpaOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* 4. Recent Transactions Table */}
                    <div className="lg:col-span-7 flex flex-col">
                        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-sm border border-white/50 overflow-hidden flex-1 flex flex-col h-full transition-all duration-300 hover:shadow-xl">
                            <div className="p-6 bg-temple-sand flex justify-between items-center border-b border-temple-gold/10">
                                <h3 className="font-black text-temple-brown text-sm uppercase tracking-widest">{lang === 'KN' ? 'ಗೌರವಾನ್ವಿತ ಸೇವೆಗಳ ಪಟ್ಟಿ' : 'Recent Scheduled Sevas'}</h3>
                                <div className="px-3 py-1 bg-white rounded-full text-[10px] font-black text-temple-saffron border border-temple-saffron/20">
                                    {pujas.length} {t.transactions}
                                </div>
                            </div>

                            <div className="overflow-auto flex-1 h-[400px]">
                                {loading ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                                        <Loader2 size={40} className="animate-spin text-temple-saffron" />
                                        <p className="font-black text-xs uppercase tracking-widest opacity-40">Connecting to Sanctum...</p>
                                    </div>
                                ) : pujas.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 italic">
                                        <Flower size={48} className="mb-4 text-temple-sand" />
                                        <p>No sevas registered for this alignment.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-xs">
                                        <thead className="sticky top-0 bg-temple-sand text-temple-brown font-black uppercase tracking-tight z-10">
                                            <tr>
                                                <th className="px-6 py-4">State</th>
                                                <th className="px-6 py-4">Devotee</th>
                                                <th className="px-6 py-4">Seva Offering</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-temple-sand">
                                            {pujas.map((puja) => {
                                                const theme = getSevaTheme(puja.seva);
                                                const uniqueKey = `${puja.type}-${puja.id}`;
                                                const isDone = processedIds.has(uniqueKey);

                                                return (
                                                    <tr
                                                        key={uniqueKey}
                                                        className={`transition-all duration-300 hover:bg-temple-sand/30 group ${isDone ? 'opacity-50 grayscale' : ''}`}
                                                    >
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={() => toggleProcessed(uniqueKey)}
                                                                className={`p-2 rounded-xl transition-all ${isDone ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-300 hover:text-temple-saffron'}`}
                                                            >
                                                                {isDone ? <CheckCircle size={20} /> : <Circle size={20} />}
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="font-black text-temple-brown text-sm">{puja.name}</p>
                                                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                                                <MapPin size={8} /> {puja.gothra || 'Samanya'}
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black border ${theme.bg} ${theme.text} ${theme.color.replace('border-l-', 'border-')}`}>
                                                                {theme.icon}
                                                                {puja.seva}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => openWhatsApp(puja.phone, puja.name, puja.seva)}
                                                                className="p-2 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-all shadow-sm"
                                                            >
                                                                <MessageCircle size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Sankalpa Expanded Section */}
                {isSankalpaOpen && panchangam.maasa && (
                    <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl border border-temple-saffron/20 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-6 border-b border-temple-sand pb-4">
                            <div className="p-3 bg-temple-saffron rounded-full text-white">
                                <Scroll size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-temple-brown font-heading uppercase tracking-wide">{t.dailySankalpa}</h3>
                                <p className="text-xs font-bold text-slate-400">Sacred Invocation Helper for Priests</p>
                            </div>
                        </div>
                        <div className="bg-temple-sand/50 p-8 rounded-2xl font-serif text-lg leading-relaxed text-temple-brown border border-white relative">
                            <div className="absolute top-4 left-4 opacity-5 rotate-12">
                                <Flower size={120} />
                            </div>
                            <p className="relative z-10 italic">
                                "Shubhe Shobhane Muhurthe, Aದ್ಯ Brahmanah Dviteeya Parardhe, Shweta Varaha Kalpe, Vaivasvata Manvantare, Ashtavimshatitame Kaliyuge, Prathama Pade, Jambu Dvipe, Bharata Varshe, Bharata Khande, Meroh Dakshine Parshve... <br /><br />
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
