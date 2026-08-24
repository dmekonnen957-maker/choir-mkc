<?php

namespace Tests\Feature;

use App\Models\Choir;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuthAndUserApprovalTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Ensure Spatie roles exist
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'team_leader', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'member', 'guard_name' => 'api']);
    }

    public function test_new_user_registration_creates_pending_member_account(): void
    {
        $choir = Choir::firstOrCreate(
            ['slug' => 'test-choir'],
            ['name' => 'Test Choir', 'status' => 'active', 'is_public' => true]
        );

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test Applicant',
            'email' => 'applicant_' . uniqid() . '@choirmkc.com',
            'phone' => '0911223344',
            'choir_id' => $choir->id,
            'role' => 'admin', // Should be IGNORED by backend
            'status' => 'approved', // Should be IGNORED by backend
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);
        $response->assertJson([
            'success' => true,
            'data' => [
                'status' => 'pending',
                'user' => [
                    'role' => 'member',
                    'status' => 'pending',
                ],
            ],
        ]);

        // User in DB has role member, status pending, assigned to choir
        $this->assertDatabaseHas('users', [
            'email' => $response->json('data.user.email'),
            'role' => 'member',
            'status' => 'pending',
        ]);
    }

    public function test_pending_user_cannot_login(): void
    {
        $email = 'pending_' . uniqid() . '@choirmkc.com';
        $user = User::create([
            'name' => 'Pending User',
            'email' => $email,
            'password' => Hash::make('password123'),
            'role' => 'member',
            'status' => 'pending',
        ]);
        $user->assignRole(Role::findByName('member', 'api'));

        $response = $this->postJson('/api/auth/login', [
            'email' => $email,
            'password' => 'password123',
        ]);

        $response->assertStatus(403);
        $response->assertJson([
            'success' => false,
            'message' => 'Your account is waiting for administrator approval.',
        ]);
    }

    public function test_rejected_user_cannot_login(): void
    {
        $email = 'rejected_' . uniqid() . '@choirmkc.com';
        $user = User::create([
            'name' => 'Rejected User',
            'email' => $email,
            'password' => Hash::make('password123'),
            'role' => 'member',
            'status' => 'rejected',
            'rejection_reason' => 'Choir is currently at full capacity.',
        ]);
        $user->assignRole(Role::findByName('member', 'api'));

        $response = $this->postJson('/api/auth/login', [
            'email' => $email,
            'password' => 'password123',
        ]);

        $response->assertStatus(403);
        $response->assertJson([
            'success' => false,
            'message' => 'Your registration was not approved: Choir is currently at full capacity.',
        ]);
    }

    public function test_admin_can_view_users_and_approve_pending_user(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin_test@choirmkc.com'],
            [
                'name' => 'Test Admin',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'status' => 'approved',
            ]
        );
        $admin->syncRoles([Role::findByName('admin', 'api')]);

        $user = User::create([
            'name' => 'Waiting User',
            'email' => 'waiting_' . uniqid() . '@choirmkc.com',
            'password' => Hash::make('password123'),
            'role' => 'member',
            'status' => 'pending',
        ]);
        $user->assignRole(Role::findByName('member', 'api'));

        // Admin logs in
        $loginRes = $this->postJson('/api/auth/login', [
            'email' => 'admin_test@choirmkc.com',
            'password' => 'password123',
        ]);
        $loginRes->assertStatus(200);
        $token = $loginRes->json('data.token');

        // Admin lists users
        $listRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/users?status=pending');
        $listRes->assertStatus(200);

        // Admin approves user
        $approveRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/admin/users/{$user->id}/approve");
        $approveRes->assertStatus(200);
        $approveRes->assertJson([
            'success' => true,
            'data' => [
                'status' => 'approved',
                'role' => 'member',
            ],
        ]);

        // User status is now approved in DB
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'status' => 'approved',
            'approved_by' => $admin->id,
        ]);

        // Now approved user can login successfully
        $userLogin = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);
        $userLogin->assertStatus(200);
        $this->assertNotEmpty($userLogin->json('data.token'));
    }

    public function test_member_cannot_access_admin_users(): void
    {
        $member = User::create([
            'name' => 'Standard Member',
            'email' => 'member_sec_' . uniqid() . '@choirmkc.com',
            'password' => Hash::make('password123'),
            'role' => 'member',
            'status' => 'approved',
        ]);
        $member->assignRole(Role::findByName('member', 'api'));

        $loginRes = $this->postJson('/api/auth/login', [
            'email' => $member->email,
            'password' => 'password123',
        ]);
        $token = $loginRes->json('data.token');

        // Accessing admin users list is forbidden
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/users');
        $response->assertStatus(403);

        // Attempting to update role or choir via admin endpoint is forbidden
        $hackRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/admin/users/{$member->id}", [
                'role' => 'admin',
            ]);
        $hackRes->assertStatus(403);
    }

    public function test_admin_can_update_user_role_and_assign_choir(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin_test@choirmkc.com'],
            [
                'name' => 'Test Admin',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'status' => 'approved',
            ]
        );
        $admin->syncRoles([Role::findByName('admin', 'api')]);

        $choirB = Choir::firstOrCreate(
            ['slug' => 'choir-b'],
            ['name' => 'Choir B', 'status' => 'active', 'is_public' => true]
        );

        $targetUser = User::create([
            'name' => 'Target User',
            'email' => 'target_' . uniqid() . '@choirmkc.com',
            'password' => Hash::make('password123'),
            'role' => 'member',
            'status' => 'approved',
        ]);
        $targetUser->assignRole(Role::findByName('member', 'api'));

        $loginRes = $this->postJson('/api/auth/login', [
            'email' => 'admin_test@choirmkc.com',
            'password' => 'password123',
        ]);
        $token = $loginRes->json('data.token');

        $updateRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/admin/users/{$targetUser->id}", [
                'role' => 'team_leader',
                'choir_id' => $choirB->id,
            ]);

        $updateRes->assertStatus(200);
        $updateRes->assertJson([
            'success' => true,
            'data' => [
                'role' => 'team_leader',
                'choir' => [
                    'id' => $choirB->id,
                    'name' => 'Choir B',
                ],
            ],
        ]);

        $this->assertDatabaseHas('users', [
            'id' => $targetUser->id,
            'role' => 'team_leader',
        ]);
    }

    public function test_approved_member_can_access_member_dashboard(): void
    {
        $choir = Choir::firstOrCreate(
            ['slug' => 'dashboard-choir'],
            ['name' => 'Dashboard Choir', 'status' => 'active', 'is_public' => true]
        );

        $member = User::create([
            'name' => 'Dashboard Member',
            'email' => 'dash_member_' . uniqid() . '@choirmkc.com',
            'password' => Hash::make('password123'),
            'role' => 'member',
            'status' => 'approved',
        ]);
        $member->assignRole(Role::findByName('member', 'api'));
        $member->choirs()->sync([$choir->id => ['status' => 'active']]);

        $loginRes = $this->postJson('/api/auth/login', [
            'email' => $member->email,
            'password' => 'password123',
        ]);
        $token = $loginRes->json('data.token');

        $dashRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/member/dashboard');

        $dashRes->assertStatus(200);
        $dashRes->assertJson([
            'success' => true,
            'data' => [
                'has_choir' => true,
                'choir' => [
                    'id' => $choir->id,
                    'name' => 'Dashboard Choir',
                ],
            ],
        ]);
    }
}
