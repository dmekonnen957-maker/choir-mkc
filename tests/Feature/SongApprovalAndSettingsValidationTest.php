<?php

namespace Tests\Feature;

use App\Models\Choir;
use App\Models\Notification;
use App\Models\Song;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SongApprovalAndSettingsValidationTest extends TestCase
{
    private function authHeader(User $user): array
    {
        $login = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        return ['Authorization' => 'Bearer ' . $login->json('data.token')];
    }

    public function test_ethiopian_phone_validation_in_admin_settings()
    {
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        $admin = User::firstOrCreate(
            ['email' => 'admin_test_settings@ykamkc.org'],
            [
                'name' => 'Admin User',
                'role' => 'admin',
                'password' => bcrypt('password123'),
                'status' => 'approved',
                'email_verified_at' => now(),
            ]
        );
        $admin->syncRoles(['admin']);
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

    public function test_member_submits_song_has_pending_status_and_notifies_admin()
    {
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        $admin = User::firstOrCreate(
            ['email' => 'admin_test_approval@ykamkc.org'],
            [
                'name' => 'Admin User 2',
                'role' => 'admin',
                'password' => bcrypt('password123'),
                'status' => 'approved',
                'email_verified_at' => now(),
            ]
        );
        $admin->syncRoles(['admin']);
        $adminHeaders = $this->authHeader($admin);

        $choir = Choir::first();
        if (!$choir) {
            $choir = Choir::create(['name' => 'Test Choir', 'slug' => 'test-choir']);
        }
        
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'member', 'guard_name' => 'api']);
        $member = User::firstOrCreate(
            ['email' => 'member_test_approval@ykamkc.org'],
            [
                'name' => 'Member User',
                'role' => 'member',
                'password' => bcrypt('password123'),
                'status' => 'approved',
                'email_verified_at' => now(),
            ]
        );
        $member->syncRoles(['member']);
        $member->choirs()->syncWithoutDetaching([$choir->id => ['status' => 'active']]);
        $memberHeaders = $this->authHeader($member);

        Notification::query()->delete();

        // Submit song as member
        $response = $this->withHeaders($memberHeaders)->postJson('/api/member/songs', [
            'choir_id' => $choir->id,
            'title' => 'Worship Song from Member',
            'composer' => 'Test Composer',
            'artist' => 'Test Artist',
            'original_key' => 'C',
            'scale' => 'major',
            'lyrics' => 'Praise the Lord with song',
        ]);

        $response->assertStatus(201);
        $songId = $response->json('data.id');

        // Verify song is pending and NOT published
        $song = Song::findOrFail($songId);
        $this->assertEquals('pending', $song->status);
        $this->assertFalse((bool) $song->is_published);
        $this->assertEquals($member->id, $song->created_by);

        // Verify Admin received notification
        $this->assertDatabaseHas('notifications', [
            'type' => 'song_submitted',
            'notifiable_id' => $admin->id,
        ]);

        // Verify it is NOT visible on the public songs endpoint
        $publicRes = $this->getJson('/api/public/songs');
        $publicRes->assertStatus(200);
        $items = collect($publicRes->json('data.items'));
        $this->assertFalse($items->contains('id', $songId));

        // Admin approves the song
        $approveRes = $this->withHeaders($adminHeaders)->postJson("/api/admin/songs/{$songId}/approve");
        if ($approveRes->status() !== 200) {
            echo "\nAPPROVE ERROR: " . $approveRes->status() . " - " . $approveRes->getContent() . "\n";
        }
        $approveRes->assertStatus(200);

        $song->refresh();
        $this->assertEquals('approved', $song->status);
        $this->assertTrue((bool) $song->is_published);
        $this->assertEquals($admin->id, $song->approved_by);

        // Verify now visible on public songs endpoint
        $publicResAfter = $this->getJson('/api/public/songs');
        $publicResAfter->assertStatus(200);
        $itemsAfter = collect($publicResAfter->json('data.items'));
        $this->assertTrue($itemsAfter->contains('id', $songId));

        // Member submits another song to test rejection
        $response2 = $this->withHeaders($memberHeaders)->postJson('/api/member/songs', [
            'choir_id' => $choir->id,
            'title' => 'Song to Reject',
            'original_key' => 'D',
            'scale' => 'minor',
        ]);
        $rejectSongId = $response2->json('data.id');

        // Admin rejects the song
        $rejectRes = $this->withHeaders($adminHeaders)->postJson("/api/admin/songs/{$rejectSongId}/reject", [
            'rejection_reason' => 'Lyrics are incomplete and missing choral parts.',
        ]);
        $rejectRes->assertStatus(200);

        $rejectedSong = Song::findOrFail($rejectSongId);
        $this->assertEquals('rejected', $rejectedSong->status);
        $this->assertFalse((bool) $rejectedSong->is_published);
        $this->assertEquals('Lyrics are incomplete and missing choral parts.', $rejectedSong->rejection_reason);

        // Verify member received rejection notification
        $this->assertDatabaseHas('notifications', [
            'type' => 'song_rejected',
            'notifiable_id' => $member->id,
        ]);
    }
}
