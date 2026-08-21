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
            'date' => $this->date,
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'venue' => $this->venue,
            'location' => $this->location,
            'description' => $this->description,
            'organizer' => $this->organizer,
            'dress_code' => $this->dress_code,
            'special_instructions' => $this->special_instructions,
            'status' => $this->status,
            'is_public' => $this->is_public,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_at' => $this->created_at,
        ];
    }
}
