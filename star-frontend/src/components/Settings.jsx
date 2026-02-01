import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, Users, Plus, Trash2, Shield, ShieldCheck,
    User, Eye, EyeOff, X, Loader2, AlertTriangle, CheckCircle,
    Settings as SettingsIcon, Lock, UserCog
} from 'lucide-react';
import api from '../services/api';

const TRANSLATIONS = {
    EN: {
        title: 'Temple Staff Management',
        subtitle: 'Manage users and permissions',
        addUser: 'Add Staff',
        username: 'Username',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        role: 'Role',
        admin: 'Admin',
        clerk: 'Clerk',
        save: 'Create User',
        cancel: 'Cancel',
        delete: 'Delete',
        deleteConfirm: 'Are you sure you want to remove this user?',
        noUsers: 'No staff members found',
        loading: 'Loading...',
        error: 'An error occurred',
        success: 'Operation successful',
        accessDenied: 'Only Admins can access this section',
        createdAt: 'Member since',
        actions: 'Actions'
    },
    KN: {
        title: 'ದೇವಾಲಯದ ಸಿಬ್ಬಂದಿ ನಿರ್ವಹಣೆ',
        subtitle: 'ಬಳಕೆದಾರರು ಮತ್ತು ಅನುಮತಿಗಳನ್ನು ನಿರ್ವಹಿಸಿ',
        addUser: 'ಸಿಬ್ಬಂದಿ ಸೇರಿಸಿ',
        username: 'ಬಳಕೆದಾರ ಹೆಸರು',
        password: 'ಗುಪ್ತಪದ',
        confirmPassword: 'ಗುಪ್ತಪದ ಖಚಿತಪಡಿಸಿ',
        role: 'ಪಾತ್ರ',
        admin: 'ನಿರ್ವಾಹಕ',
        clerk: 'ಗುಮಾಸ್ತ',
        save: 'ಬಳಕೆದಾರರನ್ನು ರಚಿಸಿ',
        cancel: 'ರದ್ದುಮಾಡಿ',
        delete: 'ಅಳಿಸಿ',
        deleteConfirm: 'ಈ ಬಳಕೆದಾರರನ್ನು ತೆಗೆದುಹಾಕಲು ಖಚಿತವೇ?',
        noUsers: 'ಯಾವುದೇ ಸಿಬ್ಬಂದಿ ಕಂಡುಬಂದಿಲ್ಲ',
        loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
        error: 'ದೋಷ ಸಂಭವಿಸಿದೆ',
        success: 'ಕಾರ್ಯಾಚರಣೆ ಯಶಸ್ವಿ',
        accessDenied: 'ಈ ವಿಭಾಗವನ್ನು ನಿರ್ವಾಹಕರು ಮಾತ್ರ ಪ್ರವೇಶಿಸಬಹುದು',
        createdAt: 'ಸದಸ್ಯತ್ವ ಪ್ರಾರಂಭ',
        actions: 'ಕ್ರಮಗಳು'
    }
};

const Settings = ({ onBack, lang = 'EN' }) => {
    const t = TRANSLATIONS[lang];

    // State
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [notification, setNotification] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        role: 'clerk'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState(null);

    // Fetch users on mount
    useEffect(() => {
        fetchUsers();
    }, []);

    // Auto-hide notifications
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/users');
            setUsers(response.data || []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            if (err.response?.status === 403) {
                setError(t.accessDenied);
            } else {
                setError(err.response?.data?.detail || t.error);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setFormError('Passwords do not match');
            return;
        }
        if (formData.password.length < 4) {
            setFormError('Password must be at least 4 characters');
            return;
        }

        try {
            setFormLoading(true);
            setFormError(null);

            await api.post('/users', {
                username: formData.username,
                password: formData.password,
                role: formData.role
            });

            setNotification({ type: 'success', message: t.success });
            setShowModal(false);
            setFormData({ username: '', password: '', confirmPassword: '', role: 'clerk' });
            fetchUsers();
        } catch (err) {
            console.error('Failed to create user:', err);
            setFormError(err.response?.data?.detail || t.error);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            await api.delete(`/users/${userId}`);
            setNotification({ type: 'success', message: t.success });
            setDeleteConfirm(null);
            fetchUsers();
        } catch (err) {
            console.error('Failed to delete user:', err);
            setNotification({ type: 'error', message: err.response?.data?.detail || t.error });
        }
    };

    const getRoleBadge = (role) => {
        const isAdmin = role?.toLowerCase() === 'admin';
        return (
            <span className={`
                inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                ${isAdmin
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }
            `}>
                {isAdmin ? <ShieldCheck size={12} /> : <Shield size={12} />}
                {isAdmin ? t.admin : t.clerk}
            </span>
        );
    };

    return (
        <div className="min-h-screen p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-3 rounded-2xl bg-white/70 backdrop-blur-md border border-temple-gold/20 
                                   hover:bg-temple-sand transition-all shadow-sm hover:shadow-md group"
                    >
                        <ArrowLeft size={20} className="text-temple-brown group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-black text-temple-brown flex items-center gap-3">
                            <UserCog className="text-temple-saffron" size={32} />
                            {t.title}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">{t.subtitle}</p>
                    </div>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold
                               bg-gradient-to-r from-temple-saffron to-temple-saffron-dark text-white
                               hover:shadow-lg hover:shadow-temple-saffron/30 hover:-translate-y-0.5
                               transition-all duration-300"
                >
                    <Plus size={20} />
                    {t.addUser}
                </button>
            </div>

            {/* Notification Toast */}
            {notification && (
                <div className={`
                    fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl
                    animate-in slide-in-from-right duration-300
                    ${notification.type === 'success'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    }
                `}>
                    {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    {notification.message}
                </div>
            )}

            {/* Main Content */}
            <div className="bg-white/70 backdrop-blur-md rounded-3xl border border-temple-gold/20 shadow-xl overflow-hidden">
                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 size={40} className="text-temple-saffron animate-spin mb-4" />
                        <p className="text-slate-500">{t.loading}</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
                            <Lock size={32} className="text-red-500" />
                        </div>
                        <p className="text-red-600 font-medium text-lg">{error}</p>
                    </div>
                )}

                {/* Users List */}
                {!loading && !error && (
                    <>
                        {users.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="w-20 h-20 rounded-full bg-temple-sand flex items-center justify-center mb-4">
                                    <Users size={32} className="text-temple-brown" />
                                </div>
                                <p className="text-slate-500">{t.noUsers}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-temple-gold/10">
                                {/* Table Header */}
                                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-temple-sand/50 text-xs font-black uppercase tracking-widest text-temple-brown">
                                    <div className="col-span-4">{t.username}</div>
                                    <div className="col-span-3">{t.role}</div>
                                    <div className="col-span-3">{t.createdAt}</div>
                                    <div className="col-span-2 text-right">{t.actions}</div>
                                </div>

                                {/* User Rows */}
                                {users.map((user) => (
                                    <div
                                        key={user.id}
                                        className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-temple-sand/20 transition-colors group"
                                    >
                                        <div className="col-span-4 flex items-center gap-3">
                                            <div className={`
                                                w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                                                ${user.role?.toLowerCase() === 'admin'
                                                    ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                                                    : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                                                }
                                            `}>
                                                {user.username?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{user.username}</p>
                                                <p className="text-xs text-slate-400">ID: {user.id}</p>
                                            </div>
                                        </div>
                                        <div className="col-span-3">
                                            {getRoleBadge(user.role)}
                                        </div>
                                        <div className="col-span-3 text-slate-500 text-sm">
                                            {user.created_at
                                                ? new Date(user.created_at).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })
                                                : '-'
                                            }
                                        </div>
                                        <div className="col-span-2 flex justify-end">
                                            <button
                                                onClick={() => setDeleteConfirm(user)}
                                                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 
                                                           transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Add User Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-temple-saffron to-temple-saffron-dark p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Plus size={24} />
                                    <h2 className="text-xl font-black">{t.addUser}</h2>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 rounded-xl hover:bg-white/20 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleCreateUser} className="p-6 space-y-5">
                            {formError && (
                                <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 text-sm">
                                    <AlertTriangle size={16} />
                                    {formError}
                                </div>
                            )}

                            {/* Username */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                                    {t.username}
                                </label>
                                <div className="relative">
                                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 
                                                   focus:border-temple-saffron focus:ring-2 focus:ring-temple-saffron/20 
                                                   outline-none transition-all"
                                        placeholder="Enter username"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                                    {t.password}
                                </label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 
                                                   focus:border-temple-saffron focus:ring-2 focus:ring-temple-saffron/20 
                                                   outline-none transition-all"
                                        placeholder="Enter password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                                    {t.confirmPassword}
                                </label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 
                                                   focus:border-temple-saffron focus:ring-2 focus:ring-temple-saffron/20 
                                                   outline-none transition-all"
                                        placeholder="Confirm password"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                                    {t.role}
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'clerk' })}
                                        className={`
                                            flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all font-bold
                                            ${formData.role === 'clerk'
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                            }
                                        `}
                                    >
                                        <Shield size={18} />
                                        {t.clerk}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'admin' })}
                                        className={`
                                            flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all font-bold
                                            ${formData.role === 'admin'
                                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                            }
                                        `}
                                    >
                                        <ShieldCheck size={18} />
                                        {t.admin}
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 
                                               hover:bg-slate-200 transition-colors"
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="flex-1 py-3 rounded-xl font-bold text-white 
                                               bg-gradient-to-r from-temple-saffron to-temple-saffron-dark
                                               hover:shadow-lg hover:shadow-temple-saffron/30 transition-all
                                               disabled:opacity-50 disabled:cursor-not-allowed
                                               flex items-center justify-center gap-2"
                                >
                                    {formLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                    {t.save}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={28} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">{t.delete}?</h3>
                            <p className="text-slate-500 mb-6">{t.deleteConfirm}</p>
                            <p className="font-bold text-red-600 mb-6">{deleteConfirm.username}</p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 
                                               hover:bg-slate-200 transition-colors"
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    onClick={() => handleDeleteUser(deleteConfirm.id)}
                                    className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500
                                               hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={16} />
                                    {t.delete}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
