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
            'choir' => $this->whenLoaded('choir', function () {
                return [
                    'id' => $this->choir?->id,
                    'name' => $this->choir?->name,
                ];
            }),
            'song_id' => $this->song_id,
            'song' => $this->whenLoaded('song', function () {
                return [
                    'id' => $this->song?->id,
                    'title' => $this->song?->title,
                ];
            }),
            'language' => $this->language,
            'content' => $this->content,
            'version_label' => $this->version_label,
            'created_by' => $this->created_by,
            'creator' => $this->whenLoaded('creator', function () {
                return $this->creator ? ['id' => $this->creator->id, 'name' => $this->creator->name] : null;
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
