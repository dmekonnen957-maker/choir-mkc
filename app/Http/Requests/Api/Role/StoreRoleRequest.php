<?php

namespace App\Http\Requests\Api\Role;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('area') && is_string($this->area)) {
            $area = strtolower(trim($this->area));
            if ($area === 'team-leader') {
                $area = 'team_leader';
            } elseif ($area === 'musicians') {
                $area = 'musician';
            }
            $this->merge(['area' => $area ?: null]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('roles', 'name')->where('guard_name', 'api'),
            ],
            'description' => ['nullable', 'string', 'max:255'],
            'area' => ['nullable', 'string', Rule::in(['admin', 'team_leader', 'team-leader', 'member', 'musician', 'musicians'])],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string'],
        ];
    }
}
