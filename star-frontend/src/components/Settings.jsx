import React, { useState, useEffect, useCallback } from 'react';
import {
    ChevronDown, Shield,
    Plus, Trash2, Database, Globe, Bell, Server,
    IndianRupee, Edit, RefreshCw, Search, AlertTriangle,
    CheckCircle2, X, Loader2, Skull, Package
} from 'lucide-react';
import api, { getCurrentUser } from '../services/api';
import { OmniToggle, OmniInput } from './ui/Widgets';

// ─── Toast Notification System ───────────────────────────────────────────────
const Toast = ({ toast, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 3000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    return (
        <div className={`
            flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl
            animate-in slide-in-from-right-8 fade-in duration-300
            ${toast.type === 'success'
                ? 'bg-emerald-50/90 dark:bg-emerald-900/80 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                : 'bg-red-50/90 dark:bg-red-900/80 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'}
        `}>
            {toast.type === 'success'
                ? <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                : <AlertTriangle size={20} className="text-red-500 shrink-0" />
            }
            <p className="text-sm font-semibold">{toast.message}</p>
            <button onClick={() => onDismiss(toast.id)} className="ml-2 p-1 rounded-full hover:bg-black/10 transition-colors">
                <X size={14} />
            </button>
        </div>
    );
};

const ToastContainer = ({ toasts, onDismiss }) => (
    <div className="fixed top-6 right-6 z-[999] flex flex-col gap-3 max-w-sm">
        {toasts.map(t => <Toast key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
);

// ─── Main Settings Component ─────────────────────────────────────────────────
const Settings = ({ onBack }) => {
    // Accordion State
    const [openSection, setOpenSection] = useState('seva_management');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sevaLoading, setSevaLoading] = useState(false);

    // Toast State
    const [toasts, setToasts] = useState([]);
    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);
    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Mock Preferences
    const [preferences, setPreferences] = useState({
        notifications: true,
        autoBackup: true,
        soundEffects: false,
        compactMode: false
    });

    // Seva Management State
    const [sevas, setSevas] = useState([]);
    const [editingSevaId, setEditingSevaId] = useState(null);
    const [editedPrice, setEditedPrice] = useState('');
    const [showAddSeva, setShowAddSeva] = useState(false);
    const [sevaSearch, setSevaSearch] = useState('');
    const [newSeva, setNewSeva] = useState({
        name_eng: '',
        name_kan: '',
        price: '',
        is_shaswata: false,
        is_active: true
    });

    // Authenticated User State
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const initData = async () => {
            try {
                const user = await getCurrentUser();
                setCurrentUser(user);
            } catch (error) {
                console.error("Error fetching current user (delete/restore buttons will be hidden):", error);
            }
            fetchSevas();
            fetchUsers();
        };
        initData();
    }, []);

    const fetchSevas = async () => {
        setSevaLoading(true);
        try {
            const response = await api.get('/sevas', { params: { active_only: false } });
            setSevas(response.data);
        } catch (error) {
            console.error("Error fetching sevas:", error);
        } finally {
            setSevaLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
            // Fallback to mock if endpoint fails
            setUsers([
                { id: 1, username: 'admin', role: 'ADMIN' },
                { id: 2, username: 'arc_priest', role: 'CLERK' }
            ]);
        }
    };

    const handleEditClick = (seva) => {
        setEditingSevaId(seva.id);
        setEditedPrice(seva.price.toString());
    };

    const handleSaveClick = async (sevaId) => {
        try {
            await api.put(`/sevas/${sevaId}`, { price: parseFloat(editedPrice) });
            setSevas(sevas.map(s => s.id === sevaId ? { ...s, price: parseFloat(editedPrice) } : s));
            setEditingSevaId(null);
            addToast('Price updated successfully');
        } catch (error) {
            console.error("Error saving seva price:", error);
            addToast('Failed to update price', 'error');
        }
    };

    const handleToggleActive = async (seva) => {
        try {
            const newStatus = !seva.is_active;
            await api.put(`/sevas/${seva.id}`, { is_active: newStatus });
            setSevas(sevas.map(s => s.id === seva.id ? { ...s, is_active: newStatus } : s));
            addToast(newStatus ? 'Seva activated' : 'Seva deactivated');
        } catch (error) {
            console.error("Error updating status:", error);
            addToast('Failed to update status', 'error');
        }
    };

    const handleDeleteSeva = async (sevaId) => {
        if (currentUser?.role?.toLowerCase() !== 'admin') {
            addToast('Permission Denied: Only Admins can delete Sevas.', 'error');
            return;
        }
        if (!window.confirm("Are you sure you want to move this Seva to the Recycle Bin?")) return;
        try {
            await api.delete(`/sevas/${sevaId}`);
            fetchSevas();
            addToast('Seva moved to Recycle Bin');
        } catch (error) {
            console.error("Error deleting seva:", error);
            addToast('Failed to delete Seva. ' + (error.response?.data?.detail || error.message), 'error');
        }
    };

    const handleRestoreSeva = async (sevaId) => {
        if (currentUser?.role?.toLowerCase() !== 'admin') {
            addToast('Restricted: Only Admins can restore Sevas.', 'error');
            return;
        }
        try {
            await api.post(`/sevas/${sevaId}/restore`);
            fetchSevas();
            addToast('Seva restored successfully');
        } catch (error) {
            console.error("Error restoring seva:", error);
            addToast('Failed to restore Seva. ' + (error.response?.data?.detail || error.message), 'error');
        }
    };

    const handlePermanentDelete = async (sevaId, sevaName) => {
        if (currentUser?.role?.toLowerCase() !== 'admin') {
            addToast('Permission Denied: Only Admins can permanently delete.', 'error');
            return;
        }
        if (!window.confirm(`⚠️ PERMANENT DELETE\n\nAre you sure you want to permanently delete "${sevaName}"?\n\nThis action CANNOT be undone.`)) return;
        if (!window.confirm(`⚠️ FINAL CONFIRMATION\n\nThis will permanently remove "${sevaName}" from the database forever.\n\nProceed?`)) return;
        try {
            await api.delete(`/sevas/${sevaId}/permanent`);
            fetchSevas();
            addToast(`"${sevaName}" permanently deleted`);
        } catch (error) {
            console.error("Error permanently deleting:", error);
            addToast('Failed to permanently delete. ' + (error.response?.data?.detail || error.message), 'error');
        }
    };

    const handleEmptyRecycleBin = async () => {
        if (currentUser?.role?.toLowerCase() !== 'admin') {
            addToast('Permission Denied: Only Admins can empty the bin.', 'error');
            return;
        }
        if (inactiveSevas.length === 0) {
            addToast('Recycle bin is already empty', 'error');
            return;
        }
        if (!window.confirm(`⚠️ EMPTY RECYCLE BIN\n\nThis will permanently delete ${inactiveSevas.length} seva(s).\nThis action CANNOT be undone.`)) return;
        if (!window.confirm(`⚠️ FINAL CONFIRMATION\n\nPermanently remove ALL ${inactiveSevas.length} deleted seva(s)?`)) return;
        try {
            const response = await api.delete('/sevas/recycle-bin/empty');
            fetchSevas();
            addToast(`Recycle bin emptied — ${response.data.count} seva(s) removed`);
        } catch (error) {
            console.error("Error emptying recycle bin:", error);
            addToast('Failed to empty recycle bin. ' + (error.response?.data?.detail || error.message), 'error');
        }
    };

    const handleAddSeva = async () => {
        try {
            if (!newSeva.name_eng || !newSeva.price) {
                addToast('Please enter English Name and Price', 'error');
                return;
            }
            await api.post('/sevas', {
                ...newSeva,
                price: parseFloat(newSeva.price)
            });
            setShowAddSeva(false);
            setNewSeva({ name_eng: '', name_kan: '', price: '', is_shaswata: false, is_active: true });
            fetchSevas();
            addToast('New Seva created successfully');
        } catch (error) {
            console.error("Error creating seva:", error);
            addToast('Failed to create Seva. ' + (error.response?.data?.detail || error.message), 'error');
        }
    };

    const toggleSection = (section) => {
        setOpenSection(openSection === section ? null : section);
    };

    // ─── Accordion Component ─────────────────────────────────────────────────
    const AccordionItem = ({ id, title, icon: Icon, badge, badgeColor, children }) => {
        const isOpen = openSection === id;
        return (
            <div className={`mb-4 rounded-[1.5rem] border transition-all duration-500 ease-spring ${isOpen ? 'bg-white dark:bg-slate-800 border-amber-200 dark:border-slate-600 shadow-xl scale-[1.01]' : 'bg-white/40 dark:bg-slate-800/40 border-transparent hover:bg-white hover:shadow-md dark:hover:bg-slate-800/60'}`}>
                <button
                    onClick={() => toggleSection(id)}
                    className="flex items-center justify-between w-full p-6 text-left"
                >
                    <div className="flex items-center gap-4">
                        <div className={`
                            p-3.5 rounded-2xl transition-all duration-300 shadow-sm
                            ${isOpen
                                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rotate-0'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-amber-50 hover:text-amber-500 -rotate-6'}
                        `}>
                            <Icon size={24} />
                        </div>
                        <div className="flex items-center gap-3">
                            <div>
                                <h3 className={`text-lg font-black font-heading tracking-tight ${isOpen ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {title}
                                </h3>
                                {isOpen && <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mt-1">Configuring</p>}
                            </div>
                            {badge !== undefined && badge > 0 && (
                                <span className={`
                                    px-2.5 py-1 rounded-full text-xs font-black
                                    ${badgeColor === 'red'
                                        ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'}
                                `}>
                                    {badge}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300
                        ${isOpen ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rotate-180' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}
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

    // Filter Sevas
    const activeSevas = sevas.filter(s => s.is_active);
    const inactiveSevas = sevas.filter(s => !s.is_active);

    // Search filter for active sevas
    const filteredActiveSevas = activeSevas.filter(s =>
        s.name_eng.toLowerCase().includes(sevaSearch.toLowerCase()) ||
        (s.name_kan && s.name_kan.toLowerCase().includes(sevaSearch.toLowerCase()))
    );

    const isAdmin = currentUser?.role?.toLowerCase() === 'admin';

    // Role badge colors
    const getRoleBadge = (role) => {
        const r = role?.toLowerCase();
        if (r === 'admin') return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/20';
        if (r === 'clerk') return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
        return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 pb-32 animate-in fade-in duration-700">
            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />

            <header className="mb-10">
                <h1 className="text-4xl md:text-5xl font-black font-heading text-slate-800 dark:text-white mb-2 tracking-tight">System Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Manage Temple Architecture & Protocols</p>
            </header>


            {/* 2. Seva Catalog & Pricing */}
            <AccordionItem id="seva_management" title="Seva Catalog & Pricing" icon={IndianRupee} badge={activeSevas.length}>
                <div className="space-y-4">
                    {/* Summary Bar */}
                    <div className="flex items-center justify-between px-1 mb-2">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                <span className="text-xl font-black text-slate-800 dark:text-white">{activeSevas.length}</span> Active Sevas
                            </span>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={18} className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search sevas by name..."
                            value={sevaSearch}
                            onChange={e => setSevaSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-300 transition-all"
                        />
                        {sevaSearch && (
                            <button
                                onClick={() => setSevaSearch('')}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Add New Seva Button/Form */}
                    {isAdmin && (
                        !showAddSeva ? (
                            <button
                                onClick={() => setShowAddSeva(true)}
                                className="w-full py-3.5 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl text-slate-500 dark:text-slate-400 font-bold hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all flex items-center justify-center gap-2 mb-4 group"
                            >
                                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                    <Plus size={16} />
                                </div>
                                Add New Seva
                            </button>
                        ) : (
                            <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-amber-200 dark:border-amber-800/50 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <h4 className="font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <Plus size={18} className="text-amber-500" /> Add New Seva
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                    <input
                                        type="text" placeholder="Seva Name (English) *"
                                        value={newSeva.name_eng} onChange={e => setNewSeva({ ...newSeva, name_eng: e.target.value })}
                                        className="p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white w-full focus:ring-2 focus:ring-amber-500/30 outline-none transition-all"
                                    />
                                    <input
                                        type="text" placeholder="Seva Name (Kannada) — Optional"
                                        value={newSeva.name_kan} onChange={e => setNewSeva({ ...newSeva, name_kan: e.target.value })}
                                        className="p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white w-full focus:ring-2 focus:ring-amber-500/30 outline-none transition-all"
                                    />
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                        <input
                                            type="number" placeholder="Price"
                                            value={newSeva.price} onChange={e => setNewSeva({ ...newSeva, price: e.target.value })}
                                            className="p-3 pl-8 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white w-full focus:ring-2 focus:ring-amber-500/30 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 p-3">
                                        <input
                                            type="checkbox" id="is_shaswata"
                                            checked={newSeva.is_shaswata} onChange={e => setNewSeva({ ...newSeva, is_shaswata: e.target.checked })}
                                            className="w-4 h-4 text-amber-600 rounded accent-amber-500"
                                        />
                                        <label htmlFor="is_shaswata" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Shaswata Seva (Recurring)</label>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => setShowAddSeva(false)} className="px-5 py-2.5 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancel</button>
                                    <button onClick={handleAddSeva} className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:scale-105">Save Seva</button>
                                </div>
                            </div>
                        )
                    )}

                    {/* Loading State */}
                    {sevaLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 size={32} className="text-amber-500 animate-spin" />
                        </div>
                    ) : filteredActiveSevas.length === 0 ? (
                        <div className="text-center py-12">
                            <Package size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-slate-400 dark:text-slate-500 font-semibold">
                                {sevaSearch ? 'No sevas match your search' : 'No active sevas found'}
                            </p>
                        </div>
                    ) : (
                        filteredActiveSevas.map((seva) => (
                            <div key={seva.id} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-800/50 transition-all duration-200 group">
                                <div className="flex items-center gap-5 w-full">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-lg text-slate-800 dark:text-white truncate">{seva.name_eng}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{seva.name_kan || ''}</p>
                                    </div>

                                    <div className="w-1/4 flex items-center gap-2">
                                        {editingSevaId === seva.id ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400">₹</span>
                                                <input
                                                    type="number"
                                                    value={editedPrice}
                                                    onChange={(e) => setEditedPrice(e.target.value)}
                                                    className="w-24 p-2 rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 focus:ring-2 focus:ring-amber-500 outline-none text-slate-800 dark:text-white"
                                                    autoFocus
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-md font-bold text-slate-700 dark:text-slate-300">₹ {parseFloat(seva.price).toFixed(2)}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${seva.is_active ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'}`}>
                                                {seva.is_active ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                            <OmniToggle checked={seva.is_active} onChange={() => handleToggleActive(seva)} size="sm" />
                                        </div>

                                        {editingSevaId === seva.id ? (
                                            <button
                                                onClick={() => handleSaveClick(seva.id)}
                                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-500/20 hover:scale-105"
                                            >
                                                Save
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleEditClick(seva)}
                                                className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-xl transition-all"
                                            >
                                                <Edit size={18} />
                                            </button>
                                        )}

                                        {/* DELETE BUTTON */}
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleDeleteSeva(seva.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                title="Move to Recycle Bin"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </AccordionItem>

            {/* 3. User Management */}
            <AccordionItem id="users" title="Staff Access Protocols" icon={Shield} badge={users.length}>
                <div className="space-y-4">
                    {users.map(user => (
                        <div key={user.id} className="group flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-800/50 transition-all duration-200">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                                    {user.username[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-heading font-black text-lg text-slate-800 dark:text-slate-200">{user.username}</p>
                                    <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mt-1 ${getRoleBadge(user.role)}`}>
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                            {isAdmin && user.username !== currentUser?.username && (
                                <button className="p-3 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 rounded-xl transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0">
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </div>
                    ))}
                    {isAdmin && (
                        <button className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-3xl text-slate-400 dark:text-slate-500 font-bold hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all flex items-center justify-center gap-2 group">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                <Plus size={18} />
                            </div>
                            Add Authorized Personnel
                        </button>
                    )}
                </div>
            </AccordionItem>

            {/* 4. System Preferences */}
            <AccordionItem id="system" title="System Preferences" icon={Database}>
                <div className="space-y-8">
                    {/* Bilingual Mode */}
                    <div className="flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                        <div className="flex items-center gap-5">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl">
                                <Globe size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-lg">Bilingual Mode</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Automatic English-Kannada transliteration</p>
                            </div>
                        </div>
                        <OmniToggle checked={true} onChange={() => { }} readOnly />
                    </div>

                    {/* Auto Backup */}
                    <div className="flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                        <div className="flex items-center gap-5">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                                <Server size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-lg">Auto-Backup Protocol (Lvl 9)</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Sync to GitHub Cloud every 30 mins</p>
                            </div>
                        </div>
                        <OmniToggle checked={preferences.autoBackup} onChange={v => setPreferences({ ...preferences, autoBackup: v })} />
                    </div>

                    {/* Notifications */}
                    <div className="flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                        <div className="flex items-center gap-5">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-2xl">
                                <Bell size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-lg">Devotee Prescience</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Send WhatsApp updates via Twilio Bridge</p>
                            </div>
                        </div>
                        <OmniToggle checked={preferences.notifications} onChange={v => setPreferences({ ...preferences, notifications: v })} />
                    </div>
                </div>
            </AccordionItem>

            {/* 5. Recycle Bin (NEW — Separate Section) */}
            <AccordionItem id="recycle_bin" title="Seva Recycle Bin" icon={Trash2} badge={inactiveSevas.length} badgeColor="red">
                <div className="space-y-4">
                    {inactiveSevas.length === 0 ? (
                        <div className="text-center py-12">
                            <Trash2 size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-slate-400 dark:text-slate-500 font-semibold text-lg">Recycle Bin is Empty</p>
                            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Deleted sevas will appear here for recovery</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between px-1 mb-2">
                                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                                    <span className="text-red-500 font-black">{inactiveSevas.length}</span> item{inactiveSevas.length > 1 ? 's' : ''} in bin
                                </p>
                                {isAdmin && (
                                    <button
                                        onClick={handleEmptyRecycleBin}
                                        className="px-4 py-2 text-xs font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl transition-all flex items-center gap-2 hover:scale-105"
                                    >
                                        <Skull size={14} /> Empty All
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3">
                                {inactiveSevas.map(seva => (
                                    <div key={seva.id} className="group flex items-center justify-between p-4 bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 hover:border-red-200 dark:hover:border-red-800/50 transition-all duration-200">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-600 dark:text-slate-300 truncate">{seva.name_eng}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs font-bold text-red-400 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full">DELETED</span>
                                                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">₹ {parseFloat(seva.price).toFixed(2)}</span>
                                            </div>
                                        </div>
                                        {isAdmin && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleRestoreSeva(seva.id)}
                                                    className="px-3.5 py-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-xl flex items-center gap-2 text-xs font-bold transition-all hover:scale-105"
                                                >
                                                    <RefreshCw size={14} /> Restore
                                                </button>
                                                <button
                                                    onClick={() => handlePermanentDelete(seva.id, seva.name_eng)}
                                                    className="px-3.5 py-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl flex items-center gap-2 text-xs font-bold transition-all hover:scale-105 opacity-0 group-hover:opacity-100"
                                                    title="Permanently delete — cannot be undone"
                                                >
                                                    <Skull size={14} /> Delete Forever
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </AccordionItem>
        </div>
    );
};

export default Settings;
