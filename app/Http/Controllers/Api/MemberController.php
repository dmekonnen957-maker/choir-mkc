<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\Api\ChoirResource;
use App\Http\Resources\Api\MemberResource;
use App\Http\Resources\Api\PerformanceResource;
use App\Http\Resources\Api\SongResource;
use App\Http\Resources\Api\UserResource;
use App\Models\Choir;
use App\Models\Member;
use App\Models\Notification;
use App\Models\Performance;
use App\Models\Rehearsal;
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

        $upcomingPerformancesList = $choir->performances()
            ->where('date', '>=', now()->toDateString())
            ->orderBy('date')
            ->take(5)
            ->get();

        $upcomingRehearsalsList = $choir->rehearsals()
            ->where('date', '>=', now()->toDateString())
            ->orderBy('date')
            ->take(5)
            ->get();

        $recentSongs = $choir->songs()
            ->latest()
            ->take(5)
            ->get();

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
                'date' => $nextRehearsal->date?->format('Y-m-d'),
                'start_time' => $nextRehearsal->start_time,
                'end_time' => $nextRehearsal->end_time,
                'location' => $nextRehearsal->location,
                'status' => $nextRehearsal->status,
            ] : null,
            'my_performances' => PerformanceResource::collection($myPerformances),
            'upcoming_performances' => PerformanceResource::collection($upcomingPerformancesList),
            'upcoming_rehearsals' => $upcomingRehearsalsList->map(fn ($r) => [
                'id' => $r->id,
                'title' => $r->title,
                'date' => $r->date?->format('Y-m-d'),
                'start_time' => $r->start_time,
                'end_time' => $r->end_time,
                'location' => $r->location,
                'status' => $r->status,
            ]),
            'recent_songs' => $recentSongs->map(fn ($s) => [
                'id' => $s->id,
                'title' => $s->title,
                'artist' => $s->artist,
                'category' => $s->category?->name,
                'key' => $s->key,
            ]),
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

        // Show the full active roster of the choir on the member-facing "My
        // Choir" page. The previous is_public self/privacy filter hid members
        // who weren't marked public (except the viewer's own record); that gate
        // is removed so every user that appears on the Users page and belongs
        // to this choir is visible here. Only `active` members are listed.
        $members = $choir->members()
            ->where('status', 'active')
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

    /**
     * Retrieve the authenticated member's attendance history and statistics.
     * Members cannot modify attendance.
     */
    public function attendance(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $choir = $this->effectiveChoir($user);

        if (! $choir) {
            return $this->ok([
                'has_choir' => false,
                'choir' => null,
                'member' => null,
                'stats' => [
                    'total_events' => 0,
                    'present' => 0,
                    'late' => 0,
                    'absent' => 0,
                    'excused' => 0,
                    'attendance_rate' => 0,
                ],
                'history' => [],
            ]);
        }

        $member = $this->linkedMember($user, $choir);

        if (! $member) {
            return $this->ok([
                'has_choir' => true,
                'choir' => new ChoirResource($choir),
                'member' => null,
                'stats' => [
                    'total_events' => 0,
                    'present' => 0,
                    'late' => 0,
                    'absent' => 0,
                    'excused' => 0,
                    'attendance_rate' => 0,
                ],
                'history' => [],
            ]);
        }

        // Retrieve all attendance records for this member in this choir
        $records = $member->attendanceRecords()
            ->where('choir_id', $choir->id)
            ->with(['attendanceSession.performance', 'attendanceSession.rehearsal'])
            ->orderByDesc('created_at')
            ->get();

        $totalChoirSessions = \App\Models\AttendanceSession::where('choir_id', $choir->id)->count();

        $presentCount = $records->where('status', 'present')->count();
        $lateCount = $records->where('status', 'late')->count();
        $absentCount = $records->where('status', 'absent')->count();
        $excusedCount = $records->where('status', 'excused')->count();
        $totalRecorded = $records->count();

        $effectiveTotal = max($totalChoirSessions, $totalRecorded);
        $attended = $presentCount + $lateCount;
        $attendanceRate = $effectiveTotal > 0 ? round(($attended / $effectiveTotal) * 100, 1) : 0;

        $history = $records->map(function ($rec) use ($choir) {
            $session = $rec->attendanceSession;
            $title = $session?->title
                ?? $session?->performance?->title
                ?? $session?->rehearsal?->title
                ?? 'Choir Session';

            $date = $session?->session_date?->format('Y-m-d')
                ?? $rec->created_at?->format('Y-m-d');

            return [
                'id' => $rec->id,
                'session_id' => $rec->attendance_session_id,
                'date' => $date,
                'event_title' => $title,
                'event_type' => $session?->event_type ?? ($session?->performance_id ? 'performance' : 'rehearsal'),
                'choir_name' => $choir->name,
                'status' => $rec->status,
                'check_in_at' => $rec->check_in_at?->toIso8601String(),
                'check_in_time' => $rec->check_in_at ? $rec->check_in_at->format('h:i A') : null,
                'check_in_timestamp' => $rec->check_in_at ? $rec->check_in_at->format('h:i:s A') : null,
                'check_out_at' => $rec->check_out_at?->toIso8601String(),
                'check_out_time' => $rec->check_out_at ? $rec->check_out_at->format('h:i A') : null,
                'notes' => $rec->notes,
            ];
        });

        return $this->ok([
            'has_choir' => true,
            'choir' => new ChoirResource($choir),
            'member' => new MemberResource($member),
            'stats' => [
                'total_events' => $effectiveTotal,
                'present' => $presentCount,
                'late' => $lateCount,
                'absent' => $absentCount,
                'excused' => $excusedCount,
                'attendance_rate' => $attendanceRate,
            ],
            'history' => $history,
        ]);
    }

    /**
     * Retrieve the authenticated member's choir performances (upcoming and
     * past), scoped strictly to the member's effective choir, along with the
     * performance's assigned songs and the member's participation status.
     * The page is effectively read-only for members.
     */
    public function performances(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $choir = $this->effectiveChoir($user);

        if (! $choir) {
            return $this->ok([
                'has_choir' => false,
                'choir' => null,
                'upcoming' => [],
                'past' => [],
                'stats' => [
                    'upcoming' => 0,
                    'this_month' => 0,
                    'completed' => 0,
                ],
                'participation' => [],
            ]);
        }

        $member = $this->linkedMember($user, $choir);

        // Participation status lookup for the member across performance_members.
        $participation = [];
        if ($member) {
            $participation = $member->performances()
                ->forChoir($choir->id)
                ->get()
                ->mapWithKeys(function (Performance $p) {
                    return [
                        $p->id => [
                            'expected' => (bool) $p->pivot->expected,
                            'participation_status' => $p->pivot->participation_status,
                        ],
                    ];
                })
                ->all();
        }

        $today = now()->toDateString();

        $upcoming = $choir->performances()
            ->with([
                'choir:id,name',
                'songs.choir' => fn ($q) => $q->withTrashed(),
                'songs' => fn ($q) => $q->orderBy('performance_songs.sequence_number'),
            ])
            ->where('date', '>=', $today)
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        $past = $choir->performances()
            ->with([
                'choir:id,name',
                'songs.choir' => fn ($q) => $q->withTrashed(),
                'songs' => fn ($q) => $q->orderBy('performance_songs.sequence_number'),
            ])
            ->where('date', '<', $today)
            ->orderByDesc('date')
            ->get();

        $stats = [
            'upcoming' => $upcoming->count(),
            'this_month' => $choir->performances()
                ->whereBetween('date', [now()->startOfMonth()->toDateString(), now()->endOfMonth()->toDateString()])
                ->count(),
            'completed' => $choir->performances()
                ->where('date', '<', $today)
                ->where('status', 'completed')
                ->count(),
        ];

        $mapPerformance = function (Performance $performance) use ($choir, $participation) {
            $data = (new PerformanceResource($performance))->resolve();
            $data['song_count'] = $performance->songs->count();
            $data['songs'] = SongResource::collection($performance->songs)->resolve();
            $data['participation'] = $participation[$performance->id] ?? [
                'expected' => null,
                'participation_status' => null,
            ];
            return $data;
        };

        return $this->ok([
            'has_choir' => true,
            'choir' => new ChoirResource($choir),
            'upcoming' => $upcoming->map($mapPerformance)->values(),
            'past' => $past->map($mapPerformance)->values(),
            'stats' => $stats,
            'participation' => $participation,
        ]);
    }

    /**
     * Return the songs belonging to the member's choir.
     * The choir is derived from the authenticated user — never from request input.
     */
    public function songs(Request $request): \Illuminate\Http\JsonResponse
    {
        $user  = $request->user();
        $choir = $this->effectiveChoir($user);

        if (! $choir) {
            return $this->ok([
                'has_choir' => false,
                'choir'     => null,
                'songs'     => [],
            ]);
        }

        $songs = $choir->songs()
            ->with('choir')
            ->orderBy('title')
            ->get()
            ->map(fn ($s) => [
                'id'               => $s->id,
                'title'            => $s->title,
                'artist'           => $s->artist,
                'composer'         => $s->composer,
                'description'      => $s->description,
                'original_key'     => $s->original_key,
                'has_lyrics'       => (bool) $s->lyrics,
                'lyrics'           => $s->lyrics,
                'has_audio'        => (bool) $s->audio_path || (bool) $s->audio_url,
                'audio_url'        => $s->audio_url ?? ($s->audio_path ? '/storage/' . ltrim($s->audio_path, '/') : null),
                'cover_url'        => $s->cover_image_path ? (str_starts_with($s->cover_image_path, 'http') ? $s->cover_image_path : '/storage/' . ltrim($s->cover_image_path, '/')) : null,
                'is_published'     => $s->is_published,
                'choir'            => ['id' => $choir->id, 'name' => $choir->name],
                'created_at'       => $s->created_at,
            ]);

        return $this->ok([
            'has_choir' => true,
            'choir'     => new ChoirResource($choir),
            'songs'     => $songs,
        ]);
    }

    /**
     * Return a merged, chronological list of performances + rehearsals
     * for the member's choir. Optionally filtered by month (YYYY-MM).
     */
    public function calendar(Request $request): \Illuminate\Http\JsonResponse
    {
        $user  = $request->user();
        $choir = $this->effectiveChoir($user);

        if (! $choir) {
            return $this->ok([
                'has_choir' => false,
                'choir'     => null,
                'events'    => [],
            ]);
        }

        $month     = $request->query('month');  // YYYY-MM
        $type      = $request->query('type');   // performance | rehearsal

        [$startDate, $endDate] = $this->calendarMonthBounds($month);

        $events = collect();

        // Performances for this choir
        if (! $type || $type === 'performance') {
            $pQuery = $choir->performances()
                ->with(['choir:id,name', 'songs' => function ($q) {
                    $q->withTrashed()->orderBy('performance_songs.sequence_number');
                }]);
            if ($startDate) {
                $pQuery->whereBetween('date', [$startDate, $endDate]);
            }
            $pQuery->orderBy('date')->orderBy('start_time');

            $events = $events->merge($pQuery->get()->map(fn ($p) => [
                'id'          => $p->id,
                'type'        => 'performance',
                'title'       => $p->title,
                'date'        => $p->date ? $p->date->format('Y-m-d') : null,
                'start_time'  => $p->start_time,
                'end_time'    => $p->end_time,
                'location'    => $p->location ?? $p->venue,
                'venue'       => $p->venue,
                'description' => $p->description,
                'status'      => $p->status,
                'choir'       => ['id' => $choir->id, 'name' => $choir->name],
                'songs'       => $p->songs->map(fn ($s) => [
                    'id'         => $s->id,
                    'title'      => $s->title,
                    'artist'     => $s->artist,
                    'has_lyrics' => (bool) $s->lyrics,
                    'lyrics'     => $s->lyrics,
                ])->values(),
            ]));
        }

        // Rehearsals for this choir
        if (! $type || $type === 'rehearsal') {
            $rQuery = $choir->rehearsals()->with(['choir:id,name', 'songs']);
            if ($startDate) {
                $rQuery->whereBetween('date', [$startDate, $endDate]);
            }
            $rQuery->orderBy('date')->orderBy('start_time');

            $events = $events->merge($rQuery->get()->map(fn ($r) => [
                'id'          => $r->id,
                'type'        => 'rehearsal',
                'title'       => $r->title,
                'date'        => $r->date ? $r->date->format('Y-m-d') : null,
                'start_time'  => $r->start_time,
                'end_time'    => $r->end_time,
                'location'    => $r->location,
                'venue'       => null,
                'description' => $r->description,
                'status'      => $r->status,
                'choir'       => ['id' => $choir->id, 'name' => $choir->name],
                'songs'       => $r->songs->map(fn ($s) => [
                    'id'         => $s->id,
                    'title'      => $s->title,
                    'artist'     => $s->artist,
                    'has_lyrics' => (bool) $s->lyrics,
                    'lyrics'     => $s->lyrics,
                ])->values(),
            ]));
        }

        $sorted = $events->sortBy(['date', 'start_time'])->values();

        return $this->ok([
            'has_choir' => true,
            'choir'     => new ChoirResource($choir),
            'events'    => $sorted,
        ]);
    }

    private function calendarMonthBounds(?string $month): array
    {
        if (! $month || ! preg_match('/^\d{4}-\d{2}$/', $month)) {
            return [null, null];
        }
        $start = \Carbon\Carbon::createFromFormat('Y-m', $month)->startOfMonth()->toDateString();
        $end   = \Carbon\Carbon::createFromFormat('Y-m', $month)->endOfMonth()->toDateString();
        return [$start, $end];
    }
}
