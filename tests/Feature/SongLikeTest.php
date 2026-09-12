<?php

namespace Tests\Feature;

use App\Models\Choir;
use App\Models\Song;
use App\Models\SongLike;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SongLikeTest extends TestCase
{
    use RefreshDatabase;

    protected bool $seed = true;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'member', 'guard_name' => 'api']);
    }

    private function createSong(array $attrs = []): Song
    {
        $choir = Choir::first() ?? Choir::factory()->create();

        return Song::create(array_merge([
            'choir_id' => $choir->id,
            'title' => 'Test Ethiopian Worship Song',
            'composer' => 'Test Composer',
            'artist' => 'Test Choir',
            'original_key' => 'C',
            'scale' => 'Tizita Major',
            'lyrics' => 'Sample lyrics content',
            'is_published' => true,
            'status' => 'approved',
        ], $attrs));
    }

    private function createMember(): User
    {
        $user = User::factory()->create([
            'status' => User::STATUS_APPROVED,
            'role' => 'member',
        ]);
        $user->assignRole('member');

        return $user;
    }

    private function createAdmin(): User
    {
        $user = User::factory()->create([
            'status' => User::STATUS_APPROVED,
            'role' => 'admin',
        ]);
        $user->assignRole('admin');

        return $user;
    }

    public function test_public_user_can_view_song_likes_count_and_unliked_state(): void
    {
        $song = $this->createSong();

        $response = $this->getJson("/api/public/songs/{$song->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.likes_count', 0)
            ->assertJsonPath('data.is_liked', false);
    }

    public function test_unauthenticated_user_cannot_like_song(): void
    {
        $song = $this->createSong();

        $response = $this->postJson("/api/songs/{$song->id}/like");

        $response->assertStatus(401);
    }

    public function test_authenticated_member_can_like_and_unlike_song(): void
    {
        $member = $this->createMember();
        $song = $this->createSong();

        Sanctum::actingAs($member, ['*']);

        // 1. Like the song
        $likeRes = $this->postJson("/api/songs/{$song->id}/like");
        $likeRes->assertStatus(200)
            ->assertJsonPath('data.likes_count', 1)
            ->assertJsonPath('data.is_liked', true);

        $this->assertDatabaseHas('song_likes', [
            'song_id' => $song->id,
            'user_id' => $member->id,
        ]);

        // 2. Liking again is idempotent and doesn't duplicate
        $dupRes = $this->postJson("/api/songs/{$song->id}/like");
        $dupRes->assertStatus(200)
            ->assertJsonPath('data.likes_count', 1)
            ->assertJsonPath('data.is_liked', true);
        $this->assertEquals(1, SongLike::where('song_id', $song->id)->where('user_id', $member->id)->count());

        // 3. Unlike the song
        $unlikeRes = $this->deleteJson("/api/songs/{$song->id}/like");
        $unlikeRes->assertStatus(200)
            ->assertJsonPath('data.likes_count', 0)
            ->assertJsonPath('data.is_liked', false);

        $this->assertDatabaseMissing('song_likes', [
            'song_id' => $song->id,
            'user_id' => $member->id,
        ]);
    }

    public function test_member_can_fetch_their_liked_songs(): void
    {
        $member = $this->createMember();
        $song1 = $this->createSong(['title' => 'Liked Song 1']);
        $song2 = $this->createSong(['title' => 'Unliked Song 2']);

        SongLike::create(['song_id' => $song1->id, 'user_id' => $member->id]);

        Sanctum::actingAs($member, ['*']);

        $response = $this->getJson('/api/member/liked-songs');

        $response->assertStatus(200);
        $items = $response->json('data.items');
        $this->assertCount(1, $items);
        $this->assertEquals($song1->id, $items[0]['id']);
        $this->assertEquals(1, $items[0]['likes_count']);
        $this->assertTrue($items[0]['is_liked']);
    }

    public function test_public_songs_list_can_sort_by_most_liked(): void
    {
        $user1 = $this->createMember();
        $user2 = $this->createMember();

        $songLow = $this->createSong(['title' => 'Less Liked Song']);
        $songHigh = $this->createSong(['title' => 'Most Liked Song']);

        SongLike::create(['song_id' => $songHigh->id, 'user_id' => $user1->id]);
        SongLike::create(['song_id' => $songHigh->id, 'user_id' => $user2->id]);
        SongLike::create(['song_id' => $songLow->id, 'user_id' => $user1->id]);

        $response = $this->getJson('/api/public/songs?sort=most_liked');

        $response->assertStatus(200);
        $items = $response->json('data.items');
        $this->assertGreaterThanOrEqual(2, count($items));
        $this->assertEquals($songHigh->id, $items[0]['id']);
        $this->assertEquals(2, $items[0]['likes_count']);
    }

    public function test_admin_can_view_song_statistics(): void
    {
        $admin = $this->createAdmin();
        $member = $this->createMember();
        $song = $this->createSong(['title' => 'Top Anthem']);

        SongLike::create(['song_id' => $song->id, 'user_id' => $member->id]);

        Sanctum::actingAs($admin, ['*']);

        $response = $this->getJson('/api/admin/songs-stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'total_songs',
                    'total_likes',
                    'most_liked_song',
                    'avg_likes_per_song',
                ],
            ]);

        $this->assertGreaterThanOrEqual(1, $response->json('data.total_likes'));
    }
}
