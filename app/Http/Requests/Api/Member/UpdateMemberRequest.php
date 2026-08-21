<?php

namespace App\Http\Requests\Api\Member;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'member_code' => [
                'required',
                'string',
                Rule::unique('members')
                    ->where('choir_id', $this->route('choir')->id)
                    ->ignore($this->route('member')->id),
            ],
            'voice_section_id' => ['nullable', 'exists:voice_sections,id'],
            'user_id' => ['nullable', 'exists:users,id'],
            'phone' => ['nullable', 'string'],
            'email' => ['nullable', 'email'],
            'photo_path' => ['nullable', 'string'],
            'join_date' => ['nullable', 'date'],
            'role_title' => ['nullable', 'string'],
            'status' => ['nullable', 'in:active,inactive,alumni'],
            'bio' => ['nullable', 'string'],
            'is_public' => ['nullable', 'boolean'],
        ];
    }
}
