<?php

namespace App\Policies;

use App\Models\Member;
use App\Models\User;

class MemberPolicy
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

    private function assigned(User $user, Member $member): bool
    {
        return $user->choirs()
            ->where('choirs.id', $member->choir_id)
            ->wherePivot('status', 'active')
            ->exists();
    }

    public function viewAny(User $user): bool
    {
        return $this->hasPerm($user, ['members.view', 'members.view.all', 'members.manage']);
    }

    public function view(User $user, Member $member): bool
    {
        if ($this->hasPerm($user, ['members.view.all', 'members.manage'])) {
            return true;
        }
        return $this->assigned($user, $member);
    }

    public function create(User $user): bool
    {
        return $this->hasPerm($user, ['members.create', 'members.manage']);
    }

    public function update(User $user, Member $member): bool
    {
        return $this->hasPerm($user, ['members.update', 'members.edit', 'members.manage']);
    }

    public function delete(User $user, Member $member): bool
    {
        return $this->hasPerm($user, ['members.delete', 'members.manage']);
    }
}
