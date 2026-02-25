/**
 * useAuth Hook - Authentication Context & Hook
 * ==============================================
 * Centralizes auth state (user, login, logout) so all components
 * can access it without prop drilling.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [user, setUser] = useState(null);

    // Check session on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await api.get('/users/me');
                setUser(response.data);
                setIsAuthenticated(true);
            } catch {
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setAuthLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = useCallback(async () => {
        // After successful login (cookie is set), fetch user profile
        try {
            const response = await api.get('/users/me');
            setUser(response.data);
            setIsAuthenticated(true);
        } catch {
            setUser(null);
            setIsAuthenticated(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post('/logout');
        } catch (err) {
            console.error('Logout error:', err);
        }
        setIsAuthenticated(false);
        setUser(null);
    }, []);

    // Listen for 401 unauthorized events (from api.js interceptor)
    useEffect(() => {
        const handleUnauthorized = () => {
            if (isAuthenticated) {
                logout();
            }
        };
        window.addEventListener('unauthorized', handleUnauthorized);
        return () => window.removeEventListener('unauthorized', handleUnauthorized);
    }, [isAuthenticated, logout]);

    // RBAC helper
    const canAccess = useCallback((page) => {
        if (!user?.role) return false;
        if (user.role === 'admin') return true;
        // Clerk can access these pages
        return ['home', 'panchangam', 'shaswata', 'dispatch'].includes(page);
    }, [user]);

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            authLoading,
            user,
            login,
            logout,
            canAccess,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default useAuth;
