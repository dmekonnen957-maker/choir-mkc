<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;

class AnnouncementResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'choir_id' => $this->choir_id,
            'title' => $this->title,
            'content' => $this->content,
            'image_path' => $this->image_path,
            'published_at' => $this->published_at,
            'is_published' => $this->is_published,
            'created_by' => $this->created_by,
            'created_at' => $this->created_at,
        ];
    }
}
