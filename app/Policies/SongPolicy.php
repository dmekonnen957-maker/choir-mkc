<?php

namespace App\Policies;

use App\Models\Song;
use App\Models\User;

class SongPolicy
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
                // Ignore guard check errors
            }
        }
        return false;
    }

    public function viewAny(User $user): bool
    {
        return $this->hasPerm($user, ['songs.view', 'songs.view.all', 'songs.manage'])
            || in_array($user->role, ['admin', 'super-admin', 'team_leader', 'member']);
    }

    public function view(User $user, Song $song): bool
    {
        if ($user->isGlobalAdmin() || $this->hasPerm($user, ['songs.view.all', 'songs.manage'])) {
            return true;
        }

        if ($this->hasPerm($user, ['songs.view'])) {
            return true;
        }

        return $user->choirs()
            ->where('choirs.id', $song->choir_id)
            ->wherePivot('status', 'active')
            ->exists();
    }

    public function create(User $user): bool
    {
        return $this->hasPerm($user, ['songs.create', 'songs.manage'])
            || $user->hasRole(['member', 'team_leader', 'admin', 'super-admin'], 'api')
            || $user->hasAnyRole(['member', 'team_leader', 'admin', 'super-admin'])
            || in_array($user->role, ['member', 'team_leader', 'admin', 'super-admin']);
    }

    public function approve(User $user, Song $song): bool
    {
        // Only Admin and Super-Admin can approve songs.
        // Choir Leaders and Choir Members CANNOT approve songs.
        $isAdmin = $user->isGlobalAdmin();

        return $isAdmin && !in_array($user->role, ['member', 'team_leader']);
    }

    public function reject(User $user, Song $song): bool
    {
        // Only Admin and Super-Admin can reject songs.
        // Choir Leaders and Choir Members CANNOT reject songs.
        $isAdmin = $user->isGlobalAdmin();

        return $isAdmin && !in_array($user->role, ['member', 'team_leader']);
    }

    public function update(User $user, Song $song): bool
    {
        return $this->assigned($user, $song)
            && $this->hasPerm($user, ['songs.update', 'songs.edit', 'songs.manage']);
    }

    public function delete(User $user, Song $song): bool
    {
        return $this->assigned($user, $song)
            && $this->hasPerm($user, ['songs.delete', 'songs.manage']);
    }

    private function assigned(User $user, Song $song): bool
    {
        return $user->choirs()
            ->where('choirs.id', $song->choir_id)
            ->wherePivot('status', 'active')
            ->exists();
    }
}
