<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceSessionResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'choir_id' => $this->choir_id,
            'rehearsal_id' => $this->rehearsal_id,
            'performance_id' => $this->performance_id,
            'event_type' => $this->event_type ?? ($this->performance_id ? 'performance' : 'rehearsal'),
            'title' => $this->title ?? ($this->performance?->title ?? $this->rehearsal?->title ?? 'Scheduled Session'),
            'session_date' => $this->session_date ? $this->session_date->format('Y-m-d') : null,
            'start_time' => $this->start_time ?? ($this->performance?->start_time ?? $this->rehearsal?->start_time),
            'end_time' => $this->end_time ?? ($this->performance?->end_time ?? $this->rehearsal?->end_time),
            'status' => $this->status ?? 'open',
            'late_threshold_minutes' => (int) ($this->late_threshold_minutes ?? 15),
            'notes' => $this->notes,
            'created_by' => $this->created_by,
            'creator_name' => $this->creator?->name,
            'choir' => $this->whenLoaded('choir', function () {
                return $this->choir ? new ChoirResource($this->choir) : null;
            }),
            'performance' => $this->whenLoaded('performance', function () {
                return $this->performance ? new PerformanceResource($this->performance) : null;
            }),
            'rehearsal' => $this->whenLoaded('rehearsal', function () {
                if (! $this->rehearsal) {
                    return null;
                }
                return [
                    'id' => $this->rehearsal->id,
                    'title' => $this->rehearsal->title,
                    'date' => $this->rehearsal->date?->format('Y-m-d'),
                    'start_time' => $this->rehearsal->start_time,
                    'location' => $this->rehearsal->location,
                ];
            }),
            'records' => $this->whenLoaded('attendanceRecords', function () {
                return AttendanceRecordResource::collection($this->attendanceRecords);
            }),
            'counts' => [
                'present' => $this->relationLoaded('attendanceRecords') ? $this->attendanceRecords->where('status', 'present')->count() : null,
                'late' => $this->relationLoaded('attendanceRecords') ? $this->attendanceRecords->where('status', 'late')->count() : null,
                'absent' => $this->relationLoaded('attendanceRecords') ? $this->attendanceRecords->where('status', 'absent')->count() : null,
                'excused' => $this->relationLoaded('attendanceRecords') ? $this->attendanceRecords->where('status', 'excused')->count() : null,
            ],
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
