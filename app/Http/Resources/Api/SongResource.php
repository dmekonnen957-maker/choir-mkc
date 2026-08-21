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
            'song_category_id' => $this->song_category_id,
            'title' => $this->title,
            'composer' => $this->composer,
            'artist' => $this->artist,
            'arranger' => $this->arranger,
            'language' => $this->language,
            'year_written' => $this->year_written,
            'description' => $this->description,
            'cover_image_path' => $this->cover_image_path,
            'is_published' => $this->is_published,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'category' => new SongCategoryResource($this->whenLoaded('songCategory')),
            'lyrics_count' => $this->whenCounted('lyrics'),
            'created_at' => $this->created_at,
        ];
    }
}
