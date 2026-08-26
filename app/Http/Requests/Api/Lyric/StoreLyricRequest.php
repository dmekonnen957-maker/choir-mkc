<?php

namespace App\Http\Requests\Api\Lyric;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLyricRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->route('choir') && !$this->has('choir_id')) {
            $this->merge(['choir_id' => $this->route('choir')->id]);
        }
        if ($this->route('song') && !$this->has('song_id')) {
            $this->merge(['song_id' => $this->route('song')->id]);
        }
    }

    public function rules(): array
    {
        return [
            'choir_id' => ['required', 'integer', 'exists:choirs,id'],
            'song_id' => ['required', 'integer', Rule::exists('songs', 'id')],
            'language' => ['nullable', 'string', 'max:50'],
            'content' => ['required', 'string'],
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
