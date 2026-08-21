<?php

namespace App\Http\Requests\Api\Performance;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePerformanceMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'member_id' => ['required', 'exists:members,id'],
            'expected' => ['nullable', 'boolean'],
            'participation_status' => ['nullable', 'in:participated,absent,excused,late,replaced'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
