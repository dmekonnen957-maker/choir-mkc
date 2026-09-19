<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use App\Http\Resources\Api\UserResource;

echo "Creating dummy role 'tester_role'...\n";
$role = Role::firstOrCreate(['name' => 'tester_role', 'guard_name' => 'api']);
$role->syncPermissions(['songs.view', 'songs.create']);
app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

echo "Role created with perms: " . $role->permissions()->pluck('name')->join(', ') . "\n";

$testUser = User::where('email', 'custom_test@example.com')->first();
if (!$testUser) {
    $testUser = User::create([
        'name' => 'Custom Tester',
        'email' => 'custom_test@example.com',
        'password' => bcrypt('password123'),
        'role' => 'tester_role',
        'status' => 'approved',
    ]);
}
$testUser->syncRoles([$role]);
app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

echo "User assigned roles: " . $testUser->getRoleNames()->join(', ') . "\n";
echo "User permissions via Spatie: " . $testUser->getAllPermissions()->pluck('name')->join(', ') . "\n";

$resource = (new UserResource($testUser->load('roles', 'permissions')))->resolve();
echo "Resource output:\n";
echo "  role: " . json_encode($resource['role']) . "\n";
echo "  roles: " . json_encode($resource['roles']) . "\n";
echo "  roles_with_area: " . json_encode($resource['roles_with_area']) . "\n";
echo "  permissions: " . json_encode($resource['permissions']) . "\n";

// Clean up
$testUser->delete();
$role->delete();
echo "Cleanup done.\n";
