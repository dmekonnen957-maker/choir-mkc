<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $choirId = DB::table('choirs')->where('slug', 'mkc-main-choir')->first()->id;

        $admin = User::create([
            'name' => 'Administrator',
            'email' => 'admin@choirmkc.com',
            'phone' => '0911000001',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'status' => 'approved',
            'approved_at' => now(),
            'email_verified_at' => now(),
        ]);

        $leader = User::create([
            'name' => 'Choir Leader',
            'email' => 'leader@choirmkc.com',
            'phone' => '0911000002',
            'password' => Hash::make('password'),
            'role' => 'team_leader',
            'status' => 'approved',
            'approved_at' => now(),
            'email_verified_at' => now(),
        ]);

        $member = User::create([
            'name' => 'Choir Member',
            'email' => 'member@choirmkc.com',
            'phone' => '0911000003',
            'password' => Hash::make('password'),
            'role' => 'member',
            'status' => 'approved',
            'approved_at' => now(),
            'email_verified_at' => now(),
        ]);

        DB::table('choir_user')->insert([
            [
                'choir_id' => $choirId,
                'user_id' => $admin->id,
                'is_primary_leader' => true,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'choir_id' => $choirId,
                'user_id' => $leader->id,
                'is_primary_leader' => false,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'choir_id' => $choirId,
                'user_id' => $member->id,
                'is_primary_leader' => false,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
