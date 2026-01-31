import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
// import { API_BASE_URL } from '../config'; 
const API_BASE_URL = 'http://127.0.0.1:8000';

const Login = ({ setToken }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Invalid credentials');
            }

            // Success: Save token and redirect
            localStorage.setItem('access_token', data.access_token);
            setToken(data.access_token); // Update parent state immediately
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background with Overlay is handled by main index.css (body styles), 
          but if this is a standalone route, we ensure the theme persists 
          or add a specific container if needed. 
          Assuming the global body background from index.css applies here.
      */}

            <div className="w-full max-w-md animate-fade-in-up">
                {/* Divine Card */}
                <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 overflow-hidden">

                    {/* Header - Saffron/Orange Gradient */}
                    <div className="bg-gradient-to-r from-orange-500 to-red-600 p-8 text-center relative">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-4 border-2 border-white/30 shadow-inner">
                            <Flame className="w-8 h-8 text-white animate-pulse" />
                        </div>

                        <h1 className="text-2xl font-bold text-white font-heading tracking-wide">
                            S.T.A.R. Secure Access
                        </h1>
                        <p className="text-orange-100 text-sm mt-1 font-medium">
                            Temple Office Portal
                        </p>
                    </div>

                    {/* Login Form */}
                    <div className="p-8">
                        <form onSubmit={handleLogin} className="space-y-6">

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r text-sm text-red-700 font-medium animate-pulse">
                                    {error}
                                </div>
                            )}

                            {/* Username Input */}
                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-gray-700">Username</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all outline-none font-medium"
                                        placeholder="Enter admin ID"
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-gray-700">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all outline-none font-medium"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center py-3 px-4 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold tracking-wide shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        Enter Temple Office
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                        <span>&copy; 2026 S.T.A.R.</span>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Secure Connection</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Text */}
                <p className="text-center text-white/80 text-sm mt-6 font-medium shadow-black drop-shadow-md">
                    Restricted access for authorized personnel only.
                </p>
            </div>
        </div>
    );
};

export default Login;
