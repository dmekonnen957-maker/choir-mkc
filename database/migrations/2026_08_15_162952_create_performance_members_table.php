<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performance_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('performance_id')->constrained()->cascadeOnDelete();
            $table->foreignId('member_id')->constrained()->cascadeOnDelete();
            $table->boolean('expected')->default(true);
            $table->enum('participation_status', ['participated', 'absent', 'excused', 'late', 'replaced'])->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->unique(['performance_id', 'member_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_members');
    }
};