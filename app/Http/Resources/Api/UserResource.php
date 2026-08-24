<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        $primaryChoir = $this->relationLoaded('choirs') ? ($this->choirs->first()) : null;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role,
            'status' => $this->status ?? 'pending',
            'approved_at' => $this->approved_at,
            'approved_by' => $this->approved_by,
            'approver_name' => $this->whenLoaded('approvedBy', fn () => $this->approvedBy?->name),
            'rejection_reason' => $this->rejection_reason,
            'choir' => $primaryChoir ? [
                'id' => $primaryChoir->id,
                'name' => $primaryChoir->name,
                'slug' => $primaryChoir->slug,
            ] : null,
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
            'updated_at' => $this->updated_at,
        ];
    }
}
