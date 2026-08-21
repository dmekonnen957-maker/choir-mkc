<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rehearsal_songs', function (Blueprint $table) {
            $table->string('status')->nullable()->after('song_id');
        });
    }

    public function down(): void
    {
        Schema::table('rehearsal_songs', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
