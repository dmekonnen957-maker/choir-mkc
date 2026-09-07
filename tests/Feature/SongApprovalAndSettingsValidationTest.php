<?php

namespace Tests\Feature;

use App\Models\Choir;
use App\Models\Notification;
use App\Models\Song;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class SongApprovalAndSettingsValidationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'team_leader', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'member', 'guard_name' => 'api']);
    }

    private function authHeader(User $user): array
    {
        $login = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        return ['Authorization' => 'Bearer ' . $login->json('data.token')];
    }

    private function makeUser(string $roleName, string $prefix = 'user'): User
    {
        $roleModel = Role::findByName($roleName, 'api');

        $user = User::create([
            'name' => ucfirst($prefix) . ' User',
            'email' => $prefix . '_' . uniqid() . '@ykamkc.org',
            'password' => bcrypt('password123'),
            'role' => $roleName,
            'status' => 'approved',
            'approved_at' => now(),
            'email_verified_at' => now(),
        ]);

        $user->assignRole($roleModel);
        return $user;
    }

    public function test_ethiopian_phone_validation_in_admin_settings()
    {
        $admin = $this->makeUser('admin', 'admin');
        $headers = $this->authHeader($admin);

        // Test invalid phone: starts with 08
        $response = $this->withHeaders($headers)->putJson('/api/admin/settings', [
            'settings' => [
                'contact_phone' => '0812345678',
            ],
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['settings.contact_phone']);

        // Test invalid phone: not 10 digits
        $response = $this->withHeaders($headers)->putJson('/api/admin/settings', [
            'settings' => [
                'contact_phone' => '09123456',
            ],
        ]);
        $response->assertStatus(422);

        // Test valid Ethiopian phone starting with 09
        $response = $this->withHeaders($headers)->putJson('/api/admin/settings', [
            'settings' => [
                'contact_phone' => '0911223344',
            ],
        ]);
        $response->assertStatus(200);

        // Test valid Ethiopian phone starting with 07
        $response = $this->withHeaders($headers)->putJson('/api/admin/settings', [
            'settings' => [
                'contact_phone' => '0711223344',
            ],
        ]);
        $response->assertStatus(200);
    }

    public function test_choir_member_submits_song_flow_and_admin_approval()
    {
        $admin = $this->makeUser('admin', 'admin');
        $adminHeaders = $this->authHeader($admin);

        $choir = Choir::create(['name' => 'Bethel Choir', 'slug' => 'bethel-choir']);

        $member = $this->makeUser('member', 'member');
        $member->choirs()->attach($choir->id, ['status' => 'active']);
        $memberHeaders = $this->authHeader($member);

        Notification::query()->delete();

        // 1. Choir Member submits a song
        $submitRes = $this->withHeaders($memberHeaders)->postJson('/api/member/songs', [
            'choir_id' => $choir->id,
            'title' => 'Egzio Maharene',
            'composer' => 'Traditional',
            'artist' => 'Bethel Choir',
            'original_key' => 'C',
            'scale' => 'ethiopian',
            'lyrics' => 'Egzio Maharene Kiristos',
            'description' => 'Fast tempo liturgical hymn',
        ]);

        $submitRes->assertStatus(201);
        $songId = $submitRes->json('data.id');

        // 2. Song is saved with status = pending, is_published = false, created_by = member
        $song = Song::findOrFail($songId);
        $this->assertEquals('pending', $song->status);
        $this->assertFalse((bool) $song->is_published);
        $this->assertEquals($member->id, $song->created_by);

        // 3. Admin receives notification for new submission
        $this->assertDatabaseHas('notifications', [
            'type' => 'song_submitted',
            'notifiable_id' => $admin->id,
        ]);

        // 4. Pending song does NOT appear on public songs page
        $publicRes = $this->getJson('/api/public/songs');
        $publicRes->assertStatus(200);
        $publicItems = collect($publicRes->json('data.items'));
        $this->assertFalse($publicItems->contains('id', $songId));

        // 5. Admin reviews and approves the song
        $adminHeaders = $this->authHeader($admin);
        $dashRes = $this->withHeaders($adminHeaders)->getJson('/api/admin/dashboard');
        $this->assertEquals(200, $dashRes->status(), 'Dashboard failed: ' . $dashRes->getContent());

        $approveRes = $this->withHeaders($adminHeaders)->postJson("/api/admin/songs/{$songId}/approve");
        $this->assertEquals(200, $approveRes->status(), 'Approve failed: ' . $approveRes->getContent());

        $song->refresh();
        $this->assertEquals('approved', $song->status);
        $this->assertTrue((bool) $song->is_published);
        $this->assertEquals($admin->id, $song->approved_by);
        $this->assertNotNull($song->approved_at);

        // 6. Submitting member receives approval notification
        $this->assertDatabaseHas('notifications', [
            'type' => 'song_approved',
            'notifiable_id' => $member->id,
        ]);

        // 7. Approved song now appears publicly
        $publicAfter = $this->getJson('/api/public/songs');
        $publicAfter->assertStatus(200);
        $publicAfterItems = collect($publicAfter->json('data.items'));
        $this->assertTrue($publicAfterItems->contains('id', $songId));
    }

    public function test_choir_leader_submits_song_flow_and_admin_rejection()
    {
        $admin = $this->makeUser('admin', 'admin2');
        $adminHeaders = $this->authHeader($admin);

        $choir = Choir::create(['name' => 'Youth Choir', 'slug' => 'youth-choir']);

        $leader = $this->makeUser('team_leader', 'leader');
        $leader->choirs()->attach($choir->id, ['status' => 'active', 'is_primary_leader' => true]);
        $leaderHeaders = $this->authHeader($leader);

        Notification::query()->delete();

        // 1. Choir Leader submits song through /api/team-leader/songs
        $submitRes = $this->withHeaders($leaderHeaders)->postJson('/api/team-leader/songs', [
            'choir_id' => $choir->id,
            'title' => 'Worship Hymn Incomplete',
            'original_key' => 'D',
            'scale' => 'minor',
            'lyrics' => 'Short rough draft',
        ]);

        $submitRes->assertStatus(201);
        $songId = $submitRes->json('data.id');

        $song = Song::findOrFail($songId);
        $this->assertEquals('pending', $song->status);
        $this->assertFalse((bool) $song->is_published);
        $this->assertEquals($leader->id, $song->created_by);

        // 2. Admin rejects song with feedback
        $adminHeaders = $this->authHeader($admin);
        $rejectRes = $this->withHeaders($adminHeaders)->postJson("/api/admin/songs/{$songId}/reject", [
            'rejection_reason' => 'Please provide complete lyrics including choir parts.',
        ]);
        $rejectRes->assertStatus(200);

        $song->refresh();
        $this->assertEquals('rejected', $song->status);
        $this->assertFalse((bool) $song->is_published);
        $this->assertEquals('Please provide complete lyrics including choir parts.', $song->rejection_reason);

        // 3. Submitting leader receives rejection notification with reason
        $this->assertDatabaseHas('notifications', [
            'type' => 'song_rejected',
            'notifiable_id' => $leader->id,
        ]);

        // 4. Rejected song does NOT appear on public songs page
        $publicRes = $this->getJson('/api/public/songs');
        $publicItems = collect($publicRes->json('data.items'));
        $this->assertFalse($publicItems->contains('id', $songId));
    }

    public function test_member_and_leader_cannot_approve_songs()
    {
        $choir = Choir::create(['name' => 'General Choir', 'slug' => 'gen-choir']);

        $leader = $this->makeUser('team_leader', 'leader_cannot_approve');
        $leader->choirs()->attach($choir->id, ['status' => 'active']);
        $leaderHeaders = $this->authHeader($leader);

        $member = $this->makeUser('member', 'member_cannot_approve');
        $member->choirs()->attach($choir->id, ['status' => 'active']);
        $memberHeaders = $this->authHeader($member);

        $song = Song::create([
            'choir_id' => $choir->id,
            'title' => 'Self Submission',
            'original_key' => 'C',
            'scale' => 'major',
            'status' => 'pending',
            'is_published' => false,
            'created_by' => $leader->id,
        ]);

        // Leader attempts to approve song -> 403 Forbidden
        $leaderApprove = $this->withHeaders($leaderHeaders)->postJson("/api/admin/songs/{$song->id}/approve");
        $leaderApprove->assertStatus(403);

        // Member attempts to approve song -> 403 Forbidden
        $memberApprove = $this->withHeaders($memberHeaders)->postJson("/api/admin/songs/{$song->id}/approve");
        $memberApprove->assertStatus(403);
    }

    public function test_song_submission_auto_assigns_active_choir_if_not_explicitly_passed()
    {
        $choir = Choir::create(['name' => 'Auto Assigned Choir', 'slug' => 'auto-choir']);

        $member = $this->makeUser('member', 'auto_member');
        $member->choirs()->attach($choir->id, ['status' => 'active']);
        $memberHeaders = $this->authHeader($member);

        // Submit WITHOUT passing choir_id
        $res = $this->withHeaders($memberHeaders)->postJson('/api/member/songs', [
            'title' => 'Song Without Explicit Choir Id',
            'original_key' => 'E',
            'scale' => 'major',
            'lyrics' => 'Praise the Lord',
        ]);

        $res->assertStatus(201);
        $songId = $res->json('data.id');

        $song = Song::findOrFail($songId);
        $this->assertEquals($choir->id, $song->choir_id);
        $this->assertEquals('pending', $song->status);
    }
}
