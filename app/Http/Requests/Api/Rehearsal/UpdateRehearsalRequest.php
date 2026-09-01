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
            'title' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'start_time' => ['nullable', 'string'],
            'end_time' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:scheduled,completed,cancelled,upcoming,ongoing'],
        ];
    }
}
