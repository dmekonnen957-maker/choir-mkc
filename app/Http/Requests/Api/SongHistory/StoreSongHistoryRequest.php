<?php

namespace App\Http\Requests\Api\SongHistory;

use Illuminate\Foundation\Http\FormRequest;

class StoreSongHistoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string'],
            'content' => ['nullable', 'string'],
            'event_date' => ['nullable', 'date'],
            'source' => ['nullable', 'string'],
        ];
    }
}
