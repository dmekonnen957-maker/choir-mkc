<?php

namespace Tests\Feature;

use App\Models\Choir;
use App\Models\Member;
use App\Models\Performance;
use App\Models\Song;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class MemberPerformancesApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'team_leader', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'member', 'guard_name' => 'api']);
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
            'slug' => strtolower(str_replace(' ', '-', $name)) . '-' . uniqid(),
            'status' => 'active',
        ]);
    }

    public function test_member_gets_only_their_choir_performances(): void
    {
        $choirA = $this->choir('A Choir');
        $choirB = $this->choir('B Choir');

        $user = $this->member();
        $user->choirs()->attach($choirA->id, ['status' => 'active']);

        $member = Member::create([
            'choir_id' => $choirA->id,
            'user_id' => $user->id,
            'member_code' => 'M-' . substr($user->email, 0, 8),
            'first_name' => 'Test',
            'last_name' => 'Member',
            'status' => 'active',
        ]);

        $song = Song::create([
            'choir_id' => $choirA->id,
            'title' => 'Amazing Grace',
            'lyrics' => "Amazing grace\nhow sweet the sound",
            'is_published' => true,
        ]);

        $upcoming = Performance::create([
            'choir_id' => $choirA->id,
            'title' => 'Sunday Worship',
            'date' => now()->addDays(3)->toDateString(),
            'start_time' => '09:00:00',
            'venue' => 'MKC Main Church',
            'status' => 'confirmed',
            'created_by' => $user->id,
        ]);
        $upcoming->songs()->attach($song->id, ['sequence_number' => 1, 'choir_id' => $choirA->id]);
        $member->performances()->attach($upcoming->id, ['choir_id' => $choirA->id, 'expected' => true, 'participation_status' => null]);

        Performance::create([
            'choir_id' => $choirA->id,
            'title' => 'Easter Praise',
            'date' => now()->subDays(10)->toDateString(),
            'start_time' => '10:00:00',
            'venue' => 'Hall A',
            'status' => 'completed',
            'created_by' => $user->id,
        ]);

        Performance::create([
            'choir_id' => $choirB->id,
            'title' => 'Secret Performance',
            'date' => now()->addDays(1)->toDateString(),
            'start_time' => '11:00:00',
            'venue' => 'Hall B',
            'status' => 'confirmed',
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/member/performances');

        $response->assertOk();
        $json = $response->json('data');

        $this->assertTrue($json['has_choir']);
        $this->assertEquals('A Choir', $json['choir']['name']);

        $titlesUpcoming = collect($json['upcoming'])->pluck('title');
        $titlesPast = collect($json['past'])->pluck('title');

        $this->assertTrue($titlesUpcoming->contains('Sunday Worship'));
        $this->assertFalse($titlesUpcoming->contains('Easter Praise'));
        $this->assertFalse($titlesUpcoming->contains('Secret Performance'));
        $this->assertTrue($titlesPast->contains('Easter Praise'));
        $this->assertFalse($titlesPast->contains('Secret Performance'));

        $sunday = collect($json['upcoming'])->firstWhere('title', 'Sunday Worship');
        $this->assertCount(1, $sunday['songs']);
        $this->assertEquals('Amazing Grace', $sunday['songs'][0]['title']);
        $this->assertEquals(1, $sunday['song_count']);
        $this->assertArrayHasKey('participation', $sunday);
        $this->assertTrue($sunday['participation']['expected']);
        $this->assertEquals('A Choir', $sunday['choir']['name']);

        $this->assertEquals(1, $json['stats']['upcoming']);
        $this->assertEquals(1, $json['stats']['completed']);
    }

    public function test_member_without_choir_gets_has_choir_false(): void
    {
        $user = $this->member();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/member/performances');

        $response->assertOk();
        $json = $response->json('data');
        $this->assertFalse($json['has_choir']);
        $this->assertEquals([], $json['upcoming']);
        $this->assertEquals([], $json['past']);
    }
}