import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken, clearToken } from '../axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const refreshUser = useCallback(async () => {
        if (!getToken()) {
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
            return;
        }

        try {
            const response = await api.get('/auth/me');
            const userData = response.data?.data?.user || response.data?.data;
            setUser(userData);
            setIsAuthenticated(true);
        } catch {
            setUser(null);
            setIsAuthenticated(false);
            clearToken();
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const login = useCallback(async (credentials, remember = false) => {
        const response = await api.post('/auth/login', credentials);
        const { token, user: userData } = response.data.data;

        setToken(token, remember);
        setUser(userData);
        setIsAuthenticated(true);

        return userData;
    }, []);

    const register = useCallback(async (payload) => {
        const response = await api.post('/auth/register', payload);
        return response.data;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // ignore network errors on logout
        } finally {
            clearToken();
            setUser(null);
            setIsAuthenticated(false);
        }
    }, []);

    const roles = user?.roles ?? [];
    const role = roles.includes('super-admin') || roles.includes('admin') || user?.role === 'admin' || user?.role === 'super-admin'
        ? 'admin'
        : roles.includes('team_leader') || user?.role === 'team_leader'
            ? 'team_leader'
            : 'member';

    const permissions = user?.permissions ?? [];
    const choirs = user?.choirs ?? [];
    const primaryChoir = user?.choir ?? choirs.find((c) => c.status === 'active') ?? choirs[0] ?? null;

    const can = useCallback((permission) => {
        return permissions.includes(permission);
    }, [permissions]);

    const value = {
        user,
        roles,
        role,
        permissions,
        choirs,
        primaryChoir,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        refreshUser,
        hasRole: (r) => roles.includes(r) || user?.role === r,
        can,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
