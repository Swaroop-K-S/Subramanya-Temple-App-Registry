import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Flower, Lock, User, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { TRANSLATIONS } from './translations';
import { useAuth } from '../hooks/useAuth';

// ── Google "G" SVG logo (official colors) ─────────────────────────────────────
const GoogleLogo = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

const Login = ({ lang = 'EN' }) => {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.EN;
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const auth = useAuth();

    // ── Password Login ─────────────────────────────────────────────────────────
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Invalid credentials');
            }

            setSuccess(true);
            setTimeout(async () => {
                await auth.login();
                navigate('/dashboard');
            }, 800);

        } catch (err) {
            const msg = err?.message || (typeof err === 'string' ? err : 'Invalid credentials. Please try again.');
            setError(msg);
            setLoading(false);
        }
    };

    // ── Google OAuth Login ─────────────────────────────────────────────────────
    const handleGoogleSuccess = async (tokenResponse) => {
        setError('');
        setGoogleLoading(true);
        try {
            // useGoogleLogin (implicit flow) returns access_token, not credential
            const response = await fetch(`${API_BASE_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ access_token: tokenResponse.access_token }),
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 503) {
                    throw new Error('Google Sign-In is not configured yet. Ask the admin to set GOOGLE_CLIENT_ID.');
                }
                throw new Error(data.detail || 'Google authentication failed');
            }

            setSuccess(true);
            setTimeout(async () => {
                await auth.login();
                navigate('/dashboard');
            }, 800);

        } catch (err) {
            // Safely extract message from any error type
            const msg = err?.message || (typeof err === 'string' ? err : 'Google Sign-In failed. Please try again.');
            setError(msg);
            setGoogleLoading(false);
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: (err) => {
            console.error('Google OAuth error:', err);
            setError('Google Sign-In was cancelled. Please try again.');
            setGoogleLoading(false);
        },
        flow: 'implicit',   // returns id_token directly
        ux_mode: 'popup',
    });

    const isAnyLoading = loading || googleLoading;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #1a1040 40%, #0d1b40 70%, #1a0a00 100%)' }}>

            {/* Animated background orbs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)', filter: 'blur(60px)', animation: 'pulse 6s ease-in-out infinite' }} />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15"
                    style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', filter: 'blur(50px)', animation: 'pulse 8s 2s ease-in-out infinite' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-4"
                    style={{ animation: 'spin 60s linear infinite' }}>
                    <Flower size={800} className="text-amber-500/10" />
                </div>
            </div>

            <div className="w-full max-w-md relative z-10" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
                {/* Glass card */}
                <div className="relative rounded-3xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-2xl"
                    style={{ background: 'rgba(255,255,255,0.07)' }}>

                    {/* Top glossy sheen */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    <div className="absolute top-0 left-0 w-full h-40 pointer-events-none"
                        style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.06), transparent)' }} />

                    {/* ── HEADER ── */}
                    <div className="pt-10 pb-6 px-10 text-center">
                        {/* Icon */}
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-5 border border-amber-400/40 shadow-[0_0_40px_rgba(245,158,11,0.35)]"
                            style={{ background: 'rgba(245,158,11,0.15)', animation: 'float 3.5s ease-in-out infinite' }}>
                            <Flower className="w-9 h-9 text-amber-300 drop-shadow-lg" />
                        </div>

                        <h1 className="text-3xl font-black text-white font-heading tracking-wide mb-1 drop-shadow-md">
                            {t.starPortal || 'S.T.A.R. Portal'}
                        </h1>
                        <p className="text-amber-200/50 text-xs font-semibold tracking-[0.22em] uppercase">
                            {t.subramanyaTempleRegistry || 'Subramanya Temple Registry'}
                        </p>
                    </div>

                    {/* ── FORM ── */}
                    <div className="px-10 pb-8 space-y-5">

                        {/* Error */}
                        {error && (
                            <div className="flex items-start gap-2.5 bg-red-500/15 border border-red-500/40 p-3.5 rounded-xl text-sm text-red-200 backdrop-blur-sm">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-4">
                            {/* Username */}
                            <div className="relative group">
                                <div className="absolute left-4 top-3.5 pointer-events-none">
                                    <User className="h-5 w-5 text-amber-400/60 group-focus-within:text-amber-400 transition-colors" />
                                </div>
                                <input
                                    id="login-username"
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder={t.username || 'Username'}
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                                    style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    disabled={isAnyLoading}
                                />
                            </div>

                            {/* Password */}
                            <div className="relative group">
                                <div className="absolute left-4 top-3.5 pointer-events-none">
                                    <Lock className="h-5 w-5 text-amber-400/60 group-focus-within:text-amber-400 transition-colors" />
                                </div>
                                <input
                                    id="login-password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t.password || 'Password'}
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                                    style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    disabled={isAnyLoading}
                                />
                            </div>

                            {/* Sign In button */}
                            <button
                                id="login-submit-btn"
                                type="submit"
                                disabled={isAnyLoading}
                                className="w-full relative group overflow-hidden py-3.5 rounded-xl font-bold text-sm tracking-wider text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{
                                    background: success
                                        ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                                        : 'linear-gradient(135deg, #f59e0b, #ea580c)',
                                    boxShadow: '0 8px 32px -8px rgba(245,158,11,0.5)',
                                }}
                            >
                                <div className="relative z-10 flex items-center justify-center gap-2">
                                    {success ? (
                                        <><CheckCircle2 className="w-5 h-5" /><span>{t.accessGranted || 'Access Granted'}</span></>
                                    ) : loading ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /><span className="tracking-widest opacity-90">{t.verifying || 'VERIFYING...'}</span></>
                                    ) : (
                                        <><span>{t.startSession || 'Sign In'}</span><ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                                    )}
                                </div>
                                {/* Shine */}
                                {!loading && !success && (
                                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                                )}
                            </button>
                        </form>

                        {/* ── DIVIDER ── */}
                        <div className="flex items-center gap-3 py-1">
                            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                            <span className="text-[11px] text-white/30 font-semibold uppercase tracking-widest whitespace-nowrap">or continue with</span>
                            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                        </div>

                        {/* ── GOOGLE BUTTON ── */}
                        <button
                            id="google-signin-btn"
                            type="button"
                            onClick={() => { setError(''); setGoogleLoading(true); googleLogin(); }}
                            disabled={isAnyLoading || success}
                            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm text-white/90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
                            style={{
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                backdropFilter: 'blur(10px)',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                        >
                            {googleLoading ? (
                                <><Loader2 className="w-5 h-5 animate-spin text-white/70" /><span className="tracking-widest text-xs opacity-80">SIGNING IN...</span></>
                            ) : (
                                <><GoogleLogo /><span>Sign in with Google</span></>
                            )}
                        </button>

                        {/* Sign-up hint */}
                        <p className="text-center text-[11px] text-white/25 leading-relaxed">
                            New to S.T.A.R.? Click <span className="text-amber-400/60 font-semibold">Sign in with Google</span> above — your account will be created automatically.
                        </p>
                    </div>

                    {/* ── FOOTER ── */}
                    <div className="px-10 py-4 flex justify-between items-center text-[10px] text-white/25"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
                        <span className="font-mono tracking-widest">V 2.0.0 (OMNI)</span>
                        <div className="flex gap-1.5 items-center">
                            <Lock className="w-3 h-3" />
                            <span>{t.encryptedProtocol || 'Encrypted Protocol'}</span>
                        </div>
                    </div>
                </div>

                {/* Default credentials hint (dev only) */}
                {import.meta.env.DEV && (
                    <div className="mt-4 p-3 rounded-xl text-center text-xs text-amber-200/50 border border-amber-500/10"
                        style={{ background: 'rgba(245,158,11,0.05)' }}>
                        <span className="font-mono">admin</span> / <span className="font-mono">admin123</span>
                        <span className="ml-2 text-white/20">· dev mode</span>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50%      { transform: translateY(-8px); }
                }
            `}</style>
        </div>
    );
};

export default Login;
