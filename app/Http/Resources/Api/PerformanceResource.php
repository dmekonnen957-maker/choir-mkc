<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;

class PerformanceResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'choir_id' => $this->choir_id,
            'title' => $this->title,
            'type' => $this->type ?? 'Worship',
            'date' => $this->date ? $this->date->format('Y-m-d') : null,
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'venue' => $this->venue,
            'location' => $this->location,
            'description' => $this->description,
            'organizer' => $this->organizer,
            'dress_code' => $this->dress_code,
            'special_instructions' => $this->special_instructions,
            'poster_path' => $this->poster_path,
            'poster_url' => $this->poster_path ? (str_starts_with($this->poster_path, 'http') ? $this->poster_path : (str_starts_with($this->poster_path, '/') ? $this->poster_path : '/storage/' . ltrim($this->poster_path, '/'))) : null,
            'status' => $this->status,
            'is_public' => $this->is_public,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_at' => $this->created_at,
            'choir' => $this->whenLoaded('choir', function () {
                return $this->choir ? [
                    'id' => $this->choir->id,
                    'name' => $this->choir->name,
                    'description' => $this->choir->description,
                    'logo_path' => $this->choir->logo_path,
                ] : null;
            }),
            'songs' => SongResource::collection($this->whenLoaded('songs')),
        ];
    }
}
