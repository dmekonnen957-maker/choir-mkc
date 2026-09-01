import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext(null);

const DEFAULT_THEME = {
    primary: '#2563eb',
    secondary: '#ffffff',
    primaryLight: '#3b82f6',
    primaryDark: '#1d4ed8',
    surface: '#f5f8fd',
    text: '#1c2026',
    textOnPrimary: '#ffffff',
    border: '#bfdbfe',
};

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
          }
        : null;
}

function getLuminance(r, g, b) {
    const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function getContrastTextColor(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return DEFAULT_THEME.text;
    const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
    return luminance > 0.5 ? '#1c2026' : '#ffffff';
}

function lightenColor(hex, amount = 0.2) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount));
    const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount));
    const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function darkenColor(hex, amount = 0.2) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const r = Math.max(0, Math.round(rgb.r * (1 - amount)));
    const g = Math.max(0, Math.round(rgb.g * (1 - amount)));
    const b = Math.max(0, Math.round(rgb.b * (1 - amount)));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function isValidHex(hex) {
    return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

function applyTheme(theme) {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-secondary', theme.secondary);
    root.style.setProperty('--theme-primary-light', theme.primaryLight);
    root.style.setProperty('--theme-primary-dark', theme.primaryDark);
    root.style.setProperty('--theme-surface', theme.surface);
    root.style.setProperty('--theme-text', theme.text);
    root.style.setProperty('--theme-text-on-primary', theme.textOnPrimary);
    root.style.setProperty('--theme-border', theme.border);

    root.style.setProperty('--color-blue-500', theme.primary);
    root.style.setProperty('--color-blue-600', theme.primary);
    root.style.setProperty('--color-blue-700', theme.primaryDark);
    root.style.setProperty('--color-blue-400', theme.primaryLight);
    root.style.setProperty('--color-blue-100', lightenColor(theme.primary, 0.85));
    root.style.setProperty('--color-blue-200', lightenColor(theme.primary, 0.65));
    root.style.setProperty('--color-blue-300', lightenColor(theme.primary, 0.45));
    root.style.setProperty('--color-blue-50', lightenColor(theme.primary, 0.95));
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(DEFAULT_THEME);
    const [loading, setLoading] = useState(true);

    const computeTheme = useCallback((primary, secondary) => {
        const validPrimary = isValidHex(primary) ? primary : DEFAULT_THEME.primary;
        const validSecondary = isValidHex(secondary) ? secondary : DEFAULT_THEME.secondary;

        const primaryLight = lightenColor(validPrimary, 0.3);
        const primaryDark = darkenColor(validPrimary, 0.2);
        const textOnPrimary = getContrastTextColor(validPrimary);

        return {
            primary: validPrimary,
            secondary: validSecondary,
            primaryLight,
            primaryDark,
            surface: '#f5f8fd',
            text: '#1c2026',
            textOnPrimary,
            border: lightenColor(validPrimary, 0.5),
        };
    }, []);

    const applyChoirTheme = useCallback((choir) => {
        if (choir?.uniform_primary_color && choir?.uniform_secondary_color) {
            const newTheme = computeTheme(choir.uniform_primary_color, choir.uniform_secondary_color);
            setTheme(newTheme);
            applyTheme(newTheme);
        } else {
            setTheme(DEFAULT_THEME);
            applyTheme(DEFAULT_THEME);
        }
        setLoading(false);
    }, [computeTheme]);

    const applyGlobalTheme = useCallback(() => {
        setTheme(DEFAULT_THEME);
        applyTheme(DEFAULT_THEME);
        setLoading(false);
    }, []);

    const resetTheme = useCallback(() => {
        applyGlobalTheme();
    }, [applyGlobalTheme]);

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--theme-primary', DEFAULT_THEME.primary);
        root.style.setProperty('--theme-secondary', DEFAULT_THEME.secondary);
        root.style.setProperty('--theme-primary-light', DEFAULT_THEME.primaryLight);
        root.style.setProperty('--theme-primary-dark', DEFAULT_THEME.primaryDark);
        root.style.setProperty('--theme-surface', DEFAULT_THEME.surface);
        root.style.setProperty('--theme-text', DEFAULT_THEME.text);
        root.style.setProperty('--theme-text-on-primary', DEFAULT_THEME.textOnPrimary);
        root.style.setProperty('--theme-border', DEFAULT_THEME.border);
        setLoading(false);
    }, []);

    return (
        <ThemeContext.Provider
            value={{
                theme,
                loading,
                applyChoirTheme,
                applyGlobalTheme,
                resetTheme,
                computeTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export default ThemeContext;