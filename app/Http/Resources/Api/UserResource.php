<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')),
            'permissions' => $this->whenLoaded('permissions', fn () => $this->permissions->pluck('name')),
            'choirs' => $this->whenLoaded('choirs', function () {
                return $this->choirs->map(function ($choir) {
                    return [
                        'id' => $choir->id,
                        'name' => $choir->name,
                        'slug' => $choir->slug,
                        'status' => $choir->pivot->status ?? null,
                        'is_primary_leader' => (bool) ($choir->pivot->is_primary_leader ?? false),
                    ];
                });
            }),
            'created_at' => $this->created_at,
        ];
    }
}
