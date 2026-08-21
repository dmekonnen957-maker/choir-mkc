<?php

namespace App\Http\Requests\Api\Rehearsal;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRehearsalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string'],
            'date' => ['required', 'date'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i'],
            'location' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:scheduled,completed,cancelled'],
        ];
    }
}
