<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('choirs', function (Blueprint $table) {
            $table->string('choir_type')->nullable()->after('name');
            $table->string('uniform_pattern')->nullable()->after('uniform_secondary_color');
            $table->text('uniform_description')->nullable()->after('uniform_pattern');
        });
    }

    public function down(): void
    {
        Schema::table('choirs', function (Blueprint $table) {
            $table->dropColumn(['choir_type', 'uniform_pattern', 'uniform_description']);
        });
    }
};
