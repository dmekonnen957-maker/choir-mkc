<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Resources\Json\JsonResource;

class MemberResource extends JsonResource
{
    public function toArray($request): array
    {
        $user = $request->user('sanctum') ?? $request->user();
        $isStaff = false;

        if ($user) {
            $isStaff = $user->isGlobalAdmin()
                || $user->hasAnyRole(['admin', 'super-admin', 'team_leader'])
                || $user->can('members.view')
                || $user->can('members.manage')
                || (int) $this->choir?->team_leader_id === (int) $user->id;
        }

        $isChild = $this->is_child;
        $primaryGuardian = $this->relationLoaded('guardians')
            ? $this->primaryGuardian()
            : null;

        $data = [
            'id' => $this->id,
            'choir_id' => $this->choir_id,
            'member_code' => $this->member_code,
            'user_id' => $this->user_id,
            'member_type' => $this->calculated_member_type,
            'is_child' => $isChild,
            'age' => $this->age,
            'voice_section_id' => $this->voice_section_id,
            'first_name' => $this->first_name,
            'middle_name' => $this->middle_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'photo_path' => $this->photo_path,
            'join_date' => $this->join_date,
            'role_title' => $this->role_title,
            'status' => $this->status,
            'bio' => $this->bio,
            'is_public' => (bool) $this->is_public,
            'voice_section' => new VoiceSectionResource($this->whenLoaded('voiceSection')),
            'choir' => $this->whenLoaded('choir', fn () => $this->choir ? [
                'id' => $this->choir->id,
                'name' => $this->choir->name,
                'slug' => $this->choir->slug ?? null,
            ] : null),
            'user_role' => $this->whenLoaded('user', fn () => $this->user?->role),
            'created_at' => $this->created_at,
        ];

        // If adult member, show their own phone and email
        if (! $isChild) {
            $data['phone'] = $this->phone ?? $this->user?->phone;
            $data['email'] = $this->email ?? $this->user?->email;
        } else {
            // For children, their primary contact is their parent/guardian
            $data['phone'] = $primaryGuardian ? $primaryGuardian->phone : null;
            $data['email'] = $primaryGuardian ? $primaryGuardian->email : null;
        }

        // Sensitive details only accessible to authenticated staff (Team Leader / Admin)
        if ($isStaff) {
            $data['date_of_birth'] = $this->date_of_birth ? $this->date_of_birth->format('Y-m-d') : null;
            $data['gender'] = $this->gender;
            $data['grade_school_level'] = $this->grade_school_level;
            $data['notes'] = $this->notes;
            $data['emergency_notes'] = $this->emergency_notes;
            $data['special_notes'] = $this->special_notes;
            $data['consent_confirmed'] = (bool) $this->consent_confirmed;
            $data['consent_confirmed_at'] = $this->consent_confirmed_at?->toIso8601String();
            $data['consent_recorder_name'] = $this->relationLoaded('consentRecorder') ? $this->consentRecorder?->name : null;

            if ($this->relationLoaded('guardians')) {
                $data['guardians'] = $this->guardians->map(fn ($g) => [
                    'id' => $g->id,
                    'full_name' => $g->full_name,
                    'relationship' => $g->relationship === 'Other' && $g->relationship_other
                        ? $g->relationship_other
                        : $g->relationship,
                    'raw_relationship' => $g->relationship,
                    'relationship_other' => $g->relationship_other,
                    'phone' => $g->phone,
                    'alt_phone' => $g->alt_phone,
                    'email' => $g->email,
                    'address' => $g->address,
                    'is_primary' => (bool) ($g->pivot->is_primary ?? false),
                ])->values();

                $data['primary_guardian'] = $primaryGuardian ? [
                    'id' => $primaryGuardian->id,
                    'full_name' => $primaryGuardian->full_name,
                    'relationship' => $primaryGuardian->relationship === 'Other' && $primaryGuardian->relationship_other
                        ? $primaryGuardian->relationship_other
                        : $primaryGuardian->relationship,
                    'raw_relationship' => $primaryGuardian->relationship,
                    'relationship_other' => $primaryGuardian->relationship_other,
                    'phone' => $primaryGuardian->phone,
                    'alt_phone' => $primaryGuardian->alt_phone,
                    'email' => $primaryGuardian->email,
                    'address' => $primaryGuardian->address,
                ] : null;
            } else {
                $data['guardians'] = [];
                $data['primary_guardian'] = null;
            }
        }

        return $data;
    }
}
