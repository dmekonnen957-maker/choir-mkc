<?php

namespace Tests\Feature;

use App\Models\Choir;
use App\Models\Lyric;
use App\Models\Song;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SongLyricTest extends TestCase
{
    use RefreshDatabase;

    protected bool $seed = true;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'team_leader', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'member', 'guard_name' => 'api']);
    }

    private function auth(User $user): array
    {
        $login = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        return ['Authorization' => 'Bearer ' . $login->json('data.token')];
    }

    private function admin(): User
    {
        $user = User::create([
            'name' => 'Song Admin',
            'email' => 'song_admin_' . uniqid() . '@choirmkc.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
            'status' => 'approved',
            'approved_at' => now(),
            'email_verified_at' => now(),
        ]);
        $user->assignRole(Role::findByName('admin', 'api'));

        return $user;
    }

    private function member(): User
    {
        $user = User::create([
            'name' => 'Plain Member',
            'email' => 'member_' . uniqid() . '@choirmkc.com',
            'password' => bcrypt('password123'),
            'role' => 'member',
            'status' => 'approved',
            'approved_at' => now(),
            'email_verified_at' => now(),
        ]);
        $user->assignRole(Role::findByName('member', 'api'));

        return $user;
    }

    private function choir(string $name): Choir
    {
        return Choir::create([
            'name' => $name,
            'slug' => str_slug_unique($name),
            'status' => 'active',
        ]);
    }

    public function test_member_count_uses_users_pivot_not_members_table(): void
    {
        $choir = $this->choir('Count Choir');
        $user = $this->member();
        $choir->users()->attach($user->id, ['status' => 'active']);

        $res = $this->withHeaders($this->auth($this->admin()))
            ->getJson("/api/admin/choirs/{$choir->id}");

        $res->assertStatus(200);
        $this->assertEquals(1, $res->json('data.member_count'));
        $this->assertCount(1, $res->json('data.members'));
        $this->assertEquals($user->name, $res->json('data.members.0.name'));
    }

    public function test_dashboard_shows_song_and_lyric_counts(): void
    {
        $choir = $this->choir('Dash Choir');
        $admin = $this->admin();
        Song::create(['choir_id' => $choir->id, 'title' => 'Song One', 'created_by' => $admin->id]);
        Lyric::create([
            'choir_id' => $choir->id,
            'song_id' => Song::first()->id,
            'content' => 'la la',
            'created_by' => $admin->id,
        ]);

        $res = $this->withHeaders($this->auth($admin))->getJson('/api/admin/dashboard');

        $res->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, $res->json('data.counts.songs'));
        $this->assertGreaterThanOrEqual(1, $res->json('data.counts.lyrics'));
    }

    public function test_admin_can_create_song(): void
    {
        $choir = $this->choir('Song Choir');
        $admin = $this->admin();

        $res = $this->withHeaders($this->auth($admin))->postJson('/api/admin/songs', [
            'choir_id' => $choir->id,
            'title' => 'Great Are You Lord',
            'artist' => 'Passion',
        ]);

        $res->assertStatus(201);
        $this->assertDatabaseHas('songs', ['title' => 'Great Are You Lord', 'choir_id' => $choir->id]);
        $this->assertEquals($admin->id, $res->json('data.created_by'));
    }

    public function test_admin_can_edit_song(): void
    {
        $choir = $this->choir('Edit Choir');
        $admin = $this->admin();
        $song = Song::create(['choir_id' => $choir->id, 'title' => 'Old Title', 'created_by' => $admin->id]);

        $res = $this->withHeaders($this->auth($admin))->putJson("/api/admin/songs/{$song->id}", [
            'choir_id' => $choir->id,
            'title' => 'New Title',
        ]);

        $res->assertStatus(200);
        $this->assertDatabaseHas('songs', ['id' => $song->id, 'title' => 'New Title']);
    }

    public function test_admin_can_upload_mp3_and_stream_it_then_delete_removes_file(): void
    {
        Storage::fake('public');
        $choir = $this->choir('Audio Choir');
        $admin = $this->admin();

        $create = $this->withHeaders($this->auth($admin))->postJson('/api/admin/songs', [
            'choir_id' => $choir->id,
            'title' => 'With Audio',
            'audio' => UploadedFile::fake()->create('track.mp3', 200, 'audio/mpeg'),
        ]);
        $create->assertStatus(201);
        $path = $create->json('data.audio_path');
        $this->assertNotNull($path);
        Storage::disk('public')->assertExists($path);

        $stream = $this->withHeaders($this->auth($admin))
            ->get("/api/admin/songs/{$create->json('data.id')}/audio");
        $stream->assertStatus(200);
        $stream->assertHeader('Content-Type', 'audio/mpeg');

        $this->withHeaders($this->auth($admin))->deleteJson("/api/admin/songs/{$create->json('data.id')}");
        Storage::disk('public')->assertMissing($path);
        $this->assertSoftDeleted('songs', ['id' => $create->json('data.id')]);
    }

    public function test_admin_can_create_and_edit_and_delete_lyrics_without_deleting_song(): void
    {
        $choir = $this->choir('Lyric Choir');
        $admin = $this->admin();
        $song = Song::create(['choir_id' => $choir->id, 'title' => 'Lyric Song', 'created_by' => $admin->id]);

        $create = $this->withHeaders($this->auth($admin))->postJson('/api/admin/lyrics', [
            'choir_id' => $choir->id,
            'song_id' => $song->id,
            'language' => 'Amharic',
            'version_label' => 'Verse 1',
            'content' => 'Praise the Lord',
        ]);
        $create->assertStatus(201);

        $lyricId = $create->json('data.id');
        $edit = $this->withHeaders($this->auth($admin))->putJson("/api/admin/lyrics/{$lyricId}", [
            'choir_id' => $choir->id,
            'song_id' => $song->id,
            'language' => 'Amharic',
            'content' => 'Praise the Lord forever',
        ]);
        $edit->assertStatus(200);
        $this->assertDatabaseHas('lyrics', ['id' => $lyricId, 'content' => 'Praise the Lord forever']);

        $this->withHeaders($this->auth($admin))->deleteJson("/api/admin/lyrics/{$lyricId}")->assertStatus(200);
        $this->assertDatabaseMissing('lyrics', ['id' => $lyricId]);
        $this->assertDatabaseHas('songs', ['id' => $song->id]);
    }

    public function test_lyric_cannot_belong_to_song_from_another_choir(): void
    {
        $choirA = $this->choir('Choir A');
        $choirB = $this->choir('Choir B');
        $admin = $this->admin();
        $song = Song::create(['choir_id' => $choirA->id, 'title' => 'A Song', 'created_by' => $admin->id]);

        $res = $this->withHeaders($this->auth($admin))->postJson('/api/admin/lyrics', [
            'choir_id' => $choirB->id,
            'song_id' => $song->id,
            'content' => 'cross choir',
        ]);

        $res->assertStatus(422);
        $this->assertDatabaseMissing('lyrics', ['content' => 'cross choir']);
    }

    public function test_non_admin_cannot_create_song(): void
    {
        $choir = $this->choir('Blocked Choir');
        $res = $this->withHeaders($this->auth($this->member()))->postJson('/api/admin/songs', [
            'choir_id' => $choir->id,
            'title' => 'Nope',
        ]);

        $res->assertStatus(403);
    }
}

if (!function_exists('Tests\Feature\str_slug_unique')) {
    function str_slug_unique(string $name): string
    {
        $base = \Illuminate\Support\Str::slug($name) ?: 'choir';
        $unique = $base;
        $i = 1;
        while (\App\Models\Choir::where('slug', $unique)->exists()) {
            $unique = $base . '-' . $i++;
        }
        return $unique;
    }
}
