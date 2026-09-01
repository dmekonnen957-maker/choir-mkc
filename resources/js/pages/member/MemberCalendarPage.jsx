import { useCallback } from 'react';
import { api } from '../../axios';
import CalendarPage from '../CalendarPage';

export default function MemberCalendarPage() {
    const fetchEvents = useCallback((params) => {
        return api.get('/member/calendar', { params }).then((res) => res.data?.data ?? res.data);
    }, []);

    return (
        <CalendarPage
            fetchEvents={fetchEvents}
            role="member"
            pageTitle="Calendar"
            pageSubtitle="Your choir's performances and rehearsals."
        />
    );
}