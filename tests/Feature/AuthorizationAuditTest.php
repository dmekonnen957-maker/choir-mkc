<?php

namespace Tests\Feature;

use App\Models\Choir;
use App\Models\Rehearsal;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuthorizationAuditTest extends TestCase
{
    private Choir $choirA;
    private Choir $choirB;
    private User $admin;
    private User $leader;
    private User $member;

    protected function setUp(): void
    {
        parent::setUp();

        $this->choirA = Choir::create([
            'name' => 'Audit Choir A',
            'slug' => 'audit-choir-a-' . uniqid(),
            'status' => 'active',
        ]);
        $this->choirB = Choir::create([
            'name' => 'Audit Choir B',
            'slug' => 'audit-choir-b-' . uniqid(),
            'status' => 'active',
        ]);

        $this->admin = $this->user('admin');
        $this->leader = $this->user('team_leader');
        $this->member = $this->user('member');
        $this->leader->choirs()->attach($this->choirA, ['status' => 'active']);
        $this->member->choirs()->attach($this->choirA, ['status' => 'active']);
    }

    public function test_leader_is_limited_to_assigned_choir(): void
    {
        Rehearsal::create([
            'choir_id' => $this->choirB->id,
            'title' => 'Private Choir B Rehearsal',
            'date' => now()->addDay()->toDateString(),
            'start_time' => '18:00:00',
            'end_time' => '20:00:00',
            'status' => 'scheduled',
        ]);

        Sanctum::actingAs($this->leader, ['*']);

        $this->getJson("/api/choirs/{$this->choirB->id}/rehearsals")
            ->assertStatus(403);
        $this->getJson("/api/choirs/{$this->choirB->id}")
            ->assertStatus(403);
        $this->putJson("/api/choirs/{$this->choirB->id}", ['name' => 'Tampered'])
            ->assertStatus(403);
        $this->getJson('/api/admin/settings')
            ->assertStatus(403);
    }

    public function test_member_cannot_use_leader_or_admin_apis(): void
    {
        Sanctum::actingAs($this->member, ['*']);

        $this->getJson('/api/admin/users')->assertStatus(403);
        $this->getJson('/api/team-leader/dashboard')->assertStatus(403);
        $this->getJson('/api/attendance/choirs')->assertStatus(403);
        $this->getJson("/api/choirs/{$this->choirA->id}/attendance-sessions")->assertStatus(403);
    }

    public function test_super_admin_can_use_admin_apis(): void
    {
        $superAdmin = $this->user('super-admin');
        $this->assertTrue($superAdmin->hasRole('super-admin', 'api'));
        Sanctum::actingAs($superAdmin, ['*']);

        $this->getJson('/api/admin/settings')->assertOk();
        $this->getJson('/api/admin/users')->assertOk();
    }

    private function user(string $roleName): User
    {
        $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'api']);
        $user = User::create([
            'name' => ucfirst(str_replace('_', ' ', $roleName)),
            'email' => $roleName . '-' . uniqid() . '@test.local',
            'password' => Hash::make('password123'),
            'role' => $roleName === 'super-admin' ? 'super-admin' : $roleName,
            'status' => 'approved',
        ]);
        $user->assignRole($role);

        return $user;
    }
}
