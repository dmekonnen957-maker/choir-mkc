<?php

namespace App\Http\Requests\Api\Rehearsal;

use Illuminate\Foundation\Http\FormRequest;

class AttachRehearsalSongRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'song_id' => ['required', 'exists:songs,id'],
            'status' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
