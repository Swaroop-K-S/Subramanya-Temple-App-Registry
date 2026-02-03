import React, { useState, useEffect } from 'react';
import { Sun, Moon, Languages, Bell, Search, Flower } from 'lucide-react';
import { useTempleTime } from '../context/TimeContext';

const Navbar = ({ lang, setLang }) => {
    const [isDark, setIsDark] = useState(false);
    const { formattedTime } = useTempleTime();

    // Theme Toggle Logic
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    return (
        <nav className="fixed top-0 left-0 right-0 z-40 h-24 px-8 flex items-center justify-between pointer-events-none md:pl-36 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-white/20 dark:border-slate-800 shadow-sm transition-all duration-500">

            {/* Left: Breadcrumb / Greeting */}
            <div className="pointer-events-auto mt-4">
                <div className="hidden md:flex flex-col animate-in slide-in-from-top-4 fade-in duration-700">
                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 mb-1">
                        Current Alignment
                    </span>
                    <span className="text-xl font-black text-slate-800 dark:text-amber-50 font-heading drop-shadow-sm">
                        {formattedTime}
                    </span>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="pointer-events-auto flex items-center gap-4 mt-4">

                {/* Search Pill (Expandable) */}
                <div className="hidden xl:flex items-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full border border-slate-200 dark:border-slate-700 px-4 py-2.5 shadow-sm w-64 hover:w-80 transition-all duration-300 group cursor-text focus-within:ring-2 focus-within:ring-amber-500/20">
                    <Search className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search Sevas, Devotees..."
                        className="bg-transparent border-none outline-none text-sm ml-2 w-full text-slate-700 dark:text-slate-200 placeholder-slate-400 font-medium"
                    />
                </div>

                {/* Notifications */}
                <button className="w-11 h-11 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-amber-500 hover:scale-105 transition-all shadow-sm relative group">
                    <Bell size={20} className="group-hover:animate-swing" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse" />
                </button>

                {/* Language Toggle */}
                <button
                    onClick={() => setLang(lang === 'EN' ? 'KN' : 'EN')}
                    className="h-11 px-5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-slate-600 hover:text-amber-600 hover:border-amber-200 transition-all font-bold text-xs shadow-sm"
                >
                    <Languages size={14} />
                    {lang === 'EN' ? 'English' : 'ಕನ್ನಡ'}
                </button>

                {/* Celestial Theme Switcher (Rolling Physics) */}
                <button
                    onClick={() => setIsDark(!isDark)}
                    className="relative w-20 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shadow-inner transition-colors duration-500 overflow-hidden group hover:shadow-md"
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
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 shadow-lg shadow-amber-500/20 cursor-pointer hover:scale-110 transition-transform duration-300">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        <Flower size={22} className="text-amber-600" />
                    </div>
                </div>

            </div>
        </nav>
    );
};

export default Navbar;
