<?php

namespace App\Policies;

use App\Models\GalleryItem;
use App\Models\User;

class GalleryItemPolicy
{
    public function before(User $user, $ability): ?bool
    {
        if ($user->hasAnyRole(['super-admin', 'admin'])) {
            return true;
        }
        return null;
    }

    private function assigned(User $user, GalleryItem $item): bool
    {
        return $user->choirs()
            ->where('choirs.id', $item->choir_id)
            ->wherePivot('status', 'active')
            ->exists();
    }

    public function viewAny(User $user): bool
    {
        return $user->can('gallery.view');
    }

    public function view(User $user, GalleryItem $item): bool
    {
        if ($user->can('gallery.view.all')) {
            return true;
        }
        return $this->assigned($user, $item);
    }

    public function create(User $user): bool
    {
        return $user->can('gallery.manage');
    }

    public function update(User $user, GalleryItem $item): bool
    {
        return $user->can('gallery.manage');
    }

    public function delete(User $user, GalleryItem $item): bool
    {
        return $user->can('gallery.manage');
    }
}
