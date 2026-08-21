<?php

namespace App\Policies;

use App\Models\User as UserModel;
use App\Models\User;

class UserPolicy
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
        return $user->can('users.view');
    }

    public function view(User $user, UserModel $model): bool
    {
        return $user->can('users.view');
    }

    public function create(User $user): bool
    {
        return $user->can('users.manage');
    }

    public function update(User $user, UserModel $model): bool
    {
        return $user->can('users.manage');
    }

    public function delete(User $user, UserModel $model): bool
    {
        return $user->can('users.manage');
    }
}
