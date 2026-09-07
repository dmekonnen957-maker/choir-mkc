import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout';
import AuthLayout from './components/layout/AuthLayout';
import { PublicPageSkeleton } from './components/public/PublicSkeletons';

// Lazy-loaded public pages for performance optimization
const HomePage = lazy(() => import('./pages/HomePage'));
const ChoirsPage = lazy(() => import('./pages/ChoirsPage'));
const ChoirDetailPage = lazy(() => import('./pages/ChoirDetailPage'));
const ChoirHistoryPage = lazy(() => import('./pages/ChoirHistoryPage'));
const SongsPage = lazy(() => import('./pages/SongsPage'));
const SongDetailPage = lazy(() => import('./pages/SongDetailPage'));
const PerformancesPage = lazy(() => import('./pages/PerformancesPage'));
const PerformanceDetailPage = lazy(() => import('./pages/PerformanceDetailPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RegistrationPendingPage from './pages/RegistrationPendingPage';
import ProtectedRoute from './routes/ProtectedRoute';

import MemberLayout from './components/member/MemberLayout';
import MemberDashboard from './pages/member/MemberDashboard';
import MemberChoir from './pages/member/MemberChoir';
import MemberProfile from './pages/member/MemberProfile';
import MemberSettings from './pages/member/MemberSettings';
import MemberNotifications from './pages/member/MemberNotifications';
import MemberPlaceholder from './pages/member/MemberPlaceholder';
import MemberPerformancesPage from './pages/member/MemberPerformancesPage';
import MemberSongsPage from './pages/member/MemberSongsPage';
import MemberCalendarPage from './pages/member/MemberCalendarPage';
import AdminCalendarPage from './pages/admin/AdminCalendarPage';
import TeamLeaderCalendarPage from './pages/team-leader/TeamLeaderCalendarPage';
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
import AdminPerformancesPage from './pages/admin/AdminPerformancesPage';
import AdminRehearsalsPage from './pages/admin/AdminRehearsalsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import MemberAttendancePage from './pages/member/MemberAttendancePage';

export default function App() {
    return (
        <Routes>
            <Route element={<PublicLayout />}>
                <Route
                    path="/"
                    element={
                        <Suspense fallback={<PublicPageSkeleton />}>
                            <HomePage />
                        </Suspense>
                    }
                />
                <Route
                    path="/choirs"
                    element={
                        <Suspense fallback={<PublicPageSkeleton />}>
                            <ChoirsPage />
                        </Suspense>
                    }
                />
                <Route
                    path="/choirs/:id"
                    element={
                        <Suspense fallback={<PublicPageSkeleton />}>
                            <ChoirDetailPage />
                        </Suspense>
                    }
                />
                <Route
                    path="/choirs/:id/history"
                    element={
                        <Suspense fallback={<PublicPageSkeleton />}>
                            <ChoirHistoryPage />
                        </Suspense>
                    }
                />
                <Route
                    path="/songs"
                    element={
                        <Suspense fallback={<PublicPageSkeleton />}>
                            <SongsPage />
                        </Suspense>
                    }
                />
                <Route
                    path="/songs/:id"
                    element={
                        <Suspense fallback={<PublicPageSkeleton />}>
                            <SongDetailPage />
                        </Suspense>
                    }
                />
                <Route
                    path="/performances"
                    element={
                        <Suspense fallback={<PublicPageSkeleton />}>
                            <PerformancesPage />
                        </Suspense>
                    }
                />
                <Route
                    path="/performances/:id"
                    element={
                        <Suspense fallback={<PublicPageSkeleton />}>
                            <PerformanceDetailPage />
                        </Suspense>
                    }
                />
                <Route
                    path="/about"
                    element={
                        <Suspense fallback={<PublicPageSkeleton />}>
                            <AboutPage />
                        </Suspense>
                    }
                />
                <Route path="/history" element={<Navigate to="/about" replace />} />
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
                <Route path="songs" element={<MemberSongsPage />} />
                <Route path="rehearsals" element={<AdminRehearsalsPage />} />
                <Route path="performances" element={<MemberPerformancesPage />} />
                <Route path="calendar" element={<MemberCalendarPage />} />
                <Route path="attendance" element={<MemberAttendancePage />} />
                <Route path="my-performances" element={<MemberPlaceholder title="My Performances" />} />
                <Route path="settings" element={<MemberSettings />} />
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
                <Route path="rehearsals" element={<AdminRehearsalsPage />} />
                <Route path="performances" element={<AdminPerformancesPage />} />
                <Route path="calendar" element={<AdminCalendarPage />} />
                <Route path="attendance" element={<AdminAttendancePage />} />
                <Route path="my-performances" element={<MemberPlaceholder title="My Performances" />} />
                <Route path="settings" element={<AdminSettingsPage />} />
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
                <Route path="songs" element={<MemberSongsPage apiPath="team-leader/songs" />} />
                <Route path="rehearsals" element={<AdminRehearsalsPage />} />
                <Route path="performances" element={<MemberPerformancesPage />} />
                <Route path="calendar" element={<TeamLeaderCalendarPage />} />
                <Route path="attendance" element={<AdminAttendancePage />} />
                <Route path="my-performances" element={<MemberPlaceholder title="My Performances" />} />
                <Route path="settings" element={<MemberSettings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
