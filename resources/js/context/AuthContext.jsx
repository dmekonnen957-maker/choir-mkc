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
        if (!permission) return false;
        if (roles.includes('super-admin') || roles.includes('admin') || user?.role === 'admin' || user?.role === 'super-admin') {
            return true;
        }
        if (permissions.includes(permission)) return true;

        // Permission aliases mapping
        const aliases = {
            'songs.update': ['songs.edit', 'songs.manage'],
            'songs.edit': ['songs.update', 'songs.manage'],
            'songs.create': ['songs.manage'],
            'songs.delete': ['songs.manage'],
            'songs.view': ['songs.view.all', 'songs.manage'],
            'lyrics.update': ['lyrics.edit', 'lyrics.manage'],
            'lyrics.edit': ['lyrics.update', 'lyrics.manage'],
            'lyrics.create': ['lyrics.manage'],
            'lyrics.delete': ['lyrics.manage'],
            'lyrics.view': ['lyrics.view.all', 'lyrics.manage'],
            'performances.update': ['performances.edit', 'performances.manage'],
            'performances.edit': ['performances.update', 'performances.manage'],
            'performances.create': ['performances.manage'],
            'performances.delete': ['performances.manage'],
            'rehearsals.update': ['rehearsals.edit', 'rehearsals.manage'],
            'rehearsals.edit': ['rehearsals.update', 'rehearsals.manage'],
            'rehearsals.create': ['rehearsals.manage'],
            'rehearsals.delete': ['rehearsals.manage'],
            'members.update': ['members.edit', 'members.manage'],
            'members.edit': ['members.update', 'members.manage'],
            'members.create': ['members.manage'],
            'members.delete': ['members.manage'],
        };

        const list = aliases[permission];
        if (list && list.some((p) => permissions.includes(p))) {
            return true;
        }

        return false;
    }, [permissions, roles, user]);

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
