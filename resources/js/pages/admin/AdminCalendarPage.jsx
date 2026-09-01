import { useCallback } from 'react';
import { api } from '../../axios';
import CalendarPage from '../CalendarPage';

export default function AdminCalendarPage() {
    const fetchEvents = useCallback((params) => {
        return api.get('/admin/calendar', { params }).then((res) => res.data?.data ?? res.data);
    }, []);

    return (
        <CalendarPage
            fetchEvents={fetchEvents}
            role="admin"
            pageTitle="Calendar"
            pageSubtitle="All performances and rehearsals across your choirs."
        />
    );
}