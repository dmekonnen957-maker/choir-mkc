import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES, useLanguage } from '../../context/LanguageContext';

export default function LanguageSelector({ compact = false }) {
    const { language, setLanguage, t } = useLanguage();
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    const current = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const selectLanguage = (code) => {
        setLanguage(code);
        setOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-label={t('common.switchLanguage')}
                aria-expanded={open}
                title={t('common.language')}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-slate-600 shadow-xs transition-colors duration-200 hover:bg-slate-50 hover:text-blue-600"
            >
                <Globe size={18} />
                {!compact && (
                    <>
                        <span className="text-xs font-bold uppercase">{language}</span>
                        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                    </>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-2xl z-50 ring-1 ring-slate-900/5 animate-in fade-in slide-in-from-top-2 duration-150">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            type="button"
                            onClick={() => selectLanguage(lang.code)}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                                lang.code === language
                                    ? 'bg-blue-50 font-bold text-blue-700'
                                    : 'text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <span className="text-base leading-none">{lang.flag}</span>
                            <span className="flex-1 text-left">{lang.nativeName || lang.label}</span>
                            {lang.code === language && <Check size={15} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}