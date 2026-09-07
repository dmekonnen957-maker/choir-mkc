<?php

namespace App\Policies;

use App\Models\Performance;
use App\Models\User;

class PerformancePolicy
{
    public function before(User $user, $ability): ?bool
    {
        if ($user->hasRole(['super-admin', 'admin'], 'api') || $user->hasAnyRole(['super-admin', 'admin'])) {
            return true;
        }
        return null;
    }

    private function hasPerm(User $user, array $permissions): bool
    {
        foreach ($permissions as $perm) {
            try {
                if ($user->hasPermissionTo($perm, 'api') || $user->can($perm)) {
                    return true;
                }
            } catch (\Throwable) {
                //
            }
        }
        return false;
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
        return $this->hasPerm($user, ['performances.view', 'performances.view.all', 'performances.manage']);
    }

    public function view(User $user, Performance $performance): bool
    {
        if ($this->hasPerm($user, ['performances.view.all', 'performances.manage'])) {
            return true;
        }
        return $this->assigned($user, $performance);
    }

    public function create(User $user): bool
    {
        return $this->hasPerm($user, ['performances.create', 'performances.manage']);
    }

    public function update(User $user, Performance $performance): bool
    {
        return $this->hasPerm($user, ['performances.update', 'performances.edit', 'performances.manage']);
    }

    public function delete(User $user, Performance $performance): bool
    {
        return $this->hasPerm($user, ['performances.delete', 'performances.manage']);
    }
}
