<?php

namespace App\Providers;

use App\Models\User;
use App\Observers\UserObserver;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register the UserObserver so that member records are kept in sync
        // when a user is deleted or deactivated (see requirements: attendance
        // must never show deleted/inactive members).
        User::observe(UserObserver::class);

        Gate::before(function (User $user): ?bool {
            return $user->role === 'super-admin'
                || $user->hasRole('super-admin', 'api')
                ? true
                : null;
        });

        // Spatie's Role/Permission models live outside App\Models, so policy
        // auto-discovery does not map them. Register them explicitly so that
        // controller authorization (Gate::authorize) resolves to our policies.
        Gate::policy(Role::class, \App\Policies\RolePolicy::class);
        Gate::policy(Permission::class, \App\Policies\PermissionPolicy::class);
    }
}
