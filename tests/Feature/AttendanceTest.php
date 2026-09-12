<?php

namespace Tests\Feature;

use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Choir;
use App\Models\Member;
use App\Models\Performance;
use App\Models\Rehearsal;
use App\Models\User;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AttendanceTest extends TestCase
{
    private Choir $choirA;
    private Choir $choirB;
    private User $admin;
    private User $leaderA;
    private User $memberA;
    private Member $memberRecordA;
    private Performance $performanceA;

    protected function setUp(): void
    {
        parent::setUp();

        // Roles & Permissions
        $guard = 'api';
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => $guard]);
        Role::firstOrCreate(['name' => 'team_leader', 'guard_name' => $guard]);
        Role::firstOrCreate(['name' => 'member', 'guard_name' => $guard]);

        Permission::firstOrCreate(['name' => 'attendance.view', 'guard_name' => $guard]);
        Permission::firstOrCreate(['name' => 'attendance.manage', 'guard_name' => $guard]);
        Permission::firstOrCreate(['name' => 'choirs.view.all', 'guard_name' => $guard]);

        // Choirs
        $this->choirA = Choir::firstOrCreate(
            ['slug' => 'choir-a-test'],
            ['name' => 'Choir A', 'status' => 'active', 'is_public' => true]
        );

        $this->choirB = Choir::firstOrCreate(
            ['slug' => 'choir-b-test'],
            ['name' => 'Choir B', 'status' => 'active', 'is_public' => true]
        );

        // Admin User
        $this->admin = User::firstOrCreate(
            ['email' => 'admin_att@choirmkc.com'],
            ['name' => 'Admin User', 'password' => bcrypt('password123'), 'role' => 'admin', 'status' => 'approved']
        );
        $this->admin->assignRole('admin');

        // Leader User for Choir A
        $this->leaderA = User::firstOrCreate(
            ['email' => 'leader_a_att@choirmkc.com'],
            ['name' => 'Leader A', 'password' => bcrypt('password123'), 'role' => 'team_leader', 'status' => 'approved']
        );
        $this->leaderA->assignRole('team_leader');
        $this->leaderA->choirs()->syncWithoutDetaching([$this->choirA->id => ['status' => 'active', 'is_primary_leader' => true]]);

        // Member User for Choir A
        $this->memberA = User::firstOrCreate(
            ['email' => 'member_a_att@choirmkc.com'],
            ['name' => 'Member A', 'password' => bcrypt('password123'), 'role' => 'member', 'status' => 'approved']
        );
        $this->memberA->assignRole('member');
        $this->memberA->choirs()->syncWithoutDetaching([$this->choirA->id => ['status' => 'active']]);

        // Member Roster Record
        $this->memberRecordA = Member::firstOrCreate(
            ['choir_id' => $this->choirA->id, 'email' => $this->memberA->email],
            [
                'user_id' => $this->memberA->id,
                'first_name' => 'Daniel',
                'last_name' => 'Mekonnen',
                'member_code' => 'DM-001',
                'status' => 'active',
                'is_public' => true,
            ]
        );

        // Performance for Choir A
        $this->performanceA = Performance::firstOrCreate(
            ['choir_id' => $this->choirA->id, 'title' => 'Sunday Worship Performance'],
            [
                'date' => Carbon::today()->toDateString(),
                'venue' => 'Main Sanctuary',
                'start_time' => '10:00:00',
                'end_time' => '12:00:00',
                'status' => 'confirmed',
                'is_public' => true,
                'created_by' => $this->admin->id,
            ]
        );
    }

    /**
     * TEST 1 & 2: Choir & Performance selection loads only that choir's members.
     */
    public function test_loading_attendance_session_returns_only_choir_members(): void
    {
        Sanctum::actingAs($this->admin, ['*']);

        // Create a member in Choir B to verify isolation
        $memberB = Member::firstOrCreate(
            ['choir_id' => $this->choirB->id, 'email' => 'member_b_att@choirmkc.com'],
            [
                'first_name' => 'Sara',
                'last_name' => 'B-Choir',
                'member_code' => 'SB-002',
                'status' => 'active',
            ]
        );

        $response = $this->postJson('/api/attendance/sessions/find-or-create', [
            'choir_id' => $this->choirA->id,
            'performance_id' => $this->performanceA->id,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);

        $memberIds = collect($response->json('data.members'))->pluck('member_id')->all();
        $this->assertContains($this->memberRecordA->id, $memberIds);
        $this->assertNotContains($memberB->id, $memberIds);

        $inactiveMember = Member::create([
            'choir_id' => $this->choirA->id,
            'first_name' => 'Inactive',
            'last_name' => 'Member',
            'member_code' => 'IM-003',
            'status' => 'inactive',
        ]);

        $reload = $this->postJson('/api/attendance/sessions/find-or-create', [
            'choir_id' => $this->choirA->id,
            'session_date' => Carbon::tomorrow()->toDateString(),
        ]);

        $reload->assertStatus(422);
    }

    /**
     * TEST 3: Click Present updates database immediately.
     */
    public function test_mark_present_updates_record_and_counts(): void
    {
        Sanctum::actingAs($this->leaderA, ['*']);

        $session = AttendanceSession::firstOrCreate([
            'choir_id' => $this->choirA->id,
            'performance_id' => $this->performanceA->id,
            'session_date' => Carbon::today()->toDateString(),
        ], ['status' => 'open']);

        $response = $this->postJson('/api/attendance/records/mark', [
            'attendance_session_id' => $session->id,
            'member_id' => $this->memberRecordA->id,
            'status' => 'present',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'present');

        $this->assertDatabaseHas('attendance_records', [
            'attendance_session_id' => $session->id,
            'member_id' => $this->memberRecordA->id,
            'status' => 'present',
        ]);
    }

    /**
     * TEST 4: Click Check In records authoritative server timestamp.
     */
    public function test_check_in_records_server_timestamp(): void
    {
        Sanctum::actingAs($this->leaderA, ['*']);

        $session = AttendanceSession::firstOrCreate([
            'choir_id' => $this->choirA->id,
            'performance_id' => $this->performanceA->id,
            'session_date' => Carbon::today()->toDateString(),
        ], ['status' => 'open']);

        $response = $this->postJson('/api/attendance/check-in', [
            'attendance_session_id' => $session->id,
            'member_id' => $this->memberRecordA->id,
        ]);

        $response->assertStatus(200);
        $this->assertNotNull($response->json('data.check_in_at'));
        $this->assertNotNull($response->json('data.check_in_time'));

        $record = AttendanceRecord::where('attendance_session_id', $session->id)
            ->where('member_id', $this->memberRecordA->id)
            ->first();

        $this->assertNotNull($record);
        $this->assertNotNull($record->check_in_at);
    }

    /**
     * TEST 5: Click Check Out records check_out_at timestamp and prevents checkout before check-in.
     */
    public function test_check_out_records_timestamp_and_prevents_premature_checkout(): void
    {
        Sanctum::actingAs($this->leaderA, ['*']);

        $session = AttendanceSession::firstOrCreate([
            'choir_id' => $this->choirA->id,
            'performance_id' => $this->performanceA->id,
            'session_date' => Carbon::today()->toDateString(),
        ], ['status' => 'open']);

        // Attempt checkout before checkin -> should fail with 422
        AttendanceRecord::where('attendance_session_id', $session->id)
            ->where('member_id', $this->memberRecordA->id)
            ->delete();

        $premature = $this->postJson('/api/attendance/check-out', [
            'attendance_session_id' => $session->id,
            'member_id' => $this->memberRecordA->id,
        ]);
        $premature->assertStatus(422);

        // Perform checkin first
        $this->postJson('/api/attendance/check-in', [
            'attendance_session_id' => $session->id,
            'member_id' => $this->memberRecordA->id,
        ]);

        // Now checkout -> should succeed
        $response = $this->postJson('/api/attendance/check-out', [
            'attendance_session_id' => $session->id,
            'member_id' => $this->memberRecordA->id,
        ]);

        $response->assertStatus(200);
        $this->assertNotNull($response->json('data.check_out_at'));

        $record = AttendanceRecord::where('attendance_session_id', $session->id)
            ->where('member_id', $this->memberRecordA->id)
            ->first();

        $this->assertNotNull($record->check_out_at);
    }

    /**
     * TEST 6: Late status calculation when checking in past threshold.
     */
    public function test_late_status_calculated_when_past_threshold(): void
    {
        Sanctum::actingAs($this->leaderA, ['*']);

        // Session starting 30 minutes ago with 15 min threshold
        $pastTime = Carbon::now()->subMinutes(30)->format('H:i:s');
        $session = AttendanceSession::create([
            'choir_id' => $this->choirA->id,
            'performance_id' => $this->performanceA->id,
            'session_date' => Carbon::today()->toDateString(),
            'start_time' => $pastTime,
            'late_threshold_minutes' => 15,
            'status' => 'open',
        ]);

        $response = $this->postJson('/api/attendance/check-in', [
            'attendance_session_id' => $session->id,
            'member_id' => $this->memberRecordA->id,
        ]);

        $response->assertStatus(200);
        $this->assertEquals('late', $response->json('data.status'));
    }

    /**
     * TEST 7: Bulk Actions (mark_all_present, mark_remaining_absent, reset).
     */
    public function test_bulk_attendance_actions(): void
    {
        Sanctum::actingAs($this->leaderA, ['*']);

        $session = AttendanceSession::create([
            'choir_id' => $this->choirA->id,
            'performance_id' => $this->performanceA->id,
            'session_date' => Carbon::today()->toDateString(),
            'status' => 'open',
        ]);

        // Bulk mark all present
        $bulkPres = $this->postJson('/api/attendance/records/bulk', [
            'attendance_session_id' => $session->id,
            'action' => 'mark_all_present',
        ]);
        $bulkPres->assertStatus(200);
        $bulkPres->assertJsonPath('data.counts.present', 1);

        // Bulk reset
        $bulkReset = $this->postJson('/api/attendance/records/bulk', [
            'attendance_session_id' => $session->id,
            'action' => 'reset',
        ]);
        $bulkReset->assertStatus(200);
        $bulkReset->assertJsonPath('data.counts.present', 0);
    }

    /**
     * TEST 10: Member can view own attendance history but not modify attendance.
     */
    public function test_member_can_view_own_attendance_history_read_only(): void
    {
        $session = AttendanceSession::create([
            'choir_id' => $this->choirA->id,
            'performance_id' => $this->performanceA->id,
            'session_date' => Carbon::today()->toDateString(),
            'title' => 'Sunday Service',
            'status' => 'open',
        ]);

        AttendanceRecord::create([
            'attendance_session_id' => $session->id,
            'choir_id' => $this->choirA->id,
            'member_id' => $this->memberRecordA->id,
            'status' => 'present',
            'check_in_at' => Carbon::now(),
        ]);

        Sanctum::actingAs($this->memberA, ['*']);

        $response = $this->getJson('/api/member/attendance');
        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.has_choir', true);
        $response->assertJsonPath('data.stats.present', 1);

        // Member cannot mark attendance records -> 403
        $modifyAttempt = $this->postJson('/api/attendance/records/mark', [
            'attendance_session_id' => $session->id,
            'member_id' => $this->memberRecordA->id,
            'status' => 'excused',
        ]);
        $modifyAttempt->assertStatus(403);
    }

    /**
     * TEST 11: Team Leader of Choir A tries to access Choir B attendance -> 403 Forbidden.
     */
    public function test_team_leader_cannot_manage_unassigned_choir_attendance(): void
    {
        Sanctum::actingAs($this->leaderA, ['*']);

        $sessionB = AttendanceSession::create([
            'choir_id' => $this->choirB->id,
            'session_date' => Carbon::today()->toDateString(),
            'status' => 'open',
        ]);

        // Attempt viewing Choir B events -> 403
        $eventsB = $this->getJson("/api/attendance/events?choir_id={$this->choirB->id}");
        $eventsB->assertStatus(403);

        // Attempt creating session in Choir B -> 403
        $createB = $this->postJson('/api/attendance/sessions/find-or-create', [
            'choir_id' => $this->choirB->id,
            'session_date' => Carbon::today()->toDateString(),
        ]);
        $createB->assertStatus(403);

        // Attempt check-in in Choir B -> 403
        $checkInB = $this->postJson('/api/attendance/check-in', [
            'attendance_session_id' => $sessionB->id,
            'member_id' => $this->memberRecordA->id,
        ]);
        $checkInB->assertStatus(403);
    }

    public function test_team_leader_column_assignment_loads_only_led_choir(): void
    {
        $this->choirA->update(['team_leader_id' => $this->leaderA->id]);
        $this->leaderA->choirs()->detach($this->choirA->id);

        Sanctum::actingAs($this->leaderA, ['*']);

        $choirs = $this->getJson('/api/attendance/choirs');
        $choirs->assertOk();
        $choirs->assertJsonFragment(['id' => $this->choirA->id, 'name' => $this->choirA->name]);
        $choirs->assertJsonMissing(['id' => $this->choirB->id, 'name' => $this->choirB->name]);

        $session = $this->postJson('/api/attendance/sessions/find-or-create', [
            'choir_id' => $this->choirA->id,
            'performance_id' => $this->performanceA->id,
        ]);

        $session->assertOk();
        $session->assertJsonFragment(['member_id' => $this->memberRecordA->id]);
    }

    /**
     * TEST 12: Admin can access all choirs.
     */
    public function test_admin_can_access_all_choirs(): void
    {
        // Legacy data may still attach an admin to one choir. That assignment
        // must never narrow the admin's global choir scope.
        $this->admin->syncRoles([]);
        $this->admin->choirs()->syncWithoutDetaching([
            $this->choirA->id => ['status' => 'active'],
        ]);

        Sanctum::actingAs($this->admin, ['*']);

        $choirs = $this->getJson('/api/choirs');
        $choirs->assertStatus(200);
        $choirs->assertJsonFragment(['id' => $this->choirA->id, 'name' => $this->choirA->name]);
        $choirs->assertJsonFragment(['id' => $this->choirB->id, 'name' => $this->choirB->name]);

        $memberB = Member::firstOrCreate(
            ['choir_id' => $this->choirB->id, 'email' => 'admin_scope_member_b@choirmkc.com'],
            [
                'first_name' => 'Choir B',
                'last_name' => 'Member',
                'member_code' => 'ADMIN-B-001',
                'status' => 'active',
            ]
        );
        $performanceB = Performance::firstOrCreate(
            ['choir_id' => $this->choirB->id, 'title' => 'Choir B Admin Scope Performance'],
            [
                'date' => Carbon::today()->toDateString(),
                'start_time' => '10:00:00',
                'end_time' => '12:00:00',
                'status' => 'confirmed',
                'created_by' => $this->admin->id,
            ]
        );

        $eventsA = $this->getJson("/api/attendance/events?choir_id={$this->choirA->id}");
        $eventsA->assertStatus(200);

        $eventsB = $this->getJson("/api/attendance/events?choir_id={$this->choirB->id}");
        $eventsB->assertStatus(200);

        $sessionB = $this->postJson('/api/attendance/sessions/find-or-create', [
            'choir_id' => $this->choirB->id,
            'performance_id' => $performanceB->id,
        ]);
        $sessionB->assertStatus(200);
        $this->assertContains($memberB->id, $this->rosterIds($sessionB));
    }

    /**
     * Create a fresh approved user + active roster record + active pivot for a
     * choir. Each call uses a unique email so tests are idempotent.
     *
     * @return array{0: User, 1: Member}
     */
    private function createUserInChoir(Choir $choir, string $prefix = 'member'): array
    {
        $suffix = uniqid();
        $user = User::create([
            'name' => ucfirst($prefix) . ' Member ' . $suffix,
            'email' => strtolower($prefix) . '.' . $suffix . '@test.local',
            'password' => bcrypt('password123'),
            'role' => 'member',
            'status' => User::STATUS_APPROVED,
        ]);
        $user->assignRole('member');
        $user->choirs()->syncWithoutDetaching([$choir->id => ['status' => 'active']]);

        $member = Member::updateOrCreate(
            ['user_id' => $user->id, 'choir_id' => $choir->id],
            [
                'member_code' => strtoupper(substr($prefix, 0, 3)) . '-' . $suffix,
                'first_name' => ucfirst($prefix),
                'last_name' => 'Member',
                'status' => 'active',
            ]
        );

        return [$user, $member];
    }

    private function rosterIds($response): array
    {
        $response->assertStatus(200);

        return collect($response->json('data.members'))->pluck('member_id')->all();
    }

    /**
     * Log the user in and return bearer auth headers so admin routes resolve
     * through the real Sanctum token flow (Spatie role/permission middleware
     * requires it in this test suite).
     */
    private function loginAs(User $user): array
    {
        $res = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);
        $res->assertStatus(200);

        return ['Authorization' => 'Bearer ' . $res->json('data.token')];
    }

    /**
     * TEST B: A newly added member appears automatically in attendance.
     */
    public function test_new_member_appears_automatically_in_attendance(): void
    {
        Sanctum::actingAs($this->admin, ['*']);

        [$user, $member] = $this->createUserInChoir($this->choirA, 'newbie');

        $roster = $this->postJson('/api/attendance/sessions/find-or-create', [
            'choir_id' => $this->choirA->id,
            'performance_id' => $this->performanceA->id,
        ]);

        $this->assertContains($member->id, $this->rosterIds($roster));
    }

    /**
     * TEST C/E: A deleted (soft-deleted) member disappears from new attendance
     * while their previous attendance records remain in history.
     */
    public function test_deleted_member_excluded_from_roster_but_history_remains(): void
    {
        Sanctum::actingAs($this->admin, ['*']);

        [$user, $member] = $this->createUserInChoir($this->choirA, 'ghost');

        $date = Carbon::today()->addDays(31)->toDateString();
        $session = AttendanceSession::firstOrCreate(
            ['choir_id' => $this->choirA->id, 'performance_id' => $this->performanceA->id, 'session_date' => $this->performanceA->date],
            ['status' => 'open', 'created_by' => $this->admin->id]
        );

        AttendanceRecord::updateOrCreate(
            ['attendance_session_id' => $session->id, 'member_id' => $member->id],
            ['choir_id' => $this->choirA->id, 'status' => 'present', 'marked_by' => $this->admin->id]
        );

        $before = $this->postJson('/api/attendance/sessions/find-or-create', [
            'choir_id' => $this->choirA->id,
            'performance_id' => $this->performanceA->id,
        ]);
        $this->assertContains($member->id, $this->rosterIds($before));

        // Soft-delete the member (exactly what UserObserver does on user delete).
        $member->delete();

        $after = $this->postJson('/api/attendance/sessions/find-or-create', [
            'choir_id' => $this->choirA->id,
            'performance_id' => $this->performanceA->id,
        ]);
        $this->assertNotContains($member->id, $this->rosterIds($after));

        // Historical attendance record must remain untouched.
        $this->assertDatabaseHas('attendance_records', [
            'attendance_session_id' => $session->id,
            'member_id' => $member->id,
            'status' => 'present',
        ]);
    }

    /**
     * TEST C/D/E: Deleting a user removes them from new attendance (via the
     * UserObserver soft-deleting the linked Member) while history survives.
     */
    public function test_deleted_user_removed_from_roster_but_history_remains(): void
    {
        Permission::firstOrCreate(['name' => 'users.delete', 'guard_name' => 'api']);
        $this->admin->syncRoles(['admin']);
        $this->admin->givePermissionTo('users.delete');
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        $headers = $this->loginAs($this->admin);

        [$user, $member] = $this->createUserInChoir($this->choirA, 'doomed');

        $date = Carbon::today()->addDays(33)->toDateString();
        $session = AttendanceSession::firstOrCreate(
            ['choir_id' => $this->choirA->id, 'performance_id' => $this->performanceA->id, 'session_date' => $this->performanceA->date],
            ['status' => 'open', 'created_by' => $this->admin->id]
        );

        AttendanceRecord::updateOrCreate(
            ['attendance_session_id' => $session->id, 'member_id' => $member->id],
            ['choir_id' => $this->choirA->id, 'status' => 'late', 'marked_by' => $this->admin->id]
        );

        $before = $this->withHeaders($headers)->postJson('/api/attendance/sessions/find-or-create', [
            'choir_id' => $this->choirA->id,
            'performance_id' => $this->performanceA->id,
        ]);
        $this->assertContains($member->id, $this->rosterIds($before));

        // Delete the user account through the admin API.
        $deleted = $this->withHeaders($headers)->deleteJson("/api/admin/users/{$user->id}");
        $deleted->assertOk();

        $after = $this->withHeaders($headers)->postJson('/api/attendance/sessions/find-or-create', [
            'choir_id' => $this->choirA->id,
            'performance_id' => $this->performanceA->id,
        ]);
        $this->assertNotContains($member->id, $this->rosterIds($after));

        $this->assertDatabaseHas('attendance_records', [
            'attendance_session_id' => $session->id,
            'member_id' => $member->id,
            'status' => 'late',
        ]);
    }

    /**
     * TEST (2): A member removed from the choir no longer appears for new
     * attendance.
     */
    public function test_member_removed_from_choir_excluded_from_roster(): void
    {
        $headers = $this->loginAs($this->admin);

        [$user, $member] = $this->createUserInChoir($this->choirA, 'leave');

        $before = $this->withHeaders($headers)->postJson('/api/attendance/sessions/find-or-create', [
            'choir_id' => $this->choirA->id,
            'performance_id' => $this->performanceA->id,
        ]);
        $this->assertContains($member->id, $this->rosterIds($before));

        // Admin edits the user and removes the choir assignment.
        $this->withHeaders($headers)
            ->putJson("/api/admin/users/{$user->id}", ['choir_id' => null])
            ->assertOk();

        $this->assertDatabaseMissing('choir_user', ['user_id' => $user->id, 'choir_id' => $this->choirA->id]);
        $this->assertSame('inactive', Member::withTrashed()->find($member->id)?->status);

        $after = $this->withHeaders($headers)->postJson('/api/attendance/sessions/find-or-create', [
            'choir_id' => $this->choirA->id,
            'performance_id' => $this->performanceA->id,
        ]);
        $this->assertNotContains($member->id, $this->rosterIds($after));
    }

    /**
     * TEST B (admin flow): Creating a user through the admin Users API with a
     * choir assignment automatically creates the roster record and the new
     * member appears in attendance.
     */
    public function test_admin_created_user_with_choir_appears_in_attendance(): void
    {
        $headers = $this->loginAs($this->admin);

        $suffix = uniqid();
        $response = $this->withHeaders($headers)->postJson('/api/admin/users', [
            'name' => 'Fresh Member',
            'email' => 'fresh.' . $suffix . '@test.local',
            'phone' => '+2519' . random_int(10000000, 99999999),
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'member',
            'status' => 'approved',
            'choir_id' => $this->choirA->id,
        ]);

        $response->assertStatus(201);

        $userId = $response->json('data.id');
        $member = Member::where('user_id', $userId)
            ->where('choir_id', $this->choirA->id)
            ->whereNull('deleted_at')
            ->first();

        $this->assertNotNull($member, 'A roster record must be auto-created when a user is assigned to a choir.');

        $roster = $this->withHeaders($headers)->postJson('/api/attendance/sessions/find-or-create', [
            'choir_id' => $this->choirA->id,
            'performance_id' => $this->performanceA->id,
        ]);

        $this->assertContains($member->id, $this->rosterIds($roster));
    }

    public function test_rehearsal_attendance_is_event_linked_and_reused(): void
    {
        Sanctum::actingAs($this->admin, ['*']);

        $rehearsal = Rehearsal::create([
            'choir_id' => $this->choirA->id,
            'title' => 'Wednesday Sectional Rehearsal',
            'date' => Carbon::today()->toDateString(),
            'start_time' => '18:00:00',
            'end_time' => '20:00:00',
            'status' => 'scheduled',
            'created_by' => $this->admin->id,
        ]);

        $events = $this->getJson("/api/attendance/events?choir_id={$this->choirA->id}");
        $events->assertOk()->assertJsonFragment([
            'id' => $rehearsal->id,
            'type' => 'rehearsal',
            'title' => $rehearsal->title,
        ]);

        $first = $this->postJson('/api/attendance/sessions/find-or-create', [
            'choir_id' => $this->choirA->id,
            'rehearsal_id' => $rehearsal->id,
        ])->assertOk();

        $second = $this->postJson('/api/attendance/sessions/find-or-create', [
            'choir_id' => $this->choirA->id,
            'event_type' => 'rehearsal',
            'rehearsal_id' => $rehearsal->id,
        ])->assertOk();

        $this->assertSame($first->json('data.session.id'), $second->json('data.session.id'));
        $this->assertSame(1, AttendanceSession::where('rehearsal_id', $rehearsal->id)->count());
    }

    public function test_arbitrary_date_cannot_create_attendance_session(): void
    {
        Sanctum::actingAs($this->admin, ['*']);

        $this->postJson('/api/attendance/sessions/find-or-create', [
            'choir_id' => $this->choirA->id,
            'session_date' => Carbon::today()->addDay()->toDateString(),
        ])->assertStatus(422);
    }

    public function test_duplicate_member_attendance_updates_one_record(): void
    {
        Sanctum::actingAs($this->leaderA, ['*']);

        $session = AttendanceSession::create([
            'choir_id' => $this->choirA->id,
            'performance_id' => $this->performanceA->id,
            'event_type' => 'performance',
            'title' => $this->performanceA->title,
            'session_date' => $this->performanceA->date,
            'start_time' => $this->performanceA->start_time,
            'end_time' => $this->performanceA->end_time,
            'status' => 'open',
        ]);

        $payload = [
            'attendance_session_id' => $session->id,
            'member_id' => $this->memberRecordA->id,
            'status' => 'present',
        ];

        $this->postJson('/api/attendance/records/mark', $payload)->assertOk();
        $this->postJson('/api/attendance/records/mark', $payload)->assertOk();

        $this->assertSame(1, AttendanceRecord::where('attendance_session_id', $session->id)
            ->where('member_id', $this->memberRecordA->id)
            ->count());
    }
}
