<?php

namespace App\Policies;

use App\Models\Rehearsal;
use App\Models\User;

class RehearsalPolicy
{
    public function before(User $user, $ability): ?bool
    {
        if ($user->hasAnyRole(['super-admin', 'admin'])) {
            return true;
        }
        return null;
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
        return $user->can('rehearsals.view');
    }

    public function view(User $user, Rehearsal $rehearsal): bool
    {
        if ($user->can('rehearsals.view.all')) {
            return true;
        }
        return $this->assigned($user, $rehearsal);
    }

    public function create(User $user): bool
    {
        return $user->can('rehearsals.manage');
    }

    public function update(User $user, Rehearsal $rehearsal): bool
    {
        return $user->can('rehearsals.manage');
    }

    public function delete(User $user, Rehearsal $rehearsal): bool
    {
        return $user->can('rehearsals.manage');
    }
}
