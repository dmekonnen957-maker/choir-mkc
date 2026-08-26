<?php

namespace App\Policies;

use App\Models\Lyric;
use App\Models\User;

class LyricPolicy
{
    public function before(User $user, $ability): ?bool
    {
        if ($user->hasAnyRole(['super-admin', 'admin'])) {
            return true;
        }
        return null;
    }

    private function assigned(User $user, Lyric $lyric): bool
    {
        return $user->choirs()
            ->where('choirs.id', $lyric->choir_id)
            ->wherePivot('status', 'active')
            ->exists();
    }

    public function viewAny(User $user): bool
    {
        return $user->can('lyrics.view');
    }

    public function view(User $user, Lyric $lyric): bool
    {
        if ($user->can('lyrics.view.all')) {
            return true;
        }
        return $this->assigned($user, $lyric);
    }

    public function create(User $user): bool
    {
        return $user->can('lyrics.create');
    }

    public function update(User $user, Lyric $lyric): bool
    {
        if (!$user->can('lyrics.edit')) {
            return false;
        }
        return $this->assigned($user, $lyric);
    }

    public function delete(User $user, Lyric $lyric): bool
    {
        if (!$user->can('lyrics.delete')) {
            return false;
        }
        return $this->assigned($user, $lyric);
    }
}
