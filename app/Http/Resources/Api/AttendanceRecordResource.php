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
            'check_in_at' => $this->check_in_at?->toIso8601String(),
            'check_in_time' => $this->check_in_at ? $this->check_in_at->format('h:i A') : null,
            'check_in_timestamp' => $this->check_in_at ? $this->check_in_at->format('h:i:s A') : null,
            'check_out_at' => $this->check_out_at?->toIso8601String(),
            'check_out_time' => $this->check_out_at ? $this->check_out_at->format('h:i A') : null,
            'notes' => $this->notes,
            'marked_by' => $this->marked_by,
            'marker_name' => $this->marker?->name,
            'member' => new MemberResource($this->whenLoaded('member')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
