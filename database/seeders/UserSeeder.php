<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Administrator',
            'email' => 'admin@choirmkc.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Choir Leader',
            'email' => 'leader@choirmkc.com',
            'password' => Hash::make('password'),
            'role' => 'leader',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Choir Member',
            'email' => 'member@choirmkc.com',
            'password' => Hash::make('password'),
            'role' => 'member',
            'email_verified_at' => now(),
        ]);
    }
}