<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SongCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Hymn', 'description' => 'Traditional hymns', 'is_active' => true],
            ['name' => 'Worship', 'description' => 'Contemporary worship songs', 'is_active' => true],
            ['name' => 'Praise', 'description' => 'Upbeat praise songs', 'is_active' => true],
            ['name' => 'Gospel', 'description' => 'Gospel music', 'is_active' => true],
            ['name' => 'Christmas', 'description' => 'Christmas carols and songs', 'is_active' => true],
            ['name' => 'Easter', 'description' => 'Easter songs', 'is_active' => true],
            ['name' => 'Special Program', 'description' => 'Songs for special programs', 'is_active' => true],
            ['name' => 'Traditional', 'description' => 'Traditional choir pieces', 'is_active' => true],
        ];

        DB::table('song_categories')->insert($categories);
    }
}