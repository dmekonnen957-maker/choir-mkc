<?php

namespace App\Http\Requests\Api\SongFile;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSongFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'description' => ['nullable', 'string'],
            'is_public' => ['nullable', 'boolean'],
            'is_downloadable' => ['nullable', 'boolean'],
        ];
    }
}
