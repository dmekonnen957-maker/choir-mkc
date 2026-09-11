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
        if ($this->route('choir') && !$this->filled('choir_id')) {
            $this->merge(['choir_id' => $this->route('choir')->id]);
        }

        // If choir_id is not provided in payload, auto-resolve from the authenticated user's active choir
        if (!$this->filled('choir_id')) {
            $user = $this->user();
            if ($user) {
                $activeChoir = $user->choirs()->wherePivot('status', 'active')->first()
                    ?? $user->choirs()->first();
                if ($activeChoir) {
                    $this->merge(['choir_id' => $activeChoir->id]);
                }
            }
        }
    }

    public function rules(): array
    {
        return [
            'choir_id' => ['required', 'integer', 'exists:choirs,id'],
            'title' => ['required', 'string', 'max:255'],
            'composer' => ['nullable', 'string', 'max:255'],
            'artist' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:3000'],
            'original_key' => ['required', 'string', 'in:C,C#,D,D#,E,F,F#,G,G#,A,A#,B,Db,Eb,Gb,Ab,Bb'],
            'scale' => ['required', 'string', 'in:tizita_major,tizita_minor,bati_major,bati_minor,ambassel_major,ambassel_minor,anchihoye,major,minor,ethiopian'],
            'scale_mode' => ['nullable', 'string', 'max:60'],
            'lyrics' => ['nullable', 'string'],
            'lyrics_visible_to_public' => ['nullable', 'boolean'],
            'is_published' => ['nullable', 'boolean'],
            'audio' => ['nullable', 'file', 'mimes:mp3', 'max:15360'],
            'cover_image' => ['nullable', 'image', 'max:5120'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $user = $this->user();
            if ($user && !in_array($user->role, ['admin', 'super-admin'])) {
                // Non-admins must be a member of the choir they are submitting to
                $choirId = $this->input('choir_id');
                if ($choirId && !$user->choirs()->where('choirs.id', $choirId)->exists()) {
                    $validator->errors()->add('choir_id', 'You can only submit songs for a choir you are a member of.');
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'choir_id.required' => 'Please select a choir. You must be assigned to an active choir to submit songs.',
            'choir_id.exists' => 'The selected choir does not exist.',
            'title.required' => 'Song title is required.',
            'title.max' => 'Song title cannot exceed 255 characters.',
            'original_key.required' => 'Please select the original key.',
            'original_key.in' => 'The selected musical key is invalid.',
            'scale.required' => 'Please select a scale.',
            'scale.in' => 'The selected scale is invalid.',
            'audio.mimes' => 'Only MP3 audio files are allowed.',
            'audio.max' => 'The audio file must not exceed 15 MB.',
            'cover_image.image' => 'The cover must be a valid image file.',
            'cover_image.max' => 'The cover image must not exceed 5 MB.',
        ];
    }
}
