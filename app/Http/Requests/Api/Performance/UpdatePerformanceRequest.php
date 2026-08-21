<?php

namespace App\Http\Requests\Api\Performance;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePerformanceRequest extends FormRequest
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
            'venue' => ['nullable', 'string'],
            'location' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'organizer' => ['nullable', 'string'],
            'dress_code' => ['nullable', 'string'],
            'special_instructions' => ['nullable', 'string'],
            'status' => ['nullable', 'in:planned,ongoing,completed,cancelled'],
            'is_public' => ['nullable', 'boolean'],
        ];
    }
}
