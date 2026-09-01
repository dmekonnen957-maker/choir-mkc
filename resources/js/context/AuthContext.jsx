import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { api, getToken, setToken, clearToken } from '../axios';
import { useTheme } from './ThemeContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { applyChoirTheme, applyGlobalTheme } = useTheme();

    const refreshUser = useCallback(async () => {
        if (!getToken()) {
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
            applyGlobalTheme();
            return;
        }

        try {
            const response = await api.get('/auth/me');
            const userData = response.data?.data?.user || response.data?.data;
            setUser(userData);
            setIsAuthenticated(true);
            
            // Apply choir theme based on user's primary choir
            const primaryChoir = userData?.choir ?? 
                userData?.choirs?.find((c) => c.status === 'active') ?? 
                userData?.choirs?.[0] ?? null;
            
            if (primaryChoir?.uniform_primary_color && primaryChoir?.uniform_secondary_color) {
                applyChoirTheme(primaryChoir);
            } else {
                applyGlobalTheme();
            }
        } catch {
            setUser(null);
            setIsAuthenticated(false);
            clearToken();
            applyGlobalTheme();
        } finally {
            setLoading(false);
        }
    }, [applyChoirTheme, applyGlobalTheme]);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const login = useCallback(async (credentials, remember = false) => {
        const response = await api.post('/auth/login', credentials);
        const { token, user: userData } = response.data.data;

        setToken(token, remember);
        setUser(userData);
        setIsAuthenticated(true);

        // Apply choir theme after login
        const primaryChoir = userData?.choir ?? 
            userData?.choirs?.find((c) => c.status === 'active') ?? 
            userData?.choirs?.[0] ?? null;
        
        if (primaryChoir?.uniform_primary_color && primaryChoir?.uniform_secondary_color) {
            applyChoirTheme(primaryChoir);
        } else {
            applyGlobalTheme();
        }

        return userData;
    }, [applyChoirTheme, applyGlobalTheme]);

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
            applyGlobalTheme();
        }
    }, [applyGlobalTheme]);

    const roles = useMemo(() => user?.roles ?? [], [user]);
    const role = useMemo(() => {
        if (roles.includes('super-admin') || roles.includes('admin') || user?.role === 'admin' || user?.role === 'super-admin') return 'admin';
        if (roles.includes('team_leader') || user?.role === 'team_leader') return 'team_leader';
        return 'member';
    }, [roles, user]);

    const permissions = useMemo(() => user?.permissions ?? [], [user]);
    const choirs = useMemo(() => user?.choirs ?? [], [user]);
    const primaryChoir = useMemo(() => {
        return user?.choir ?? choirs.find((c) => c.status === 'active') ?? choirs[0] ?? null;
    }, [user, choirs]);

    const can = useCallback((permission) => {
        if (role === 'admin') return true;
        return permissions.includes(permission);
    }, [permissions, role]);

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
