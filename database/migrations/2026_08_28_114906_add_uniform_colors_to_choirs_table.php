<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('choirs', function (Blueprint $table) {
            $table->string('uniform_primary_color', 7)->nullable()->after('status');
            $table->string('uniform_secondary_color', 7)->nullable()->after('uniform_primary_color');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('choirs', function (Blueprint $table) {
            $table->dropColumn(['uniform_primary_color', 'uniform_secondary_color']);
        });
    }
};
