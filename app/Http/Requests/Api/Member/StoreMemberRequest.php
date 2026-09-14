<?php

namespace App\Http\Requests\Api\Member;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $choir = $this->route('choir');
        $choirId = $choir ? $choir->id : $this->input('choir_id');

        $rules = [
            'member_type' => ['nullable', 'in:adult,child'],
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'member_code' => [
                'nullable',
                'string',
                Rule::unique('members')->where('choir_id', $choirId),
            ],
            'voice_section_id' => ['nullable', 'exists:voice_sections,id'],
            'photo' => ['nullable', 'image', 'max:5120'], // 5MB
            'photo_path' => ['nullable', 'string'],
            'join_date' => ['nullable', 'date'],
            'role_title' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:active,inactive,suspended,former,transferred,graduated'],
            'bio' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'is_public' => ['nullable', 'boolean'],
        ];

        if ($this->input('member_type') === 'child') {
            $rules['date_of_birth'] = ['required', 'date', 'before_or_equal:today'];
            $rules['gender'] = ['nullable', 'string', 'max:20'];
            $rules['grade_school_level'] = ['nullable', 'string', 'max:100'];
            $rules['emergency_notes'] = ['nullable', 'string'];
            $rules['special_notes'] = ['nullable', 'string'];

            // Parent/Guardian fields
            $rules['guardian_name'] = ['required', 'string', 'max:255'];
            $rules['guardian_relationship'] = ['required', 'in:Mother,Father,Legal Guardian,Other'];
            $rules['guardian_relationship_other'] = ['required_if:guardian_relationship,Other', 'nullable', 'string', 'max:100'];
            $rules['guardian_phone'] = ['required', 'string', 'max:30'];
            $rules['guardian_alt_phone'] = ['nullable', 'string', 'max:30'];
            $rules['guardian_email'] = ['nullable', 'email', 'max:255'];
            $rules['guardian_address'] = ['nullable', 'string', 'max:500'];

            // Consent confirmation
            $rules['consent_confirmed'] = ['required', 'accepted'];
        } else {
            // Adult rules
            $rules['date_of_birth'] = ['nullable', 'date'];
            $rules['email'] = ['nullable', 'email', 'max:255'];
            $rules['phone'] = ['nullable', 'string', 'max:30'];
            $rules['user_id'] = ['nullable', 'exists:users,id'];
            $rules['create_user_account'] = ['nullable', 'boolean'];
            $rules['password'] = ['required_if:create_user_account,true', 'nullable', 'string', 'min:8'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'guardian_name.required' => 'Parent or guardian full name is required for child registration.',
            'guardian_relationship.required' => 'Relationship to child is required.',
            'guardian_relationship_other.required_if' => 'Please specify the relationship when "Other" is selected.',
            'guardian_phone.required' => 'Parent/Guardian phone number is required as the primary contact.',
            'consent_confirmed.required' => 'Parent/Guardian consent must be confirmed to register a child.',
            'consent_confirmed.accepted' => 'Parent/Guardian consent must be confirmed to register a child.',
            'date_of_birth.required' => 'Date of birth is required for child members to establish age.',
        ];
    }
}
