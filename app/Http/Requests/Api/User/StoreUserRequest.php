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

        // Return unchanged so the regex rule fails with a clear message.
        return (string) $value;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:100', 'regex:/^[\p{L}\s]+$/u'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'phone' => ['required', 'string', 'regex:/^\+2519\d{8}$/', Rule::unique('users', 'phone')],
            'password' => ['required', 'string', 'min:8'],
            'password_confirmation' => ['required', 'string', 'same:password'],
            'role' => ['nullable', 'string', Rule::in(['member', 'team_leader', 'admin', 'super-admin'])],
            'status' => ['nullable', 'string', Rule::in(['pending', 'approved', 'rejected'])],
            'choir_id' => ['nullable', 'integer', 'exists:choirs,id'],
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
            'phone.required' => 'Phone number is required.',
            'phone.regex' => 'Enter a valid Ethiopian phone number (e.g. 0912345678).',
            'phone.unique' => 'This phone number is already registered.',
            'password.required' => 'Password is required.',
            'password.min' => 'Password must be at least 8 characters.',
            'password_confirmation.required' => 'Please confirm the password.',
            'password_confirmation.same' => 'Password confirmation does not match.',
        ];
    }
}
