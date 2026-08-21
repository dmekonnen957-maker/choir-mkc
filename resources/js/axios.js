import axios from 'axios';

const API_URL = '/api';

const TOKEN_KEYS = ['cmkc_token', 'cmkc_token_temp'];

export function getToken() {
    for (const key of TOKEN_KEYS) {
        const value =
            typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
        if (value) return value;
        const sessionValue =
            typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null;
        if (sessionValue) return sessionValue;
    }
    return null;
}

export function setToken(token, remember = true) {
    if (remember) {
        localStorage.setItem('cmkc_token', token);
    } else {
        sessionStorage.setItem('cmkc_token_temp', token);
    }
}

export function clearToken() {
    localStorage.removeItem('cmkc_token');
    sessionStorage.removeItem('cmkc_token_temp');
}

const api = axios.create({
    baseURL: API_URL,
    headers: {
        Accept: 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

function normalizeError(error) {
    const status = error.response?.status ?? 0;
    const data = error.response?.data ?? {};

    if (!error.response) {
        return {
            status: 0,
            message: 'Unable to reach the server. Check your connection and try again.',
            errors: null,
        };
    }

    let message = data.message ?? 'Something went wrong. Please try again.';
    const url = error.config?.url ?? '';

    if (status === 401) {
        message = url.includes('/auth/login')
            ? 'Invalid email or password.'
            : 'Your session has expired. Please sign in again.';
    } else if (status === 403) {
        message = data.message ?? "You don't have permission to do that.";
    } else if (status === 404) {
        message = data.message ?? 'The requested resource was not found.';
    } else if (status === 422) {
        message = data.message ?? 'Please check the highlighted fields.';
    } else if (status === 429) {
        message = 'Too many attempts. Please wait a moment and try again.';
    } else if (status >= 500) {
        message = 'Something went wrong. Please try again.';
    }

    return {
        status,
        message,
        errors: data.errors ?? null,
    };
}

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const normalized = normalizeError(error);
        const url = error.config?.url ?? '';

        if (normalized.status === 401 && !url.includes('/auth/login')) {
            clearToken();
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                window.location.href = '/login';
            }
        }

        return Promise.reject(normalized);
    },
);

export { api };
export default api;
