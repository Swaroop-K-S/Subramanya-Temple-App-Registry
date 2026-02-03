import React, { useState } from 'react';
import { Home, Calendar, BarChart3, IndianRupee, Settings, LogOut, Flower, Truck } from 'lucide-react';

const Sidebar = ({ activePage, setActivePage, handleLogout }) => {
    const [isHovered, setIsHovered] = useState(false);

    const menuItems = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'panchangam', icon: Calendar, label: 'Panchangam' },
        { id: 'reports', icon: IndianRupee, label: 'Reports' },
        { id: 'dispatch', icon: Truck, label: 'Dispatch' },
        { id: 'settings', icon: Settings, label: 'Settings' }
    ];

    return (
        <aside
            className={`
                fixed left-4 top-24 bottom-4 z-50 
                hidden md:flex flex-col justify-between 
                bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl 
                border border-white/20 dark:border-white/5 
                shadow-2xl rounded-[2rem] 
                transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
                ${isHovered ? 'w-64' : 'w-24'}
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Top Section: Logo & Menu */}
            <div className="flex flex-col py-8 gap-2">

                {/* Logo Mark - Animated */}
                <div className="flex items-center justify-center h-12 mb-8 overflow-hidden">
                    <div className="relative flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 z-10">
                        <Flower className="text-white w-7 h-7 animate-[spin_12s_linear_infinite]" />
                    </div>

                    {/* Text Reveal */}
                    <div className={`ml-4 flex flex-col justify-center transition-all duration-500 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 absolute left-16'}`}>
                        <span className="font-heading font-black text-xl text-slate-800 dark:text-white tracking-tight">VedaApp</span>
                        <span className="text-[10px] uppercase font-bold text-amber-600 tracking-widest">Registry</span>
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-4 space-y-3">
                    {menuItems.map((item) => {
                        const isActive = activePage === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActivePage(item.id)}
                                className={`
                                    relative flex items-center w-full p-3.5 rounded-2xl transition-all duration-300 group
                                    ${isActive
                                        ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 shadow-sm'
                                        : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600'}
                                `}
                            >
                                {/* Active Indicator: Vertical Glowing Gradient */}
                                {isActive && (
                                    <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-full bg-gradient-to-b from-amber-400 to-orange-600 shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
                                )}

                                <div className="relative z-10 flex items-center justify-center w-6 h-6">
                                    <item.icon
                                        size={24}
                                        className={`transition-all duration-300 ${isActive ? 'stroke-[2.5px] scale-110' : 'stroke-[2px]'}`}
                                    />
                                </div>

                                <span className={`
                                    ml-4 font-bold text-sm whitespace-nowrap overflow-hidden transition-all duration-500
                                    ${isHovered ? 'opacity-100 max-w-full translate-x-0' : 'opacity-0 max-w-0 -translate-x-4'}
                                `}>
                                    {item.label}
                                </span>

                                {/* Hover Tooltip (Only when collapsed) */}
                                {!isHovered && (
                                    <div className="absolute left-full ml-6 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl translate-x-2 group-hover:translate-x-0">
                                        {item.label}
                                        <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-slate-900 rotate-45 rounded-[1px]" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Section: Logout */}
            <div className="p-4 mb-4">
                <button
                    onClick={handleLogout}
                    className={`
                        flex items-center w-full p-3.5 rounded-2xl 
                        text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600
                        transition-all duration-300 group
                    `}
                >
                    <div className="relative z-10 flex items-center justify-center w-6 h-6">
                        <LogOut size={24} className="stroke-[2px] group-hover:stroke-[2.5px]" />
                    </div>
                    <span className={`
                        ml-4 font-bold text-sm whitespace-nowrap overflow-hidden transition-all duration-500 text-red-500
                         ${isHovered ? 'opacity-100 max-w-full translate-x-0' : 'opacity-0 max-w-0 -translate-x-4'}
                    `}>
                        Logout
                    </span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
