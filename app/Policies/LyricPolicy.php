<?php

namespace App\Policies;

use App\Models\Lyric;
use App\Models\User;

class LyricPolicy
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
        return $this->hasPerm($user, ['lyrics.view', 'lyrics.view.all', 'lyrics.manage']);
    }

    public function view(User $user, Lyric $lyric): bool
    {
        if ($this->hasPerm($user, ['lyrics.view.all', 'lyrics.manage'])) {
            return true;
        }

        if ($this->hasPerm($user, ['lyrics.view'])) {
            return true;
        }

        return $user->choirs()
            ->where('choirs.id', $lyric->choir_id)
            ->wherePivot('status', 'active')
            ->exists();
    }

    public function create(User $user): bool
    {
        return $this->hasPerm($user, ['lyrics.create', 'lyrics.manage']);
    }

    public function update(User $user, Lyric $lyric): bool
    {
        return $this->hasPerm($user, ['lyrics.update', 'lyrics.edit', 'lyrics.manage']);
    }

    public function delete(User $user, Lyric $lyric): bool
    {
        return $this->hasPerm($user, ['lyrics.delete', 'lyrics.manage']);
    }
}
