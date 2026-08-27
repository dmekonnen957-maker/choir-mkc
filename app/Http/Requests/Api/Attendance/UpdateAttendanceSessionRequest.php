<?php

namespace App\Http\Requests\Api\Attendance;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAttendanceSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rehearsal_id' => ['nullable', 'exists:rehearsals,id'],
            'performance_id' => ['nullable', 'exists:performances,id'],
            'event_type' => ['nullable', 'string', 'in:rehearsal,performance,service,other'],
            'title' => ['nullable', 'string', 'max:255'],
            'session_date' => ['sometimes', 'required', 'date'],
            'start_time' => ['nullable'],
            'end_time' => ['nullable'],
            'status' => ['nullable', 'string', 'in:not_started,open,closed'],
            'late_threshold_minutes' => ['nullable', 'integer', 'min:0', 'max:240'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
