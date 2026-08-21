<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;

class ChoirResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'logo_path' => $this->logo_path,
            'description' => $this->description,
            'church_name' => $this->church_name,
            'status' => $this->status,
            'is_public' => $this->is_public,
            'created_by' => $this->created_by,
            'created_at' => $this->created_at,
            'member_count' => $this->whenCounted('members'),
        ];
    }
}
