<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\Api\ChoirResource;
use App\Http\Resources\Api\MemberResource;
use App\Http\Resources\Api\PerformanceResource;
use App\Http\Resources\Api\UserResource;
use App\Models\Choir;
use App\Models\Member;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class MemberController extends ApiController
{
    /**
     * Resolve the member's effective choir from the authenticated user only.
     * The choir is NEVER taken from request input.
     */
    private function effectiveChoir(User $user): ?Choir
    {
        return $user->choirs()
            ->wherePivot('status', 'active')
            ->first()
            ?? $user->choirs()->first();
    }

    private function linkedMember(User $user, ?Choir $choir): ?Member
    {
        if (! $choir) {
            return null;
        }

        return $choir->members()->where('user_id', $user->id)->first();
    }

    public function dashboard(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $choir = $this->effectiveChoir($user);

        if (! $choir) {
            return $this->ok([
                'has_choir' => false,
                'choir' => null,
                'stats' => [
                    'upcoming_performances' => 0,
                    'upcoming_rehearsals' => 0,
                    'my_performances' => 0,
                    'attendance' => [
                        'present' => 0,
                        'absent' => 0,
                        'late' => 0,
                        'total' => 0,
                        'has_records' => false,
                    ],
                ],
                'next_performance' => null,
                'next_rehearsal' => null,
                'my_performances' => [],
            ]);
        }

        $member = $this->linkedMember($user, $choir);

        $upcomingPerformances = $choir->performances()->upcoming()->count();
        $upcomingRehearsals = $choir->rehearsals()
            ->where('date', '>=', now()->toDateString())
            ->whereIn('status', ['scheduled', 'confirmed'])
            ->count();

        $nextPerformance = $choir->performances()->upcoming()->orderBy('date')->first();
        $nextRehearsal = $choir->rehearsals()
            ->where('date', '>=', now()->toDateString())
            ->whereIn('status', ['scheduled', 'confirmed'])
            ->orderBy('date')
            ->first();

        $attendance = [
            'present' => 0,
            'absent' => 0,
            'late' => 0,
            'total' => 0,
            'has_records' => false,
        ];
        $myPerformances = collect();

        if ($member) {
            $records = $member->attendanceRecords()->forChoir($choir->id);
            $attendance = [
                'present' => (clone $records)->present()->count(),
                'absent' => (clone $records)->absent()->count(),
                'late' => (clone $records)->late()->count(),
                'total' => $records->count(),
                'has_records' => $records->count() > 0,
            ];

            $myPerformances = $member->performances()
                ->forChoir($choir->id)
                ->upcoming()
                ->orderBy('date')
                ->get();
        }

        return $this->ok([
            'has_choir' => true,
            'choir' => new ChoirResource($choir->loadCount('members')),
            'stats' => [
                'upcoming_performances' => $upcomingPerformances,
                'upcoming_rehearsals' => $upcomingRehearsals,
                'my_performances' => $myPerformances->count(),
                'attendance' => $attendance,
            ],
            'next_performance' => $nextPerformance ? new PerformanceResource($nextPerformance) : null,
            'next_rehearsal' => $nextRehearsal ? [
                'id' => $nextRehearsal->id,
                'title' => $nextRehearsal->title,
                'date' => $nextRehearsal->date,
                'start_time' => $nextRehearsal->start_time,
                'location' => $nextRehearsal->location,
                'status' => $nextRehearsal->status,
            ] : null,
            'my_performances' => PerformanceResource::collection($myPerformances),
        ]);
    }

    public function choir(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $choir = $this->effectiveChoir($user);

        if (! $choir) {
            return $this->ok(['choir' => null, 'members' => [], 'leader' => null]);
        }

        $choir->loadCount('members');

        // Privacy: only public members, plus the member's own record.
        $members = $choir->members()
            ->where('status', 'active')
            ->where(function ($query) use ($user) {
                $query->where('is_public', true)
                    ->orWhere('user_id', $user->id);
            })
            ->orderBy('first_name')
            ->get();

        $leader = $choir->members()
            ->where('status', 'active')
            ->whereNotNull('role_title')
            ->where('role_title', '<>', '')
            ->first();

        return $this->ok([
            'choir' => new ChoirResource($choir),
            'members' => MemberResource::collection($members),
            'leader' => $leader ? [
                'name' => $leader->full_name,
                'role_title' => $leader->role_title,
            ] : null,
        ]);
    }

    public function profile(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $choir = $this->effectiveChoir($user);
        $member = $this->linkedMember($user, $choir);

        return $this->ok([
            'user' => new UserResource($user->load('roles', 'permissions', 'choirs')),
            'member' => $member ? new MemberResource($member) : null,
            'choir' => $choir ? new ChoirResource($choir) : null,
        ]);
    }

    public function updateProfile(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        if ($validator->fails()) {
            return $this->error('Please check the highlighted fields.', $validator->errors(), 422);
        }

        $user->name = $request->name;
        $user->email = $request->email;

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        // Phone lives on the linked Member record, not the User.
        $choir = $this->effectiveChoir($user);
        $member = $this->linkedMember($user, $choir);
        if ($member && $request->has('phone')) {
            $member->phone = $request->phone;
            $member->save();
        }

        return $this->ok([
            'user' => new UserResource($user->load('roles', 'permissions', 'choirs')),
            'member' => $member ? new MemberResource($member) : null,
        ], 'Profile updated successfully');
    }

    public function notifications(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();

        $notifications = Notification::query()
            ->where('notifiable_type', $user->getMorphClass())
            ->where('notifiable_id', $user->id)
            ->orderByDesc('created_at')
            ->take(20)
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'data' => $notification->data,
                    'read_at' => $notification->read_at,
                    'created_at' => $notification->created_at,
                ];
            });

        return $this->ok([
            'notifications' => $notifications,
            'unread_count' => $notifications->whereNull('read_at')->count(),
        ]);
    }
}
