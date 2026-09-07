<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('performances', function (Blueprint $table) {
            if (!Schema::hasColumn('performances', 'type')) {
                $table->string('type')->nullable()->default('Worship')->after('title');
            }
            if (!Schema::hasColumn('performances', 'poster_path')) {
                $table->string('poster_path')->nullable()->after('special_instructions');
            }
            $table->boolean('is_public')->default(true)->change();
        });

        // Update existing records so created performances are visible to public
        DB::table('performances')
            ->whereIn('status', ['scheduled', 'confirmed', 'completed'])
            ->update(['is_public' => true]);
    }

    public function down(): void
    {
        Schema::table('performances', function (Blueprint $table) {
            if (Schema::hasColumn('performances', 'type')) {
                $table->dropColumn('type');
            }
            if (Schema::hasColumn('performances', 'poster_path')) {
                $table->dropColumn('poster_path');
            }
        });
    }
};
