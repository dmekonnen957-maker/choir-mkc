<?php

namespace App\Policies;

use App\Models\Rehearsal;
use App\Models\User;

class RehearsalPolicy
{
    public function before(User $user, $ability): ?bool
    {
        if ($user->isGlobalAdmin()) {
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

    private function assigned(User $user, Rehearsal $rehearsal): bool
    {
        return $user->choirs()
            ->where('choirs.id', $rehearsal->choir_id)
            ->wherePivot('status', 'active')
            ->exists();
    }

    public function viewAny(User $user): bool
    {
        return $this->hasPerm($user, ['rehearsals.view', 'rehearsals.view.all', 'rehearsals.manage']);
    }

    public function view(User $user, Rehearsal $rehearsal): bool
    {
        if ($this->hasPerm($user, ['rehearsals.view.all', 'rehearsals.manage'])) {
            return true;
        }
        return $this->assigned($user, $rehearsal);
    }

    public function create(User $user): bool
    {
        return $this->hasPerm($user, ['rehearsals.create', 'rehearsals.manage']);
    }

    public function update(User $user, Rehearsal $rehearsal): bool
    {
        return $this->assigned($user, $rehearsal)
            && $this->hasPerm($user, ['rehearsals.update', 'rehearsals.edit', 'rehearsals.manage']);
    }

    public function delete(User $user, Rehearsal $rehearsal): bool
    {
        return $this->assigned($user, $rehearsal)
            && $this->hasPerm($user, ['rehearsals.delete', 'rehearsals.manage']);
    }
}
