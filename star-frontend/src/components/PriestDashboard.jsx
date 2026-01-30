/**
 * PriestDashboard Component
 * =========================
 * Dashboard for priests showing today's scheduled Shaswata pujas
 * with quick actions like WhatsApp messaging.
 */

import { useState, useEffect } from 'react';
import {
    Sun, Moon, Calendar, Phone, User,
    Loader2, RefreshCw, MessageCircle, Star,
    ArrowLeft, CheckCircle2
} from 'lucide-react';

// API base URL
const API_BASE = 'http://127.0.0.1:8000';

function PriestDashboard({ onBack }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch today's sankalpa data
    const fetchDailySankalpa = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/daily-sankalpa`);
            if (!response.ok) throw new Error('Failed to fetch');
            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDailySankalpa();
    }, []);

    // Generate WhatsApp link
    const getWhatsAppLink = (phone, name, panchangam, seva) => {
        const cleanPhone = phone.replace(/\D/g, '');
        const message = encodeURIComponent(
            `🙏 Namaste ${name},\n\n` +
            `Today is *${panchangam}* - your Shashwata Puja day!\n\n` +
            `Your seva "*${seva}*" will be performed today at Sri Subramanya Temple, Tarikere.\n\n` +
            `May Lord Subramanya bless you and your family.\n\n` +
            `🙏 Om Sharavana Bhava 🙏`
        );
        return `https://wa.me/91${cleanPhone}?text=${message}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto" />
                    <p className="mt-4 text-purple-700 font-medium">Loading Today's Sankalpa...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-6 max-w-md text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Connection Error</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={fetchDailySankalpa}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 text-white shadow-lg">
                <div className="max-w-6xl mx-auto px-4 py-5">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-purple-200 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back to Catalog</span>
                        </button>
                        <div className="text-center">
                            <h1 className="text-2xl font-bold">🙏 Priest Dashboard</h1>
                            <p className="text-purple-200 text-sm">Today's Sankalpa List</p>
                        </div>
                        <button
                            onClick={fetchDailySankalpa}
                            className="flex items-center gap-2 px-3 py-2 bg-purple-500/30 rounded-lg hover:bg-purple-500/50 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Top Card - Today's Panchangam */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
                        <div className="flex items-center gap-3 text-white">
                            <Sun className="w-8 h-8" />
                            <span className="text-xl font-bold">Today's Panchangam</span>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Gregorian Date */}
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Calendar className="w-7 h-7 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Gregorian Date</p>
                                    <p className="text-lg font-bold text-gray-800">{data?.date?.full_date}</p>
                                    <p className="text-sm text-gray-600">{data?.date?.weekday}</p>
                                </div>
                            </div>

                            {/* Panchangam */}
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <Moon className="w-7 h-7 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Hindu Date</p>
                                    <p className="text-lg font-bold text-purple-700">{data?.panchangam}</p>
                                    <p className="text-sm text-gray-600">
                                        <Star className="w-3 h-3 inline mr-1" />
                                        {data?.panchangam_details?.nakshatra}
                                    </p>
                                </div>
                            </div>

                            {/* Total Count */}
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                                    <CheckCircle2 className="w-7 h-7 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Today's Pujas</p>
                                    <p className="text-3xl font-bold text-green-700">{data?.total_count}</p>
                                    <p className="text-sm text-gray-600">
                                        {data?.lunar_count} Lunar, {data?.gregorian_count} Birthday
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pujas Table */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            📋 Today's Seva List
                        </h2>
                    </div>

                    {data?.pujas?.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-6xl mb-4">🕉️</div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Pujas Today</h3>
                            <p className="text-gray-500">It's a peaceful day! Om Shanti!</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            #
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Devotee
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Phone
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Gothra
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Seva
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data?.pujas?.map((puja, index) => (
                                        <tr key={puja.id} className="hover:bg-purple-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                                        <User className="w-5 h-5 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{puja.name}</p>
                                                        {puja.notes && (
                                                            <p className="text-xs text-gray-500">{puja.notes}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <Phone className="w-4 h-4 text-gray-400" />
                                                    {puja.phone}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-700">
                                                {puja.gothra || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-700">
                                                {puja.seva}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${puja.type === 'LUNAR'
                                                        ? 'bg-indigo-100 text-indigo-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {puja.type === 'LUNAR' ? (
                                                        <><Moon className="w-3 h-3" /> Tithi</>
                                                    ) : (
                                                        <><Calendar className="w-3 h-3" /> Birthday</>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <a
                                                    href={getWhatsAppLink(puja.phone, puja.name, data?.panchangam, puja.seva)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm hover:shadow-md"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                    WhatsApp
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-gray-500 text-sm">
                    <p>🙏 Sarve Jana Sukhino Bhavantu | May all beings be happy! 🙏</p>
                </div>
            </main>
        </div>
    );
}

export default PriestDashboard;
