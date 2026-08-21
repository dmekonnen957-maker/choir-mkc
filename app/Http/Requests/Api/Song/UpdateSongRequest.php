<?php

namespace App\Http\Requests\Api\Song;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSongRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'song_category_id' => ['nullable', 'exists:song_categories,id'],
            'composer' => ['nullable', 'string'],
            'artist' => ['nullable', 'string'],
            'arranger' => ['nullable', 'string'],
            'language' => ['nullable', 'string'],
            'year_written' => ['nullable', 'integer'],
            'description' => ['nullable', 'string'],
            'cover_image_path' => ['nullable', 'string'],
            'is_published' => ['nullable', 'boolean'],
        ];
    }
}
