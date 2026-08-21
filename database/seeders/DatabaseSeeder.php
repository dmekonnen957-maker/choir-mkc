<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ChoirSeeder::class,
            VoiceSectionSeeder::class,
            SongCategorySeeder::class,
            UserSeeder::class,
            PermissionRoleSeeder::class,
        ]);
    }
}