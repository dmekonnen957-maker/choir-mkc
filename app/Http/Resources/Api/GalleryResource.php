<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;

class GalleryResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'choir_id' => $this->choir_id,
            'performance_id' => $this->performance_id,
            'title' => $this->title,
            'description' => $this->description,
            'media_path' => $this->media_path,
            'media_type' => $this->media_type,
            'event_date' => $this->event_date,
            'is_public' => $this->is_public,
            'created_at' => $this->created_at,
        ];
    }
}
