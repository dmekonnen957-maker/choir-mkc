<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\Api\MemberResource;
use App\Models\Member;
use Illuminate\Http\Request;

class AdminMemberController extends ApiController
{
    /**
     * List choir members across choirs or filtered by choir_id.
     * Supports both adult and child members (under 18) with guardians.
     * Authorization is handled by route middleware (permission:members.view).
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Member::with(['choir', 'voiceSection', 'guardians', 'user', 'consentRecorder']);

        // Non-global admins (e.g. team leaders) are scoped to their assigned/led choirs
        if (! $user->isGlobalAdmin() && ! $user->can('members.view.all')) {
            $assignedChoirIds = $user->choirs()->pluck('choirs.id')->toArray();
            if ($user->hasRole('team_leader') || $user->role === 'team_leader') {
                $ledChoirIds = \App\Models\Choir::where('team_leader_id', $user->id)->pluck('id')->toArray();
                $assignedChoirIds = array_unique(array_merge($assignedChoirIds, $ledChoirIds));
            }

            if (!empty($assignedChoirIds)) {
                $query->whereIn('choir_id', $assignedChoirIds);
            }
        }

        // Strict filter by choir
        if ($request->filled('choir_id') && $request->choir_id !== 'all' && $request->choir_id !== '') {
            $choirId = (int) $request->choir_id;
            $query->where('choir_id', $choirId);
        }

        // Filter by member type: adult vs child
        if ($request->filled('type') && $request->type !== 'all' && $request->type !== '') {
            if ($request->type === 'child') {
                $query->children();
            } elseif ($request->type === 'adult') {
                $query->adults();
            }
        }

        // Filter by member status
        if ($request->filled('status') && $request->status !== 'all' && $request->status !== '') {
            $query->where('status', $request->status);
        }

        // Filter by voice section
        if ($request->filled('voice_section_id') && $request->voice_section_id !== 'all' && $request->voice_section_id !== '') {
            $query->where('voice_section_id', (int) $request->voice_section_id);
        }

        // Search by name, member code, phone, email, or guardian details
        if ($request->filled('search')) {
            $search = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', $search)
                    ->orWhere('middle_name', 'like', $search)
                    ->orWhere('last_name', 'like', $search)
                    ->orWhere('member_code', 'like', $search)
                    ->orWhere('email', 'like', $search)
                    ->orWhere('phone', 'like', $search)
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', $search)
                            ->orWhere('email', 'like', $search)
                            ->orWhere('phone', 'like', $search);
                    })
                    ->orWhereHas('guardians', function ($gq) use ($search) {
                        $gq->where('full_name', 'like', $search)
                            ->orWhere('phone', 'like', $search)
                            ->orWhere('email', 'like', $search);
                    });
            });
        }

        $query->latest();

        return $this->paginate($query, MemberResource::class);
    }
}
