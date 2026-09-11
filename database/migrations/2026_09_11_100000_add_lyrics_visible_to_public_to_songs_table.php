<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('songs', function (Blueprint $table) {
            $table->boolean('lyrics_visible_to_public')
                ->default(true)
                ->after('lyrics')
                ->comment('When false, lyrics are hidden from unauthenticated public users via API');
        });
    }

    public function down(): void
    {
        Schema::table('songs', function (Blueprint $table) {
            $table->dropColumn('lyrics_visible_to_public');
        });
    }
};
