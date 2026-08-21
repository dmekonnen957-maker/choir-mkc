<?php

namespace App\Http\Requests\Api\Lyric;

use Illuminate\Foundation\Http\FormRequest;

class StoreLyricRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'language' => ['required', 'string', 'max:50'],
            'content' => ['required', 'string'],
            'version_label' => ['nullable', 'string'],
            'is_published' => ['nullable', 'boolean'],
        ];
    }
}
