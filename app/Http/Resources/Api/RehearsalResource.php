<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;

class RehearsalResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'choir_id' => $this->choir_id,
            'title' => $this->title,
            'date' => $this->date ? $this->date->format('Y-m-d') : null,
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'location' => $this->location,
            'description' => $this->description,
            'notes' => $this->description,
            'status' => $this->status,
            'created_by' => $this->created_by,
            'choir' => $this->relationLoaded('choir') ? [
                'id' => $this->choir->id,
                'name' => $this->choir->name,
                'team_leader' => $this->choir->teamLeader ? [
                    'id' => $this->choir->teamLeader->id,
                    'name' => $this->choir->teamLeader->name,
                ] : null,
            ] : null,
            'created_at' => $this->created_at,
        ];
    }
}
