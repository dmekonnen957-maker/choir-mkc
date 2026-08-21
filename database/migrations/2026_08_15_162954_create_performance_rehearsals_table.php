<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performance_rehearsals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('choir_id')->constrained()->cascadeOnDelete();
            $table->foreignId('performance_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rehearsal_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            
            $table->unique(['performance_id', 'rehearsal_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_rehearsals');
    }
};