<?php

namespace App\Http\Requests\Api\User;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('user') instanceof User ? $this->route('user')->id : $this->route('user');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['nullable', 'string', Rule::in(['member', 'team_leader', 'admin', 'super-admin'])],
            'roles' => ['nullable', 'array'],
            'status' => ['nullable', 'string', Rule::in(['pending', 'approved', 'rejected'])],
            'choir_id' => ['nullable', 'integer', 'exists:choirs,id'],
            'rejection_reason' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
