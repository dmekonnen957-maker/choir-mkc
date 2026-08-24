import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { isAuthenticated, loading, role } = useAuth();
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

    if (allowedRoles && !allowedRoles.includes(role)) {
        if (role === 'admin') {
            return <Navigate to="/admin/dashboard" replace />;
        }
        if (role === 'team_leader') {
            return <Navigate to="/team-leader/dashboard" replace />;
        }
        if (role === 'member') {
            return <Navigate to="/member/dashboard" replace />;
        }
        return <Navigate to="/" replace />;
    }

    return children;
}
