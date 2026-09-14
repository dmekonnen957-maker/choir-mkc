import { translationsEn, translationsAm } from '../context/LanguageContext';

function toDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

export function localizedDate(value, language = 'en') {
    const d = toDate(value);
    if (!d) return '';
    const months = (language === 'am' ? translationsAm : translationsEn)['common.monthNames'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function localizedShortDate(value, language = 'en') {
    const d = toDate(value);
    if (!d) return '';
    const months = (language === 'am' ? translationsAm : translationsEn)['common.monthShort'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}