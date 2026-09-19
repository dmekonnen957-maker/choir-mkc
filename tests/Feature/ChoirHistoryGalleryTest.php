<?php

namespace Tests\Feature;

use App\Models\Choir;
use App\Models\GalleryItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ChoirHistoryGalleryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'member', 'guard_name' => 'api']);
    }

    private function makeUser(string $roleName, string $prefix = 'user'): User
    {
        $roleModel = Role::findByName($roleName, 'api');

        $user = User::create([
            'name' => ucfirst($prefix).' User',
            'email' => $prefix.'_'.uniqid().'@ykamkc.org',
            'password' => bcrypt('password123'),
            'role' => $roleName,
            'status' => 'approved',
            'approved_at' => now(),
            'email_verified_at' => now(),
        ]);

        $user->assignRole($roleModel);

        return $user;
    }

    private function authHeader(User $user): array
    {
        $login = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        return ['Authorization' => 'Bearer '.$login->json('data.token')];
    }

    private function createHistoryItems(Choir $choir, int $count): void
    {
        for ($i = 1; $i <= $count; $i++) {
            $choir->galleryItems()->create([
                'title' => "Memory {$i}",
                'description' => null,
                'media_path' => "choir-history/{$choir->id}/fake-{$i}.jpg",
                'media_type' => 'image',
                'event_date' => now()->subDays($count - $i)->format('Y-m-d'),
                'is_public' => false,
                'is_history' => true,
                'uploaded_by' => null,
            ]);
        }
    }

    public function test_show_paginates_photos_and_returns_relative_file_urls(): void
    {
        $admin = $this->makeUser('admin', 'admin');
        Storage::fake('local');

        $choir = Choir::create(['name' => 'Archive Choir', 'slug' => 'archive-choir']);

        $member = $this->makeUser('member', 'member');
        $member->choirs()->attach($choir->id, ['status' => 'active']);

        $this->createHistoryItems($choir, 120);

        $response = $this->withHeaders($this->authHeader($member))->getJson('/api/member/choir-history');

        $response->assertStatus(200);
        $response->assertJsonPath('data.photos.pagination.total', 120);
        $response->assertJsonPath('data.photos.pagination.per_page', 50);
        $response->assertJsonPath('data.photos.pagination.current_page', 1);
        $response->assertJsonPath('data.photos.pagination.last_page', 3);

        $items = $response->json('data.photos.items');
        $this->assertCount(50, $items);
        $this->assertStringStartsWith('/member/choir-history/photos/', $items[0]['url']);
        $this->assertStringNotContainsString('/api/', $items[0]['url']);
        $this->assertStringStartsWith('/member/choir-history/photos/', $items[0]['thumb_url']);
        $this->assertStringNotContainsString('/api/', $items[0]['thumb_url']);
    }

    public function test_photos_endpoint_paginates_large_datasets(): void
    {
        $admin = $this->makeUser('admin', 'admin');
        Storage::fake('local');

        $choir = Choir::create(['name' => 'Big Archive', 'slug' => 'big-archive']);

        $member = $this->makeUser('member', 'member');
        $member->choirs()->attach($choir->id, ['status' => 'active']);

        $this->createHistoryItems($choir, 1000);

        $headers = $this->authHeader($member);

        $page1 = $this->withHeaders($headers)->getJson('/api/member/choir-history/photos?page=1&per_page=50');
        $page1->assertStatus(200);
        $page1->assertJsonPath('data.pagination.total', 1000);
        $page1->assertJsonPath('data.pagination.current_page', 1);
        $page1->assertJsonPath('data.pagination.last_page', 20);
        $this->assertCount(50, $page1->json('data.items'));

        $page20 = $this->withHeaders($headers)->getJson('/api/member/choir-history/photos?page=20&per_page=50');
        $page20->assertStatus(200);
        $page20->assertJsonPath('data.pagination.current_page', 20);
        $this->assertCount(50, $page20->json('data.items'));

        $id1 = $page1->json('data.items.0.id');
        $ids = collect(array_merge($page1->json('data.items'), $page20->json('data.items')))
            ->pluck('id')->unique();
        $this->assertTrue($ids->contains($id1));

        // per_page is honored
        $small = $this->withHeaders($headers)->getJson('/api/member/choir-history/photos?page=1&per_page=30');
        $small->assertStatus(200);
        $this->assertCount(30, $small->json('data.items'));
        $this->assertEquals(30, $small->json('data.pagination.per_page'));
    }

    public function test_user_can_upload_unlimited_history_photos(): void
    {
        Storage::fake('local');

        $admin = $this->makeUser('admin', 'admin');
        $choir = Choir::create(['name' => 'Upload Choir', 'slug' => 'upload-choir']);
        $admin->choirs()->attach($choir->id, ['status' => 'active']);
        $headers = $this->authHeader($admin);

        for ($i = 1; $i <= 8; $i++) {
            $response = $this->withHeaders($headers)->postJson('/api/member/choir-history/photos', [
                'photo' => UploadedFile::fake()->image("photo-{$i}.jpg", 800, 600),
                'title' => "Memory {$i}",
            ]);

            $response->assertStatus(201);
        }

        $show = $this->withHeaders($headers)->getJson('/api/member/choir-history');
        $show->assertStatus(200);
        $show->assertJsonPath('data.photos.pagination.total', 8);
    }

    public function test_uploaded_photo_file_and_thumbnail_are_served(): void
    {
        Storage::fake('local');

        $admin = $this->makeUser('admin', 'admin');
        $choir = Choir::create(['name' => 'Media Choir', 'slug' => 'media-choir']);
        $admin->choirs()->attach($choir->id, ['status' => 'active']);
        $headers = $this->authHeader($admin);

        $upload = $this->withHeaders($headers)->postJson('/api/member/choir-history/photos', [
            'photo' => UploadedFile::fake()->image('wedding.jpg', 800, 600),
            'title' => 'Wedding',
        ]);
        $upload->assertStatus(201);

        $photoId = $upload->json('data.id');
        $item = GalleryItem::findOrFail($photoId);
        Storage::disk('local')->assertExists($item->media_path);

        $thumbPath = "choir-history/{$choir->id}/thumbs/{$item->id}.webp";

        $file = $this->withHeaders($headers)->getJson("/api/member/choir-history/photos/{$photoId}/file");
        $file->assertStatus(200);
        $this->assertStringContainsString('image/', $file->headers->get('Content-Type'));

        $thumb = $this->withHeaders($headers)->get("/api/member/choir-history/photos/{$photoId}/thumbnail");
        $thumb->assertStatus(200);
        $this->assertStringContainsString('image/', $thumb->headers->get('Content-Type'));
        $this->assertEquals('image/webp', strtolower($thumb->headers->get('Content-Type') ?? ''));

        Storage::disk('local')->assertExists($thumbPath);
    }

    public function test_delete_removes_database_row_original_and_thumbnail(): void
    {
        Storage::fake('local');

        $admin = $this->makeUser('admin', 'admin');
        $choir = Choir::create(['name' => 'Delete Choir', 'slug' => 'delete-choir']);
        $admin->choirs()->attach($choir->id, ['status' => 'active']);
        $headers = $this->authHeader($admin);

        $upload = $this->withHeaders($headers)->postJson('/api/member/choir-history/photos', [
            'photo' => UploadedFile::fake()->image('to-delete.jpg', 800, 600),
        ]);
        $photoId = $upload->json('data.id');
        $item = GalleryItem::findOrFail($photoId);
        $thumbPath = "choir-history/{$choir->id}/thumbs/{$item->id}.webp";

        $thumb = $this->withHeaders($headers)->get("/api/member/choir-history/photos/{$photoId}/thumbnail");
        $thumb->assertStatus(200);

        Storage::disk('local')->assertExists($item->media_path);
        Storage::disk('local')->assertExists($thumbPath);

        $delete = $this->withHeaders($headers)->deleteJson("/api/member/choir-history/photos/{$photoId}");
        $delete->assertStatus(200);

        $this->assertDatabaseMissing('gallery_items', ['id' => $photoId]);
        Storage::disk('local')->assertMissing($item->media_path);
        Storage::disk('local')->assertMissing($thumbPath);
    }

    public function test_member_cannot_upload_or_manage_photos(): void
    {
        Storage::fake('local');

        $admin = $this->makeUser('admin', 'admin');
        $choir = Choir::create(['name' => 'Guard Choir', 'slug' => 'guard-choir']);

        $member = $this->makeUser('member', 'member');
        $member->choirs()->attach($choir->id, ['status' => 'active']);
        $memberHeaders = $this->authHeader($member);

        $upload = $this->withHeaders($memberHeaders)->postJson('/api/member/choir-history/photos', [
            'photo' => UploadedFile::fake()->image('member-upload.jpg', 800, 600),
        ]);
        $upload->assertStatus(403);

        $show = $this->withHeaders($memberHeaders)->getJson('/api/member/choir-history');
        $show->assertStatus(200);
        $show->assertJsonPath('data.can_manage', false);
    }

    public function test_admin_can_browse_any_choir_via_choir_id(): void
    {
        Storage::fake('local');

        $admin = $this->makeUser('admin', 'admin');

        $choirA = Choir::create(['name' => 'Choir A', 'slug' => 'choir-a']);
        $choirB = Choir::create(['name' => 'Choir B', 'slug' => 'choir-b']);
        $this->createHistoryItems($choirA, 3);
        $this->createHistoryItems($choirB, 7);

        $headers = $this->authHeader($admin);

        $responseA = $this->withHeaders($headers)->getJson('/api/member/choir-history?choir_id='.$choirA->id);
        $responseA->assertStatus(200);
        $responseA->assertJsonPath('data.photos.pagination.total', 3);
        $responseA->assertJsonPath('data.choir.id', $choirA->id);

        $responseB = $this->withHeaders($headers)->getJson('/api/member/choir-history?choir_id='.$choirB->id);
        $responseB->assertStatus(200);
        $responseB->assertJsonPath('data.photos.pagination.total', 7);
        $responseB->assertJsonPath('data.choir.id', $choirB->id);
    }
}
