<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rehearsal_songs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('choir_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rehearsal_id')->constrained()->cascadeOnDelete();
            $table->foreignId('song_id')->constrained()->cascadeOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->unique(['rehearsal_id', 'song_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rehearsal_songs');
    }
};