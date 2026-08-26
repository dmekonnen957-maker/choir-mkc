<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('choirs', function (Blueprint $table) {
            $table->foreignId('team_leader_id')
                ->nullable()
                ->after('created_by')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('choirs', function (Blueprint $table) {
            $table->dropForeign(['team_leader_id']);
            $table->dropColumn('team_leader_id');
        });
    }
};
