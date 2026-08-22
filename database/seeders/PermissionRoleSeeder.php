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
        'choirs.view', 'choirs.view.all', 'choirs.create', 'choirs.update', 'choirs.delete',
        'members.view', 'members.view.all', 'members.manage',
        'songs.view', 'songs.view.all', 'songs.manage',
        'rehearsals.view', 'rehearsals.view.all', 'rehearsals.manage',
        'attendance.view', 'attendance.manage',
        'performances.view', 'performances.view.all', 'performances.manage',
        'announcements.view', 'announcements.view.all', 'announcements.manage',
        'gallery.view', 'gallery.view.all', 'gallery.manage',
        'users.view', 'users.manage',
        'audit_logs.view',
        'notifications.view', 'notifications.manage',
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

        // Sync (replace) roles so re-seeding corrects any previously misassigned roles.
        $roles = [
            1 => 'super-admin',
            2 => 'team_leader',
            3 => 'member',
        ];

        foreach ($roles as $userId => $roleName) {
            $user = User::find($userId);
            if ($user) {
                $role = Role::findByName($roleName, $guard);
                $user->syncRoles([$role->name]);
            }
        }
    }
}
