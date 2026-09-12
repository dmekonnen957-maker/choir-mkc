<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PermissionRoleSeeder extends Seeder
{
    private const GUARD = 'api';

    private array $permissions = [
        // Users
        'users.view', 'users.view.all', 'users.create', 'users.edit', 'users.update', 'users.delete', 'users.approve', 'users.manage',
        // Roles
        'roles.view', 'roles.create', 'roles.edit', 'roles.update', 'roles.delete', 'roles.manage',
        // Permissions
        'permissions.view', 'permissions.create', 'permissions.edit', 'permissions.update', 'permissions.delete', 'permissions.manage',
        // Choirs
        'choirs.view', 'choirs.view.all', 'choirs.create', 'choirs.edit', 'choirs.update', 'choirs.delete', 'choirs.manage',
        // Members
        'members.view', 'members.view.all', 'members.create', 'members.edit', 'members.update', 'members.delete', 'members.manage',
        // Songs
        'songs.view', 'songs.view.all', 'songs.create', 'songs.edit', 'songs.update', 'songs.delete', 'songs.manage',
        // Lyrics
        'lyrics.view', 'lyrics.view.all', 'lyrics.create', 'lyrics.edit', 'lyrics.update', 'lyrics.delete', 'lyrics.manage',
        // Rehearsals
        'rehearsals.view', 'rehearsals.view.all', 'rehearsals.create', 'rehearsals.edit', 'rehearsals.update', 'rehearsals.delete', 'rehearsals.manage',
        // Attendance
        'attendance.view', 'attendance.create', 'attendance.edit', 'attendance.update', 'attendance.delete', 'attendance.manage',
        // Performances
        'performances.view', 'performances.view.all', 'performances.create', 'performances.edit', 'performances.update', 'performances.delete', 'performances.manage',
        // Calendar
        'calendar.view', 'calendar.create', 'calendar.edit', 'calendar.update', 'calendar.delete', 'calendar.manage',
        // Announcements
        'announcements.view', 'announcements.view.all', 'announcements.create', 'announcements.edit', 'announcements.update', 'announcements.delete', 'announcements.manage',
        // Gallery
        'gallery.view', 'gallery.view.all', 'gallery.create', 'gallery.edit', 'gallery.update', 'gallery.delete', 'gallery.manage',
        // Audit Logs
        'audit_logs.view',
        // Notifications
        'notifications.view', 'notifications.create', 'notifications.manage',
        // Settings
        'settings.manage',
        // Reports
        'reports.view', 'reports.export',
    ];

    public function run(): void
    {
        $guard = self::GUARD;

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach ($this->permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => $guard]);
        }

        $make = function (string $name, array $perms) use ($guard): Role {
            $role = Role::firstOrCreate(['name' => $name, 'guard_name' => $guard]);
            $role->syncPermissions($perms);

            return $role;
        };

        // Rename legacy "choir-manager" to "team_leader" if found
        $legacyManager = Role::where('name', 'choir-manager')->where('guard_name', $guard)->first();
        if ($legacyManager) {
            $legacyManager->name = 'team_leader';
            $legacyManager->save();
        }

        $make('super-admin', $this->permissions);
        $make('admin', $this->permissions);
        $make('team_leader', [
            'choirs.view', 'choirs.update', 'choirs.edit',
            'members.view', 'members.create', 'members.update', 'members.edit', 'members.manage',
            'songs.view', 'songs.create', 'songs.update', 'songs.edit', 'songs.delete',
            'lyrics.view', 'lyrics.create', 'lyrics.update', 'lyrics.edit', 'lyrics.delete',
            'rehearsals.view', 'rehearsals.create', 'rehearsals.update', 'rehearsals.edit', 'rehearsals.delete', 'rehearsals.manage',
            'attendance.view', 'attendance.create', 'attendance.update', 'attendance.edit', 'attendance.manage',
            'performances.view', 'performances.create', 'performances.update', 'performances.edit', 'performances.delete', 'performances.manage',
            'calendar.view', 'calendar.create', 'calendar.update', 'calendar.edit', 'calendar.manage',
            'announcements.view', 'announcements.create', 'announcements.update', 'announcements.edit', 'announcements.manage',
            'gallery.view', 'gallery.create', 'gallery.update', 'gallery.edit', 'gallery.manage',
            'notifications.view',
        ]);
        $make('member', [
            'choirs.view', 'members.view', 'songs.view', 'lyrics.view',
            'rehearsals.view', 'performances.view', 'calendar.view',
            'announcements.view', 'gallery.view', 'notifications.view',
        ]);

        $roleByColumn = [
            'super-admin' => 'super-admin',
            'admin' => 'admin',
            'team_leader' => 'team_leader',
            'choir-manager' => 'team_leader',
            'member' => 'member',
        ];

        User::query()->each(function (User $user) use ($roleByColumn, $guard): void {
            $target = $roleByColumn[$user->role] ?? ($user->role ?: 'member');

            $roleModel = Role::where('name', $target)->where('guard_name', $guard)->first();

            if ($roleModel) {
                $user->syncRoles([$roleModel]);
            }
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
