<?php

namespace App\Policies;

use App\Models\Member;
use App\Models\User;

class MemberPolicy
{
    public function before(User $user, $ability): ?bool
    {
        if ($user->hasAnyRole(['super-admin', 'admin'])) {
            return true;
        }
        return null;
    }

    private function assigned(User $user, Member $member): bool
    {
        return $user->choirs()
            ->where('choirs.id', $member->choir_id)
            ->wherePivot('status', 'active')
            ->exists();
    }

    public function viewAny(User $user): bool
    {
        return $user->can('members.view');
    }

    public function view(User $user, Member $member): bool
    {
        if ($user->can('members.view.all')) {
            return true;
        }
        return $this->assigned($user, $member);
    }

    public function create(User $user): bool
    {
        return $user->can('members.manage');
    }

    public function update(User $user, Member $member): bool
    {
        return $user->can('members.manage');
    }

    public function delete(User $user, Member $member): bool
    {
        return $user->can('members.manage');
    }
}
