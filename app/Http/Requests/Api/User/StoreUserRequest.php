<?php

namespace App\Http\Requests\Api\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8'],
            'password_confirmation' => ['nullable', 'string', 'same:password'],
            'role' => ['nullable', 'string', Rule::in(['member', 'team_leader', 'admin', 'super-admin'])],
            'roles' => ['nullable', 'array'],
            'status' => ['nullable', 'string', Rule::in(['pending', 'approved', 'rejected'])],
            'choir_id' => ['nullable', 'integer', 'exists:choirs,id'],
        ];
    }
}
