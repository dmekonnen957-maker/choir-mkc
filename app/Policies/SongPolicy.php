<?php

namespace App\Policies;

use App\Models\Song;
use App\Models\User;

class SongPolicy
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
                // Ignore guard check errors
            }
        }
        return false;
    }

    public function viewAny(User $user): bool
    {
        return $this->hasPerm($user, ['songs.view', 'songs.view.all', 'songs.manage']);
    }

    public function view(User $user, Song $song): bool
    {
        if ($this->hasPerm($user, ['songs.view.all', 'songs.manage'])) {
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
        return $this->hasPerm($user, ['songs.create', 'songs.manage']);
    }

    public function update(User $user, Song $song): bool
    {
        return $this->hasPerm($user, ['songs.update', 'songs.edit', 'songs.manage']);
    }

    public function delete(User $user, Song $song): bool
    {
        return $this->hasPerm($user, ['songs.delete', 'songs.manage']);
    }
}
