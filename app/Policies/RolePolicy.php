<?php

namespace App\Policies;

use App\Models\User;
use Spatie\Permission\Models\Role;

class RolePolicy
{
    public function before(User $user, $ability): ?bool
    {
        if ($user->hasAnyRole(['super-admin', 'admin'])) {
            return true;
        }
        return null;
    }

    public function viewAny(User $user): bool
    {
        return $user->can('roles.view') || $user->can('roles.manage');
    }

    public function view(User $user, Role $role): bool
    {
        return $user->can('roles.view') || $user->can('roles.manage');
    }

    public function create(User $user): bool
    {
        return $user->can('roles.create') || $user->can('roles.manage');
    }

    public function update(User $user, Role $role): bool
    {
        return $user->can('roles.edit') || $user->can('roles.manage');
    }

    public function delete(User $user, Role $role): bool
    {
        return $user->can('roles.delete') || $user->can('roles.manage');
    }
}
