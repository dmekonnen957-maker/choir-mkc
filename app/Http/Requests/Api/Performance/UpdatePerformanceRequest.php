<?php

namespace App\Http\Requests\Api\Performance;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePerformanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $venue = $this->input('venue') ?: $this->input('location') ?: 'Main Sanctuary';
        $location = $this->input('location') ?: $this->input('venue') ?: 'Main Sanctuary';
        $status = $this->input('status') ?: 'scheduled';

        $startTime = $this->input('start_time');
        if ($startTime === '' || $startTime === null) {
            $startTime = null;
        } elseif (preg_match('/^\d{1,2}:\d{2}$/', (string) $startTime)) {
            $startTime = sprintf('%02d:%s', (int) explode(':', $startTime)[0], explode(':', $startTime)[1]);
        }

        $endTime = $this->input('end_time');
        if ($endTime === '' || $endTime === null) {
            $endTime = null;
        } elseif (preg_match('/^\d{1,2}:\d{2}$/', (string) $endTime)) {
            $endTime = sprintf('%02d:%s', (int) explode(':', $endTime)[0], explode(':', $endTime)[1]);
        }

        $this->merge([
            'venue' => $venue,
            'location' => $location,
            'status' => strtolower((string) $status),
            'start_time' => $startTime,
            'end_time' => $endTime,
        ]);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'start_time' => ['nullable', 'string'],
            'end_time' => ['nullable', 'string'],
            'venue' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'organizer' => ['nullable', 'string', 'max:255'],
            'dress_code' => ['nullable', 'string', 'max:255'],
            'special_instructions' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:scheduled,confirmed,completed,cancelled,postponed,planned,ongoing'],
            'is_public' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Performance title is required.',
            'date.required' => 'Performance date is required.',
            'date.date' => 'Please enter a valid date (YYYY-MM-DD).',
            'status.in' => 'The selected status is invalid. Choose Scheduled, Confirmed, Completed, Cancelled, or Postponed.',
        ];
    }
}
