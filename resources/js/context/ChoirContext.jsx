import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../axios';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';

const ChoirContext = createContext(null);

const SESSION_KEY = 'mkc_selected_choir_id';

export function ChoirProvider({ children }) {
    const { user, role, primaryChoir, isAuthenticated } = useAuth();
    const { applyChoirTheme, applyGlobalTheme } = useTheme();

    const isAdmin = role === 'admin' || role === 'super-admin';
    const isTeamLeader = role === 'team_leader';

    // All choirs accessible to this user
    const [choirs, setChoirs] = useState([]);
    // The currently selected choir (null = All Choirs for admin)
    const [currentChoir, setCurrentChoirState] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch accessible choirs list (admin/team-leader only)
    const fetchChoirs = useCallback(async () => {
        if (!isAuthenticated) return [];
        try {
            const res = await api.get('/choirs', { params: { per_page: 200 } });
            return res.data?.data?.items ?? res.data?.data ?? [];
        } catch {
            return [];
        }
    }, [isAuthenticated]);

    // Apply theme when choir changes
    const applyThemeForChoir = useCallback((choir) => {
        if (choir?.uniform_primary_color && choir?.uniform_secondary_color) {
            applyChoirTheme(choir);
        } else {
            applyGlobalTheme();
        }
    }, [applyChoirTheme, applyGlobalTheme]);

    // Public setter — only admin / team leader can actually change it
    const setCurrentChoir = useCallback((choir) => {
        if (!isAdmin && !isTeamLeader) return; // members cannot switch
        setCurrentChoirState(choir);
        applyThemeForChoir(choir);
        // Persist for admins
        if (isAdmin) {
            if (choir?.id) {
                sessionStorage.setItem(SESSION_KEY, String(choir.id));
            } else {
                sessionStorage.removeItem(SESSION_KEY);
            }
        }
    }, [isAdmin, isTeamLeader, applyThemeForChoir]);

    // Initialise context once auth is ready
    useEffect(() => {
        if (!isAuthenticated || !user) {
            setCurrentChoirState(null);
            setChoirs([]);
            setLoading(false);
            return;
        }

        let cancelled = false;

        const init = async () => {
            setLoading(true);

            if (isAdmin) {
                // Admin: fetch full choir list, restore saved selection
                const list = await fetchChoirs();
                if (cancelled) return;
                setChoirs(list);

                const savedId = sessionStorage.getItem(SESSION_KEY);
                if (savedId) {
                    const saved = list.find((c) => String(c.id) === savedId) ?? null;
                    setCurrentChoirState(saved);
                    applyThemeForChoir(saved);
                } else {
                    // Default = All Choirs (null)
                    setCurrentChoirState(null);
                    applyGlobalTheme();
                }
            } else if (isTeamLeader) {
                // Team leader: fetch their assigned choirs, auto-select first
                const list = await fetchChoirs();
                if (cancelled) return;
                setChoirs(list);

                const savedId = sessionStorage.getItem(SESSION_KEY);
                const saved = savedId ? list.find((c) => String(c.id) === savedId) : null;
                const chosen = saved ?? list[0] ?? primaryChoir ?? null;
                setCurrentChoirState(chosen);
                applyThemeForChoir(chosen);
            } else {
                // Member: locked to primaryChoir from auth
                const choir = primaryChoir ?? null;
                setCurrentChoirState(choir);
                setChoirs(choir ? [choir] : []);
                applyThemeForChoir(choir);
            }

            if (!cancelled) setLoading(false);
        };

        init();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, user, isAdmin, isTeamLeader, primaryChoir, fetchChoirs, applyThemeForChoir, applyGlobalTheme]);

    const value = {
        currentChoir,
        setCurrentChoir,
        choirs,
        loading,
        isAllChoirs: isAdmin && currentChoir === null,
    };

    return <ChoirContext.Provider value={value}>{children}</ChoirContext.Provider>;
}

export function useChoir() {
    const context = useContext(ChoirContext);
    if (!context) {
        throw new Error('useChoir must be used within a ChoirProvider');
    }
    return context;
}

export default ChoirContext;
