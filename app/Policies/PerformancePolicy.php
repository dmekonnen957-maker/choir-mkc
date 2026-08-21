<?php

namespace App\Policies;

use App\Models\Performance;
use App\Models\User;

class PerformancePolicy
{
    public function before(User $user, $ability): ?bool
    {
        if ($user->hasAnyRole(['super-admin', 'admin'])) {
            return true;
        }
        return null;
    }

    private function assigned(User $user, Performance $performance): bool
    {
        return $user->choirs()
            ->where('choirs.id', $performance->choir_id)
            ->wherePivot('status', 'active')
            ->exists();
    }

    public function viewAny(User $user): bool
    {
        return $user->can('performances.view');
    }

    public function view(User $user, Performance $performance): bool
    {
        if ($user->can('performances.view.all')) {
            return true;
        }
        return $this->assigned($user, $performance);
    }

    public function create(User $user): bool
    {
        return $user->can('performances.manage');
    }

    public function update(User $user, Performance $performance): bool
    {
        return $user->can('performances.manage');
    }

    public function delete(User $user, Performance $performance): bool
    {
        return $user->can('performances.manage');
    }
}
