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
        $choir = $this->route('choir');
        $choirId = $choir ? $choir->id : $this->input('choir_id');
        $member = $this->route('member');
        $memberId = $member ? (is_object($member) ? $member->id : $member) : null;

        $rules = [
            'member_type' => ['nullable', 'in:adult,child'],
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'date_of_birth' => ['nullable', 'date', 'before_or_equal:today'],
            'gender' => ['nullable', 'string', 'max:20'],
            'member_code' => [
                'nullable',
                'string',
                Rule::unique('members')
                    ->where('choir_id', $choirId)
                    ->ignore($memberId),
            ],
            'voice_section_id' => ['nullable', 'exists:voice_sections,id'],
            'photo' => ['nullable', 'image', 'max:5120'],
            'photo_path' => ['nullable', 'string'],
            'join_date' => ['nullable', 'date'],
            'role_title' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:active,inactive,suspended,former,transferred,graduated'],
            'bio' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'grade_school_level' => ['nullable', 'string', 'max:100'],
            'emergency_notes' => ['nullable', 'string'],
            'special_notes' => ['nullable', 'string'],
            'is_public' => ['nullable', 'boolean'],

            // Guardian fields (optional on update, but validated if present)
            'guardian_name' => ['nullable', 'string', 'max:255'],
            'guardian_relationship' => ['nullable', 'string', 'max:50'],
            'guardian_relationship_other' => ['nullable', 'string', 'max:100'],
            'guardian_phone' => ['nullable', 'string', 'max:30'],
            'guardian_alt_phone' => ['nullable', 'string', 'max:30'],
            'guardian_email' => ['nullable', 'email', 'max:255'],
            'guardian_address' => ['nullable', 'string', 'max:500'],

            // Adult contact fields
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
        ];

        return $rules;
    }
}
