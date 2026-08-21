<?php

namespace App\Http\Requests\Api\Performance;

use Illuminate\Foundation\Http\FormRequest;

class StorePerformanceRehearsalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rehearsal_id' => ['required', 'exists:rehearsals,id'],
        ];
    }
}
