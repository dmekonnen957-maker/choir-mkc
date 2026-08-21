<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performances', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time')->nullable();
            $table->string('venue');
            $table->string('location')->nullable();
            $table->text('description')->nullable();
            $table->string('organizer')->nullable();
            $table->string('dress_code')->nullable();
            $table->text('special_instructions')->nullable();
            $table->enum('status', ['scheduled', 'confirmed', 'completed', 'cancelled', 'postponed'])->default('scheduled');
            $table->boolean('is_public')->default(false);
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performances');
    }
};