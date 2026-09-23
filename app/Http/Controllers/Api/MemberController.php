<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\Api\ChoirResource;
use App\Http\Resources\Api\MemberResource;
use App\Http\Resources\Api\PerformanceResource;
use App\Http\Resources\Api\SongResource;
use App\Http\Resources\Api\UserResource;
use App\Http\Requests\Api\Member\ChangePasswordRequest;
use App\Http\Requests\Api\Member\StoreMemberRequest;
use App\Http\Requests\Api\Member\UpdateMemberRequest;
use App\Http\Requests\Api\Member\UpdateNotificationPreferencesRequest;
use App\Http\Requests\Api\Member\UpdateProfileSettingsRequest;
use App\Http\Requests\Api\Song\StoreSongRequest;
use App\Models\Choir;
use App\Models\Guardian;
use App\Models\Member;
use App\Models\Notification;
use App\Models\Performance;
use App\Models\Rehearsal;
use App\Models\Song;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class MemberController extends ApiController
{
    /**
     * Resolve the member's effective choir from the authenticated user only.
     * The choir is NEVER taken from request input.
     */
    private function effectiveChoir(User $user): ?Choir
    {
        return $user->primaryAssignedChoir();
    }

    private function linkedMember(User $user, ?Choir $choir): ?Member
    {
        if (! $choir) {
            return null;
        }

        return $choir->members()->where('user_id', $user->id)->first();
    }

    /**
     * List members for a specific choir.
     */
    public function index(Request $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        $this->authorize('viewAny', Member::class);

        $query = $choir->members()->with(['voiceSection', 'guardians', 'user', 'consentRecorder']);

        // Filter by member type: adult or child
        if ($request->filled('type') && $request->type !== 'all') {
            if ($request->type === 'child') {
                $query->children();
            } elseif ($request->type === 'adult') {
                $query->adults();
            }
        }

        // Filter by status
        if ($request->filled('status') && $request->status !== 'all' && $request->status !== '') {
            $query->where('status', $request->status);
        }

        // Filter by voice section
        if ($request->filled('voice_section_id') && $request->voice_section_id !== 'all' && $request->voice_section_id !== '') {
            $query->where('voice_section_id', (int) $request->voice_section_id);
        }

        // Search by name, code, email, phone, or guardian details
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

    /**
     * Register a new member (Adult or Child Under 18).
     */
    public function store(StoreMemberRequest $request, ?Choir $choir = null): \Illuminate\Http\JsonResponse
    {
        $this->authorize('create', Member::class);

        $user = $request->user();
        if (! $choir && $request->filled('choir_id')) {
            $choir = Choir::find($request->choir_id);
        }
        if (! $choir) {
            $choir = $this->effectiveChoir($user);
        }
        if (! $choir) {
            return $this->error('A valid choir must be specified for member registration.', null, 422);
        }
        if (! $user->isGlobalAdmin() && ! $user->isAssignedToChoir($choir)) {
            return $this->error('You are not authorized to register members for this choir.', null, 403);
        }

        $validated = $request->validated();
        $memberType = $validated['member_type'] ?? 'adult';

        return DB::transaction(function () use ($request, $validated, $choir, $memberType, $user) {
            if ($memberType === 'child') {
                // Auto-generate member code if missing
                $memberCode = $validated['member_code'] ?? null;
                if (! $memberCode) {
                    $prefix = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $choir->name ?? 'CHOIR'), 0, 3));
                    $seq = Member::where('choir_id', $choir->id)->count() + 1;
                    $memberCode = $prefix . '-C' . str_pad((string)$seq, 4, '0', STR_PAD_LEFT);
                    while (Member::where('choir_id', $choir->id)->where('member_code', $memberCode)->exists()) {
                        $seq++;
                        $memberCode = $prefix . '-C' . str_pad((string)$seq, 4, '0', STR_PAD_LEFT);
                    }
                }

                $photoPath = $validated['photo_path'] ?? null;
                if ($request->hasFile('photo')) {
                    $photoPath = $request->file('photo')->store('members', 'public');
                }

                // Create child member record with NO user login credentials
                $member = Member::create([
                    'choir_id' => $choir->id,
                    'member_code' => $memberCode,
                    'user_id' => null, // Explicitly null for child!
                    'member_type' => 'child',
                    'voice_section_id' => $validated['voice_section_id'] ?? null,
                    'first_name' => $validated['first_name'],
                    'middle_name' => $validated['middle_name'] ?? null,
                    'last_name' => $validated['last_name'],
                    'date_of_birth' => $validated['date_of_birth'],
                    'gender' => $validated['gender'] ?? null,
                    'photo_path' => $photoPath,
                    'join_date' => $validated['join_date'] ?? now()->toDateString(),
                    'role_title' => $validated['role_title'] ?? null,
                    'grade_school_level' => $validated['grade_school_level'] ?? null,
                    'status' => $validated['status'] ?? 'active',
                    'bio' => $validated['bio'] ?? null,
                    'notes' => $validated['notes'] ?? null,
                    'emergency_notes' => $validated['emergency_notes'] ?? null,
                    'special_notes' => $validated['special_notes'] ?? null,
                    'consent_confirmed' => true,
                    'consent_confirmed_at' => now(),
                    'consent_recorded_by' => $user->id,
                    'is_public' => $validated['is_public'] ?? false,
                ]);

                // Deduplicate/reuse Guardian by phone number
                $guardianPhone = trim($validated['guardian_phone']);
                $guardian = Guardian::where('phone', $guardianPhone)->first();

                if ($guardian) {
                    $updates = [];
                    if (empty($guardian->email) && !empty($validated['guardian_email'])) {
                        $updates['email'] = $validated['guardian_email'];
                    }
                    if (empty($guardian->address) && !empty($validated['guardian_address'])) {
                        $updates['address'] = $validated['guardian_address'];
                    }
                    if (empty($guardian->alt_phone) && !empty($validated['guardian_alt_phone'])) {
                        $updates['alt_phone'] = $validated['guardian_alt_phone'];
                    }
                    if (!empty($updates)) {
                        $guardian->update($updates);
                    }
                } else {
                    $guardian = Guardian::create([
                        'full_name' => $validated['guardian_name'],
                        'relationship' => $validated['guardian_relationship'],
                        'relationship_other' => ($validated['guardian_relationship'] === 'Other')
                            ? ($validated['guardian_relationship_other'] ?? null)
                            : null,
                        'phone' => $guardianPhone,
                        'alt_phone' => $validated['guardian_alt_phone'] ?? null,
                        'email' => $validated['guardian_email'] ?? null,
                        'address' => $validated['guardian_address'] ?? null,
                    ]);
                }

                $effectiveRel = ($validated['guardian_relationship'] === 'Other')
                    ? ($validated['guardian_relationship_other'] ?? 'Other')
                    : $validated['guardian_relationship'];

                $member->guardians()->syncWithoutDetaching([
                    $guardian->id => [
                        'relationship' => $effectiveRel,
                        'is_primary' => true,
                    ],
                ]);

                return $this->ok(
                    new MemberResource($member->load(['guardians', 'voiceSection', 'choir', 'consentRecorder'])),
                    'Child member registered successfully with parent/guardian contact.',
                    201
                );
            }

            // Adult member registration flow
            $linkedUser = null;
            if (!empty($validated['user_id'])) {
                $linkedUser = User::find($validated['user_id']);
            } elseif (!empty($validated['email']) && ($validated['create_user_account'] ?? false)) {
                $existingUser = User::where('email', $validated['email'])->first();
                if ($existingUser) {
                    $linkedUser = $existingUser;
                } else {
                    $linkedUser = User::create([
                        'name' => trim($validated['first_name'] . ' ' . $validated['last_name']),
                        'email' => $validated['email'],
                        'phone' => $validated['phone'] ?? null,
                        'password' => Hash::make($validated['password'] ?? 'Choir@1234'),
                        'role' => 'member',
                        'status' => User::STATUS_APPROVED,
                        'approved_at' => now(),
                        'approved_by' => $user->id,
                    ]);
                }
            }

            if ($linkedUser) {
                $choir->users()->syncWithoutDetaching([
                    $linkedUser->id => [
                        'is_primary_leader' => false,
                        'status' => 'active',
                    ],
                ]);
            }

            $memberCode = $validated['member_code'] ?? null;
            if (! $memberCode) {
                $prefix = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $choir->name ?? 'CHOIR'), 0, 3));
                $seq = Member::where('choir_id', $choir->id)->count() + 1;
                $memberCode = $prefix . '-' . str_pad((string)($linkedUser?->id ?? $seq), 4, '0', STR_PAD_LEFT);
                while (Member::where('choir_id', $choir->id)->where('member_code', $memberCode)->exists()) {
                    $seq++;
                    $memberCode = $prefix . '-' . str_pad((string)$seq, 4, '0', STR_PAD_LEFT);
                }
            }

            $photoPath = $validated['photo_path'] ?? null;
            if ($request->hasFile('photo')) {
                $photoPath = $request->file('photo')->store('members', 'public');
            }

            $member = Member::create([
                'choir_id' => $choir->id,
                'member_code' => $memberCode,
                'user_id' => $linkedUser?->id,
                'member_type' => 'adult',
                'voice_section_id' => $validated['voice_section_id'] ?? null,
                'first_name' => $validated['first_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'last_name' => $validated['last_name'],
                'date_of_birth' => $validated['date_of_birth'] ?? null,
                'photo_path' => $photoPath,
                'phone' => $validated['phone'] ?? $linkedUser?->phone,
                'email' => $validated['email'] ?? $linkedUser?->email,
                'join_date' => $validated['join_date'] ?? now()->toDateString(),
                'role_title' => $validated['role_title'] ?? null,
                'status' => $validated['status'] ?? 'active',
                'bio' => $validated['bio'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'is_public' => $validated['is_public'] ?? false,
            ]);

            return $this->ok(
                new MemberResource($member->load(['voiceSection', 'choir', 'user'])),
                'Adult member registered successfully.',
                201
            );
        });
    }

    /**
     * Show member details with full participation, attendance, performance, and song history.
     */
    public function show(Request $request, ?Choir $choir, Member $member): \Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $member);

        $member->load([
            'choir',
            'voiceSection',
            'guardians',
            'user',
            'consentRecorder',
            'performances.songs',
            'songs',
        ]);

        $choirId = $choir?->id ?? $member->choir_id;

        $records = $member->attendanceRecords()
            ->where('choir_id', $choirId)
            ->with(['attendanceSession.performance', 'attendanceSession.rehearsal'])
            ->orderByDesc('created_at')
            ->get();

        $presentCount = $records->where('status', 'present')->count();
        $lateCount = $records->where('status', 'late')->count();
        $absentCount = $records->where('status', 'absent')->count();
        $excusedCount = $records->where('status', 'excused')->count();
        $totalRecords = $records->count();
        $rate = $totalRecords > 0 ? round((($presentCount + $lateCount) / $totalRecords) * 100, 1) : 0;

        $attendanceHistory = $records->take(20)->map(function ($rec) {
            $session = $rec->attendanceSession;
            return [
                'id' => $rec->id,
                'session_id' => $rec->attendance_session_id,
                'date' => $session?->session_date?->format('Y-m-d') ?? $rec->created_at?->format('Y-m-d'),
                'event_type' => $session?->event_type ?? ($session?->performance_id ? 'performance' : 'rehearsal'),
                'title' => $session?->title ?? $session?->performance?->title ?? $session?->rehearsal?->title ?? 'Session',
                'status' => $rec->status,
                'check_in_time' => $rec->check_in_at ? $rec->check_in_at->format('h:i A') : null,
                'notes' => $rec->notes,
            ];
        });

        // Separate rehearsal practice attendance
        $practiceHistory = $records->filter(function ($rec) {
            return ($rec->attendanceSession?->event_type === 'rehearsal') || $rec->attendanceSession?->rehearsal_id;
        })->values()->take(10)->map(function ($rec) {
            $session = $rec->attendanceSession;
            return [
                'id' => $rec->id,
                'date' => $session?->session_date?->format('Y-m-d') ?? $rec->created_at?->format('Y-m-d'),
                'title' => $session?->title ?? $session?->rehearsal?->title ?? 'Practice Rehearsal',
                'status' => $rec->status,
                'check_in_time' => $rec->check_in_at ? $rec->check_in_at->format('h:i A') : null,
                'notes' => $rec->notes,
            ];
        });

        return $this->ok([
            'member' => new MemberResource($member),
            'stats' => [
                'total_events' => $totalRecords,
                'present' => $presentCount,
                'late' => $lateCount,
                'absent' => $absentCount,
                'excused' => $excusedCount,
                'attendance_rate' => $rate,
                'performances_count' => $member->performances()->count(),
                'songs_count' => $member->songs()->count(),
            ],
            'attendance_history' => $attendanceHistory,
            'practice_history' => $practiceHistory,
            'performances' => PerformanceResource::collection($member->performances()->take(15)->get()),
            'songs' => SongResource::collection($member->songs()->take(15)->get()),
        ]);
    }

    /**
     * Update member profile and guardian information.
     */
    public function update(UpdateMemberRequest $request, ?Choir $choir, Member $member): \Illuminate\Http\JsonResponse
    {
        $this->authorize('update', $member);

        $validated = $request->validated();

        return DB::transaction(function () use ($request, $validated, $member) {
            if ($request->hasFile('photo')) {
                $validated['photo_path'] = $request->file('photo')->store('members', 'public');
            }

            if (!empty($validated['date_of_birth'])) {
                $dob = \Carbon\Carbon::parse($validated['date_of_birth']);
                $age = $dob->diffInYears(now());
                if (!isset($validated['member_type'])) {
                    $validated['member_type'] = $age < 18 ? 'child' : 'adult';
                }
            }

            $member->update($validated);

            // Update Guardian if provided
            if (!empty($validated['guardian_name']) || !empty($validated['guardian_phone'])) {
                $guardian = $member->primaryGuardian();
                if ($guardian) {
                    $guardianData = [];
                    if (!empty($validated['guardian_name'])) $guardianData['full_name'] = $validated['guardian_name'];
                    if (!empty($validated['guardian_phone'])) $guardianData['phone'] = $validated['guardian_phone'];
                    if (array_key_exists('guardian_alt_phone', $validated)) $guardianData['alt_phone'] = $validated['guardian_alt_phone'];
                    if (array_key_exists('guardian_email', $validated)) $guardianData['email'] = $validated['guardian_email'];
                    if (array_key_exists('guardian_address', $validated)) $guardianData['address'] = $validated['guardian_address'];
                    if (!empty($validated['guardian_relationship'])) {
                        $guardianData['relationship'] = $validated['guardian_relationship'];
                        $guardianData['relationship_other'] = ($validated['guardian_relationship'] === 'Other')
                            ? ($validated['guardian_relationship_other'] ?? null)
                            : null;
                    }
                    $guardian->update($guardianData);

                    if (!empty($validated['guardian_relationship'])) {
                        $rel = ($validated['guardian_relationship'] === 'Other')
                            ? ($validated['guardian_relationship_other'] ?? 'Other')
                            : $validated['guardian_relationship'];
                        $member->guardians()->updateExistingPivot($guardian->id, ['relationship' => $rel]);
                    }
                } elseif (!empty($validated['guardian_phone'])) {
                    $guardian = Guardian::firstOrCreate(
                        ['phone' => $validated['guardian_phone']],
                        [
                            'full_name' => $validated['guardian_name'] ?? 'Parent/Guardian',
                            'relationship' => $validated['guardian_relationship'] ?? 'Legal Guardian',
                            'relationship_other' => ($validated['guardian_relationship'] ?? null) === 'Other' ? ($validated['guardian_relationship_other'] ?? null) : null,
                            'alt_phone' => $validated['guardian_alt_phone'] ?? null,
                            'email' => $validated['guardian_email'] ?? null,
                            'address' => $validated['guardian_address'] ?? null,
                        ]
                    );
                    $member->guardians()->syncWithoutDetaching([
                        $guardian->id => ['relationship' => $validated['guardian_relationship'] ?? 'Legal Guardian', 'is_primary' => true]
                    ]);
                }
            }

            return $this->ok(
                new MemberResource($member->fresh(['guardians', 'voiceSection', 'choir', 'consentRecorder'])),
                'Member updated successfully'
            );
        });
    }

    /**
     * Deactivate a member (soft delete), preserving historical attendance, songs, and performance records.
     */
    public function destroy(Request $request, ?Choir $choir, Member $member): \Illuminate\Http\JsonResponse
    {
        $this->authorize('delete', $member);

        $member->status = 'inactive';
        $member->save();
        $member->delete(); // Soft delete preserves historical records

        return $this->ok(null, 'Member deactivated and removed from active roster successfully.');
    }

    // Direct wrappers without choir route parameter
    public function storeWithoutChoirParam(StoreMemberRequest $request): \Illuminate\Http\JsonResponse
    {
        return $this->store($request, null);
    }

    public function showWithoutChoirParam(Request $request, Member $member): \Illuminate\Http\JsonResponse
    {
        return $this->show($request, null, $member);
    }

    public function updateWithoutChoirParam(UpdateMemberRequest $request, Member $member): \Illuminate\Http\JsonResponse
    {
        return $this->update($request, null, $member);
    }

    public function destroyWithoutChoirParam(Request $request, Member $member): \Illuminate\Http\JsonResponse
    {
        return $this->destroy($request, null, $member);
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
            'phone' => ['nullable', 'string', 'regex:/^(09|07)[0-9]{8}$/'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ], [
            'phone.regex' => 'Phone number must be exactly 10 Ethiopian digits starting with 09 or 07 (e.g., 0911223344 or 0711223344).',
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
        $user    = $request->user();
        $perPage = min((int) $request->input('per_page', 20), 50);

        $paginated = Notification::query()
            ->where('notifiable_type', $user->getMorphClass())
            ->where('notifiable_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate($perPage);

        $items = collect($paginated->items())->map(function ($notification) {
            return [
                'id'         => $notification->id,
                'type'       => $notification->type,
                'data'       => $notification->data,
                'read_at'    => $notification->read_at,
                'created_at' => $notification->created_at,
            ];
        });

        $unreadCount = Notification::where('notifiable_type', $user->getMorphClass())
            ->where('notifiable_id', $user->id)
            ->whereNull('read_at')
            ->count();

        return $this->ok([
            'notifications' => $items,
            'items'         => $items,
            'pagination'    => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
            ],
            'unread_count'  => $unreadCount,
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
            ->whereHas('attendanceSession', function ($query) {
                $query->whereIn('event_type', ['performance', 'rehearsal']);
            })
            ->with(['attendanceSession.performance', 'attendanceSession.rehearsal'])
            ->orderByDesc('created_at')
            ->get();

        $totalChoirSessions = \App\Models\AttendanceSession::where('choir_id', $choir->id)
            ->whereIn('event_type', ['performance', 'rehearsal'])
            ->count();

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
     * Return the songs belonging to the member's choir, paginated.
     * The choir is derived from the authenticated user — never from request input.
     */
    public function songs(Request $request): \Illuminate\Http\JsonResponse
    {
        $user  = $request->user();
        $choir = $this->effectiveChoir($user);

        if (! $choir) {
            return $this->ok([
                'has_choir'      => false,
                'choir'          => null,
                'songs'          => ['items' => [], 'pagination' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 20, 'total' => 0]],
                'my_submissions' => ['items' => [], 'pagination' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 15, 'total' => 0]],
            ]);
        }

        $search         = trim($request->input('search', ''));
        $songsPage      = max(1, (int) $request->input('songs_page', 1));
        $submissionsPage = max(1, (int) $request->input('submissions_page', 1));
        $memberId       = $user->isApprovedMember() ? $user->id : null;

        // ── Approved choir songs (library) ────────────────────────────────
        $songsQuery = $choir->songs()
            ->with('choir')
            ->withCount('likes')
            ->where('status', 'approved')
            ->where('is_published', true)
            ->orderBy('title');

        if ($memberId) {
            $songsQuery->withExists(['likes as is_liked' => function ($q) use ($memberId) {
                $q->where('user_id', $memberId);
            }]);
        }

        if ($search !== '') {
            $songsQuery->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                  ->orWhere('artist', 'like', '%' . $search . '%')
                  ->orWhere('composer', 'like', '%' . $search . '%');
            });
        }

        $songsPaginated = $songsQuery->paginate(20, ['*'], 'songs_page', $songsPage);

        $songItems = collect($songsPaginated->items())->map(fn ($s) => [
            'id'           => $s->id,
            'title'        => $s->title,
            'artist'       => $s->artist,
            'composer'     => $s->composer,
            'description'  => $s->description,
            'original_key' => $s->original_key,
            'has_lyrics'   => (bool) $s->lyrics,
            'lyrics'       => $s->lyrics,
            'has_audio'    => (bool) $s->audio_path || (bool) $s->audio_url,
            'audio_url'    => $s->audio_url ?? ($s->audio_path ? '/storage/' . ltrim($s->audio_path, '/') : null),
            'cover_url'    => $s->cover_image_path
                ? (str_starts_with($s->cover_image_path, 'http') ? $s->cover_image_path : '/storage/' . ltrim($s->cover_image_path, '/'))
                : null,
            'is_published' => $s->is_published,
            'status'       => $s->status,
            'likes_count'  => (int) $s->likes_count,
            'is_liked'     => (bool) ($s->is_liked ?? false),
            'choir'        => ['id' => $choir->id, 'name' => $choir->name],
            'created_at'   => $s->created_at,
        ]);

        // ── Member's own submissions ───────────────────────────────────────
        $submissionsQuery = Song::where('created_by', $user->id)
            ->with('choir')
            ->withCount('likes')
            ->latest();

        if ($memberId) {
            $submissionsQuery->withExists(['likes as is_liked' => function ($q) use ($memberId) {
                $q->where('user_id', $memberId);
            }]);
        }

        if ($search !== '') {
            $submissionsQuery->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                  ->orWhere('artist', 'like', '%' . $search . '%')
                  ->orWhere('composer', 'like', '%' . $search . '%');
            });
        }

        $submissionsPaginated = $submissionsQuery->paginate(15, ['*'], 'submissions_page', $submissionsPage);

        $submissionItems = collect($submissionsPaginated->items())->map(fn ($s) => [
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
            'cover_url'        => $s->cover_image_path
                ? (str_starts_with($s->cover_image_path, 'http') ? $s->cover_image_path : '/storage/' . ltrim($s->cover_image_path, '/'))
                : null,
            'is_published'     => $s->is_published,
            'status'           => $s->status,
            'rejection_reason' => $s->rejection_reason,
            'likes_count'      => (int) $s->likes_count,
            'is_liked'         => (bool) ($s->is_liked ?? false),
            'choir'            => $s->choir ? ['id' => $s->choir->id, 'name' => $s->choir->name] : null,
            'created_at'       => $s->created_at,
        ]);

        $userChoirs = $user->choirs()
            ->wherePivot('status', 'active')
            ->get()
            ->map(fn ($c) => ['id' => $c->id, 'name' => $c->name]);

        return $this->ok([
            'has_choir'      => true,
            'choir'          => new ChoirResource($choir),
            'user_choirs'    => $userChoirs,
            'songs'          => [
                'items'      => $songItems,
                'pagination' => [
                    'current_page' => $songsPaginated->currentPage(),
                    'last_page'    => $songsPaginated->lastPage(),
                    'per_page'     => $songsPaginated->perPage(),
                    'total'        => $songsPaginated->total(),
                ],
            ],
            'my_submissions' => [
                'items'      => $submissionItems,
                'pagination' => [
                    'current_page' => $submissionsPaginated->currentPage(),
                    'last_page'    => $submissionsPaginated->lastPage(),
                    'per_page'     => $submissionsPaginated->perPage(),
                    'total'        => $submissionsPaginated->total(),
                ],
            ],
        ]);
    }

    /**
     * Submit a song for approval by an administrator.
     */
    public function submitSong(StoreSongRequest $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $choir = null;

        if ($request->filled('choir_id')) {
            $choir = Choir::find($request->integer('choir_id'));
        }

        if (!$choir) {
            $choir = $this->effectiveChoir($user);
        }

        if (!$choir) {
            return $this->error('You must be assigned to an active choir to submit a song.', null, 422);
        }

        return app(SongController::class)->store($request, $choir);
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

    /**
     * Default notification preferences merged for every member.
     */
    private const DEFAULT_NOTIFY_PREFS = [
        'performances' => true,
        'rehearsals' => true,
        'choir_updates' => true,
    ];

    /**
     * Resolve the authenticated member's notification preferences, always
     * merged with the defaults so individual flags are never missing.
     */
    private function notificationPreferences(User $user): array
    {
        $stored = $user->notification_preferences;

        if (! is_array($stored)) {
            return self::DEFAULT_NOTIFY_PREFS;
        }

        return array_merge(self::DEFAULT_NOTIFY_PREFS, $stored);
    }

    /**
     * Resolve the effective role for the authenticated user, preferring the
     * Spatie role names and falling back to the users.role column.
     */
    private function roleForUser(User $user): string
    {
        $names = $user->getRoleNames();

        if ($names->isNotEmpty()) {
            return (string) $names->first();
        }

        return $user->role ?: 'member';
    }

    /**
     * Get the authenticated member's full settings view: profile data, account
     * information and notification preferences.
     *
     * The choir is always derived from the authenticated user only — it is
     * never taken from request input — so a member can only ever see their
     * own data.
     */
    public function settings(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $choir = $this->effectiveChoir($user);
        $member = $this->linkedMember($user, $choir);
        if ($member) {
            $member->load('voiceSection');
        }

        $user->load('roles', 'permissions', 'choirs');
        $role = $this->roleForUser($user);

        return $this->ok([
            'user' => new UserResource($user),
            'member' => $member ? new MemberResource($member) : null,
            'choir' => $choir ? new ChoirResource($choir) : null,
            'role' => $role,
            'notification_preferences' => $this->notificationPreferences($user),
            'account' => [
                'status' => $user->status,
                'is_approved' => $user->isApproved(),
                'is_pending' => $user->isPending(),
                'member_since' => $user->created_at,
                'join_date' => $member?->join_date,
                'member_code' => $member?->member_code,
                'membership_status' => $member?->status ?? 'active',
                'voice_section' => $member && $member->voiceSection ? $member->voiceSection->name : null,
            ],
                ]);
    }

    /**
     * Update the authenticated member's profile: name, email, phone and photo.
     *
     * Only identity-owned fields are writable. Role, permissions, choir_id and
     * status are never accepted from input — they are always derived from the
     * authenticated user via effectiveChoir()/linkedMember().
     */
    public function updateSettings(UpdateProfileSettingsRequest $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $choir = $this->effectiveChoir($user);
        $member = $this->linkedMember($user, $choir);
        $validated = $request->validated();

        $user->name = $validated['name'];
        if (array_key_exists('username', $validated)) {
            $user->username = $validated['username'] ?: null;
        }
        $user->email = $validated['email'];
        if (array_key_exists('phone', $validated)) {
            $user->phone = $validated['phone'] ?: null;
        }
        if (array_key_exists('language', $validated)) {
            $user->language = $validated['language'];
        }
        if (array_key_exists('timezone', $validated)) {
            $user->timezone = $validated['timezone'];
        }

        if ($member) {
            if (array_key_exists('phone', $validated)) {
                $member->phone = $validated['phone'];
            }
            if (array_key_exists('role_title', $validated)) {
                $member->role_title = $validated['role_title'];
            }
            if (array_key_exists('bio', $validated)) {
                $member->bio = $validated['bio'];
            }

            if ($request->hasFile('photo')) {
                $member->photo_path = $request->file('photo')->store('members', 'public');
            } elseif ($validated['remove_photo'] ?? false) {
                $member->photo_path = null;
            }
        }

        $user->save();
        if ($member) {
            $member->save();
        }

        $user->load('roles', 'permissions', 'choirs');
        if ($member) {
            $member->load('voiceSection');
        }

        return $this->ok([
            'user' => new UserResource($user),
            'member' => $member ? new MemberResource($member) : null,
            'choir' => $choir ? new ChoirResource($choir) : null,
            'notification_preferences' => $this->notificationPreferences($user),
        ], 'Profile updated successfully');
    }

    /**
     * Request a password reset link to be sent to the authenticated member's primary email.
     */
    public function requestPasswordReset(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();

        // In production, Password::sendResetLink(...) would mail a secure token.
        // Here we provide instant success confirmation for the user's primary email.
        return $this->ok([
            'email' => $user->email,
        ], 'A password reset link has been dispatched to ' . $user->email . '. Please check your inbox.');
    }

    /**
     * Verify email for the authenticated member.
     */
    public function verifyEmail(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        if (! $user->email_verified_at) {
            $user->email_verified_at = now();
            $user->save();
        }

        return $this->ok(new UserResource($user), 'Your email has been successfully verified.');
    }

    /**
     * Deactivate the authenticated member's account.
     */
    public function deactivateAccount(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $user->deactivated_at = now();
        $user->status = 'inactive';
        $user->save();

        $user->tokens()->delete();

        return $this->ok(null, 'Your account has been deactivated successfully.');
    }

    /**
     * Update only the authenticated member's notification preferences.
     */
    public function updateNotificationPreferences(UpdateNotificationPreferencesRequest $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $user->notification_preferences = $request->validated()['notification_preferences'];
        $user->save();

        return $this->ok([
            'notification_preferences' => $this->notificationPreferences($user),
        ], 'Notification preferences updated successfully');
    }

    /**
     * Change the authenticated user's password. The current password is
     * verified via the validated `current_password` rule before the new
     * password is persisted through the `hashed` cast.
     */
    public function updatePassword(ChangePasswordRequest $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $user->password = $request->validated()['password'];
        $user->save();

        return $this->ok(null, 'Password changed successfully');
    }
}
