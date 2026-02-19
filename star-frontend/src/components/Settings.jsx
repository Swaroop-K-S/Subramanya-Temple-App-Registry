import React, { useState, useEffect, useCallback } from 'react';
import {
    ChevronDown, Shield, User, Users, Settings2, Printer, Database, Activity,
    Plus, Trash2, Globe, Bell, Server, FileText, Download, Upload,
    IndianRupee, Edit, RefreshCw, Search, AlertTriangle, Lock, Eye, EyeOff,
    CheckCircle2, X, Loader2, Skull, Package, HardDrive, Clock, Hash,
    ChevronRight, Save, RotateCcw
} from 'lucide-react';
import api, { getCurrentUser } from '../services/api';
import { OmniToggle, OmniInput } from './ui/Widgets';

// ─── Toast Notification System ───────────────────────────────────────────────
function Toast({ toast, onDismiss }) {
    const bg = toast.type === 'error'
        ? 'bg-red-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300'
        : toast.type === 'warning'
            ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/40 text-amber-700 dark:text-amber-300'
            : 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300';
    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl ${bg} shadow-2xl animate-slideIn`}>
            {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => onDismiss(toast.id)} className="ml-auto opacity-60 hover:opacity-100"><X size={14} /></button>
        </div>
    );
}
function ToastContainer({ toasts, onDismiss }) {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
            {toasts.map(t => <Toast key={t.id} toast={t} onDismiss={onDismiss} />)}
        </div>
    );
}

// ─── Sidebar Navigation Items ────────────────────────────────────────────────
const NAV_ITEMS = [
    { id: 'general', label: 'General', icon: Settings2, desc: 'Profile & App Info' },
    { id: 'sevas', label: 'Seva Catalog', icon: Package, desc: 'Pricing & Management' },
    { id: 'staff', label: 'Staff Access', icon: Shield, desc: 'User Management' },
    { id: 'database', label: 'Data & Backup', icon: Database, desc: 'Backup & Recovery' },
    { id: 'printer', label: 'Printing', icon: Printer, desc: 'Thermal Config' },
    { id: 'audit', label: 'Audit Logs', icon: FileText, desc: 'Activity History' },
];

// ─── Main Settings Component ─────────────────────────────────────────────────
function Settings({ onBack }) {
    const [activeTab, setActiveTab] = useState('general');
    const [toasts, setToasts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Data
    const [sevas, setSevas] = useState([]);
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [settings, setSettings] = useState({});
    const [systemHealth, setSystemHealth] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);

    // Seva editing
    const [editingId, setEditingId] = useState(null);
    const [editPrice, setEditPrice] = useState('');
    const [showRecycleBin, setShowRecycleBin] = useState(false);
    const [sevaSearch, setSevaSearch] = useState('');
    const [showAddSeva, setShowAddSeva] = useState(false);
    const [newSeva, setNewSeva] = useState({ name_eng: '', name_kan: '', price: '', is_shaswata: false, is_slot_based: false, daily_limit: '' });

    // User management
    const [showAddUser, setShowAddUser] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'clerk' });

    // Password change
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [pwdData, setPwdData] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });

    // Settings state
    const [settingsDirty, setSettingsDirty] = useState(false);
    const [localSettings, setLocalSettings] = useState({});

    // ── Toast helper ──
    const showToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    // ── Data Fetching ──
    const fetchSevas = useCallback(async () => {
        try { const res = await api.get('/sevas'); setSevas(res.data || []); }
        catch { showToast('Failed to load Sevas', 'error'); }
    }, [showToast]);

    const fetchUsers = useCallback(async () => {
        try { const res = await api.get('/users'); setUsers(res.data || []); }
        catch { setUsers([]); }
    }, []);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await api.get('/settings');
            const m = {}; (res.data || []).forEach(s => { m[s.key] = s.value; });
            setSettings(m); setLocalSettings(m);
        } catch { setSettings({}); setLocalSettings({}); }
    }, []);

    const fetchHealth = useCallback(async () => {
        try { const res = await api.get('/system/health'); setSystemHealth(res.data); }
        catch { setSystemHealth(null); }
    }, []);

    const fetchAuditLogs = useCallback(async () => {
        try { const res = await api.get('/audit-logs?limit=50'); setAuditLogs(res.data || []); }
        catch { setAuditLogs([]); }
    }, []);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            setCurrentUser(getCurrentUser());
            await Promise.all([fetchSevas(), fetchUsers(), fetchSettings(), fetchHealth()]);
            setLoading(false);
        }; init();
    }, [fetchSevas, fetchUsers, fetchSettings, fetchHealth]);

    useEffect(() => { if (activeTab === 'audit') fetchAuditLogs(); }, [activeTab, fetchAuditLogs]);

    // ── Seva Handlers ──
    const handleEditClick = (seva) => { setEditingId(seva.id); setEditPrice(seva.price.toString()); };
    const handleSaveClick = async (sevaId) => {
        try { await api.put(`/sevas/${sevaId}`, { price: parseFloat(editPrice) }); setEditingId(null); fetchSevas(); showToast('Price updated'); }
        catch { showToast('Failed to update price', 'error'); }
    };
    const handleToggleActive = async (seva) => {
        try { await api.put(`/sevas/${seva.id}`, { is_active: !seva.is_active }); fetchSevas(); showToast(seva.is_active ? 'Seva deactivated' : 'Seva activated'); }
        catch { showToast('Toggle failed', 'error'); }
    };
    const handleDeleteSeva = async (sevaId) => {
        if (!window.confirm('Move this Seva to Recycle Bin?')) return;
        try { await api.delete(`/sevas/${sevaId}`); fetchSevas(); showToast('Moved to Recycle Bin'); }
        catch { showToast('Delete failed', 'error'); }
    };
    const handleRestoreSeva = async (sevaId) => {
        try { await api.post(`/sevas/${sevaId}/restore`); fetchSevas(); showToast('Seva restored'); }
        catch { showToast('Restore failed', 'error'); }
    };
    const handlePermanentDelete = async (sevaId, name) => {
        if (!window.confirm(`PERMANENTLY delete "${name}"? This cannot be undone.`)) return;
        try { await api.delete(`/sevas/${sevaId}/permanent`); fetchSevas(); showToast('Permanently deleted'); }
        catch { showToast('Permanent delete failed', 'error'); }
    };
    const handleEmptyRecycleBin = async () => {
        const d = sevas.filter(s => !s.is_active);
        if (d.length === 0) return;
        if (!window.confirm(`Permanently delete ALL ${d.length} items in Recycle Bin?`)) return;
        try { for (const s of d) await api.delete(`/sevas/${s.id}/permanent`); fetchSevas(); showToast(`Emptied ${d.length} items`); }
        catch { showToast('Empty recycle bin failed', 'error'); }
    };
    const handleAddSeva = async () => {
        if (!newSeva.name_eng.trim()) { showToast('Name is required', 'error'); return; }
        try {
            await api.post('/sevas', { ...newSeva, price: parseFloat(newSeva.price) || 0, daily_limit: newSeva.daily_limit ? parseInt(newSeva.daily_limit) : null });
            setNewSeva({ name_eng: '', name_kan: '', price: '', is_shaswata: false, is_slot_based: false, daily_limit: '' });
            setShowAddSeva(false); fetchSevas(); showToast('Seva added');
        } catch { showToast('Add failed', 'error'); }
    };

    // ── User Handlers ──
    const handleAddUser = async () => {
        if (!newUser.username.trim() || !newUser.password.trim()) { showToast('Username and password required', 'error'); return; }
        try { await api.post('/users', newUser); setNewUser({ username: '', password: '', role: 'clerk' }); setShowAddUser(false); fetchUsers(); showToast('User created'); }
        catch (e) { showToast(e.response?.data?.detail || 'Failed to create user', 'error'); }
    };
    const handleDeleteUser = async (id, username) => {
        if (!window.confirm(`Delete user "${username}"?`)) return;
        try { await api.delete(`/users/${id}`); fetchUsers(); showToast(`User "${username}" deleted`); }
        catch (e) { showToast(e.response?.data?.detail || 'Delete failed', 'error'); }
    };
    const handleChangePassword = async () => {
        if (pwdData.new_password !== pwdData.confirm_password) { showToast('Passwords do not match', 'error'); return; }
        if (pwdData.new_password.length < 6) { showToast('Min 6 characters', 'error'); return; }
        try {
            await api.put('/users/me/password', { current_password: pwdData.current_password, new_password: pwdData.new_password });
            setPwdData({ current_password: '', new_password: '', confirm_password: '' }); setShowPasswordChange(false); showToast('Password changed');
        } catch (e) { showToast(e.response?.data?.detail || 'Failed', 'error'); }
    };

    // ── Settings Handlers ──
    const handleSettingChange = (key, value) => { setLocalSettings(p => ({ ...p, [key]: value })); setSettingsDirty(true); };
    const handleSaveSettings = async () => {
        try { await api.put('/settings', { settings: localSettings }); setSettings(localSettings); setSettingsDirty(false); showToast('Settings saved'); }
        catch { showToast('Save failed', 'error'); }
    };

    // ── Backup ──
    const handleBackup = async () => {
        try {
            const res = await api.get('/system/backup', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a'); a.href = url;
            a.download = `star_temple_backup_${new Date().toISOString().slice(0, 10)}.db`;
            a.click(); window.URL.revokeObjectURL(url);
            showToast('Backup downloaded'); fetchAuditLogs();
        } catch { showToast('Backup failed', 'error'); }
    };

    // ── Derived Data ──
    const activeSevas = sevas.filter(s => s.is_active);
    const deletedSevas = sevas.filter(s => !s.is_active);
    const filteredSevas = (showRecycleBin ? deletedSevas : activeSevas)
        .filter(s => !sevaSearch || s.name_eng.toLowerCase().includes(sevaSearch.toLowerCase()));

    const getRoleBadge = (role) => {
        if (role === 'admin') return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">Admin</span>;
        return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">Clerk</span>;
    };

    // ── Reusable Components ──
    const GlassCard = ({ children, className = '' }) => (
        <div className={`bg-slate-50 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm dark:shadow-lg ${className}`}>
            {children}
        </div>
    );

    const SectionHeader = ({ icon: Icon, title, subtitle, action }) => (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center">
                    <Icon size={20} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h2>
                    {subtitle && <p className="text-xs text-slate-400 dark:text-white/50">{subtitle}</p>}
                </div>
            </div>
            {action}
        </div>
    );

    const InputField = ({ className = '', ...props }) => (
        <input {...props} className={`px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-white/30 ${className}`} />
    );

    const SelectField = ({ children, className = '', ...props }) => (
        <select {...props} className={`px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-white text-sm ${className}`}>
            {children}
        </select>
    );

    const PrimaryBtn = ({ children, className = '', ...props }) => (
        <button {...props} className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm ${className}`}>
            {children}
        </button>
    );

    const GhostBtn = ({ children, className = '', ...props }) => (
        <button {...props} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all ${className}`}>
            {children}
        </button>
    );

    const AccentBtn = ({ children, className = '', ...props }) => (
        <button {...props} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 hover:from-amber-200 hover:to-orange-200 dark:hover:from-amber-500/30 dark:hover:to-orange-500/30 transition-all ${className}`}>
            {children}
        </button>
    );

    if (loading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-amber-500" size={32} /></div>;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PANELS
    // ═══════════════════════════════════════════════════════════════════════════

    const GeneralPanel = () => (
        <div className="space-y-5">
            <SectionHeader icon={User} title="My Profile" subtitle="Your account details" />
            <GlassCard>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-slate-400 dark:text-white/40 text-xs">Username</span><p className="text-slate-800 dark:text-white font-medium mt-1">{currentUser?.username || 'admin'}</p></div>
                    <div><span className="text-slate-400 dark:text-white/40 text-xs">Role</span><div className="mt-1">{getRoleBadge(currentUser?.role || 'admin')}</div></div>
                </div>
                <button onClick={() => setShowPasswordChange(!showPasswordChange)}
                    className="mt-4 flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-amber-600 dark:text-amber-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
                    <Lock size={14} /> Change Password
                </button>
                {showPasswordChange && (
                    <div className="mt-4 p-4 bg-slate-100 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/5 space-y-3">
                        {['current_password', 'new_password', 'confirm_password'].map(field => (
                            <div key={field}>
                                <label className="text-xs text-slate-500 dark:text-white/40 capitalize">{field.replace(/_/g, ' ')}</label>
                                <div className="relative">
                                    <InputField type={showPwd[field.split('_')[0]] ? "text" : "password"}
                                        value={pwdData[field]} onChange={e => setPwdData(p => ({ ...p, [field]: e.target.value }))}
                                        className="w-full mt-1 pr-10" />
                                    <button onClick={() => setShowPwd(p => ({ ...p, [field.split('_')[0]]: !p[field.split('_')[0]] }))}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 mt-0.5 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60">
                                        {showPwd[field.split('_')[0]] ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                        <PrimaryBtn onClick={handleChangePassword}>Save Password</PrimaryBtn>
                    </div>
                )}
            </GlassCard>

            <SectionHeader icon={Settings2} title="App Preferences" subtitle="System-wide settings" />
            <GlassCard>
                <div className="space-y-4">
                    {[
                        { key: 'bilingual_mode', label: 'Bilingual Mode', desc: 'Show Kannada alongside English', type: 'toggle' },
                        { key: 'notifications', label: 'Notifications', desc: 'Desktop alerts for new bookings', type: 'toggle' },
                    ].map(pref => (
                        <div key={pref.key} className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-800 dark:text-white font-medium">{pref.label}</p>
                                <p className="text-xs text-slate-400 dark:text-white/40">{pref.desc}</p>
                            </div>
                            <OmniToggle checked={localSettings[pref.key] === 'true'} onChange={val => handleSettingChange(pref.key, val ? 'true' : 'false')} />
                        </div>
                    ))}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-800 dark:text-white font-medium">Default Dispatch Method</p>
                            <p className="text-xs text-slate-400 dark:text-white/40">For Shaswata Seva prasadam</p>
                        </div>
                        <SelectField value={localSettings.default_dispatch_method || 'POST'} onChange={e => handleSettingChange('default_dispatch_method', e.target.value)}>
                            <option value="POST">Post</option>
                            <option value="COURIER">Courier</option>
                            <option value="HAND_DELIVERY">Hand Delivery</option>
                        </SelectField>
                    </div>
                </div>
                {settingsDirty && (
                    <button onClick={handleSaveSettings}
                        className="mt-4 flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:from-emerald-600 hover:to-teal-600 transition-all">
                        <Save size={14} /> Save Changes
                    </button>
                )}
            </GlassCard>
        </div>
    );

    const SevaCatalogPanel = () => (
        <div className="space-y-5">
            <SectionHeader icon={Package} title={showRecycleBin ? 'Recycle Bin' : 'Seva Catalog'}
                subtitle={`${showRecycleBin ? deletedSevas.length : activeSevas.length} items`}
                action={
                    <div className="flex gap-2">
                        <GhostBtn onClick={() => setShowRecycleBin(!showRecycleBin)}
                            className={showRecycleBin ? '!bg-red-50 dark:!bg-red-500/20 !border-red-200 dark:!border-red-500/30 !text-red-600 dark:!text-red-300' : ''}>
                            {showRecycleBin ? <><RotateCcw size={12} /> Back</> : <><Trash2 size={12} /> Bin ({deletedSevas.length})</>}
                        </GhostBtn>
                        {!showRecycleBin && <AccentBtn onClick={() => setShowAddSeva(!showAddSeva)}><Plus size={12} /> Add Seva</AccentBtn>}
                        {showRecycleBin && deletedSevas.length > 0 && (
                            <button onClick={handleEmptyRecycleBin}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/30 transition-all">
                                <Skull size={12} /> Empty All
                            </button>
                        )}
                    </div>
                }
            />
            {showAddSeva && (
                <GlassCard className="!border-amber-200 dark:!border-amber-500/20">
                    <h3 className="text-sm font-bold text-amber-600 dark:text-amber-300 mb-3">New Seva</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <InputField placeholder="Name (English)*" value={newSeva.name_eng} onChange={e => setNewSeva(p => ({ ...p, name_eng: e.target.value }))} className="col-span-2" />
                        <InputField placeholder="Name (Kannada)" value={newSeva.name_kan} onChange={e => setNewSeva(p => ({ ...p, name_kan: e.target.value }))} />
                        <InputField type="number" placeholder="Price (₹)" value={newSeva.price} onChange={e => setNewSeva(p => ({ ...p, price: e.target.value }))} />
                        <InputField type="number" placeholder="Daily Limit (opt)" value={newSeva.daily_limit} onChange={e => setNewSeva(p => ({ ...p, daily_limit: e.target.value }))} />
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/60"><input type="checkbox" checked={newSeva.is_shaswata} onChange={e => setNewSeva(p => ({ ...p, is_shaswata: e.target.checked }))} className="rounded" /> Shaswata</label>
                            <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/60"><input type="checkbox" checked={newSeva.is_slot_based} onChange={e => setNewSeva(p => ({ ...p, is_slot_based: e.target.checked }))} className="rounded" /> Slot-based</label>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <PrimaryBtn onClick={handleAddSeva} className="!text-xs !py-1.5">Create</PrimaryBtn>
                        <GhostBtn onClick={() => setShowAddSeva(false)}>Cancel</GhostBtn>
                    </div>
                </GlassCard>
            )}

            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" />
                <InputField placeholder="Search sevas..." value={sevaSearch} onChange={e => setSevaSearch(e.target.value)} className="w-full pl-9 !rounded-xl" />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredSevas.map(seva => (
                    <div key={seva.id} className="flex items-center justify-between px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/8 rounded-xl hover:bg-slate-50 dark:hover:bg-white/8 transition-all group">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-800 dark:text-white font-medium truncate">{seva.name_eng}</span>
                                {seva.name_kan && <span className="text-xs text-slate-400 dark:text-white/30 truncate">{seva.name_kan}</span>}
                                {seva.is_shaswata && <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20">Shaswata</span>}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                            {editingId === seva.id ? (
                                <>
                                    <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)}
                                        className="w-20 px-2 py-1 bg-amber-50 dark:bg-white/10 border border-amber-300 dark:border-amber-500/30 rounded text-amber-700 dark:text-amber-300 text-sm text-right" autoFocus />
                                    <button onClick={() => handleSaveClick(seva.id)} className="p-1 text-emerald-500 hover:text-emerald-600 dark:text-emerald-400"><CheckCircle2 size={16} /></button>
                                    <button onClick={() => setEditingId(null)} className="p-1 text-slate-400 dark:text-white/30 hover:text-slate-600"><X size={16} /></button>
                                </>
                            ) : (
                                <>
                                    <span className="text-sm text-amber-600 dark:text-amber-300 font-mono">₹{seva.price}</span>
                                    {!showRecycleBin ? (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditClick(seva)} className="p-1 text-slate-400 hover:text-amber-500"><Edit size={14} /></button>
                                            <button onClick={() => handleToggleActive(seva)} className="p-1 text-slate-400 hover:text-blue-500"><Globe size={14} /></button>
                                            <button onClick={() => handleDeleteSeva(seva.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-1">
                                            <button onClick={() => handleRestoreSeva(seva.id)} className="p-1 text-emerald-500 hover:text-emerald-600"><RotateCcw size={14} /></button>
                                            <button onClick={() => handlePermanentDelete(seva.id, seva.name_eng)} className="p-1 text-red-500 hover:text-red-600"><Skull size={14} /></button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ))}
                {filteredSevas.length === 0 && <div className="text-center py-8 text-slate-400 dark:text-white/30 text-sm">{showRecycleBin ? 'Recycle Bin is empty' : 'No matching sevas'}</div>}
            </div>
        </div>
    );

    const StaffPanel = () => (
        <div className="space-y-5">
            <SectionHeader icon={Shield} title="Staff Accounts" subtitle={`${users.length} registered`}
                action={<AccentBtn onClick={() => setShowAddUser(!showAddUser)}><Plus size={12} /> Add User</AccentBtn>}
            />
            {showAddUser && (
                <GlassCard className="!border-amber-200 dark:!border-amber-500/20">
                    <h3 className="text-sm font-bold text-amber-600 dark:text-amber-300 mb-3">New User</h3>
                    <div className="grid grid-cols-3 gap-3">
                        <InputField placeholder="Username" value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} />
                        <InputField type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} />
                        <SelectField value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}>
                            <option value="clerk">Clerk</option><option value="admin">Admin</option>
                        </SelectField>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <PrimaryBtn onClick={handleAddUser} className="!text-xs !py-1.5">Create User</PrimaryBtn>
                        <GhostBtn onClick={() => setShowAddUser(false)}>Cancel</GhostBtn>
                    </div>
                </GlassCard>
            )}
            <div className="space-y-2">
                {users.map(user => (
                    <div key={user.id} className="flex items-center justify-between px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/8 rounded-xl hover:bg-slate-50 dark:hover:bg-white/8 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center">
                                <User size={16} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-800 dark:text-white font-medium">{user.username}</p>
                                <p className="text-xs text-slate-400 dark:text-white/30">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {getRoleBadge(user.role)}
                            {currentUser?.username !== user.username && (
                                <button onClick={() => handleDeleteUser(user.id, user.username)}
                                    className="p-1.5 text-slate-300 dark:text-white/20 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {users.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No users found</div>}
            </div>
        </div>
    );

    const DatabasePanel = () => (
        <div className="space-y-5">
            <SectionHeader icon={Database} title="Data Management" subtitle="Backup & system health" />
            {systemHealth && (
                <GlassCard>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-white/80 mb-3 flex items-center gap-2"><Activity size={14} className="text-emerald-500" /> System Health</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'DB Size', value: `${systemHealth.database?.size_mb || 0} MB`, icon: HardDrive, color: 'text-blue-500' },
                            { label: 'Sevas', value: `${systemHealth.records?.total_sevas || 0} (${systemHealth.records?.active_sevas || 0} active)`, icon: Package, color: 'text-amber-500' },
                            { label: 'Devotees', value: systemHealth.records?.total_devotees || 0, icon: Users, color: 'text-purple-500' },
                            { label: 'Subscriptions', value: systemHealth.records?.total_subscriptions || 0, icon: RefreshCw, color: 'text-teal-500' },
                            { label: 'Transactions', value: systemHealth.records?.total_transactions || 0, icon: IndianRupee, color: 'text-emerald-500' },
                            { label: 'Staff', value: systemHealth.records?.total_users || 0, icon: Shield, color: 'text-rose-500' },
                        ].map(stat => (
                            <div key={stat.label} className="p-3 bg-slate-100 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/5">
                                <div className="flex items-center gap-2 mb-1">
                                    <stat.icon size={12} className={stat.color} />
                                    <span className="text-[10px] text-slate-500 dark:text-white/40 uppercase tracking-wider">{stat.label}</span>
                                </div>
                                <p className="text-sm text-slate-800 dark:text-white font-bold">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                    <button onClick={fetchHealth} className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white/60 transition-all">
                        <RefreshCw size={12} /> Refresh
                    </button>
                </GlassCard>
            )}
            <GlassCard>
                <h3 className="text-sm font-bold text-slate-700 dark:text-white/80 mb-3 flex items-center gap-2"><Download size={14} className="text-blue-500" /> Backup & Recovery</h3>
                <p className="text-xs text-slate-500 dark:text-white/40 mb-4">Download a copy of the entire temple database for safekeeping.</p>
                <button onClick={handleBackup}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/30 transition-all font-medium">
                    <Download size={16} /> Download Backup
                </button>
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/10 rounded-xl">
                    <p className="text-xs text-red-500 dark:text-red-300/60 flex items-center gap-1.5">
                        <AlertTriangle size={12} /> Database restore requires manual server restart.
                    </p>
                </div>
            </GlassCard>
        </div>
    );

    const PrinterPanel = () => (
        <div className="space-y-5">
            <SectionHeader icon={Printer} title="Thermal Printer" subtitle="Receipt formatting options" />
            <GlassCard>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-500 dark:text-white/40">Paper Size</label>
                        <SelectField value={localSettings.printer_paper_size || '3inch'} onChange={e => handleSettingChange('printer_paper_size', e.target.value)} className="w-full mt-1">
                            <option value="2inch">2 inch (58mm)</option><option value="3inch">3 inch (80mm)</option>
                        </SelectField>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 dark:text-white/40">Top Margin (px)</label>
                        <InputField type="number" value={localSettings.printer_margin_top || '10'} onChange={e => handleSettingChange('printer_margin_top', e.target.value)} className="w-full mt-1" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 dark:text-white/40">Footer Text</label>
                        <InputField value={localSettings.printer_footer_text || 'ಶ್ರೀ ಸುಬ್ರಹ್ಮಣ್ಯ ದೇವಸ್ಥಾನ'} onChange={e => handleSettingChange('printer_footer_text', e.target.value)} className="w-full mt-1" />
                    </div>
                </div>
                {settingsDirty && (
                    <button onClick={handleSaveSettings}
                        className="mt-4 flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:from-emerald-600 hover:to-teal-600 transition-all">
                        <Save size={14} /> Save Printer Settings
                    </button>
                )}
            </GlassCard>
        </div>
    );

    const AuditPanel = () => (
        <div className="space-y-5">
            <SectionHeader icon={FileText} title="Audit Trail" subtitle={`${auditLogs.length} recent actions`}
                action={<GhostBtn onClick={fetchAuditLogs}><RefreshCw size={12} /> Refresh</GhostBtn>}
            />
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                {auditLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-3 px-4 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/8 rounded-xl">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${log.action === 'DELETE' ? 'bg-red-100 dark:bg-red-500/20 text-red-500' :
                            log.action === 'BACKUP' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-500' :
                                log.action === 'CREATE' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500' :
                                    'bg-amber-100 dark:bg-amber-500/20 text-amber-500'
                            }`}>
                            {log.action === 'DELETE' ? <Trash2 size={14} /> :
                                log.action === 'BACKUP' ? <Download size={14} /> :
                                    log.action === 'CREATE' ? <Plus size={14} /> : <Edit size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-700 dark:text-white/80">{log.action}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40">{log.resource_type}</span>
                                {log.resource_id && <span className="text-[10px] text-slate-400 dark:text-white/20">#{log.resource_id}</span>}
                            </div>
                            <p className="text-xs text-slate-400 dark:text-white/30 mt-0.5 truncate">{log.details || 'No details'}</p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-[10px] text-slate-500 dark:text-white/30">{log.username || 'system'}</p>
                            <p className="text-[10px] text-slate-400 dark:text-white/20">{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</p>
                        </div>
                    </div>
                ))}
                {auditLogs.length === 0 && (
                    <div className="text-center py-12 text-slate-400 dark:text-white/30">
                        <FileText size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No audit logs yet</p>
                        <p className="text-xs mt-1 text-slate-400">Actions will appear here automatically</p>
                    </div>
                )}
            </div>
        </div>
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════
    const panels = { general: GeneralPanel, sevas: SevaCatalogPanel, staff: StaffPanel, database: DatabasePanel, printer: PrinterPanel, audit: AuditPanel };
    const ActivePanel = panels[activeTab] || GeneralPanel;

    return (
        <div className="h-full flex flex-col">
            <ToastContainer toasts={toasts} onDismiss={id => setToasts(prev => prev.filter(t => t.id !== id))} />
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-white/5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-500/20 dark:to-orange-600/20 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center">
                    <Settings2 size={20} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Settings</h1>
                    <p className="text-xs text-slate-400 dark:text-white/40">Admin Control Center • S.T.A.R.</p>
                </div>
            </div>
            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
                <nav className="w-56 border-r border-slate-200 dark:border-white/5 py-3 px-2 overflow-y-auto shrink-0">
                    {NAV_ITEMS.map(item => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-left transition-all ${activeTab === item.id
                                ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/15 dark:to-orange-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300 shadow-sm'
                                : 'text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
                                }`}>
                            <item.icon size={16} className={activeTab === item.id ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-white/30'} />
                            <div>
                                <p className="text-sm font-medium leading-tight">{item.label}</p>
                                <p className="text-[10px] opacity-50 leading-tight">{item.desc}</p>
                            </div>
                            {activeTab === item.id && <ChevronRight size={12} className="ml-auto text-amber-400 dark:text-amber-500/50" />}
                        </button>
                    ))}
                </nav>
                <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <ActivePanel />
                </main>
            </div>
        </div>
    );
}

export default Settings;
