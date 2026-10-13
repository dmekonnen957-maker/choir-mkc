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
const MusicianDashboard = lazy(() => import('./pages/musician/MusicianDashboard'));

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
import MemberChoirHistoryPage from './pages/member/MemberChoirHistoryPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminActivityLogsPage from './pages/admin/AdminActivityLogsPage';

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

            {/* Musician Area */}
            <Route
                path="/musician"
                element={
                    <ProtectedRoute allowedAreas={['musician', 'member', 'team_leader', 'admin']}>
                        <MemberLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<MusicianDashboard />} />
                <Route path="choir" element={<MemberChoir />} />
                <Route path="profile" element={<MemberProfile />} />
                <Route path="notifications" element={<MemberNotifications />} />
                <Route path="songs" element={<MemberSongsPage />} />
                <Route path="rehearsals" element={<AdminRehearsalsPage />} />
                <Route path="performances" element={<MemberPerformancesPage />} />
                <Route path="calendar" element={<MemberCalendarPage />} />
                <Route path="attendance" element={<MemberAttendancePage />} />
                <Route path="my-performances" element={<MemberPerformancesPage />} />
                <Route path="choir-history" element={<MemberChoirHistoryPage />} />
                <Route path="settings" element={<MemberSettings />} />
            </Route>

            {/* Member Area */}
            <Route
                path="/member/choir-history"
                element={
                    <ProtectedRoute allowedAreas={['member', 'musician', 'team_leader', 'admin']}>
                        <MemberLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<MemberChoirHistoryPage />} />
            </Route>
            <Route
                path="/member"
                element={
                    <ProtectedRoute allowedAreas={['member']}>
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
                <Route path="my-performances" element={<MemberPerformancesPage />} />
                <Route path="choir-history" element={<MemberChoirHistoryPage />} />
                <Route path="settings" element={<MemberSettings />} />
            </Route>

            {/* Admin Area */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute allowedAreas={['admin']}>
                        <MemberLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                {/* Choirs: require choirs.view or choirs.manage */}
                <Route path="choirs" element={
                    <ProtectedRoute allowedAreas={['admin']} allowedPermissions={['choirs.view', 'choirs.manage']}>
                        <AdminChoirsPage />
                    </ProtectedRoute>
                } />
                <Route path="choirs/create" element={
                    <ProtectedRoute allowedAreas={['admin']} allowedPermissions={['choirs.create', 'choirs.manage']}>
                        <AdminChoirFormPage mode="create" />
                    </ProtectedRoute>
                } />
                <Route path="choirs/:id" element={
                    <ProtectedRoute allowedAreas={['admin']} allowedPermissions={['choirs.view', 'choirs.manage']}>
                        <AdminChoirDetailPage />
                    </ProtectedRoute>
                } />
                <Route path="choirs/:id/edit" element={
                    <ProtectedRoute allowedAreas={['admin']} allowedPermissions={['choirs.edit', 'choirs.update', 'choirs.manage']}>
                        <AdminChoirFormPage mode="edit" />
                    </ProtectedRoute>
                } />
                {/* Members: require members.view or members.manage */}
                <Route path="members" element={
                    <ProtectedRoute allowedAreas={['admin']} allowedPermissions={['members.view', 'members.manage']}>
                        <AdminMembersPage />
                    </ProtectedRoute>
                } />
                {/* Users: require users.view or users.manage */}
                <Route path="users" element={
                    <ProtectedRoute allowedAreas={['admin']} allowedPermissions={['users.view', 'users.manage']}>
                        <AdminUsersPage />
                    </ProtectedRoute>
                } />
                <Route path="users/:id" element={
                    <ProtectedRoute allowedAreas={['admin']} allowedPermissions={['users.view', 'users.manage']}>
                        <AdminUsersPage />
                    </ProtectedRoute>
                } />
                {/* Roles & Permissions: require roles.view or roles.manage */}
                <Route path="roles" element={
                    <ProtectedRoute allowedAreas={['admin']} allowedPermissions={['roles.view', 'roles.manage', 'permissions.view', 'permissions.manage']}>
                        <AdminRolesPage />
                    </ProtectedRoute>
                } />
                <Route path="roles/:id" element={
                    <ProtectedRoute allowedAreas={['admin']} allowedPermissions={['roles.view', 'roles.manage', 'permissions.view', 'permissions.manage']}>
                        <AdminRolesPage />
                    </ProtectedRoute>
                } />
                <Route path="choir" element={<MemberChoir apiPath="/team-leader/choir" />} />
                <Route path="profile" element={<MemberProfile apiPath="/team-leader/profile" />} />
                <Route path="notifications" element={<MemberNotifications apiPath="/team-leader/notifications" />} />
                {/* Songs: require songs.view or songs.manage */}
                <Route path="songs" element={
                    <ProtectedRoute allowedAreas={['admin']} allowedPermissions={['songs.view', 'songs.manage']}>
                        <AdminSongsPage />
                    </ProtectedRoute>
                } />
                <Route path="songs/new" element={
                    <ProtectedRoute allowedAreas={['admin']} allowedPermissions={['songs.create', 'songs.manage']}>
                        <AdminSongFormPage mode="create" />
                    </ProtectedRoute>
                } />
                <Route path="songs/:id/edit" element={
                    <ProtectedRoute allowedAreas={['admin']} allowedPermissions={['songs.edit', 'songs.update', 'songs.manage']}>
                        <AdminSongFormPage mode="edit" />
                    </ProtectedRoute>
                } />
                <Route path="songs/:id" element={
                    <ProtectedRoute allowedAreas={['admin']} allowedPermissions={['songs.view', 'songs.manage']}>
                        <AdminSongDetailPage />
                    </ProtectedRoute>
                } />
                <Route path="rehearsals" element={<AdminRehearsalsPage />} />
                <Route path="performances" element={<AdminPerformancesPage />} />
                {/* Calendar: require calendar.view or calendar.manage */}
                <Route path="calendar" element={
                    <ProtectedRoute allowedAreas={['admin']} allowedPermissions={['calendar.view', 'calendar.manage']}>
                        <AdminCalendarPage />
                    </ProtectedRoute>
                } />
                <Route path="attendance" element={<AdminAttendancePage />} />
                <Route path="my-performances" element={<MemberPlaceholder title="My Performances" />} />
                {/* Settings: require settings.view or settings.manage */}
                <Route path="settings" element={
                    <ProtectedRoute allowedAreas={['admin']} allowedPermissions={['settings.view', 'settings.manage']}>
                        <AdminSettingsPage />
                    </ProtectedRoute>
                } />
                {/* Reports: require reports.view or reports.manage */}
                <Route path="reports" element={
                    <ProtectedRoute allowedAreas={['admin']} allowedPermissions={['reports.view', 'reports.manage']}>
                        <AdminReportsPage />
                    </ProtectedRoute>
                } />
                <Route path="choir-history" element={<MemberChoirHistoryPage />} />
                {/* Activity Logs: require audit_logs.view */}
                <Route path="activity-logs" element={
                    <ProtectedRoute allowedAreas={['admin']} allowedPermissions={['audit_logs.view']}>
                        <AdminActivityLogsPage />
                    </ProtectedRoute>
                } />
            </Route>

            {/* Team Leader Area */}
            <Route
                path="/team-leader"
                element={
                    <ProtectedRoute allowedAreas={['team_leader', 'admin']}>
                        <MemberLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<TeamLeaderDashboard />} />
                <Route path="choir" element={<MemberChoir apiPath="/team-leader/choir" />} />
                <Route path="profile" element={<MemberProfile apiPath="/team-leader/profile" />} />
                <Route path="notifications" element={<MemberNotifications apiPath="/team-leader/notifications" />} />
                <Route path="songs" element={<MemberSongsPage apiPath="team-leader/songs" />} />
                <Route path="rehearsals" element={<AdminRehearsalsPage choirsUrl="/choirs?per_page=200" />} />
                <Route path="performances" element={<AdminPerformancesPage choirsUrl="/choirs?per_page=200" />} />
                <Route path="users" element={<AdminUsersPage basePath="team-leader" />} />
                <Route path="users/:id" element={<AdminUsersPage basePath="team-leader" />} />
                <Route path="members" element={<AdminMembersPage basePath="team-leader" />} />
                <Route path="calendar" element={<TeamLeaderCalendarPage />} />
                <Route path="attendance" element={<AdminAttendancePage />} />
                <Route path="my-performances" element={<MemberPerformancesPage apiPath="/team-leader/performances" />} />
                <Route path="choir-history" element={<MemberChoirHistoryPage />} />
                <Route path="settings" element={<MemberSettings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
