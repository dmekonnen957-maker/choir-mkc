<?php

namespace App\Http\Requests\Api\SongFile;

use Illuminate\Foundation\Http\FormRequest;

class StoreSongFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:51200'],
            'file_name' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'is_public' => ['nullable', 'boolean'],
            'is_downloadable' => ['nullable', 'boolean'],
        ];
    }
}
