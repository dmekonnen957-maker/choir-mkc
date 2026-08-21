<?php

namespace App\Policies;

use App\Models\Song;
use App\Models\User;

class SongPolicy
{
    public function before(User $user, $ability): ?bool
    {
        if ($user->hasAnyRole(['super-admin', 'admin'])) {
            return true;
        }
        return null;
    }

    private function assigned(User $user, Song $song): bool
    {
        return $user->choirs()
            ->where('choirs.id', $song->choir_id)
            ->wherePivot('status', 'active')
            ->exists();
    }

    public function viewAny(User $user): bool
    {
        return $user->can('songs.view');
    }

    public function view(User $user, Song $song): bool
    {
        if ($user->can('songs.view.all')) {
            return true;
        }
        return $this->assigned($user, $song);
    }

    public function create(User $user): bool
    {
        return $user->can('songs.manage');
    }

    public function update(User $user, Song $song): bool
    {
        return $user->can('songs.manage');
    }

    public function delete(User $user, Song $song): bool
    {
        return $user->can('songs.manage');
    }
}
