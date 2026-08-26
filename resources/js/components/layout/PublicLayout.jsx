import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import PublicHeader from '../public/PublicHeader';
import PublicFooter from '../public/PublicFooter';

export default function PublicLayout() {
    const location = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
    }, [location.pathname]);

    return (
        <div className="flex min-h-screen flex-col bg-white">
            <PublicHeader />
            <main key={location.pathname} className="flex-1">
                <Outlet />
            </main>
            <PublicFooter />
        </div>
    );
}
