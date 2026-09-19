<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

echo "=== ROLES ===\n";
foreach (Role::where('guard_name', 'api')->with('permissions')->get() as $role) {
    echo "Role: {$role->name} | Area: {$role->area} | Permissions: " . $role->permissions->count() . "\n";
}

echo "\n=== PERMISSIONS (".Permission::count().") ===\n";
echo implode(', ', Permission::pluck('name')->toArray()) . "\n";

echo "\n=== USERS ===\n";
foreach (User::with('roles')->get() as $u) {
    echo "User #{$u->id}: {$u->name} ({$u->email}) | DB role: '{$u->role}' | Status: {$u->status} | Spatie Roles: " . $u->roles->pluck('name')->join(', ') . "\n";
}
