<?php

namespace App\Http\Requests\Api\Permission;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('permissions', 'name')->where('guard_name', 'api'),
            ],
            'description' => ['nullable', 'string', 'max:255'],
            'group' => ['nullable', 'string', 'max:50'],
        ];
    }
}
