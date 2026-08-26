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

    protected function prepareForValidation(): void
    {
        if ($this->filled('name')) {
            $this->merge(['name' => trim((string) $this->input('name'))]);
        }

        if ($this->filled('phone')) {
            $this->merge(['phone' => $this->normalizePhone($this->input('phone'))]);
        }
    }

    private function normalizePhone($value): string
    {
        $digits = preg_replace('/\D/', '', (string) $value);

        if (str_starts_with($digits, '251')) {
            $digits = substr($digits, 3);
        } elseif (str_starts_with($digits, '0')) {
            $digits = substr($digits, 1);
        }

        if (preg_match('/^9\d{8}$/', $digits)) {
            return '+251' . $digits;
        }

        return (string) $value;
    }

    public function rules(): array
    {
        $id = $this->route('user') instanceof User ? $this->route('user')->id : $this->route('user');

        return [
            'name' => ['sometimes', 'required', 'string', 'min:2', 'max:100', 'regex:/^[\p{L}\s]+$/u'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($id)],
            'phone' => ['nullable', 'string', 'regex:/^\+2519\d{8}$/', Rule::unique('users', 'phone')->ignore($id)],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['nullable', 'string', Rule::in(['member', 'team_leader', 'admin', 'super-admin'])],
            'status' => ['nullable', 'string', Rule::in(['pending', 'approved', 'rejected'])],
            'choir_id' => ['nullable', 'integer', 'exists:choirs,id'],
            'rejection_reason' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Full name is required.',
            'name.min' => 'Full name must contain at least 2 characters.',
            'name.max' => 'Full name must not exceed 100 characters.',
            'name.regex' => 'Full name may only contain letters and spaces.',
            'email.required' => 'Email address is required.',
            'email.email' => 'Enter a valid email address.',
            'email.unique' => 'This email address is already registered.',
            'phone.regex' => 'Enter a valid Ethiopian phone number (e.g. 0912345678).',
            'phone.unique' => 'This phone number is already registered.',
            'password.min' => 'Password must be at least 8 characters.',
        ];
    }
}
