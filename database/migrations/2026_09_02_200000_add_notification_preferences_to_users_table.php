<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('notification_preferences')->nullable()->after('rejection_reason');
        });

        // Seed sensible defaults for any users created before this migration.
        DB::table('users')->whereNull('notification_preferences')->update([
            'notification_preferences' => json_encode([
                'performances' => true,
                'rehearsals' => true,
                'choir_updates' => true,
            ]),
        ]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('notification_preferences');
        });
    }
};