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
import RegistrationPendingPage from './pages/RegistrationPendingPage';
import ProtectedRoute from './routes/ProtectedRoute';

import MemberLayout from './components/member/MemberLayout';
import MemberDashboard from './pages/member/MemberDashboard';
import MemberChoir from './pages/member/MemberChoir';
import MemberProfile from './pages/member/MemberProfile';
import MemberNotifications from './pages/member/MemberNotifications';
import MemberPlaceholder from './pages/member/MemberPlaceholder';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminRolesPage from './pages/admin/AdminRolesPage';
import AdminPermissionsPage from './pages/admin/AdminPermissionsPage';
import AdminMembersPage from './pages/admin/AdminMembersPage';

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
            <Route path="/registration-pending" element={<RegistrationPendingPage />} />

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

            {/* Admin area — protected, uses MemberLayout (sidebar + header) */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
                        <MemberLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<MemberPlaceholder title="Admin Dashboard" />} />
                <Route path="choirs" element={<MemberPlaceholder title="Choirs" />} />
                <Route path="members" element={<AdminMembersPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="users/:id" element={<AdminUsersPage />} />
                <Route path="roles" element={<AdminRolesPage />} />
                <Route path="roles/:id" element={<AdminRolesPage />} />
                <Route path="permissions" element={<AdminPermissionsPage />} />
                <Route path="permissions/:id" element={<AdminPermissionsPage />} />
                <Route path="choir" element={<MemberChoir />} />
                <Route path="profile" element={<MemberProfile />} />
                <Route path="notifications" element={<MemberNotifications />} />
                <Route path="songs" element={<MemberPlaceholder title="Songs" />} />
                <Route path="lyrics" element={<MemberPlaceholder title="Lyrics" />} />
                <Route path="rehearsals" element={<MemberPlaceholder title="Rehearsals" />} />
                <Route path="performances" element={<MemberPlaceholder title="Performances" />} />
                <Route path="calendar" element={<MemberPlaceholder title="Calendar" />} />
                <Route path="attendance" element={<MemberPlaceholder title="My Attendance" />} />
                <Route path="performance-attendance" element={<MemberPlaceholder title="Performance Attendance" />} />
                <Route path="my-performances" element={<MemberPlaceholder title="My Performances" />} />
                <Route path="settings" element={<MemberPlaceholder title="Settings" />} />
                <Route path="reports" element={<MemberPlaceholder title="Reports" />} />
                <Route path="choir-history" element={<MemberPlaceholder title="Choir History" />} />
                <Route path="activity-logs" element={<MemberPlaceholder title="Activity Logs" />} />
            </Route>

            {/* Team Leader area — protected, uses MemberLayout (sidebar + header) */}
            <Route
                path="/team-leader"
                element={
                    <ProtectedRoute allowedRoles={['team_leader']}>
                        <MemberLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<MemberPlaceholder title="Team Leader Dashboard" />} />
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

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}


