<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Attendance\StoreAttendanceRecordRequest;
use App\Http\Requests\Api\Attendance\StoreAttendanceSessionRequest;
use App\Http\Requests\Api\Attendance\UpdateAttendanceRecordRequest;
use App\Http\Requests\Api\Attendance\UpdateAttendanceSessionRequest;
use App\Http\Resources\Api\AttendanceRecordResource;
use App\Http\Resources\Api\AttendanceSessionResource;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Choir;
use App\Models\Member;
use App\Models\Performance;
use App\Models\Rehearsal;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AttendanceController extends ApiController
{
    /**
     * Check if the authenticated user has permission to view attendance for this choir.
     */
    private function canViewChoir(User $user, ?Choir $choir): bool
    {
        if (! $choir) {
            return false;
        }

        if ($user->isGlobalAdmin()) {
            return true;
        }

        return $user->choirs()->where('choirs.id', $choir->id)->wherePivot('status', 'active')->exists()
            || (int) $choir->team_leader_id === (int) $user->id
            || $user->can('attendance.view.all');
    }

    /**
     * Check if the authenticated user has permission to manage attendance for this choir.
     */
    private function canManageChoir(User $user, ?Choir $choir): bool
    {
        if (! $choir) {
            return false;
        }

        if ($user->isGlobalAdmin()) {
            return true;
        }

        $isAssigned = $user->choirs()
            ->where('choirs.id', $choir->id)
            ->wherePivot('status', 'active')
            ->exists();

        if (! $isAssigned && (int) $choir->team_leader_id !== (int) $user->id) {
            return false;
        }

        return $user->hasAnyRole(['team_leader', 'admin', 'super-admin'])
            || $user->can('attendance.manage')
            || $user->can('rehearsals.manage');
    }

    private function scheduledEvent(AttendanceSession $session): Performance|Rehearsal|null
    {
        if ($session->performance_id) {
            $performance = $session->performance;
            return $performance
                && (int) $performance->choir_id === (int) $session->choir_id
                && $performance->date
                && $session->session_date
                && $performance->date->toDateString() === $session->session_date->toDateString()
                ? $performance
                : null;
        }

        if ($session->rehearsal_id) {
            $rehearsal = $session->rehearsal;
            return $rehearsal
                && (int) $rehearsal->choir_id === (int) $session->choir_id
                && $rehearsal->date
                && $session->session_date
                && $rehearsal->date->toDateString() === $session->session_date->toDateString()
                ? $rehearsal
                : null;
        }

        return null;
    }

    /**
     * Return only choirs the authenticated user may use for attendance.
     */
    public function choirs(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isGlobalAdmin()) {
            $choirs = Choir::active()->orderBy('name')->get(['id', 'name']);
        } else {
            $assignedIds = $user->choirs()
                ->wherePivot('status', 'active')
                ->pluck('choirs.id');

            $choirs = Choir::active()
                ->where(function ($query) use ($user, $assignedIds) {
                    $query->whereIn('id', $assignedIds)
                        ->orWhere('team_leader_id', $user->id);
                })
                ->orderBy('name')
                ->get(['id', 'name']);
        }

        return $this->ok(['choirs' => $choirs]);
    }

    /**
     * Helper to compute summary counts for a session.
     */
    private function sessionCounts(AttendanceSession $session, int $totalMembers): array
    {
        $records = $session->attendanceRecords()->get();

        $present = $records->where('status', 'present')->count();
        $late = $records->where('status', 'late')->count();
        $absent = $records->where('status', 'absent')->count();
        $excused = $records->where('status', 'excused')->count();
        $markedCount = $present + $late + $absent + $excused;
        $unmarked = max(0, $totalMembers - $markedCount);

        return [
            'total_members' => $totalMembers,
            'present' => $present,
            'late' => $late,
            'absent' => $absent,
            'excused' => $excused,
            'unmarked' => $unmarked,
            'attendance_rate' => $totalMembers > 0 ? round((($present + $late) / $totalMembers) * 100, 1) : 0,
        ];
    }

    /**
     * Resolve only current, active members for a choir.
     *
     * Rules (all must be satisfied for a member to be included):
     *  1. Not soft-deleted (SoftDeletes trait handles this automatically).
     *  2. Member status = 'active' (excludes inactive / suspended / former).
     *  3a. If the member has a linked user (user_id IS NOT NULL):
     *       – The user must have status = 'approved'.
     *       – The user must not be deactivated (deactivated_at IS NULL).
     *       – The user must still be an active member of THIS choir in the
     *         choir_user pivot (choir_user.status = 'active').
     *  3b. If the member has NO linked user (guest / offline member):
     *       – Include them as-is since the member record itself is the source
     *         of truth. (The UserObserver soft-deletes linked members when
     *         their user account is removed, so reaching this branch means
     *         the member was intentionally created without a user account.)
     */
    private function currentMembers(Choir $choir)
    {
        return $choir->members()
            ->where('members.status', 'active')
            ->where(function ($query) use ($choir) {
                // Branch A: guest members (no linked user account)
                $query->whereNull('members.user_id')
                    // Branch B: user-linked members — verify the user is still
                    // active, approved, and belongs to this choir.
                    ->orWhereHas('user', function ($userQuery) use ($choir) {
                        $userQuery->where('status', User::STATUS_APPROVED)
                            ->whereNull('deactivated_at')
                            ->whereHas('choirs', function ($choirQuery) use ($choir) {
                                $choirQuery->where('choirs.id', $choir->id)
                                    ->where('choir_user.status', 'active');
                            });
                    });
            });
    }

    /**
     * List events (performances & rehearsals) for a choir.
     * GET /api/attendance/events?choir_id={choir_id}
     */
    public function events(Request $request): JsonResponse
    {
        $user = $request->user();
        $choirId = $request->query('choir_id');

        if (! $choirId) {
            // If user is admin, allow fetching first choir or all choirs
            $choir = $user->isGlobalAdmin()
                ? Choir::first()
                : $user->choirs()->first();

            if (! $choir) {
                return $this->ok(['events' => [], 'choirs' => []]);
            }
            $choirId = $choir->id;
        } else {
            $choir = Choir::findOrFail($choirId);
        }

        if (! $this->canViewChoir($user, $choir)) {
            return $this->error('You are not authorized to view this choir.', null, 403);
        }

        $performances = Performance::where('choir_id', $choir->id)
            ->orderByDesc('date')
            ->take(50)
            ->get()
            ->map(fn (Performance $p) => [
                'id' => $p->id,
                'type' => 'performance',
                'title' => $p->title,
                'date' => $p->date?->format('Y-m-d'),
                'start_time' => $p->start_time,
                'end_time' => $p->end_time,
                'location' => $p->venue ?? $p->location,
                'status' => $p->status,
                'label' => "[Performance] {$p->title} (" . ($p->date?->format('M d, Y') ?? '') . ')',
            ]);

        $rehearsals = Rehearsal::where('choir_id', $choir->id)
            ->orderByDesc('date')
            ->take(50)
            ->get()
            ->map(fn (Rehearsal $r) => [
                'id' => $r->id,
                'type' => 'rehearsal',
                'title' => $r->title,
                'date' => $r->date?->format('Y-m-d'),
                'start_time' => $r->start_time,
                'end_time' => $r->end_time,
                'location' => $r->location,
                'status' => $r->status,
                'label' => "[Rehearsal] {$r->title} (" . ($r->date?->format('M d, Y') ?? '') . ')',
            ]);

        $events = $performances->concat($rehearsals)->sortByDesc('date')->values();

        return $this->ok([
            'choir' => [
                'id' => $choir->id,
                'name' => $choir->name,
            ],
            'events' => $events,
        ]);
    }

    /**
     * List attendance sessions for a choir.
     * GET /api/attendance/sessions?choir_id={choir_id}&from={date}&to={date}
     */
    public function sessions(Request $request): JsonResponse
    {
        $user = $request->user();
        $choirId = $request->query('choir_id');

        if (! $choirId) {
            $choir = $user->isGlobalAdmin()
                ? Choir::first()
                : $user->choirs()->first();

            if (! $choir) {
                return $this->ok(['sessions' => []]);
            }
            $choirId = $choir->id;
        } else {
            $choir = Choir::findOrFail($choirId);
        }

        if (! $this->canViewChoir($user, $choir)) {
            return $this->error('You are not authorized to view this choir.', null, 403);
        }

        $query = AttendanceSession::where('choir_id', $choir->id)
              ->where(function ($query) {
                 $query->whereNotNull('performance_id')->orWhereNotNull('rehearsal_id');
              })
              ->with(['performance', 'rehearsal', 'creator', 'records'])
            ->orderByDesc('session_date')
            ->orderByDesc('id');

        if ($request->filled('from')) {
            $query->where('session_date', '>=', $request->query('from'));
        }
        if ($request->filled('to')) {
            $query->where('session_date', '<=', $request->query('to'));
        }
        if ($request->filled('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('event_type') && $request->query('event_type') !== 'all') {
            $query->where('event_type', $request->query('event_type'));
        }

        $sessions = $query->paginate($request->integer('per_page', 20));

        $totalMembers = $this->currentMembers($choir)->count();

        $items = collect($sessions->items())->map(function (AttendanceSession $s) use ($totalMembers) {
            $data = (new AttendanceSessionResource($s))->toArray(request());
            $data['summary'] = $this->sessionCounts($s, $totalMembers);
            return $data;
        });

        return $this->ok([
            'items' => $items,
            'current_page' => $sessions->currentPage(),
            'last_page' => $sessions->lastPage(),
            'total' => $sessions->total(),
        ]);
    }

    /**
     * Get or initialize session for an event or date.
     * POST /api/attendance/sessions/find-or-create
     */
    public function findOrCreateSession(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'choir_id' => ['required', 'exists:choirs,id'],
            'event_type' => ['nullable', 'string', 'in:performance,rehearsal'],
            'performance_id' => ['required_if:event_type,performance', 'nullable', 'exists:performances,id'],
            'rehearsal_id' => ['required_if:event_type,rehearsal', 'nullable', 'exists:rehearsals,id'],
            'late_threshold_minutes' => ['nullable', 'integer', 'min:0', 'max:240'],
        ]);

        if ($validator->fails()) {
            return $this->error('Validation error', $validator->errors(), 422);
        }

        $user = $request->user();
        $choir = Choir::findOrFail($request->choir_id);

        if (! $this->canManageChoir($user, $choir)) {
            return $this->error('You do not have permission to manage attendance for this choir.', null, 403);
        }

        $eventType = $request->input('event_type')
            ?? ($request->filled('performance_id') ? 'performance' : ($request->filled('rehearsal_id') ? 'rehearsal' : null));
        $performanceId = $request->input('performance_id');
        $rehearsalId = $request->input('rehearsal_id');
        $event = null;

        if (! $eventType) {
            return $this->error('Select a scheduled rehearsal or performance before taking attendance.', null, 422);
        }

        if ($eventType === 'performance') {
            $performance = Performance::findOrFail($performanceId);
            if ((int) $performance->choir_id !== (int) $choir->id || ! $performance->date) {
                return $this->error('The selected performance does not belong to this choir or has no scheduled date.', null, 422);
            }
            $event = $performance;

            $session = AttendanceSession::where('choir_id', $choir->id)
                ->where('performance_id', $performanceId)
                ->first();
        } else {
            $rehearsal = Rehearsal::findOrFail($rehearsalId);
            if ((int) $rehearsal->choir_id !== (int) $choir->id || ! $rehearsal->date) {
                return $this->error('The selected rehearsal does not belong to this choir or has no scheduled date.', null, 422);
            }
            $event = $rehearsal;

            $session = AttendanceSession::where('choir_id', $choir->id)
                ->where('rehearsal_id', $rehearsalId)
                ->first();
        }

        if (! $session) {
            $session = AttendanceSession::create([
                'choir_id' => $choir->id,
                'performance_id' => $performanceId,
                'rehearsal_id' => $rehearsalId,
                'event_type' => $eventType,
                'title' => $event->title,
                'session_date' => $event->date,
                'start_time' => $event->start_time,
                'end_time' => $event->end_time,
                'status' => 'open',
                'late_threshold_minutes' => $request->input('late_threshold_minutes', 15),
                'created_by' => $user->id,
            ]);
        } elseif ($this->scheduledEvent($session) === null) {
            return $this->error('This attendance session is not linked to a valid scheduled choir event.', null, 422);
        } else {
            $session->event_type = $eventType;
            $session->title = $event->title;
            $session->session_date = $event->date;
            $session->start_time = $event->start_time;
            $session->end_time = $event->end_time;
            $session->save();
        }

        return $this->showSession($request, $session);
    }

    /**
     * Get detailed attendance session with choir roster and live counts.
     * GET /api/attendance/sessions/{attendanceSession}
     */
    public function showSession(Request $request, AttendanceSession $attendanceSession): JsonResponse
    {
        $user = $request->user();
        $choir = $attendanceSession->choir ?? Choir::findOrFail($attendanceSession->choir_id);

        if (! $this->canViewChoir($user, $choir)) {
            return $this->error('You are not authorized to view this choir attendance.', null, 403);
        }

        if ($this->scheduledEvent($attendanceSession) === null) {
            return $this->error('Attendance must be linked to a scheduled rehearsal or performance.', null, 422);
        }

        $attendanceSession->load(['choir', 'performance', 'rehearsal', 'creator']);
        $records = $attendanceSession->attendanceRecords()->with(['member.voiceSection', 'marker'])->get();

        // Load the current active roster for this choir only.
        $members = $this->currentMembers($choir)
            ->with(['voiceSection', 'user'])
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        $recordsMap = $records->keyBy('member_id');

        $memberRoster = $members->map(function (Member $member) use ($recordsMap, $attendanceSession) {
            /** @var AttendanceRecord|null $record */
            $record = $recordsMap->get($member->id);

            return [
                'member_id' => $member->id,
                'member_code' => $member->member_code,
                'first_name' => $member->first_name,
                'last_name' => $member->last_name,
                'full_name' => $member->full_name,
                'email' => $member->email ?? $member->user?->email,
                'phone' => $member->phone ?? $member->user?->phone,
                'photo_path' => $member->photo_path,
                'role_title' => $member->role_title,
                'voice_section' => $member->voiceSection ? [
                    'id' => $member->voiceSection->id,
                    'name' => $member->voiceSection->name,
                ] : null,
                'record_id' => $record?->id,
                'status' => $record?->status ?? 'unmarked',
                'check_in_at' => $record?->check_in_at?->toIso8601String(),
                'check_in_time' => $record?->check_in_at ? $record->check_in_at->format('h:i A') : null,
                'check_in_timestamp' => $record?->check_in_at ? $record->check_in_at->format('h:i:s A') : null,
                'check_out_at' => $record?->check_out_at?->toIso8601String(),
                'check_out_time' => $record?->check_out_at ? $record->check_out_at->format('h:i A') : null,
                'notes' => $record?->notes,
                'marked_by' => $record?->marked_by,
                'marker_name' => $record?->marker?->name,
            ];
        });

        $counts = $this->sessionCounts($attendanceSession, $members->count());

        $sessionResource = (new AttendanceSessionResource($attendanceSession))->toArray($request);

        return $this->ok([
            'session' => $sessionResource,
            'counts' => $counts,
            'members' => $memberRoster,
        ]);
    }

    /**
     * Update session status (open, closed, not_started) or settings.
     * PATCH /api/attendance/sessions/{attendanceSession}/status
     */
    public function updateStatus(Request $request, AttendanceSession $attendanceSession): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => ['required', 'string', 'in:not_started,open,closed'],
            'late_threshold_minutes' => ['nullable', 'integer', 'min:0', 'max:240'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return $this->error('Validation error', $validator->errors(), 422);
        }

        $user = $request->user();
        if (! $this->canManageChoir($user, $attendanceSession->choir)) {
            return $this->error('You do not have permission to modify this attendance session.', null, 403);
        }

        if ($this->scheduledEvent($attendanceSession) === null) {
            return $this->error('Attendance is available only for scheduled performances and rehearsals.', null, 422);
        }

        $attendanceSession->status = $request->status;
        if ($request->has('late_threshold_minutes')) {
            $attendanceSession->late_threshold_minutes = $request->late_threshold_minutes;
        }
        if ($request->has('notes')) {
            $attendanceSession->notes = $request->notes;
        }
        $attendanceSession->save();

        return $this->ok([
            'session' => new AttendanceSessionResource($attendanceSession),
            'status' => $attendanceSession->status,
        ], 'Attendance session status updated.');
    }

    /**
     * Real-time Check-In with server-authoritative timestamp and late calculation.
     * POST /api/attendance/check-in
     */
    public function checkIn(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'attendance_session_id' => ['required', 'exists:attendance_sessions,id'],
            'member_id' => ['required', 'exists:members,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return $this->error('Validation error', $validator->errors(), 422);
        }

        $user = $request->user();
        $session = AttendanceSession::findOrFail($request->attendance_session_id);
        $choir = $session->choir;

        if (! $this->canManageChoir($user, $choir)) {
            return $this->error('You do not have permission to check in members for this choir.', null, 403);
        }

        if ($this->scheduledEvent($session) === null) {
            return $this->error('Attendance is available only for scheduled performances and rehearsals.', null, 422);
        }

        if ($session->isClosed()) {
            return $this->error('Attendance is closed for this session. Reopen attendance to record check-ins.', null, 422);
        }

        // Validate member belongs to this choir
        $member = $this->currentMembers($choir)
            ->where('members.id', $request->member_id)
            ->first();

        if (! $member) {
            return $this->error('Member does not belong to the selected choir.', null, 422);
        }

        // Authoritative server timestamp
        $checkInTime = Carbon::now();

        // Late evaluation
        $status = 'present';
        $startTimeStr = $session->start_time ?? $session->performance?->start_time ?? $session->rehearsal?->start_time;

        if ($startTimeStr && $session->session_date) {
            $threshold = (int) ($session->late_threshold_minutes ?? 15);
            try {
                $sessionDateStr = $session->session_date->format('Y-m-d');
                $scheduledStart = Carbon::parse("{$sessionDateStr} {$startTimeStr}");

                if ($checkInTime->greaterThan($scheduledStart->copy()->addMinutes($threshold))) {
                    $status = 'late';
                }
            } catch (\Throwable) {
                // Keep 'present' fallback if format cannot be parsed
            }
        }

        // Find or create record
        $record = AttendanceRecord::updateOrCreate(
            [
                'attendance_session_id' => $session->id,
                'member_id' => $member->id,
            ],
            [
                'choir_id' => $choir->id,
                'status' => $status,
                'check_in_at' => $checkInTime,
                'marked_by' => $user->id,
                'notes' => $request->notes,
            ]
        );

        $totalMembers = $this->currentMembers($choir)->count();
        $counts = $this->sessionCounts($session, $totalMembers);

        return $this->ok([
            'record' => new AttendanceRecordResource($record->load('member', 'marker')),
            'counts' => $counts,
            'member_id' => $member->id,
            'status' => $status,
            'check_in_at' => $record->check_in_at->toIso8601String(),
            'check_in_time' => $record->check_in_at->format('h:i A'),
            'check_in_timestamp' => $record->check_in_at->format('h:i:s A'),
        ], "Checked in {$member->full_name} as " . ucfirst($status));
    }

    /**
     * Real-time Check-Out with server-authoritative timestamp.
     * POST /api/attendance/check-out
     */
    public function checkOut(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'attendance_session_id' => ['required', 'exists:attendance_sessions,id'],
            'member_id' => ['required', 'exists:members,id'],
        ]);

        if ($validator->fails()) {
            return $this->error('Validation error', $validator->errors(), 422);
        }

        $user = $request->user();
        $session = AttendanceSession::findOrFail($request->attendance_session_id);
        $choir = $session->choir;

        if (! $this->canManageChoir($user, $choir)) {
            return $this->error('You do not have permission to check out members for this choir.', null, 403);
        }

        if ($this->scheduledEvent($session) === null) {
            return $this->error('Attendance is available only for scheduled performances and rehearsals.', null, 422);
        }

        $record = AttendanceRecord::where('attendance_session_id', $session->id)
            ->where('member_id', $request->member_id)
            ->first();

        if (! $record || ! $record->check_in_at) {
            return $this->error('Member has not checked in yet. Check in is required before check-out.', null, 422);
        }

        if ($record->check_out_at) {
            return $this->error('Member is already checked out at ' . $record->check_out_at->format('h:i A'), null, 422);
        }

        $checkOutTime = Carbon::now();
        $record->check_out_at = $checkOutTime;
        $record->save();

        $totalMembers = $this->currentMembers($choir)->count();
        $counts = $this->sessionCounts($session, $totalMembers);

        return $this->ok([
            'record' => new AttendanceRecordResource($record->load('member', 'marker')),
            'counts' => $counts,
            'member_id' => $record->member_id,
            'check_out_at' => $record->check_out_at->toIso8601String(),
            'check_out_time' => $record->check_out_at->format('h:i A'),
        ], 'Checked out successfully.');
    }

    /**
     * Manually mark member attendance status (present, late, absent, excused).
     * POST /api/attendance/records/mark
     */
    public function markRecord(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'attendance_session_id' => ['required', 'exists:attendance_sessions,id'],
            'member_id' => ['required', 'exists:members,id'],
            'status' => ['required', 'in:present,late,absent,excused,unmarked'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return $this->error('Validation error', $validator->errors(), 422);
        }

        $user = $request->user();
        $session = AttendanceSession::findOrFail($request->attendance_session_id);
        $choir = $session->choir;

        if (! $this->canManageChoir($user, $choir)) {
            return $this->error('You do not have permission to mark attendance for this choir.', null, 403);
        }

        if ($this->scheduledEvent($session) === null) {
            return $this->error('Attendance is available only for scheduled performances and rehearsals.', null, 422);
        }

        // Validate member belongs to choir
        $member = $this->currentMembers($choir)
            ->where('members.id', $request->member_id)
            ->first();

        if (! $member) {
            return $this->error('Member does not belong to this choir.', null, 422);
        }

        $status = $request->status;

        if ($status === 'unmarked') {
            AttendanceRecord::where('attendance_session_id', $session->id)
                ->where('member_id', $member->id)
                ->delete();

            $record = null;
        } else {
            $record = AttendanceRecord::where('attendance_session_id', $session->id)
                ->where('member_id', $member->id)
                ->first();

            if (! $record) {
                $checkInAt = in_array($status, ['present', 'late'], true) ? Carbon::now() : null;
                $record = AttendanceRecord::create([
                    'attendance_session_id' => $session->id,
                    'choir_id' => $choir->id,
                    'member_id' => $member->id,
                    'status' => $status,
                    'check_in_at' => $checkInAt,
                    'notes' => $request->notes,
                    'marked_by' => $user->id,
                ]);
            } else {
                $record->status = $status;
                if ($request->has('notes')) {
                    $record->notes = $request->notes;
                }
                if (in_array($status, ['present', 'late'], true) && ! $record->check_in_at) {
                    $record->check_in_at = Carbon::now();
                } elseif (in_array($status, ['absent', 'excused'], true)) {
                    $record->check_in_at = null;
                    $record->check_out_at = null;
                }
                $record->marked_by = $user->id;
                $record->save();
            }
        }

        $totalMembers = $this->currentMembers($choir)->count();
        $counts = $this->sessionCounts($session, $totalMembers);

        return $this->ok([
            'record' => $record ? new AttendanceRecordResource($record->load('member', 'marker')) : null,
            'counts' => $counts,
            'member_id' => $member->id,
            'status' => $status,
            'check_in_at' => $record?->check_in_at?->toIso8601String(),
            'check_in_time' => $record?->check_in_at ? $record->check_in_at->format('h:i A') : null,
            'check_out_at' => $record?->check_out_at?->toIso8601String(),
            'check_out_time' => $record?->check_out_at ? $record->check_out_at->format('h:i A') : null,
        ], "Marked {$member->full_name} as " . ucfirst($status));
    }

    /**
     * Bulk attendance actions (mark_all_present, mark_remaining_absent, reset).
     * POST /api/attendance/records/bulk
     */
    public function bulk(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'attendance_session_id' => ['required', 'exists:attendance_sessions,id'],
            'action' => ['required', 'in:mark_all_present,mark_remaining_absent,reset'],
        ]);

        if ($validator->fails()) {
            return $this->error('Validation error', $validator->errors(), 422);
        }

        $user = $request->user();
        $session = AttendanceSession::findOrFail($request->attendance_session_id);
        $choir = $session->choir ?? Choir::findOrFail($session->choir_id);

        if (! $this->canManageChoir($user, $choir)) {
            return $this->error('You do not have permission to manage attendance for this choir.', null, 403);
        }

        if ($this->scheduledEvent($session) === null) {
            return $this->error('Attendance is available only for scheduled performances and rehearsals.', null, 422);
        }

        $action = $request->action;
        $activeMembers = $this->currentMembers($choir)->get();
        $now = Carbon::now();

        DB::transaction(function () use ($action, $session, $choir, $activeMembers, $user, $now) {
            if ($action === 'mark_all_present') {
                foreach ($activeMembers as $member) {
                    $record = AttendanceRecord::where('attendance_session_id', $session->id)
                        ->where('member_id', $member->id)
                        ->first();

                    if (! $record) {
                        AttendanceRecord::create([
                            'attendance_session_id' => $session->id,
                            'choir_id' => $choir->id,
                            'member_id' => $member->id,
                            'status' => 'present',
                            'check_in_at' => $now,
                            'marked_by' => $user->id,
                        ]);
                    } elseif (! in_array($record->status, ['present', 'late'], true)) {
                        $record->status = 'present';
                        $record->check_in_at = $record->check_in_at ?? $now;
                        $record->marked_by = $user->id;
                        $record->save();
                    }
                }
            } elseif ($action === 'mark_remaining_absent') {
                $existingMemberIds = AttendanceRecord::where('attendance_session_id', $session->id)
                    ->pluck('member_id')
                    ->all();

                foreach ($activeMembers as $member) {
                    if (! in_array($member->id, $existingMemberIds, true)) {
                        AttendanceRecord::create([
                            'attendance_session_id' => $session->id,
                            'choir_id' => $choir->id,
                            'member_id' => $member->id,
                            'status' => 'absent',
                            'marked_by' => $user->id,
                        ]);
                    }
                }
            } elseif ($action === 'reset') {
                AttendanceRecord::where('attendance_session_id', $session->id)->delete();
            }
        });

        return $this->showSession($request, $session);
    }

    /**
     * Member analytics & attendance rates report for choir members.
     * GET /api/attendance/stats?choir_id={choir_id}
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $choirId = $request->query('choir_id');

        if (! $choirId) {
            $choir = $user->isGlobalAdmin()
                ? Choir::first()
                : $user->choirs()->first();

            if (! $choir) {
                return $this->ok(['members' => [], 'overall' => []]);
            }
            $choirId = $choir->id;
        } else {
            $choir = Choir::findOrFail($choirId);
        }

        if (! $this->canViewChoir($user, $choir)) {
            return $this->error('You are not authorized to view this choir attendance.', null, 403);
        }

        $totalSessions = AttendanceSession::where('choir_id', $choir->id)
            ->where(function ($query) {
                $query->whereNotNull('performance_id')->orWhereNotNull('rehearsal_id');
            })
            ->count();

        $members = $this->currentMembers($choir)
            ->with(['voiceSection', 'attendanceRecords' => fn ($q) => $q->where('choir_id', $choir->id)])
            ->orderBy('first_name')
            ->get();

        $memberStats = $members->map(function (Member $member) use ($totalSessions) {
            $records = $member->attendanceRecords;
            $present = $records->where('status', 'present')->count();
            $late = $records->where('status', 'late')->count();
            $absent = $records->where('status', 'absent')->count();
            $excused = $records->where('status', 'excused')->count();
            $attended = $present + $late;
            $rate = $totalSessions > 0 ? round(($attended / $totalSessions) * 100, 1) : 0;

            return [
                'member_id' => $member->id,
                'full_name' => $member->full_name,
                'member_code' => $member->member_code,
                'voice_section' => $member->voiceSection?->name,
                'total_sessions' => $totalSessions,
                'present' => $present,
                'late' => $late,
                'absent' => $absent,
                'excused' => $excused,
                'attendance_rate' => $rate,
            ];
        });

        return $this->ok([
            'total_sessions' => $totalSessions,
            'member_stats' => $memberStats,
        ]);
    }

    // ==========================================
    // Backward-compatible nested REST endpoints:
    // ==========================================

    public function index(Request $request, Choir $choir)
    {
        return $this->paginate($choir->attendanceSessions(), AttendanceSessionResource::class);
    }

    public function store(StoreAttendanceSessionRequest $request, Choir $choir)
    {
        if (! $this->canManageChoir($request->user(), $choir)) {
            return $this->error('Forbidden', null, 403);
        }

        $session = $choir->attendanceSessions()->create([
            'choir_id' => $choir->id,
            'created_by' => $request->user()->id,
            ...$request->validated(),
        ]);

        return $this->ok(new AttendanceSessionResource($session), 'Created', 201);
    }

    public function show(Request $request, Choir $choir, AttendanceSession $attendanceSession)
    {
        return $this->showSession($request, $attendanceSession);
    }

    public function update(UpdateAttendanceSessionRequest $request, Choir $choir, AttendanceSession $attendanceSession)
    {
        if (! $this->canManageChoir($request->user(), $choir)) {
            return $this->error('Forbidden', null, 403);
        }

        $attendanceSession->update($request->validated());

        return $this->ok(new AttendanceSessionResource($attendanceSession));
    }

    public function destroy(Choir $choir, AttendanceSession $attendanceSession)
    {
        if (! $this->canManageChoir(request()->user(), $choir)) {
            return $this->error('Forbidden', null, 403);
        }

        $attendanceSession->delete();

        return $this->ok(null, 'Attendance session deleted');
    }

    public function recordsIndex(Request $request, Choir $choir, AttendanceSession $attendanceSession)
    {
        return $this->ok(
            AttendanceRecordResource::collection($attendanceSession->records()->with('member', 'marker')->get())
        );
    }

    public function recordsStore(StoreAttendanceRecordRequest $request, Choir $choir, AttendanceSession $attendanceSession)
    {
        if (! $this->canManageChoir($request->user(), $choir)) {
            return $this->error('Forbidden', null, 403);
        }

        $record = $attendanceSession->attendanceRecords()->create([
            'attendance_session_id' => $attendanceSession->id,
            'choir_id' => $choir->id,
            ...$request->validated(),
        ]);

        return $this->ok(new AttendanceRecordResource($record), 'Created', 201);
    }

    public function recordsShow(Request $request, Choir $choir, AttendanceSession $attendanceSession, AttendanceRecord $record)
    {
        return $this->ok(new AttendanceRecordResource($record->load('member', 'marker')));
    }

    public function recordsUpdate(UpdateAttendanceRecordRequest $request, Choir $choir, AttendanceSession $attendanceSession, AttendanceRecord $record)
    {
        if (! $this->canManageChoir($request->user(), $choir)) {
            return $this->error('Forbidden', null, 403);
        }

        $record->update($request->validated());

        return $this->ok(new AttendanceRecordResource($record));
    }

    public function recordsDestroy(Choir $choir, AttendanceSession $attendanceSession, AttendanceRecord $record)
    {
        if (! $this->canManageChoir(request()->user(), $choir)) {
            return $this->error('Forbidden', null, 403);
        }

        $record->delete();

        return $this->ok(null, 'Attendance record deleted');
    }
}
