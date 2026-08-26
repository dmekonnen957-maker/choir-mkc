<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;

class SongResource extends JsonResource
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
            'title' => $this->title,
            'composer' => $this->composer,
            'artist' => $this->artist,
            'description' => $this->description,
            'audio_path' => $this->audio_path,
            'audio_url' => $this->audio_url,
            'created_by' => $this->created_by,
            'creator' => $this->whenLoaded('creator', function () {
                return $this->creator ? ['id' => $this->creator->id, 'name' => $this->creator->name] : null;
            }),
            'lyrics_count' => $this->whenCounted('lyrics'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
