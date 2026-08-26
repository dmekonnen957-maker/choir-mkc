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
        // Only the administrative account required to access the system.
        // Test/dev member accounts are intentionally NOT created here.
        $admin = User::firstOrCreate(
            ['email' => 'admin@choirmkc.com'],
            [
                'name' => 'Administrator',
                'phone' => '0911000001',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'status' => 'approved',
                'approved_at' => now(),
                'email_verified_at' => now(),
            ]
        );

        $choir = DB::table('choirs')->where('slug', 'mkc-main-choir')->first();
        if ($choir) {
            DB::table('choir_user')->updateOrInsert(
                ['choir_id' => $choir->id, 'user_id' => $admin->id],
                [
                    'is_primary_leader' => true,
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
