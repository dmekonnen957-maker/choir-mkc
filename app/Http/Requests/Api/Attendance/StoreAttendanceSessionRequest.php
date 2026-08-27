<?php

namespace App\Http\Requests\Api\Attendance;

use Illuminate\Foundation\Http\FormRequest;

class StoreAttendanceSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'choir_id' => ['nullable', 'exists:choirs,id'],
            'rehearsal_id' => ['nullable', 'exists:rehearsals,id'],
            'performance_id' => ['nullable', 'exists:performances,id'],
            'event_type' => ['nullable', 'string', 'in:rehearsal,performance,service,other'],
            'title' => ['nullable', 'string', 'max:255'],
            'session_date' => ['required', 'date'],
            'start_time' => ['nullable', 'date_format:H:i,H:i:s'],
            'end_time' => ['nullable', 'date_format:H:i,H:i:s'],
            'status' => ['nullable', 'string', 'in:not_started,open,closed'],
            'late_threshold_minutes' => ['nullable', 'integer', 'min:0', 'max:240'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
