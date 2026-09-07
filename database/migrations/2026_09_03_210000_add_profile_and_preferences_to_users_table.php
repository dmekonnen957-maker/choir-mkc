<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable()->unique()->after('name');
            $table->string('language')->default('en')->after('notification_preferences');
            $table->string('timezone')->default('Africa/Addis_Ababa')->after('language');
            $table->timestamp('deactivated_at')->nullable()->after('timezone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['username', 'language', 'timezone', 'deactivated_at']);
        });
    }
};
