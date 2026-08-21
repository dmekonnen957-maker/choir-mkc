<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;

class SongHistoryResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'choir_id' => $this->choir_id,
            'song_id' => $this->song_id,
            'title' => $this->title,
            'content' => $this->content,
            'event_date' => $this->event_date,
            'source' => $this->source,
            'created_by' => $this->created_by,
            'created_at' => $this->created_at,
        ];
    }
}
