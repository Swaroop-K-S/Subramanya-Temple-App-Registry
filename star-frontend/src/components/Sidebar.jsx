import React, { useState } from 'react';
import { Home, Calendar, BarChart3, IndianRupee, Settings, LogOut, Flower, Truck, ScrollText } from 'lucide-react';

const Sidebar = ({ activePage, setActivePage, handleLogout, user }) => {
    const [isHovered, setIsHovered] = useState(false);

    const menuItems = [
        { id: 'home', icon: Home, label: 'Home', allowed: ['admin', 'clerk'] },
        { id: 'panchangam', icon: Calendar, label: 'Panchangam', allowed: ['admin', 'clerk'] },
        { id: 'daily', icon: ScrollText, label: 'Daily Txns', allowed: ['admin'] },
        { id: 'reports', icon: IndianRupee, label: 'Reports', allowed: ['admin'] },
        { id: 'dispatch', icon: Truck, label: 'Shaswata Pooja', allowed: ['admin', 'clerk'] }, // Assuming clerks can book
        { id: 'settings', icon: Settings, label: 'Settings', allowed: ['admin'] }
    ];

    // Filter items based on user role
    const filteredItems = menuItems.filter(item => {
        if (!user) return false;
        return item.allowed.includes(user.role);
    });

    return (
        <aside className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-6 items-center">

            {/* The Floating Dock */}
            <div
                className={`
                    flex flex-col items-center gap-4 py-6 px-3
                    bg-white/40 dark:bg-slate-900/40 
                    backdrop-blur-2xl 
                    border border-white/30 dark:border-white/10
                    shadow-[0_8px_32px_rgba(0,0,0,0.12)]
                    rounded-[3rem] 
                    transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
                    ${isHovered ? 'scale-105' : 'scale-100'}
                `}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Logo */}
                <div className="w-12 h-12 mb-2 bg-gradient-to-br from-temple-gold to-temple-saffron rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 animate-spin-slow">
                    <Flower className="text-white w-6 h-6" />
                </div>

                {/* Navigation Items - Magnification Physics */}
                <nav className="flex flex-col gap-3">
                    {filteredItems.map((item) => {
                        const isActive = activePage === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActivePage(item.id)}
                                className={`
                                    relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 group
                                    ${isActive
                                        ? 'bg-white dark:bg-white/10 text-temple-saffron shadow-lg scale-110'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-temple-gold'}
                                `}
                            >
                                <item.icon
                                    size={24}
                                    className={`
                                        transition-all duration-300 transform origin-center
                                        group-hover:scale-125 group-hover:-translate-y-1
                                        ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}
                                    `}
                                />

                                {/* Tooltip */}
                                <div className="absolute left-14 px-3 py-1 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap -translate-x-2 group-hover:translate-x-0 shadow-xl">
                                    {item.label}
                                </div>

                                {/* Active Dot */}
                                {isActive && (
                                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-temple-saffron rounded-full opacity-0" />
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Divider */}
                <div className="w-8 h-[1px] bg-slate-300 dark:bg-slate-700 my-1" />

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-12 h-12 rounded-full flex items-center justify-center text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 transition-all duration-300 group"
                >
                    <LogOut size={24} className="group-hover:scale-125 transition-transform duration-300" />
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
