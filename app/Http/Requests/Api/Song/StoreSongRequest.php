<?php

namespace App\Http\Requests\Api\Song;

use Illuminate\Foundation\Http\FormRequest;

class StoreSongRequest extends FormRequest
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
    }

    public function rules(): array
    {
        return [
            'choir_id' => ['required', 'integer', 'exists:choirs,id'],
            'title' => ['required', 'string', 'max:255'],
            'composer' => ['nullable', 'string', 'max:255'],
            'artist' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'original_key' => ['required', 'string', 'in:C,C#,D,D#,E,F,F#,G,G#,A,A#,B,Db,Eb,Gb,Ab,Bb'],
            'scale' => ['required', 'string', 'in:major,minor,ethiopian'],
            'scale_mode' => ['nullable', 'string', 'max:60'],
            'lyrics' => ['nullable', 'string'],
            'is_published' => ['nullable', 'boolean'],
            'audio' => ['nullable', 'file', 'mimes:mp3', 'max:15360'],
        ];
    }

    public function messages(): array
    {
        return [
            'choir_id.required' => 'Please select a choir.',
            'choir_id.exists' => 'The selected choir does not exist.',
            'title.required' => 'Song title is required.',
            'original_key.required' => 'Please select the original key.',
            'original_key.in' => 'The selected key is invalid.',
            'scale.required' => 'Please select a scale.',
            'scale.in' => 'The selected scale is invalid.',
            'audio.mimes' => 'Only MP3 audio files are allowed.',
            'audio.max' => 'The audio file must not exceed 15 MB.',
        ];
    }
}
