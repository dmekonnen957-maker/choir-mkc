<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('songs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('song_category_id')->constrained();
            $table->string('title');
            $table->string('composer')->nullable();
            $table->string('artist')->nullable();
            $table->string('arranger')->nullable();
            $table->string('language')->nullable();
            $table->integer('year_written')->nullable();
            $table->text('description')->nullable();
            $table->string('cover_image_path')->nullable();
            $table->boolean('is_published')->default(false);
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('songs');
    }
};