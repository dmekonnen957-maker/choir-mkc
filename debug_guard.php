<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Spatie\Permission\Models\Role;
use Spatie\Permission\Guard as SpatieGuard;
$role = Role::where('guard_name','api')->first();
echo "role guard_name = "; var_dump($role ? $role->guard_name : 'NO ROLE');
echo "auth.defaults.guard = "; var_dump(config('auth.defaults.guard'));
$g = $role ? ($role->guard_name ?? config('auth.defaults.guard')) : config('auth.defaults.guard');
echo "guard used = "; var_dump($g);
echo "getModelForGuard(guard) = "; var_dump(SpatieGuard::getModelForGuard($g));
echo "auth.guards.api = "; var_dump(config('auth.guards.api'));
echo "auth.providers.users = "; var_dump(config('auth.providers.users'));
