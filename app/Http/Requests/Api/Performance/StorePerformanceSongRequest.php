<?php

namespace App\Http\Requests\Api\Performance;

use Illuminate\Foundation\Http\FormRequest;

class StorePerformanceSongRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'song_id' => ['required', 'exists:songs,id'],
            'sequence_number' => ['nullable', 'integer'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
