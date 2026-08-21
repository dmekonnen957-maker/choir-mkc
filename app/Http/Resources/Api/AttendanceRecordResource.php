<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceRecordResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'choir_id' => $this->choir_id,
            'attendance_session_id' => $this->attendance_session_id,
            'member_id' => $this->member_id,
            'status' => $this->status,
            'notes' => $this->notes,
            'marked_by' => $this->marked_by,
            'member' => new MemberResource($this->whenLoaded('member')),
            'created_at' => $this->created_at,
        ];
    }
}
