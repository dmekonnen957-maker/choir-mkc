<?php

namespace Tests\Feature;

use App\Models\Choir;
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

    public function test_dashboard_shows_song_count(): void
    {
        $choir = $this->choir('Dash Choir');
        $admin = $this->admin();
        Song::create(['choir_id' => $choir->id, 'title' => 'Song One', 'created_by' => $admin->id]);

        $res = $this->withHeaders($this->auth($admin))->getJson('/api/admin/dashboard');

        $res->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, $res->json('data.counts.songs'));
    }

    public function test_admin_can_create_song(): void
    {
        $choir = $this->choir('Song Choir');
        $admin = $this->admin();

        $res = $this->withHeaders($this->auth($admin))->postJson('/api/admin/songs', [
            'choir_id' => $choir->id,
            'title' => 'Great Are You Lord',
            'artist' => 'Passion',
            'original_key' => 'G',
            'scale' => 'major',
        ]);

        $res->assertStatus(201);
        $this->assertDatabaseHas('songs', ['title' => 'Great Are You Lord', 'choir_id' => $choir->id]);
        $this->assertEquals($admin->id, $res->json('data.created_by'));
    }

    public function test_song_requires_valid_key_and_scale(): void
    {
        $choir = $this->choir('Validate Choir');
        $admin = $this->admin();

        $bad = $this->withHeaders($this->auth($admin))->postJson('/api/admin/songs', [
            'choir_id' => $choir->id,
            'title' => 'Bad',
            'original_key' => 'H',
            'scale' => 'dorian',
        ]);
        $bad->assertStatus(422);

        $good = $this->withHeaders($this->auth($admin))->postJson('/api/admin/songs', [
            'choir_id' => $choir->id,
            'title' => 'Good',
            'original_key' => 'C',
            'scale' => 'major',
        ]);
        $good->assertStatus(201);
    }

    public function test_admin_can_create_song_with_lyrics_key_scale_and_mp3_as_one_record(): void
    {
        Storage::fake('public');
        $choir = $this->choir('Unified Choir');
        $admin = $this->admin();

        $res = $this->withHeaders($this->auth($admin))->postJson('/api/admin/songs', [
            'choir_id' => $choir->id,
            'title' => 'Amazing Grace',
            'artist' => 'Traditional',
            'original_key' => 'C',
            'scale' => 'major',
            'lyrics' => "[C]Amazing grace how [F]sweet the sound\nThat saved a wretch like me",
            'is_published' => true,
            'audio' => UploadedFile::fake()->create('track.mp3', 200, 'audio/mpeg'),
        ]);

        $res->assertStatus(201);
        $id = $res->json('data.id');

        // Exactly one song record, no separate legacy lyric records.
        $this->assertDatabaseCount('songs', 1);
        $this->assertDatabaseHas('songs', [
            'id' => $id,
            'title' => 'Amazing Grace',
            'original_key' => 'C',
            'scale' => 'major',
            'lyrics' => "[C]Amazing grace how [F]sweet the sound\nThat saved a wretch like me",
            'is_published' => true,
        ]);
        $this->assertNotNull($res->json('data.audio_path'));
        Storage::disk('public')->assertExists($res->json('data.audio_path'));
        $this->assertTrue($res->json('data.has_lyrics'));
    }

    public function test_song_show_returns_key_scale_lyrics_and_original(): void
    {
        $choir = $this->choir('Show Choir');
        $admin = $this->admin();
        $song = Song::create([
            'choir_id' => $choir->id,
            'title' => 'Show Song',
            'original_key' => 'D',
            'scale' => 'minor',
            'lyrics' => '[D]Hello [G]world',
            'created_by' => $admin->id,
        ]);

        $res = $this->withHeaders($this->auth($admin))->getJson("/api/admin/songs/{$song->id}");

        $res->assertStatus(200);
        $this->assertEquals('D', $res->json('data.original_key'));
        $this->assertEquals('D', $res->json('data.key'));
        $this->assertEquals('minor', $res->json('data.scale'));
        $this->assertEquals('[D]Hello [G]world', $res->json('data.lyrics'));
        $this->assertEquals('[D]Hello [G]world', $res->json('data.display_lyrics'));
    }

    public function test_transpose_api_returns_transposed_key_and_lyrics(): void
    {
        $choir = $this->choir('Transpose Choir');
        $admin = $this->admin();
        $song = Song::create([
            'choir_id' => $choir->id,
            'title' => 'Transpose Song',
            'original_key' => 'C',
            'scale' => 'major',
            'lyrics' => '[C]Amazing [F]grace',
            'created_by' => $admin->id,
        ]);

        $up = $this->withHeaders($this->auth($admin))
            ->getJson("/api/admin/songs/{$song->id}?transpose=1");
        $up->assertStatus(200);
        $this->assertEquals('C#', $up->json('data.key'));
        $this->assertEquals('[C#]Amazing [F#]grace', $up->json('data.display_lyrics'));

        $down = $this->withHeaders($this->auth($admin))
            ->getJson("/api/admin/songs/{$song->id}?transpose=-2");
        $down->assertStatus(200);
        $this->assertEquals('A#', $down->json('data.key'));
        $this->assertEquals('[A#]Amazing [D#]grace', $down->json('data.display_lyrics'));

        $zero = $this->withHeaders($this->auth($admin))
            ->getJson("/api/admin/songs/{$song->id}?transpose=0");
        $zero->assertStatus(200);
        $this->assertEquals('C', $zero->json('data.key'));
        $this->assertEquals('[C]Amazing [F]grace', $zero->json('data.display_lyrics'));
    }

    public function test_admin_can_edit_song_lyrics_key_and_scale(): void
    {
        $choir = $this->choir('Edit Choir');
        $admin = $this->admin();
        $song = Song::create([
            'choir_id' => $choir->id,
            'title' => 'Old Title',
            'original_key' => 'C',
            'scale' => 'major',
            'created_by' => $admin->id,
        ]);

        $res = $this->withHeaders($this->auth($admin))->putJson("/api/admin/songs/{$song->id}", [
            'choir_id' => $choir->id,
            'title' => 'New Title',
            'original_key' => 'E',
            'scale' => 'minor',
            'lyrics' => '[E]New lyric',
        ]);

        $res->assertStatus(200);
        $this->assertDatabaseHas('songs', [
            'id' => $song->id,
            'title' => 'New Title',
            'original_key' => 'E',
            'scale' => 'minor',
            'lyrics' => '[E]New lyric',
        ]);
    }

    public function test_admin_can_upload_mp3_and_stream_it_then_delete_removes_file(): void
    {
        Storage::fake('public');
        $choir = $this->choir('Audio Choir');
        $admin = $this->admin();

        $create = $this->withHeaders($this->auth($admin))->postJson('/api/admin/songs', [
            'choir_id' => $choir->id,
            'title' => 'With Audio',
            'original_key' => 'C',
            'scale' => 'major',
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

    public function test_delete_song_removes_audio_but_keeps_choir(): void
    {
        Storage::fake('public');
        $choir = $this->choir('Keep Choir');
        $admin = $this->admin();
        $song = Song::create([
            'choir_id' => $choir->id,
            'title' => 'To Delete',
            'original_key' => 'G',
            'scale' => 'major',
            'audio_path' => 'songs/to-delete.mp3',
            'created_by' => $admin->id,
        ]);
        Storage::disk('public')->put($song->audio_path, 'audio-bytes');

        $this->withHeaders($this->auth($admin))->deleteJson("/api/admin/songs/{$song->id}");

        Storage::disk('public')->assertMissing($song->audio_path);
        $this->assertSoftDeleted('songs', ['id' => $song->id]);
        $this->assertDatabaseHas('choirs', ['id' => $choir->id]);
    }

    public function test_public_song_view_exposes_data_without_admin_controls(): void
    {
        $choir = $this->choir('Public Choir');
        $song = Song::create([
            'choir_id' => $choir->id,
            'title' => 'Public Song',
            'original_key' => 'A',
            'scale' => 'minor',
            'lyrics' => '[A]Public',
            'is_published' => true,
        ]);

        $res = $this->getJson("/api/public/choirs/{$choir->id}/songs/{$song->id}");
        $res->assertStatus(200);
        $this->assertEquals('Public Song', $res->json('data.title'));
        $this->assertEquals('A', $res->json('data.key'));
        $this->assertEquals('[A]Public', $res->json('data.display_lyrics'));

        // Unpublished songs are not publicly accessible.
        $hidden = Song::create([
            'choir_id' => $choir->id,
            'title' => 'Hidden Song',
            'is_published' => false,
        ]);
        $this->getJson("/api/public/choirs/{$choir->id}/songs/{$hidden->id}")->assertStatus(404);
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
