<?php

namespace App\Http\Requests\Api\Permission;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Permission;

class UpdatePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('permission') instanceof Permission
            ? $this->route('permission')->id
            : $this->route('permission');

        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('permissions', 'name')->where('guard_name', 'api')->ignore($id),
            ],
            'description' => ['nullable', 'string', 'max:255'],
            'group' => ['nullable', 'string', 'max:50'],
        ];
    }
}
