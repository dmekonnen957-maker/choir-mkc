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
            setUser(response.data.data.user);
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
        const { token, user: userData } = response.data.data;

        setToken(token, true);
        setUser(userData);
        setIsAuthenticated(true);

        return userData;
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
    const role = roles.includes('super-admin') || roles.includes('admin')
        ? 'admin'
        : roles.includes('team_leader')
            ? 'team_leader'
            : 'member';

    const choirs = user?.choirs ?? [];
    const primaryChoir = choirs.find((c) => c.status === 'active') ?? choirs[0] ?? null;

    const value = {
        user,
        roles,
        role,
        choirs,
        primaryChoir,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        refreshUser,
        hasRole: (r) => roles.includes(r),
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
