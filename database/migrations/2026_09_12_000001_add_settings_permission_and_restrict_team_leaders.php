<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        $guard = 'api';
        $permission = Permission::firstOrCreate([
            'name' => 'settings.manage',
            'guard_name' => $guard,
        ]);

        foreach (['admin', 'super-admin'] as $roleName) {
            $role = Role::where('name', $roleName)->where('guard_name', $guard)->first();
            if ($role instanceof Role) {
                $role->givePermissionTo($permission);
            }
        }

        $leader = Role::where('name', 'team_leader')->where('guard_name', $guard)->first();
        if ($leader instanceof Role) {
            $leader->revokePermissionTo([
                'choirs.view.all',
                'members.view.all',
                'songs.view.all',
                'lyrics.view.all',
                'rehearsals.view.all',
                'performances.view.all',
                'announcements.view.all',
                'gallery.view.all',
            ]);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        $permission = Permission::query()
            ->where('name', 'settings.manage')
            ->where('guard_name', 'api')
            ->first();
        if ($permission instanceof Permission) {
            $permission->delete();
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
