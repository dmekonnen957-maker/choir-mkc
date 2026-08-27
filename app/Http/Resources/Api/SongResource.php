<?php

namespace App\Http\Resources\Api;

use App\Services\TransposeService;
use Illuminate\Http\Resources\Json\JsonResource;

class SongResource extends JsonResource
{
    public function toArray($request): array
    {
        $transpose = (int) ($request->input('transpose', 0));

        $key = $this->original_key;
        $displayLyrics = $this->lyrics;

        if ($transpose !== 0) {
            if ($this->original_key) {
                $key = TransposeService::transposeKey($this->original_key, $transpose);
            }
            if ($this->lyrics !== null) {
                $displayLyrics = TransposeService::transposeLyrics($this->lyrics, $transpose);
            }
        }

        return [
            'id' => $this->id,
            'choir_id' => $this->choir_id,
            'choir' => $this->whenLoaded('choir', function () {
                return $this->choir ? ['id' => $this->choir->id, 'name' => $this->choir->name] : null;
            }),
            'title' => $this->title,
            'composer' => $this->composer,
            'artist' => $this->artist,
            'description' => $this->description,
            'audio_path' => $this->audio_path,
            'audio_url' => $this->audio_url,
            'original_key' => $this->original_key,
            'key' => $key,
            'scale' => $this->scale,
            'scale_mode' => $this->scale_mode,
            'lyrics' => $this->lyrics,
            'display_lyrics' => $displayLyrics,
            'has_lyrics' => (bool) $this->lyrics,
            'is_published' => $this->is_published,
            'created_by' => $this->created_by,
            'creator' => $this->whenLoaded('creator', function () {
                return $this->creator ? ['id' => $this->creator->id, 'name' => $this->creator->name] : null;
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
