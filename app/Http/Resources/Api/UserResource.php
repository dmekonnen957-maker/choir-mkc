<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        $primaryChoir = $this->relationLoaded('choirs') && $this->choirs ? $this->choirs->first() : null;

        // Fetch effective roles and permissions from Spatie
        $roleNames = collect($this->getRoleNames()->values()->all());
        if ($roleNames->isEmpty() && $this->role) {
            $roleNames = collect([$this->role]);
        }

        // Load role models with areas
        $roleModels = \Spatie\Permission\Models\Role::where('guard_name', 'api')
            ->whereIn('name', $roleNames->toArray())
            ->with('permissions')
            ->get()
            ->keyBy('name');

        $coreRoleAreas = [
            'super-admin' => 'admin',
            'admin' => 'admin',
            'team_leader' => 'team_leader',
            'team-leader' => 'team_leader',
            'member' => 'member',
            'musician' => 'musician',
            'musicians' => 'musician',
        ];

        $rolesWithArea = $roleNames->map(function ($name) use ($roleModels, $coreRoleAreas) {
            $role = $roleModels->get($name);
            $area = $role?->area;
            if ($area === 'team-leader') {
                $area = 'team_leader';
            } elseif ($area === 'musicians') {
                $area = 'musician';
            }

            if (! $area) {
                $area = $coreRoleAreas[$name] ?? null;
            }

            if (! $area && $role) {
                $perms = $role->permissions->pluck('name')->toArray();
                foreach ($perms as $p) {
                    if (str_starts_with($p, 'users.') || str_starts_with($p, 'roles.') || str_starts_with($p, 'permissions.') || str_starts_with($p, 'audit_logs.') || str_starts_with($p, 'reports.') || str_starts_with($p, 'settings.') || $p === 'choirs.create' || $p === 'choirs.delete' || $p === 'choirs.manage') {
                        $area = 'admin';
                        break;
                    }
                }
            }

            return [
                'name' => $name,
                'area' => $area ?: 'member',
            ];
        });

        $permissions = $this->getAllPermissions()->pluck('name')->values()->all();
        $primaryRole = $roleNames->first() ?? $this->role ?? 'member';

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
            'role' => $primaryRole,
            'user_role' => $primaryRole,
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
            'roles' => $roleNames,
            'roles_with_area' => $rolesWithArea,
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
