<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('choir_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('choir_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_primary_leader')->default(false);
            $table->string('status')->default('active');
            $table->timestamps();

            $table->unique(['choir_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('choir_user');
    }
};
