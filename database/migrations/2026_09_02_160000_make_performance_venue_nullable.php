<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('performances', function (Blueprint $table) {
            $table->string('venue')->nullable()->default('Main Sanctuary')->change();
            $table->string('location')->nullable()->default('Main Sanctuary')->change();
            $table->time('start_time')->nullable()->default('09:00:00')->change();
        });
    }

    public function down(): void
    {
        Schema::table('performances', function (Blueprint $table) {
            $table->string('venue')->nullable(false)->change();
        });
    }
};
