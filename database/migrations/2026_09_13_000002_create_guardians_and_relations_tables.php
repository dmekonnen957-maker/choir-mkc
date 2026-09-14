<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guardians', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('relationship', 50); // Mother, Father, Legal Guardian, Other
            $table->string('relationship_other')->nullable();
            $table->string('phone', 30)->index();
            $table->string('alt_phone', 30)->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('guardian_child', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guardian_id')->constrained('guardians')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->string('relationship', 50)->nullable();
            $table->boolean('is_primary')->default(true);
            $table->timestamps();

            $table->unique(['guardian_id', 'member_id']);
        });

        Schema::create('song_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('song_id')->constrained('songs')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->foreignId('choir_id')->nullable()->constrained('choirs')->cascadeOnDelete();
            $table->string('role', 50)->nullable(); // Soloist, Lead, Vocalist, etc.
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['song_id', 'member_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('song_participants');
        Schema::dropIfExists('guardian_child');
        Schema::dropIfExists('guardians');
    }
};
