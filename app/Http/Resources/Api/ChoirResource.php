<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;

class ChoirResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'logo_path' => $this->logo_path,
            'description' => $this->description,
            'church_name' => $this->church_name,
            'status' => $this->status,
            'is_active' => $this->status === 'active',
            'is_public' => $this->is_public,
            'created_by' => $this->created_by,
            'created_at' => $this->created_at,
            'team_leader_id' => $this->team_leader_id,
            'uniform_primary_color' => $this->uniform_primary_color,
            'uniform_secondary_color' => $this->uniform_secondary_color,
            'choir_type' => $this->choir_type,
            'uniform_pattern' => $this->uniform_pattern,
            'uniform_description' => $this->uniform_description,
            'team_leader' => $this->whenLoaded('teamLeader', function () {
                return $this->teamLeader ? [
                    'id' => $this->teamLeader->id,
                    'name' => $this->teamLeader->name,
                    'email' => $this->teamLeader->email,
                    'phone' => $this->teamLeader->phone,
                ] : null;
            }),
            'member_count' => $this->whenCounted('users'),
            'songs_count' => $this->whenCounted('songs'),
            'performances_count' => $this->whenCounted('performances'),
            'members' => $this->whenLoaded('users', function () {
                return $this->users->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'role' => $user->role,
                        'status' => $user->pivot?->status,
                    ];
                });
            }),
            'upcoming_performances' => $this->whenLoaded('upcoming', function () {
                return PerformanceResource::collection($this->upcoming);
            }),
            'performance_history' => $this->whenLoaded('history', function () {
                return PerformanceResource::collection($this->history);
            }),
        ];
    }
}
