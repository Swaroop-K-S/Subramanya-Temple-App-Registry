import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Languages, Bell, Search, Flower, MapPin, ChevronRight, X } from 'lucide-react';
import { useTempleTime } from '../context/TimeContext';
import { TRANSLATIONS } from './translations';
import api from '../services/api';

const Navbar = ({ lang, setLang, user, navigate }) => {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.EN;
    const [isDark, setIsDark] = useState(false);
    const { formattedTime } = useTempleTime();

    // === NOTIFICATION STATE ===
    const [tomorrowPujas, setTomorrowPujas] = useState([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifLoading, setNotifLoading] = useState(false);
    const notifRef = useRef(null);

    // Theme Toggle Logic
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    // === FETCH TOMORROW'S PUJAS (Notification Data Source) ===
    useEffect(() => {
        const fetchTomorrowPujas = async () => {
            setNotifLoading(true);
            try {
                const response = await api.get('/shaswata/tomorrow');
                setTomorrowPujas(response.data?.pujas || []);
            } catch (error) {
                console.error("Failed to fetch tomorrow's pujas:", error);
            } finally {
                setNotifLoading(false);
            }
        };
        fetchTomorrowPujas();

        // Re-check every 5 minutes
        const interval = setInterval(fetchTomorrowPujas, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unconfirmedCount = tomorrowPujas.filter(p => !p.address_confirmed).length;
    const totalCount = tomorrowPujas.length;

    const handleNotifClick = () => {
        setNotifOpen(!notifOpen);
    };

    const handleGoToDispatch = () => {
        setNotifOpen(false);
        if (navigate) navigate('/dispatch');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-40 h-28 px-8 flex items-center justify-between pointer-events-none md:pl-40 bg-white/60 dark:bg-slate-950/80 backdrop-blur-3xl border-b border-white/20 dark:border-white/5 shadow-sm transition-all duration-500">

            {/* Left: Breadcrumb / Greeting */}
            <div className="pointer-events-auto mt-2">
                <div className="hidden md:flex flex-col animate-in slide-in-from-top-4 fade-in duration-700">
                    <span className="text-[11px] uppercase font-bold tracking-[0.2em] text-slate-400 mb-1 pl-1">
                        {t.currentAlignment}
                    </span>
                    <span className="text-2xl font-black text-slate-800 dark:text-temple-sand font-heading drop-shadow-sm tracking-tight">
                        {formattedTime}
                    </span>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="pointer-events-auto flex items-center gap-5 mt-2">

                {/* Search Pill (Expandable) */}
                <div className="hidden xl:flex items-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-full border border-white/30 dark:border-white/10 px-5 py-3 shadow-sm w-72 hover:w-96 transition-all duration-500 group cursor-text focus-within:ring-4 focus-within:ring-amber-500/10 active:scale-95">
                    <Search className="w-5 h-5 text-slate-400 group-hover:text-temple-saffron transition-colors" />
                    <input
                        type="text"
                        placeholder="Search Sevas, Devotees..."
                        className="bg-transparent border-none outline-none text-base ml-3 w-full text-slate-700 dark:text-slate-200 placeholder-slate-400 font-medium"
                    />
                </div>

                {/* === NOTIFICATIONS BELL (Address Confirmation) === */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={handleNotifClick}
                        className={`
                            w-12 h-12 rounded-full backdrop-blur-xl border flex items-center justify-center
                            transition-all shadow-sm hover:shadow-lg relative group
                            ${totalCount > 0
                                ? 'bg-amber-50/80 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-700/30 text-amber-600 dark:text-amber-400 hover:scale-110'
                                : 'bg-white/50 dark:bg-slate-800/50 border-white/30 dark:border-white/10 text-slate-500 hover:text-temple-saffron hover:scale-110'
                            }
                        `}
                    >
                        <Bell size={22} className={`${totalCount > 0 ? 'animate-swing' : 'group-hover:animate-swing'}`} />

                        {/* Badge */}
                        {unconfirmedCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] bg-gradient-to-r from-red-500 to-rose-600 text-white text-[11px] font-black rounded-full flex items-center justify-center px-1 shadow-lg shadow-red-500/40 animate-bounce">
                                {unconfirmedCount}
                            </span>
                        )}

                        {/* All confirmed green dot */}
                        {totalCount > 0 && unconfirmedCount === 0 && (
                            <span className="absolute top-3 right-3.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                        )}
                    </button>

                    {/* === NOTIFICATION DROPDOWN === */}
                    {notifOpen && (
                        <div className="absolute top-full mt-3 right-0 z-50 w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700/50 animate-in slide-in-from-top-2 fade-in duration-200 overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                                        Tomorrow's Poojas
                                    </h3>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        {totalCount === 0
                                            ? 'No poojas scheduled'
                                            : `${totalCount} pooja${totalCount > 1 ? 's' : ''} — ${unconfirmedCount} need${unconfirmedCount === 1 ? 's' : ''} address confirmation`
                                        }
                                    </p>
                                </div>
                                <button onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Puja List */}
                            <div className="max-h-80 overflow-y-auto">
                                {notifLoading ? (
                                    <div className="py-8 text-center">
                                        <div className="inline-block w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-xs text-slate-400 mt-2">Checking...</p>
                                    </div>
                                ) : totalCount === 0 ? (
                                    <div className="py-8 text-center">
                                        <Bell size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                        <p className="text-sm text-slate-400">All clear for tomorrow! 🙏</p>
                                    </div>
                                ) : (
                                    tomorrowPujas.map((puja, idx) => (
                                        <div
                                            key={puja.id || idx}
                                            className={`
                                                px-5 py-3.5 flex items-start gap-3 border-b last:border-0 border-slate-50 dark:border-slate-800/50
                                                hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors cursor-pointer
                                            `}
                                            onClick={handleGoToDispatch}
                                        >
                                            {/* Status Icon */}
                                            <div className={`
                                                mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                                                ${puja.address_confirmed
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                                    : puja.confirmation_sent
                                                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                                        : 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400'
                                                }
                                            `}>
                                                <MapPin size={16} />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                                    {puja.name}
                                                </p>
                                                <p className="text-xs text-slate-400 truncate mt-0.5">
                                                    {puja.seva} • {puja.date_info}
                                                </p>

                                                {/* Status Badge */}
                                                <span className={`
                                                    inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full
                                                    ${puja.address_confirmed
                                                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                                        : puja.confirmation_sent
                                                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                                            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                                    }
                                                `}>
                                                    {puja.address_confirmed ? '✅ Confirmed' : puja.confirmation_sent ? '🟡 Pending' : '⚪ Not Sent'}
                                                </span>
                                            </div>

                                            <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 mt-2 flex-shrink-0" />
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Footer CTA */}
                            {totalCount > 0 && (
                                <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={handleGoToDispatch}
                                        className="w-full py-2.5 bg-gradient-to-r from-temple-gold to-temple-saffron text-white rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <MapPin size={16} />
                                        Open Shaswata Pooja Dashboard
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Language Toggle */}
                <button
                    onClick={() => setLang(lang === 'EN' ? 'KN' : 'EN')}
                    className="h-12 px-6 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/30 dark:border-white/10 flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-temple-saffron hover:border-amber-200 transition-all font-bold text-sm shadow-sm hover:shadow-md active:scale-95"
                >
                    <Languages size={16} />
                    {lang === 'EN' ? 'English' : 'ಕನ್ನಡ'}
                </button>

                {/* Celestial Theme Switcher (Rolling Physics) */}
                <button
                    onClick={() => setIsDark(!isDark)}
                    className="relative w-20 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shadow-inner transition-colors duration-500 overflow-hidden group hover:shadow-md active:scale-95"
                    title="Toggle Cosmic Mode"
                >
                    {/* The Rolling Celestial Body */}
                    <div
                        className={`
                            absolute top-1 left-1 w-8 h-8 rounded-full shadow-lg transform transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1)
                            flex items-center justify-center border
                            ${isDark
                                ? 'translate-x-10 rotate-[360deg] bg-slate-800 border-slate-600'
                                : 'translate-x-0 rotate-0 bg-gradient-to-br from-amber-300 to-orange-400 border-amber-200'}
                        `}
                    >
                        {isDark ? (
                            <Moon size={14} className="text-slate-200" />
                        ) : (
                            <Sun size={16} className="text-white" />
                        )}
                    </div>

                    {/* Background Elements */}
                    <div className={`absolute inset-0 flex items-center justify-around px-2 pointer-events-none transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
                        <span className="w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-twinkle"></span>
                        <span className="w-1 h-1 bg-white rounded-full opacity-90 animate-twinkle delay-100"></span>
                        <span className="w-0.5 h-0.5 bg-white rounded-full opacity-50 animate-twinkle delay-200"></span>
                    </div>
                </button>

                {/* Profile Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-temple-gold to-temple-saffron p-0.5 shadow-lg shadow-amber-500/20 cursor-pointer hover:scale-110 transition-transform duration-300">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        <Flower size={24} className="text-temple-saffron" />
                    </div>
                </div>

            </div>
        </nav>
    );
};

export default Navbar;
