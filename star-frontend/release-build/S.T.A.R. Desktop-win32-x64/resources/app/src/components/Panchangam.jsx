
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sun, Moon, ShieldAlert, Sparkles, ScrollText, Copy, Check, Calendar, RefreshCw } from 'lucide-react';
import api from '../services/api';
import CelestialCycle from './CelestialCycle';
import { useTempleTime } from '../context/TimeContext';

const Panchangam = () => {
    const { currentDate, isNewDay } = useTempleTime(); // Get live time
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSankalpa, setShowSankalpa] = useState(false);
    const [copied, setCopied] = useState(false);

    // Initial Load: Always default to Today's date (System Date)
    const [selectedDate, setSelectedDate] = useState(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });

    // The Midnight Watcher: Auto-update selectedDate when day changes
    // The Midnight Watcher: Auto-update selectedDate when day changes
    useEffect(() => {
        if (isNewDay) {
            const liveYear = currentDate.getFullYear();
            const liveMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
            const liveDay = String(currentDate.getDate()).padStart(2, '0');
            const liveDateString = `${liveYear}-${liveMonth}-${liveDay}`;

            // Day has changed! Auto-update state to trigger fetchPanchangam
            setSelectedDate(liveDateString);
        }
    }, [isNewDay, currentDate]);

    // Fetch data whenever selectedDate changes (Manual or Auto)
    useEffect(() => {
        fetchPanchangam();
    }, [selectedDate]);

    const fetchPanchangam = async () => {
        try {
            setLoading(true);
            const [year, month, day] = selectedDate.split('-');
            const dateStr = `${day}-${month}-${year}`;

            const response = await api.get(`/daily-sankalpa?date_str=${dateStr}`);
            setData(response.data.panchangam);
        } catch (err) {
            console.error("Error fetching panchangam:", err);
            setError("Failed to load Divine Almanac");
        } finally {
            setLoading(false);
        }
    };

    const handleCopySankalpa = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRefresh = () => {
        fetchPanchangam();
    };

    const formatDateDisplay = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
                <div className="relative animate-[spin_3s_linear_infinite]">
                    <Sun className="w-16 h-16 text-temple-saffron opacity-80" />
                </div>
                <p className="mt-4 text-temple-brown dark:text-amber-100 font-heading font-bold animate-pulse">Loading Divine Almanac...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-8 text-center text-red-600 bg-red-50 rounded-2xl border border-red-100">
                <ShieldAlert className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{error || "Data unavailable"}</p>
                <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-white border border-red-200 rounded-lg hover:bg-red-50 text-sm font-bold">
                    Try Again
                </button>
            </div>
        );
    }



    const generateSankalpaString = () => {
        if (!data) return "";

        const samvatsara = data.attributes?.samvatsara || "";
        const ayana = data.attributes?.ayana || "";
        const ritu = data.attributes?.ritu || "";
        const vasara = data.attributes?.vasara_sanskrit || "";

        return `Mama upātta, samastha duritha kshyathwara sri parameshwara prithiartham, subhe shobane muhurthe – ādhyabrahmanaha – dwithiye pararthe – swetha varaha kalpe – vaivasvatha manvanthare – ashtā vimsathi thithame kaliyuge – prathame pade – jambudwepe – bharata varshe bharatha kande – merohe – dakshine parswe – sakabdhe – asmin varthamane vyavharike – prabhavadhi nāma sashtya samvathsaranām madye – ${samvatsara} Nāma Samvatsare – ${ayana} Ayane – ${ritu} Rithou – ${data.attributes?.maasa} Mase – ${data.attributes?.paksha} Pakshe – ${data.attributes?.tithi} Thithou – ${vasara} Vasara Yuktayam – ${data.attributes?.nakshatra} Nakshatra Yuktayam – Subha Yoga – Subha Karana Evam Guna Visheshana Vishishtayam – Subha Thithou...`;
    };

    const sankalpaText = generateSankalpaString();

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-700">

            {/* Top Toolbar: Tools */}
            <div className="flex justify-end items-center gap-4">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Calendar className="w-4 h-4 text-temple-stone/50" />
                    </div>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white/50 backdrop-blur-sm border border-white/60 dark:bg-slate-800/60 dark:border-slate-700/50 rounded-xl text-sm font-bold text-temple-brown dark:text-amber-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-temple-saffron/50 cursor-pointer hover:bg-white/80 dark:hover:bg-slate-800 transition-all"
                    />
                </div>
                <button
                    onClick={handleRefresh}
                    className="p-2 bg-white/50 backdrop-blur-sm border border-white/60 dark:bg-slate-800/60 dark:border-slate-700/50 rounded-xl text-temple-stone/50 dark:text-slate-400 hover:text-temple-saffron dark:hover:text-temple-saffron hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm hover:rotate-180 duration-500"
                    title="Refresh Data"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* 1. Hero Section: Celestial Cycle (Sun/Moon) */}
            <CelestialCycle
                sunrise={data.sun_cycle?.sunrise}
                sunset={data.sun_cycle?.sunset}
                dateDisplay={formatDateDisplay(selectedDate)}
            />

            {/* 2. The 5 Limbs (Pancha-Anga Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { label: 'Tithi', value: data.attributes?.tithi },
                    { label: 'Nakshatra', value: data.attributes?.nakshatra },
                    { label: 'Yoga', value: data.attributes?.yoga },
                    { label: 'Karana', value: data.attributes?.karana },
                    { label: 'Maasa', value: data.attributes?.maasa },
                    { label: 'Paksha', value: data.attributes?.paksha }
                ].map((item, index) => (
                    <div key={index} className="glass-card p-6 border border-white/60 dark:border-white/10 dark:bg-slate-900/60 hover:border-temple-saffron/30 transition-all duration-300 hover:shadow-lg group flex flex-col items-center text-center justify-center min-h-[120px]">
                        <p className="text-xs font-bold text-temple-brown/70 dark:text-amber-100/70 uppercase tracking-widest mb-2">{item.label}</p>
                        <p className="text-xl font-bold text-temple-saffron dark:text-orange-400 font-heading group-hover:scale-105 transition-transform">
                            {item.value || '-'}
                        </p>
                    </div>
                ))}
            </div>

            {/* 3. Inauspicious Times (Warning Zone) */}
            <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30 p-6 flex flex-col md:flex-row gap-6 items-center justify-center shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-red-500/5 dark:bg-red-500/10 z-0"></div>
                <div className="flex items-center gap-3 text-red-800/80 dark:text-red-300 z-10">
                    <ShieldAlert className="w-6 h-6 flex-shrink-0 animate-pulse-slow" />
                    <span className="font-bold text-sm uppercase tracking-wide">Inauspicious Times</span>
                </div>
                <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                    <div className="text-center">
                        <span className="block text-[10px] font-bold text-red-400 dark:text-red-400/80 uppercase tracking-wider mb-1">Rahukala</span>
                        <span className="font-heading font-bold text-xl text-red-700 dark:text-red-200">{data.inauspicious?.rahu}</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-[10px] font-bold text-red-400 dark:text-red-400/80 uppercase tracking-wider mb-1">Yamaganda</span>
                        <span className="font-heading font-bold text-xl text-red-700 dark:text-red-200">{data.inauspicious?.yama}</span>
                    </div>
                </div>
            </div>

            {/* 4. The Sankalpa Feature */}
            <div className="text-center pt-8 pb-12">
                {!showSankalpa ? (
                    <button
                        onClick={() => setShowSankalpa(true)}
                        className="inline-flex items-center gap-3 px-10 py-4 bg-temple-saffron text-white rounded-xl font-bold shadow-lg shadow-orange-500/50 hover:shadow-orange-500/70 hover:-translate-y-1 transition-all duration-300 group"
                    >
                        <ScrollText className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        <span>Generate Daily Sankalpa</span>
                    </button>
                ) : (
                    <div className="max-w-3xl mx-auto glass-card dark:bg-slate-900/80 p-10 border-t-4 border-temple-saffron animate-fade-in-up text-left relative shadow-2xl">
                        <button
                            onClick={() => handleCopySankalpa(sankalpaText)}
                            className="absolute top-4 right-4 p-2 text-temple-stone/40 dark:text-slate-500 hover:text-temple-saffron transition-colors rounded-lg hover:bg-orange-50 dark:hover:bg-slate-800"
                            title="Copy to clipboard"
                        >
                            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                        </button>

                        <div className="text-center mb-8">
                            <Sparkles className="w-8 h-8 text-temple-gold mx-auto mb-3 opacity-80" />
                            <h3 className="font-heading font-bold text-2xl text-temple-brown dark:text-amber-100">Daily Sankalpa Mantra</h3>
                            <div className="h-1 w-16 bg-temple-saffron/30 mx-auto mt-4 rounded-full" />
                        </div>

                        <div className="bg-temple-surface/50 dark:bg-slate-800/50 p-6 rounded-xl border border-temple-saffron/10 dark:border-slate-700 shadow-inner">
                            <p className="text-lg md:text-xl font-heading leading-relaxed text-center text-temple-ink/80 dark:text-slate-300 italic font-medium">
                                "{sankalpaText}"
                            </p>
                        </div>

                        <div className="mt-8 text-center">
                            <button
                                onClick={() => setShowSankalpa(false)}
                                className="text-xs font-bold text-temple-stone/40 dark:text-slate-500 hover:text-temple-saffron uppercase tracking-widest transition-colors hover:underline decoration-temple-saffron/30 underline-offset-4"
                            >
                                Close Sankalpa
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default Panchangam;
