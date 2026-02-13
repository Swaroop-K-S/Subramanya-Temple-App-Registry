import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flower, Lock, User, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

const Login = ({ setToken }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Invalid credentials');
            }

            // Success Animation Trigger
            setSuccess(true);
            setTimeout(() => {
                localStorage.setItem('access_token', data.access_token);
                setToken(data.access_token);
                navigate('/dashboard');
            }, 800);

        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900">
            {/* LARGE WATERMARK BACKGROUND */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 animate-pulse-slow">
                <Flower size={600} className="text-amber-500" />
            </div>

            <div className="w-full max-w-md relative z-10 animate-fade-in-up">
                {/* DEEP GLASS CARD */}
                <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative">

                    {/* Glossy Reflection Effect */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

                    {/* Header */}
                    <div className="p-10 pb-0 text-center relative z-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/20 backdrop-blur-md mb-6 border border-amber-400/50 shadow-[0_0_30px_rgba(245,158,11,0.3)] animate-float">
                            <Flower className="w-10 h-10 text-amber-300 drop-shadow-lg" />
                        </div>

                        <h1 className="text-3xl font-black text-white font-heading tracking-wide mb-2 drop-shadow-md">
                            S.T.A.R. Portal
                        </h1>
                        <p className="text-amber-100/70 text-sm font-medium tracking-widest uppercase">
                            Subramanya Temple Registry
                        </p>
                    </div>

                    {/* Form */}
                    <div className="p-10 pt-8">
                        <form onSubmit={handleLogin} className="space-y-6">

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-xl text-sm text-red-200 font-medium animate-shake backdrop-blur-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> {error}
                                </div>
                            )}

                            {/* Floating Label Input - Username */}
                            <div className="relative group">
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="peer w-full pl-12 pr-4 py-3.5 bg-black/20 hover:bg-black/30 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all shadow-inner"
                                    placeholder="Username"
                                />
                                <label className="absolute left-12 top-3.5 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-amber-400 peer-focus:bg-slate-900 peer-focus:px-1 peer-focus:rounded-sm cursor-text">
                                    Username
                                </label>
                                <User className="absolute left-4 top-3.5 h-5 w-5 text-gray-500 group-hover:text-amber-400 peer-focus:text-amber-400 transition-colors" />
                            </div>

                            {/* Floating Label Input - Password */}
                            <div className="relative group">
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="peer w-full pl-12 pr-4 py-3.5 bg-black/20 hover:bg-black/30 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all shadow-inner"
                                    placeholder="Password"
                                />
                                <label className="absolute left-12 top-3.5 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-amber-400 peer-focus:bg-slate-900 peer-focus:px-1 peer-focus:rounded-sm cursor-text">
                                    Password
                                </label>
                                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-500 group-hover:text-amber-400 peer-focus:text-amber-400 transition-colors" />
                            </div>

                            {/* Mystic Action Button */}
                            <button
                                type="submit"
                                disabled={loading || success}
                                className={`w-full relative group overflow-hidden py-4 rounded-xl font-bold tracking-wide shadow-[0_10px_30px_-10px_rgba(245,158,11,0.5)] transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300
                                    ${success
                                        ? "bg-green-500 text-white ring-4 ring-green-500/30"
                                        : "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-[0_0_20px_rgba(245,158,11,0.6)] ring-1 ring-white/20"}
                                `}
                            >
                                <div className="relative z-10 flex items-center justify-center gap-2">
                                    {loading ? (
                                        success ? (
                                            <>
                                                <CheckCircle2 className="w-6 h-6 animate-bounce" />
                                                <span className="text-lg">Access Granted</span>
                                            </>
                                        ) : (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span className="tracking-widest opacity-90">VERIFYING...</span>
                                            </>
                                        )
                                    ) : (
                                        <>
                                            <span>Start Session</span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </div>

                                {/* Shine Effect */}
                                {!loading && !success && (
                                    <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 group-hover:animate-shine" />
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="px-10 py-5 bg-black/20 border-t border-white/5 flex justify-between items-center text-xs text-amber-100/40">
                        <span className="font-mono tracking-widest">V 2.0.0 (OMNI)</span>
                        <div className="flex gap-2 items-center">
                            <Lock className="w-3 h-3" /> Encrypted Protocol
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
