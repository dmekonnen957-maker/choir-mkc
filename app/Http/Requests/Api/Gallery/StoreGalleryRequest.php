<?php

namespace App\Http\Requests\Api\Gallery;

use Illuminate\Foundation\Http\FormRequest;

class StoreGalleryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'media' => 'nullable|file|max:51200',
            'media_path' => 'nullable|string',
            'title' => 'required|string',
            'description' => 'nullable|string',
            'event_date' => 'nullable|date',
            'performance_id' => 'nullable|exists:performances,id',
            'is_public' => 'nullable|boolean',
        ];
    }
}
