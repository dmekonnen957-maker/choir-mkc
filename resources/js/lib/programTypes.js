export const PROGRAM_TYPES = [
    'All Program Types',
    'Worship',
    'Worship Night',
    'Concert',
    'Special Program',
    'Sunday Service',
    'Christmas',
    'Easter',
    'Youth',
    'Choir Presentation',
    'Other',
];

export function programTypeLabel(type, t) {
    const map = {
        'All Program Types': t('perf.allTypes'),
        'Worship': t('perf.tWorship'),
        'Worship Night': t('perf.tWorshipNight'),
        'Concert': t('perf.tConcert'),
        'Special Program': t('perf.tSpecial'),
        'Sunday Service': t('perf.tSunday'),
        'Christmas': t('perf.tChristmas'),
        'Easter': t('perf.tEaster'),
        'Youth': t('perf.tYouth'),
        'Choir Presentation': t('perf.tPresentation'),
        'Other': t('perf.tOther'),
    };
    return map[type] || type;
}