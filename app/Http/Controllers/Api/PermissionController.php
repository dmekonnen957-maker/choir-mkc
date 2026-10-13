<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Permission\StorePermissionRequest;
use App\Http\Requests\Api\Permission\UpdatePermissionRequest;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

class PermissionController extends ApiController
{
    private function resolveGroup(string $permissionName): string
    {
        $parts = explode('.', $permissionName);
        $prefix = $parts[0] ?? 'system';
        return match ($prefix) {
            'users' => 'Users',
            'roles' => 'Roles',
            'permissions' => 'Permissions',
            'choirs' => 'Choirs',
            'members' => 'Members',
            'songs' => 'Songs',
            'lyrics' => 'Lyrics',
            'rehearsals' => 'Rehearsals',
            'attendance' => 'Attendance',
            'performances' => 'Performances',
            'announcements' => 'Announcements',
            'gallery' => 'Gallery',
            'notifications' => 'Notifications',
            'reports' => 'Reports',
            'audit_logs' => 'Audit Logs',
            'settings' => 'Settings',
            'calendar' => 'Calendar',
            'choir_history' => 'Choir History',
            default => ucfirst($prefix),
        };
    }

    private function resolveLabel(string $name): string
    {
        return match($name) {
            // Users
            'users.view'        => 'View Users',
            'users.view.all'    => 'View All Users',
            'users.create'      => 'Create User (button)',
            'users.edit'        => 'Edit User',
            'users.update'      => 'Update User',
            'users.delete'      => 'Delete User (button)',
            'users.approve'     => 'Approve / Reject Users',
            'users.manage'      => 'Full User Management',
            // Roles
            'roles.view'        => 'View Roles & Permissions Page',
            'roles.create'      => 'Create Role',
            'roles.edit'        => 'Edit Role',
            'roles.update'      => 'Update Role',
            'roles.delete'      => 'Delete Role',
            'roles.manage'      => 'Full Role Management',
            // Permissions
            'permissions.view'    => 'View Permissions',
            'permissions.create'  => 'Create Permission',
            'permissions.edit'    => 'Edit Permission',
            'permissions.update'  => 'Update Permission',
            'permissions.delete'  => 'Delete Permission',
            'permissions.manage'  => 'Full Permission Management',
            // Choirs
            'choirs.view'       => 'View Choirs Page',
            'choirs.view.all'   => 'View All Choirs',
            'choirs.create'     => 'Create Choir',
            'choirs.edit'       => 'Edit Choir',
            'choirs.update'     => 'Update Choir',
            'choirs.delete'     => 'Delete Choir',
            'choirs.manage'     => 'Full Choir Management',
            // Members
            'members.view'      => 'View Members Page',
            'members.view.all'  => 'View All Members',
            'members.create'    => 'Add Member (button)',
            'members.edit'      => 'Edit Member',
            'members.update'    => 'Update Member',
            'members.delete'    => 'Delete Member',
            'members.manage'    => 'Full Member Management',
            // Songs
            'songs.view'        => 'View Songs Page',
            'songs.view.all'    => 'View All Songs',
            'songs.create'      => 'Add Song (button)',
            'songs.edit'        => 'Edit Song',
            'songs.update'      => 'Update Song',
            'songs.delete'      => 'Delete Song',
            'songs.manage'      => 'Full Song Management',
            // Lyrics
            'lyrics.view'       => 'View Lyrics',
            'lyrics.view.all'   => 'View All Lyrics',
            'lyrics.create'     => 'Add Lyrics',
            'lyrics.edit'       => 'Edit Lyrics',
            'lyrics.update'     => 'Update Lyrics',
            'lyrics.delete'     => 'Delete Lyrics',
            'lyrics.manage'     => 'Full Lyrics Management',
            // Rehearsals
            'rehearsals.view'   => 'View Rehearsals Page',
            'rehearsals.view.all' => 'View All Rehearsals',
            'rehearsals.create' => 'Schedule Rehearsal',
            'rehearsals.edit'   => 'Edit Rehearsal',
            'rehearsals.update' => 'Update Rehearsal',
            'rehearsals.delete' => 'Cancel Rehearsal',
            'rehearsals.manage' => 'Full Rehearsal Management',
            // Attendance
            'attendance.view'   => 'View Attendance Page',
            'attendance.view.all' => 'View All Attendance',
            'attendance.create' => 'Record Attendance',
            'attendance.edit'   => 'Edit Attendance',
            'attendance.update' => 'Update Attendance',
            'attendance.delete' => 'Delete Attendance Record',
            'attendance.manage' => 'Full Attendance Management',
            // Performances
            'performances.view'   => 'View Performances Page',
            'performances.view.all' => 'View All Performances',
            'performances.create' => 'Add Performance',
            'performances.edit'   => 'Edit Performance',
            'performances.update' => 'Update Performance',
            'performances.delete' => 'Delete Performance',
            'performances.manage' => 'Full Performance Management',
            // Calendar
            'calendar.view'     => 'View Calendar Page',
            'calendar.create'   => 'Add Calendar Event',
            'calendar.edit'     => 'Edit Calendar Event',
            'calendar.update'   => 'Update Calendar Event',
            'calendar.delete'   => 'Delete Calendar Event',
            'calendar.manage'   => 'Full Calendar Management',
            // Announcements
            'announcements.view'   => 'View Announcements',
            'announcements.view.all' => 'View All Announcements',
            'announcements.create' => 'Post Announcement',
            'announcements.edit'   => 'Edit Announcement',
            'announcements.update' => 'Update Announcement',
            'announcements.delete' => 'Delete Announcement',
            'announcements.manage' => 'Full Announcement Management',
            // Gallery
            'gallery.view'      => 'View Gallery',
            'gallery.view.all'  => 'View All Gallery',
            'gallery.create'    => 'Upload to Gallery',
            'gallery.edit'      => 'Edit Gallery Item',
            'gallery.update'    => 'Update Gallery Item',
            'gallery.delete'    => 'Delete Gallery Item',
            'gallery.manage'    => 'Full Gallery Management',
            // Reports
            'reports.view'      => 'View Reports Page',
            'reports.export'    => 'Export Reports',
            'reports.manage'    => 'Full Report Management',
            // Audit Logs
            'audit_logs.view'   => 'View Activity Logs Page',
            'audit_logs.manage' => 'Full Activity Log Management',
            // Notifications
            'notifications.view'   => 'View Notifications',
            'notifications.create' => 'Send Notifications',
            'notifications.manage' => 'Full Notification Management',
            // Settings
            'settings.view'     => 'View Settings Page',
            'settings.manage'   => 'Manage System Settings',
            'settings.edit'     => 'Edit Settings',
            'settings.update'   => 'Update Settings',
            // Choir History
            'choir_history.view'   => 'View Choir History Page',
            'choir_history.manage' => 'Manage Choir History',
            default => ucwords(str_replace(['.', '_'], [' ', ' '], $name)),
        };
    }

    private function resolveDescription(string $name): string
    {
        return match($name) {
            'users.view'        => 'Shows the Users menu item and allows opening the Users page.',
            'users.view.all'    => 'Allows viewing users across all choirs.',
            'users.create'      => 'Shows the Create User button on the Users page.',
            'users.edit'        => 'Allows editing user details and role assignment.',
            'users.update'      => 'Alias for users.edit.',
            'users.delete'      => 'Shows the Delete button on the Users page.',
            'users.approve'     => 'Allows approving or rejecting pending user registrations.',
            'users.manage'      => 'Full control: view, create, edit, approve, and delete users.',
            'roles.view'        => 'Shows the Roles & Permissions menu item and page.',
            'roles.create'      => 'Allows creating new custom roles.',
            'roles.edit'        => 'Allows editing role name, description, and permissions.',
            'roles.update'      => 'Alias for roles.edit.',
            'roles.delete'      => 'Allows deleting custom roles.',
            'roles.manage'      => 'Full control over roles and permission assignment.',
            'permissions.view'  => 'Allows viewing the permissions list.',
            'permissions.create'=> 'Allows creating new permissions.',
            'permissions.edit'  => 'Allows editing permission names.',
            'permissions.update'=> 'Alias for permissions.edit.',
            'permissions.delete'=> 'Allows deleting permissions.',
            'permissions.manage'=> 'Full permission management.',
            'choirs.view'       => 'Shows the Choirs menu item and allows opening the Choirs page.',
            'choirs.view.all'   => 'Allows viewing all choirs system-wide.',
            'choirs.create'     => 'Allows creating new choir groups.',
            'choirs.edit'       => 'Allows editing choir details.',
            'choirs.update'     => 'Alias for choirs.edit.',
            'choirs.delete'     => 'Allows deleting a choir.',
            'choirs.manage'     => 'Full choir management: create, edit, delete.',
            'members.view'      => 'Shows the Members menu item and allows opening the Members page.',
            'members.view.all'  => 'Allows viewing members across all choirs.',
            'members.create'    => 'Shows the Add Member button and allows creating member profiles.',
            'members.edit'      => 'Allows editing member profiles.',
            'members.update'    => 'Alias for members.edit.',
            'members.delete'    => 'Allows removing members from the system.',
            'members.manage'    => 'Full member management: view, add, edit, delete.',
            'songs.view'        => 'Shows the Songs menu item and allows opening the Songs page.',
            'songs.view.all'    => 'Allows viewing all songs across choirs.',
            'songs.create'      => 'Shows the Add Song button and allows submitting songs.',
            'songs.edit'        => 'Allows editing song details and approving/rejecting submissions.',
            'songs.update'      => 'Alias for songs.edit.',
            'songs.delete'      => 'Allows deleting songs from the library.',
            'songs.manage'      => 'Full song management: view, add, edit, delete, approve.',
            'lyrics.view'       => 'Allows viewing song lyrics.',
            'lyrics.create'     => 'Allows adding lyrics to songs.',
            'lyrics.edit'       => 'Allows editing lyrics.',
            'lyrics.update'     => 'Alias for lyrics.edit.',
            'lyrics.delete'     => 'Allows deleting lyrics.',
            'lyrics.manage'     => 'Full lyrics management.',
            'rehearsals.view'   => 'Shows the Rehearsals menu item and allows opening the Rehearsals page.',
            'rehearsals.create' => 'Allows scheduling new rehearsals.',
            'rehearsals.edit'   => 'Allows editing rehearsal details.',
            'rehearsals.update' => 'Alias for rehearsals.edit.',
            'rehearsals.delete' => 'Allows cancelling/deleting rehearsals.',
            'rehearsals.manage' => 'Full rehearsal management.',
            'attendance.view'   => 'Shows the Attendance menu item and allows opening the Attendance page.',
            'attendance.create' => 'Allows recording attendance for sessions.',
            'attendance.edit'   => 'Allows editing attendance records.',
            'attendance.update' => 'Alias for attendance.edit.',
            'attendance.delete' => 'Allows deleting attendance records.',
            'attendance.manage' => 'Full attendance management.',
            'performances.view' => 'Shows the Performances menu item and allows opening the Performances page.',
            'performances.create' => 'Allows adding new performances.',
            'performances.edit' => 'Allows editing performance details.',
            'performances.update' => 'Alias for performances.edit.',
            'performances.delete' => 'Allows deleting performances.',
            'performances.manage' => 'Full performance management.',
            'calendar.view'     => 'Shows the Calendar menu item and allows opening the Calendar page.',
            'calendar.create'   => 'Allows adding events to the calendar.',
            'calendar.edit'     => 'Allows editing calendar events.',
            'calendar.update'   => 'Alias for calendar.edit.',
            'calendar.delete'   => 'Allows deleting calendar events.',
            'calendar.manage'   => 'Full calendar management.',
            'announcements.view' => 'Allows viewing choir announcements.',
            'announcements.create' => 'Allows posting new announcements.',
            'announcements.edit' => 'Allows editing announcements.',
            'announcements.update' => 'Alias for announcements.edit.',
            'announcements.delete' => 'Allows deleting announcements.',
            'announcements.manage' => 'Full announcement management.',
            'gallery.view'      => 'Allows viewing the photo gallery.',
            'gallery.create'    => 'Allows uploading photos to the gallery.',
            'gallery.edit'      => 'Allows editing gallery items.',
            'gallery.update'    => 'Alias for gallery.edit.',
            'gallery.delete'    => 'Allows deleting gallery items.',
            'gallery.manage'    => 'Full gallery management.',
            'reports.view'      => 'Shows the Reports menu item and allows opening the Reports page.',
            'reports.export'    => 'Allows exporting reports as files.',
            'reports.manage'    => 'Full report access including export.',
            'audit_logs.view'   => 'Shows the Activity Logs menu item and allows viewing system audit logs.',
            'audit_logs.manage' => 'Full activity log management.',
            'notifications.view' => 'Allows viewing notifications.',
            'notifications.create' => 'Allows sending notifications to members.',
            'notifications.manage' => 'Full notification management.',
            'settings.view'     => 'Shows the Settings menu item and allows viewing system settings.',
            'settings.manage'   => 'Allows viewing and updating all system settings.',
            'settings.edit'     => 'Allows editing system settings.',
            'settings.update'   => 'Alias for settings.edit.',
            'choir_history.view' => 'Shows the Choir History page.',
            'choir_history.manage' => 'Full choir history management.',
            default => '',
        };
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', Permission::class);

        $query = Permission::where('guard_name', 'api')
            ->with('roles')
            ->withCount('roles');

        if ($request->filled('search')) {
            $search = '%' . trim($request->search) . '%';
            $query->where('name', 'like', $search);
        }

        $permissions = $query->get()->map(function ($perm) {
            return [
                'id' => $perm->id,
                'name' => $perm->name,
                'key' => $perm->name,
                'label' => $this->resolveLabel($perm->name),
                'description' => $this->resolveDescription($perm->name),
                'group' => $this->resolveGroup($perm->name),
                'guard_name' => $perm->guard_name,
                'roles_count' => $perm->roles_count,
                'roles' => $perm->roles->pluck('name'),
                'created_at' => $perm->created_at,
            ];
        });

        // Optional group filter
        if ($request->filled('group') && $request->group !== 'all') {
            $permissions = $permissions->where('group', $request->group)->values();
        }

        return $this->ok([
            'items' => $permissions,
            'groups' => $permissions->pluck('group')->unique()->values(),
            'total' => $permissions->count(),
        ]);
    }

    public function store(StorePermissionRequest $request)
    {
        $this->authorize('create', Permission::class);

        $data = $request->validated();

        $perm = Permission::create([
            'name' => $data['name'],
            'guard_name' => 'api',
        ]);

        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'permission.created',
            'subject_type' => Permission::class,
            'subject_id' => $perm->id,
            'new_values' => ['name' => $perm->name],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->ok([
            'id' => $perm->id,
            'name' => $perm->name,
            'key' => $perm->name,
            'label' => $this->resolveLabel($perm->name),
            'description' => $this->resolveDescription($perm->name),
            'group' => $this->resolveGroup($perm->name),
            'guard_name' => $perm->guard_name,
            'roles' => [],
        ], 'Permission created successfully', 201);
    }

    public function show(Request $request, Permission $permission)
    {
        $this->authorize('view', $permission);

        $permission->load('roles');

        return $this->ok([
            'id' => $permission->id,
            'name' => $permission->name,
            'key' => $permission->name,
            'label' => $this->resolveLabel($permission->name),
            'description' => $this->resolveDescription($permission->name),
            'group' => $this->resolveGroup($permission->name),
            'guard_name' => $permission->guard_name,
            'roles_count' => $permission->roles->count(),
            'roles' => $permission->roles->pluck('name'),
            'created_at' => $permission->created_at,
        ]);
    }

    public function update(UpdatePermissionRequest $request, Permission $permission)
    {
        $this->authorize('update', $permission);

        $data = $request->validated();
        $oldValues = ['name' => $permission->name];

        $permission->update([
            'name' => $data['name'],
        ]);

        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'permission.updated',
            'subject_type' => Permission::class,
            'subject_id' => $permission->id,
            'old_values' => $oldValues,
            'new_values' => ['name' => $permission->name],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->ok([
            'id' => $permission->id,
            'name' => $permission->name,
            'key' => $permission->name,
            'label' => $this->resolveLabel($permission->name),
            'description' => $this->resolveDescription($permission->name),
            'group' => $this->resolveGroup($permission->name),
            'guard_name' => $permission->guard_name,
            'roles' => $permission->roles()->pluck('name'),
        ], 'Permission updated successfully');
    }

    public function destroy(Request $request, Permission $permission)
    {
        $this->authorize('delete', $permission);

        $oldValues = ['name' => $permission->name];

        $permission->delete();

        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'permission.deleted',
            'subject_type' => Permission::class,
            'subject_id' => $permission->id,
            'old_values' => $oldValues,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->ok(null, 'Permission deleted successfully');
    }
}
