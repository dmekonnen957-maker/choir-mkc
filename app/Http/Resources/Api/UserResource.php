<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        $primaryChoir = $this->relationLoaded('choirs') && $this->choirs ? $this->choirs->first() : null;

        // Fetch effective roles and permissions from Spatie
        $roles = $this->getRoleNames()->values()->all();
        if (empty($roles) && $this->role) {
            $roles = [$this->role];
        }

        $permissions = $this->getAllPermissions()->pluck('name')->values()->all();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'full_name' => $this->name,
            'first_name' => $this->name,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at,
            'is_email_verified' => (bool) $this->email_verified_at,
            'phone' => $this->phone,
            'language' => $this->language ?? 'en',
            'timezone' => $this->timezone ?? 'Africa/Addis_Ababa',
            'role' => $this->role ?? ($roles[0] ?? 'member'),
            'user_role' => $this->role ?? ($roles[0] ?? 'member'),
            'member_code' => null,
            'status' => $this->status ?? 'pending',
            'approved_at' => $this->approved_at,
            'approved_by' => $this->approved_by,
            'deactivated_at' => $this->deactivated_at,
            'approver_name' => $this->whenLoaded('approvedBy', fn () => $this->approvedBy?->name),
            'rejection_reason' => $this->rejection_reason,
            'choir' => $primaryChoir ? [
                'id' => $primaryChoir->id,
                'name' => $primaryChoir->name,
                'slug' => $primaryChoir->slug,
                'uniform_primary_color' => $primaryChoir->uniform_primary_color,
                'uniform_secondary_color' => $primaryChoir->uniform_secondary_color,
            ] : null,
            'roles' => $roles,
            'permissions' => $permissions,
            'choirs' => $this->whenLoaded('choirs', function () {
                return $this->choirs->map(function ($choir) {
                    return [
                        'id' => $choir->id,
                        'name' => $choir->name,
                        'slug' => $choir->slug,
                        'uniform_primary_color' => $choir->uniform_primary_color,
                        'uniform_secondary_color' => $choir->uniform_secondary_color,
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
