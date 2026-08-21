<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;

class LyricResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'choir_id' => $this->choir_id,
            'song_id' => $this->song_id,
            'language' => $this->language,
            'content' => $this->content,
            'version_label' => $this->version_label,
            'is_published' => $this->is_published,
            'created_at' => $this->created_at,
        ];
    }
}
