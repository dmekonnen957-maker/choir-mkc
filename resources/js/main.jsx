import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ChoirProvider } from './context/ChoirContext';
import { LanguageProvider } from './context/LanguageContext';

createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <LanguageProvider>
                <ThemeProvider>
                    <AuthProvider>
                        <ChoirProvider>
                            <App />
                        </ChoirProvider>
                    </AuthProvider>
                </ThemeProvider>
            </LanguageProvider>
        </BrowserRouter>
    </React.StrictMode>,
);
