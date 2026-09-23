import { useCallback } from 'react';
import { api } from '../../axios';
import CalendarPage from '../CalendarPage';
import { useLanguage } from '../../context/LanguageContext';

export default function TeamLeaderCalendarPage() {
    const { t } = useLanguage();
    const fetchEvents = useCallback((params) => {
        return api.get('/team-leader/calendar', { params }).then((res) => {
            const { events = [], choir = null } = res.data?.data ?? res.data ?? {};
            return { events, choirs: choir ? [choir] : [] };
        });
    }, []);

    return (
        <CalendarPage
            fetchEvents={fetchEvents}
            role="team_leader"
            pageTitle={t('calendar.title', 'Choir Schedule & Calendar')}
            pageSubtitle={t('calendar.subtitle', 'Unified calendar of worship events, practices, and choir milestones.')}
        />
    );
}