<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;

class MemberResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'choir_id' => $this->choir_id,
            'member_code' => $this->member_code,
            'user_id' => $this->user_id,
            'voice_section_id' => $this->voice_section_id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'photo_path' => $this->photo_path,
            'phone' => $this->phone,
            'email' => $this->email,
            'join_date' => $this->join_date,
            'role_title' => $this->role_title,
            'status' => $this->status,
            'bio' => $this->bio,
            'is_public' => $this->is_public,
            'voice_section' => new VoiceSectionResource($this->whenLoaded('voiceSection')),
            'created_at' => $this->created_at,
        ];
    }
}
