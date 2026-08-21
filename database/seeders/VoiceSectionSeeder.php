<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VoiceSectionSeeder extends Seeder
{
    public function run(): void
    {
        $choirId = DB::table('choirs')->where('slug', 'mkc-main-choir')->first()->id;

        $sections = [
            ['name' => 'Soprano', 'description' => 'Highest female voice', 'is_active' => true],
            ['name' => 'Alto', 'description' => 'Lowest female voice', 'is_active' => true],
            ['name' => 'Tenor', 'description' => 'Highest male voice', 'is_active' => true],
            ['name' => 'Bass', 'description' => 'Lowest male voice', 'is_active' => true],
        ];

        foreach ($sections as &$section) {
            $section['choir_id'] = $choirId;
        }

        DB::table('voice_sections')->insert($sections);
    }
}