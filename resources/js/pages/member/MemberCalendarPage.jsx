import { useCallback } from 'react';
import { api } from '../../axios';
import CalendarPage from '../CalendarPage';
import { useLanguage } from '../../context/LanguageContext';

export default function MemberCalendarPage() {
    const { t } = useLanguage();
    const fetchEvents = useCallback((params) => {
        return api.get('/member/calendar', { params }).then((res) => res.data?.data ?? res.data);
    }, []);

    return (
        <CalendarPage
            fetchEvents={fetchEvents}
            role="member"
            pageTitle={t('calendar.title', 'Choir Schedule & Calendar')}
            pageSubtitle={t('calendar.subtitle', 'Unified calendar of worship events, practices, and choir milestones.')}
        />
    );
}