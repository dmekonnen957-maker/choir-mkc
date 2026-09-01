import { useCallback } from 'react';
import { api } from '../../axios';
import CalendarPage from '../CalendarPage';

export default function TeamLeaderCalendarPage() {
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
            pageTitle="Calendar"
            pageSubtitle="Performances and rehearsals for your choir."
        />
    );
}