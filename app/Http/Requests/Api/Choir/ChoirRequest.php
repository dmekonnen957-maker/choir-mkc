<?php

namespace App\Http\Requests\Api\Choir;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ChoirRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', Rule::unique('choirs')->ignore($this->route('choir')?->id)],
            'description' => ['nullable', 'string'],
            'church_name' => ['nullable', 'string'],
            'logo_path' => ['nullable', 'string'],
            'status' => ['nullable', 'in:active,inactive'],
            'is_public' => ['nullable', 'boolean'],
        ];
    }
}
