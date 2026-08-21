<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VoiceSectionSeeder extends Seeder
{
    public function run(): void
    {
        $sections = [
            ['name' => 'Soprano', 'description' => 'Highest female voice', 'is_active' => true],
            ['name' => 'Alto', 'description' => 'Lowest female voice', 'is_active' => true],
            ['name' => 'Tenor', 'description' => 'Highest male voice', 'is_active' => true],
            ['name' => 'Bass', 'description' => 'Lowest male voice', 'is_active' => true],
        ];

        DB::table('voice_sections')->insert($sections);
    }
}