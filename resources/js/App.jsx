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
import TeamLeaderDashboard from './pages/team-leader/TeamLeaderDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminRolesPage from './pages/admin/AdminRolesPage';
import AdminMembersPage from './pages/admin/AdminMembersPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminChoirsPage from './pages/admin/AdminChoirsPage';
import AdminChoirFormPage from './pages/admin/AdminChoirFormPage';
import AdminChoirDetailPage from './pages/admin/AdminChoirDetailPage';
import AdminSongsPage from './pages/admin/AdminSongsPage';
import AdminSongFormPage from './pages/admin/AdminSongFormPage';
import AdminSongDetailPage from './pages/admin/AdminSongDetailPage';
import AdminAttendancePage from './pages/admin/AdminAttendancePage';
import MemberAttendancePage from './pages/member/MemberAttendancePage';

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

            {/* Member Area */}
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
                <Route path="rehearsals" element={<MemberPlaceholder title="Rehearsals" />} />
                <Route path="performances" element={<MemberPlaceholder title="Performances" />} />
                <Route path="calendar" element={<MemberPlaceholder title="Calendar" />} />
                <Route path="attendance" element={<MemberAttendancePage />} />
                <Route path="my-performances" element={<MemberPlaceholder title="My Performances" />} />
                <Route path="settings" element={<MemberPlaceholder title="Settings" />} />
            </Route>

            {/* Admin Area */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
                        <MemberLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="choirs" element={<AdminChoirsPage />} />
                <Route path="choirs/create" element={<AdminChoirFormPage mode="create" />} />
                <Route path="choirs/:id" element={<AdminChoirDetailPage />} />
                <Route path="choirs/:id/edit" element={<AdminChoirFormPage mode="edit" />} />
                <Route path="members" element={<AdminMembersPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="users/:id" element={<AdminUsersPage />} />
                <Route path="roles" element={<AdminRolesPage />} />
                <Route path="roles/:id" element={<AdminRolesPage />} />
                <Route path="choir" element={<MemberChoir />} />
                <Route path="profile" element={<MemberProfile />} />
                <Route path="notifications" element={<MemberNotifications />} />
                <Route path="songs" element={<AdminSongsPage />} />
                <Route path="songs/new" element={<AdminSongFormPage mode="create" />} />
                <Route path="songs/:id/edit" element={<AdminSongFormPage mode="edit" />} />
                <Route path="songs/:id" element={<AdminSongDetailPage />} />
                <Route path="rehearsals" element={<MemberPlaceholder title="Rehearsals" />} />
                <Route path="performances" element={<MemberPlaceholder title="Performances" />} />
                <Route path="calendar" element={<MemberPlaceholder title="Calendar" />} />
                <Route path="attendance" element={<AdminAttendancePage />} />
                <Route path="performance-attendance" element={<AdminAttendancePage />} />
                <Route path="my-performances" element={<MemberPlaceholder title="My Performances" />} />
                <Route path="settings" element={<MemberPlaceholder title="Settings" />} />
                <Route path="reports" element={<MemberPlaceholder title="Reports" />} />
                <Route path="choir-history" element={<MemberPlaceholder title="Choir History" />} />
                <Route path="activity-logs" element={<MemberPlaceholder title="Activity Logs" />} />
            </Route>

            {/* Team Leader Area */}
            <Route
                path="/team-leader"
                element={
                    <ProtectedRoute allowedRoles={['team_leader']}>
                        <MemberLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<TeamLeaderDashboard />} />
                <Route path="choir" element={<MemberChoir />} />
                <Route path="profile" element={<MemberProfile />} />
                <Route path="notifications" element={<MemberNotifications />} />
                <Route path="songs" element={<MemberPlaceholder title="Songs" />} />
                <Route path="rehearsals" element={<MemberPlaceholder title="Rehearsals" />} />
                <Route path="performances" element={<MemberPlaceholder title="Performances" />} />
                <Route path="calendar" element={<MemberPlaceholder title="Calendar" />} />
                <Route path="attendance" element={<AdminAttendancePage />} />
                <Route path="my-performances" element={<MemberPlaceholder title="My Performances" />} />
                <Route path="settings" element={<MemberPlaceholder title="Settings" />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
