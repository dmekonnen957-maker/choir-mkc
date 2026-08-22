import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout';
import AuthLayout from './components/layout/AuthLayout';
import HomePage from './pages/HomePage';
import ChoirsPage from './pages/ChoirsPage';
import ChoirDetailPage from './pages/ChoirDetailPage';
import ChoirHistoryPage from './pages/ChoirHistoryPage';
import SongsPage from './pages/SongsPage';
import SongDetailPage from './pages/SongDetailPage';
import PerformancesPage from './pages/PerformancesPage';
import PerformanceDetailPage from './pages/PerformanceDetailPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './routes/ProtectedRoute';

import MemberLayout from './components/member/MemberLayout';
import MemberDashboard from './pages/member/MemberDashboard';
import MemberChoir from './pages/member/MemberChoir';
import MemberProfile from './pages/member/MemberProfile';
import MemberNotifications from './pages/member/MemberNotifications';
import MemberPlaceholder from './pages/member/MemberPlaceholder';

export default function App() {
    return (
        <Routes>
            <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/choirs" element={<ChoirsPage />} />
                <Route path="/choirs/:id" element={<ChoirDetailPage />} />
                <Route path="/choirs/:id/history" element={<ChoirHistoryPage />} />
                <Route path="/songs" element={<SongsPage />} />
                <Route path="/songs/:id" element={<SongDetailPage />} />
                <Route path="/performances" element={<PerformancesPage />} />
                <Route path="/performances/:id" element={<PerformanceDetailPage />} />
                <Route path="/history" element={<HistoryPage />} />
            </Route>

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
                path="/member"
                element={
                    <ProtectedRoute allowedRoles={['member']}>
                        <MemberLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<MemberDashboard />} />
                <Route path="choir" element={<MemberChoir />} />
                <Route path="profile" element={<MemberProfile />} />
                <Route path="notifications" element={<MemberNotifications />} />
                <Route path="songs" element={<MemberPlaceholder title="Songs" />} />
                <Route path="lyrics" element={<MemberPlaceholder title="Lyrics" />} />
                <Route path="rehearsals" element={<MemberPlaceholder title="Rehearsals" />} />
                <Route path="performances" element={<MemberPlaceholder title="Performances" />} />
                <Route path="calendar" element={<MemberPlaceholder title="Calendar" />} />
                <Route path="attendance" element={<MemberPlaceholder title="My Attendance" />} />
                <Route path="my-performances" element={<MemberPlaceholder title="My Performances" />} />
                <Route path="settings" element={<MemberPlaceholder title="Settings" />} />
            </Route>

            {/* Future areas — placeholders only, not built in this phase. */}
            <Route path="/admin/dashboard" element={<MemberPlaceholder title="Admin Dashboard" />} />
            <Route path="/team-leader/dashboard" element={<MemberPlaceholder title="Team Leader Dashboard" />} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
