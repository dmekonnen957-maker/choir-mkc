<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionRoleSeeder extends Seeder
{
    private const GUARD = 'api';

    private array $permissions = [
        'users.view', 'users.create', 'users.edit', 'users.delete', 'users.approve', 'users.manage',
        'roles.view', 'roles.create', 'roles.edit', 'roles.delete', 'roles.manage',
        'permissions.view', 'permissions.create', 'permissions.edit', 'permissions.delete', 'permissions.manage',
        'choirs.view', 'choirs.view.all', 'choirs.create', 'choirs.update', 'choirs.delete',
        'members.view', 'members.view.all', 'members.manage',
        'songs.view', 'songs.view.all', 'songs.manage',
        'rehearsals.view', 'rehearsals.view.all', 'rehearsals.manage',
        'attendance.view', 'attendance.manage',
        'performances.view', 'performances.view.all', 'performances.manage',
        'announcements.view', 'announcements.view.all', 'announcements.manage',
        'gallery.view', 'gallery.view.all', 'gallery.manage',
        'audit_logs.view',
        'notifications.view', 'notifications.manage',
        'reports.view', 'reports.export',
    ];

    public function run(): void
    {
        $guard = self::GUARD;

        foreach ($this->permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => $guard]);
        }

        $make = function (string $name, array $perms) use ($guard): Role {
            $role = Role::firstOrCreate(['name' => $name, 'guard_name' => $guard]);
            $role->syncPermissions($perms);

            return $role;
        };

        // Rename the legacy "choir-manager" role to the canonical "team_leader".
        $legacyManager = Role::where('name', 'choir-manager')->where('guard_name', $guard)->first();
        if ($legacyManager) {
            $legacyManager->name = 'team_leader';
            $legacyManager->save();
        }

        $make('super-admin', $this->permissions);
        $make('admin', $this->permissions);
        $make('team_leader', [
            'choirs.view', 'choirs.view.all', 'choirs.update',
            'members.view', 'members.view.all', 'members.manage',
            'songs.view', 'songs.view.all', 'songs.manage',
            'rehearsals.view', 'rehearsals.view.all', 'rehearsals.manage',
            'attendance.view', 'attendance.manage',
            'performances.view', 'performances.view.all', 'performances.manage',
            'announcements.view', 'announcements.view.all', 'announcements.manage',
            'gallery.view', 'gallery.view.all', 'gallery.manage',
            'notifications.view',
        ]);
        $make('member', [
            'choirs.view', 'members.view', 'songs.view',
            'rehearsals.view', 'performances.view',
            'announcements.view', 'gallery.view', 'notifications.view',
        ]);

        // Sync (replace) roles based on each user's stored `role` column so
        // re-seeding corrects any previously misassigned roles, without
        // relying on hard-coded primary-key IDs.
        $roleByColumn = [
            'super-admin' => 'super-admin',
            'admin' => 'admin',
            'team_leader' => 'team_leader',
            'choir-manager' => 'team_leader',
            'member' => 'member',
        ];

        User::query()->each(function (User $user) use ($roleByColumn, $guard): void {
            $target = $roleByColumn[$user->role] ?? 'member';

            $roleModel = Role::where('name', $target)->where('guard_name', $guard)->first();

            if ($roleModel) {
                // Sync by Role model instance to avoid guard-name resolution
                // against the default "web" guard (roles are stored as "api").
                $user->syncRoles([$roleModel]);
            }
        });
    }
}
