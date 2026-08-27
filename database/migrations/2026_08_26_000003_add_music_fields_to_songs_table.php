<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('songs', function (Blueprint $table) {
            $table->string('original_key')->nullable()->after('artist');
            $table->string('scale')->nullable()->after('original_key');
            // Reserved for future expansion (e.g. specific Ethiopian modes).
            $table->string('scale_mode')->nullable()->after('scale');
            $table->longText('lyrics')->nullable()->after('scale_mode');
        });

        // Migrate any existing lyrics records into the unified song record.
        // The Lyrics table remains for backward compatibility but the admin
        // UI now treats lyrics as part of the single Song.
        $lyrics = DB::table('lyrics')
            ->select('song_id', 'content')
            ->whereNotNull('content')
            ->orderBy('id')
            ->get();

        $bySong = [];
        foreach ($lyrics as $row) {
            if (!isset($bySong[$row->song_id])) {
                $bySong[$row->song_id] = $row->content;
            }
        }

        foreach ($bySong as $songId => $content) {
            DB::table('songs')
                ->where('id', $songId)
                ->whereNull('lyrics')
                ->update(['lyrics' => $content]);
        }
    }

    public function down(): void
    {
        Schema::table('songs', function (Blueprint $table) {
            $table->dropColumn(['original_key', 'scale', 'scale_mode', 'lyrics']);
        });
    }
};
