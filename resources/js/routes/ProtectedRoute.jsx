import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function ProtectedRoute({ children, allowedAreas, allowedPermissions }) {
    const { isAuthenticated, loading, area, can } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-surface">
                <LoadingSpinner size={40} />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // Check area-based access
    if (allowedAreas && !allowedAreas.includes(area)) {
        // Redirect to appropriate dashboard based on user's area
        if (area === 'admin') {
            return <Navigate to="/admin/dashboard" replace />;
        }
        if (area === 'team_leader') {
            return <Navigate to="/team-leader/dashboard" replace />;
        }
        if (area === 'musician') {
            return <Navigate to="/musician/dashboard" replace />;
        }
        if (area === 'member') {
            return <Navigate to="/member/dashboard" replace />;
        }
        return <Navigate to="/" replace />;
    }

    // Check permission-based access
    if (allowedPermissions && !allowedPermissions.some(p => can(p))) {
        // Redirect to appropriate dashboard based on user's area
        if (area === 'admin') {
            return <Navigate to="/admin/dashboard" replace />;
        }
        if (area === 'team_leader') {
            return <Navigate to="/team-leader/dashboard" replace />;
        }
        if (area === 'musician') {
            return <Navigate to="/musician/dashboard" replace />;
        }
        if (area === 'member') {
            return <Navigate to="/member/dashboard" replace />;
        }
        return <Navigate to="/" replace />;
    }

    return children;
}
