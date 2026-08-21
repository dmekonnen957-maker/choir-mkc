<?php

namespace App\Http\Requests\Api\Role;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('role') instanceof Role ? $this->route('role')->id : $this->route('role');

        return [
            'name' => ['required', 'string', Rule::unique('roles', 'name')->ignore($id)],
            'permissions' => 'nullable|array',
        ];
    }
}
