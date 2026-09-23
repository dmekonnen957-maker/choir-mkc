import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../context/LanguageContext';

export default function LanguageSelector() {
    const { language, setLanguage, isAmharic, t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const activeLanguage = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className={`relative flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-colors duration-200 member-theme-control shadow-xs active:scale-95 ${
                    isOpen
                        ? 'border-blue-300 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                }`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={t('language.current', 'Current language: {label}. Select language.', { label: activeLanguage.label })}
                title={t('language.change', isAmharic ? 'ቋንቋ ቀይር' : 'Change Language')}
            >
                <span className="text-base leading-none" role="img" aria-hidden="true">
                    {activeLanguage.flag}
                </span>
                <span className="hidden sm:inline font-semibold">
                    {activeLanguage.nativeName}
                </span>
                <span className="inline sm:hidden font-semibold uppercase tracking-wider">
                    {activeLanguage.code}
                </span>
                <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
                />
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-44 origin-top-right rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-slate-900/5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 member-theme-control"
                    role="listbox"
                    aria-label={t('language.options', 'Language options')}
                >
                    <div className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                        {t('language.select', isAmharic ? 'ቋንቋ ይምረጡ' : 'Select Language')}
                    </div>
                    {SUPPORTED_LANGUAGES.map((lang) => {
                        const isSelected = language === lang.code;
                        return (
                            <button
                                key={lang.code}
                                type="button"
                                onClick={() => {
                                    setLanguage(lang.code);
                                    setIsOpen(false);
                                }}
                                role="option"
                                aria-selected={isSelected}
                                className={`flex w-full items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors ${
                                    isSelected
                                        ? 'bg-blue-50 text-blue-700 font-bold'
                                        : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="text-base leading-none" role="img" aria-hidden="true">
                                        {lang.flag}
                                    </span>
                                    <span>{lang.nativeName}</span>
                                    {lang.code === 'am' && (
                                        <span className="text-[10px] font-normal text-slate-400">
                                            {t('language.amharic', '(አማርኛ)')}
                                        </span>
                                    )}
                                </span>
                                {isSelected && (
                                    <Check size={14} className="text-blue-600 shrink-0 font-bold" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
