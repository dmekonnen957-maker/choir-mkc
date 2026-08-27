<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ChoirSeeder extends Seeder
{
    public function run(): void
    {
        if (DB::table('choirs')->where('slug', 'mkc-main-choir')->exists()) {
            return;
        }

        DB::table('choirs')->insert([
            'name' => 'EKA MKC Choirs and Worship Teams',
            'slug' => 'mkc-main-choir',
            'description' => 'Primary EKA MKC Choirs and Worship Teams choir used as the default tenant.',
            'church_name' => null,
            'history' => null,
            'status' => 'active',
            'is_public' => true,
            'created_by' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
