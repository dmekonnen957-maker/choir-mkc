<?php

namespace App\Http\Requests\Api\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
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
        return [
            'name' => ['required', 'string', 'min:2', 'max:100', 'regex:/^[\p{L}\s]+$/u'],
            'first_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'regex:/^\+2519\d{8}$/', 'unique:users,phone'],
            'choir_id' => ['required', 'integer', 'exists:choirs,id'],
            'password' => ['required', 'string', Password::min(8)],
            'password_confirmation' => ['required', 'string', 'same:password'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Full name is required.',
            'name.min' => 'Full name must contain at least 2 characters.',
            'name.regex' => 'Full name may only contain letters and spaces.',
            'email.unique' => 'This email address is already registered.',
            'phone.regex' => 'Enter a valid Ethiopian phone number (e.g. 0912345678).',
            'phone.unique' => 'This phone number is already registered.',
            'choir_id.required' => 'Please select a choir.',
            'choir_id.exists' => 'The selected choir is invalid.',
            'password_confirmation.same' => 'Password confirmation does not match.',
        ];
    }
}
