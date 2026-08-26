<?php

namespace App\Http\Requests\Api\Lyric;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLyricRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'choir_id' => ['required', 'integer', 'exists:choirs,id'],
            'song_id' => ['sometimes', 'required', 'integer', Rule::exists('songs', 'id')],
            'language' => ['nullable', 'string', 'max:50'],
            'content' => ['sometimes', 'required', 'string'],
            'version_label' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'choir_id.required' => 'Please select a choir.',
            'choir_id.exists' => 'The selected choir does not exist.',
            'song_id.required' => 'Please select a song.',
            'song_id.exists' => 'The selected song does not exist.',
            'content.required' => 'Lyrics content is required.',
        ];
    }
}
