<?php

namespace App\Policies;

use App\Models\User;
use Spatie\Permission\Models\Permission;

class PermissionPolicy
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
        return $user->can('permissions.view') || $user->can('permissions.manage');
    }

    public function view(User $user, Permission $permission): bool
    {
        return $user->can('permissions.view') || $user->can('permissions.manage');
    }

    public function create(User $user): bool
    {
        return $user->can('permissions.create') || $user->can('permissions.manage');
    }

    public function update(User $user, Permission $permission): bool
    {
        return $user->can('permissions.edit') || $user->can('permissions.manage');
    }

    public function delete(User $user, Permission $permission): bool
    {
        return $user->can('permissions.delete') || $user->can('permissions.manage');
    }
}
