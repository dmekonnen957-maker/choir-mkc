<?php

namespace App\Policies;

use App\Models\Announcement;
use App\Models\User;

class AnnouncementPolicy
{
    public function before(User $user, $ability): ?bool
    {
        if ($user->hasAnyRole(['super-admin', 'admin'])) {
            return true;
        }
        return null;
    }

    private function assigned(User $user, Announcement $announcement): bool
    {
        if ($announcement->choir_id === null) {
            return $user->can('announcements.view.all');
        }
        return $user->choirs()
            ->where('choirs.id', $announcement->choir_id)
            ->wherePivot('status', 'active')
            ->exists();
    }

    public function viewAny(User $user): bool
    {
        return $user->can('announcements.view');
    }

    public function view(User $user, Announcement $announcement): bool
    {
        if ($user->can('announcements.view.all')) {
            return true;
        }
        return $this->assigned($user, $announcement);
    }

    public function create(User $user): bool
    {
        return $user->can('announcements.manage');
    }

    public function update(User $user, Announcement $announcement): bool
    {
        return $user->can('announcements.manage');
    }

    public function delete(User $user, Announcement $announcement): bool
    {
        return $user->can('announcements.manage');
    }
}
