<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performance_songs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('performance_id')->constrained()->cascadeOnDelete();
            $table->foreignId('song_id')->constrained()->cascadeOnDelete();
            $table->integer('sequence_number')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->unique(['performance_id', 'song_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_songs');
    }
};