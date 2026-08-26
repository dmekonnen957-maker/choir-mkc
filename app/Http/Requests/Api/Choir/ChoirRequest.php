<?php

namespace App\Http\Requests\Api\Choir;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ChoirRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $choirId = $this->route('choir')?->id;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('choirs')->ignore($choirId),
            ],
            'slug' => ['nullable', 'string', Rule::unique('choirs')->ignore($choirId)],
            'description' => ['nullable', 'string'],
            'church_name' => ['nullable', 'string'],
            'logo_path' => ['nullable', 'string'],
            'status' => ['nullable', 'in:active,inactive'],
            'is_public' => ['nullable', 'boolean'],
            'team_leader_id' => [
                'nullable',
                'exists:users,id',
                function ($attribute, $value, $fail) {
                    if (!$value) {
                        return;
                    }

                    $user = \App\Models\User::find($value);

                    if (!$user) {
                        return;
                    }

                    if ($user->status !== \App\Models\User::STATUS_APPROVED) {
                        $fail('The selected team leader must be an approved user.');
                        return;
                    }

                    if (!$user->hasAnyRole(['team_leader', 'admin', 'super-admin'])) {
                        $fail('The selected team leader must have the team leader role.');
                    }
                },
            ],
        ];
    }
}
