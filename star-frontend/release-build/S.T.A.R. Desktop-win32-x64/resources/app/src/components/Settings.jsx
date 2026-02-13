import React, { useState, useEffect } from 'react';
import {
    ChevronDown, ChevronUp, User, Shield, CreditCard,
    Save, Plus, Trash2, Key, Database, Globe, Bell, Server
} from 'lucide-react';
import api from '../services/api';
import { OmniToggle, OmniInput } from './ui/Widgets';

const Settings = ({ onBack }) => {
    // Accordion State
    const [openSection, setOpenSection] = useState('profile');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Mock Preferences (In real app, fetch from backend/localstorage)
    const [preferences, setPreferences] = useState({
        notifications: true,
        autoBackup: true,
        soundEffects: false,
        compactMode: false
    });

    const toggleSection = (section) => {
        setOpenSection(openSection === section ? null : section);
    };

    const AccordionItem = ({ id, title, icon: Icon, children }) => {
        const isOpen = openSection === id;
        return (
            <div className={`mb-4 rounded-[1.5rem] border transition-all duration-500 ease-spring ${isOpen ? 'bg-white dark:bg-slate-800 border-amber-200 dark:border-slate-600 shadow-xl scale-[1.01]' : 'bg-white/40 dark:bg-slate-800/40 border-transparent hover:bg-white hover:shadow-md'}`}>
                <button
                    onClick={() => toggleSection(id)}
                    className="flex items-center justify-between w-full p-6 text-left"
                >
                    <div className="flex items-center gap-4">
                        <div className={`
                            p-3.5 rounded-2xl transition-all duration-300 shadow-sm
                            ${isOpen
                                ? 'bg-amber-100 text-amber-600 rotate-0'
                                : 'bg-slate-100 text-slate-500 hover:bg-amber-50 hover:text-amber-500 -rotate-6'}
                        `}>
                            <Icon size={24} />
                        </div>
                        <div>
                            <h3 className={`text-lg font-black font-heading tracking-tight ${isOpen ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                {title}
                            </h3>
                            {isOpen && <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mt-1">Configuring</p>}
                        </div>
                    </div>

                    <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300
                        ${isOpen ? 'bg-amber-100 text-amber-600 rotate-180' : 'bg-slate-100 text-slate-400'}
                    `}>
                        <ChevronDown size={18} />
                    </div>
                </button>

                {isOpen && (
                    <div className="px-6 pb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700/50">
                            {children}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Fetch Users Mock
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Mocking for UI Demo
                setUsers([
                    { id: 1, username: 'admin', role: 'ADMIN' },
                    { id: 2, username: 'arc_priest', role: 'CLERK' }
                ]);
            } catch (e) {
                console.error(e);
            }
        };
        fetchUsers();
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 pb-32 animate-in fade-in duration-700">
            <header className="mb-10">
                <h1 className="text-4xl md:text-5xl font-black font-heading text-slate-800 dark:text-white mb-2 tracking-tight">System Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Manage Temple Architecture & Protocols</p>
            </header>

            {/* 1. Account & Profile */}
            <AccordionItem id="profile" title="Temple Profile" icon={User}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <OmniInput label="Temple Name" defaultValue="Sri Subramanya Swamy Temple" />
                    <OmniInput label="Admin Contact" defaultValue="+91 99000 00000" icon={CreditCard} />
                    <div className="col-span-full">
                        <OmniInput label="Address" defaultValue="Kukke Subramanya, Karnataka" />
                    </div>
                    <div className="col-span-full flex justify-end">
                        <button className="px-8 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl font-bold hover:scale-105 transition-transform flex items-center gap-3 shadow-xl shadow-slate-900/20">
                            <Save size={20} /> Save Configuration
                        </button>
                    </div>
                </div>
            </AccordionItem>

            {/* 2. User Management */}
            <AccordionItem id="users" title="Staff Access Protocols" icon={Shield}>
                <div className="space-y-4">
                    {users.map(user => (
                        <div key={user.id} className="group flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-amber-200 transition-colors">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                                    {user.username[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-heading font-black text-lg text-slate-800 dark:text-slate-200">{user.username}</p>
                                    <span className="inline-block px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">{user.role}</span>
                                </div>
                            </div>
                            <button className="p-3 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                    <button className="w-full py-4 border-2 border-dashed border-slate-300 rounded-3xl text-slate-400 font-bold hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-all flex items-center justify-center gap-2 group">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                            <Plus size={18} />
                        </div>
                        Add Authorized Personnel
                    </button>
                </div>
            </AccordionItem>

            {/* 3. System Preferences (Toggles) */}
            <AccordionItem id="system" title="System Preferences" icon={Database}>
                <div className="space-y-8">

                    {/* Bilingual Mode */}
                    <div className="flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-5">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                                <Globe size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-lg">Bilingual Mode</h4>
                                <p className="text-sm text-slate-500 font-medium">Automatic English-Kannada transliteration</p>
                            </div>
                        </div>
                        <OmniToggle checked={true} onChange={() => { }} readOnly />
                    </div>

                    {/* Auto Backup */}
                    <div className="flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-5">
                            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                                <Server size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-lg">Auto-Backup Protocol (Lvl 9)</h4>
                                <p className="text-sm text-slate-500 font-medium">Sync to GitHub Cloud every 30 mins</p>
                            </div>
                        </div>
                        <OmniToggle checked={preferences.autoBackup} onChange={v => setPreferences({ ...preferences, autoBackup: v })} />
                    </div>

                    {/* Notifications */}
                    <div className="flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-5">
                            <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                                <Bell size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-lg">Devotee Prescience</h4>
                                <p className="text-sm text-slate-500 font-medium">Send WhatsApp updates via Twilio Bridge</p>
                            </div>
                        </div>
                        <OmniToggle checked={preferences.notifications} onChange={v => setPreferences({ ...preferences, notifications: v })} />
                    </div>

                </div>
            </AccordionItem>
        </div>
    );
};

export default Settings;
