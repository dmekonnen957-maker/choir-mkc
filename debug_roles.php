<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Spatie\Permission\Models\Role;
echo "Running RoleController index query...\n";
try {
    $roles = Role::where('guard_name','api')->with('permissions')->withCount('users')->get();
    foreach ($roles as $r) {
        echo "role {$r->name} guard={$r->guard_name} users_count={$r->users_count}\n";
    }
    echo "OK, count=".$roles->count()."\n";
} catch (\Throwable $e) {
    echo "ERROR: ".$e->getMessage()."\n";
    echo $e->getTraceAsString()."\n";
}
