<?php

namespace App\Policies;

use App\Models\Choir;
use App\Models\User;

class ChoirPolicy
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
        return $user->can('choirs.view');
    }

    public function view(User $user, Choir $choir): bool
    {
        if ($user->can('choirs.view.all')) {
            return true;
        }
        return $user->choirs()
            ->where('choirs.id', $choir->id)
            ->wherePivot('status', 'active')
            ->exists();
    }

    public function create(User $user): bool
    {
        return $user->can('choirs.create');
    }

    public function update(User $user, Choir $choir): bool
    {
        return $user->can('choirs.update');
    }

    public function delete(User $user, Choir $choir): bool
    {
        return $user->can('choirs.delete');
    }
}
