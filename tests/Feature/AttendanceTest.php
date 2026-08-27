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

    /**
     * TEST 12: Admin can access all choirs.
     */
    public function test_admin_can_access_all_choirs(): void
    {
        Sanctum::actingAs($this->admin, ['*']);

        $eventsA = $this->getJson("/api/attendance/events?choir_id={$this->choirA->id}");
        $eventsA->assertStatus(200);

        $eventsB = $this->getJson("/api/attendance/events?choir_id={$this->choirB->id}");
        $eventsB->assertStatus(200);
    }
}
