<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->string('member_type', 20)->default('adult')->after('user_id');
            $table->string('middle_name')->nullable()->after('first_name');
            $table->date('date_of_birth')->nullable()->after('last_name');
            $table->string('gender', 20)->nullable()->after('date_of_birth');
            $table->string('grade_school_level')->nullable()->after('role_title');
            $table->text('emergency_notes')->nullable()->after('notes');
            $table->text('special_notes')->nullable()->after('emergency_notes');
            $table->boolean('consent_confirmed')->default(false)->after('special_notes');
            $table->timestamp('consent_confirmed_at')->nullable()->after('consent_confirmed');
            $table->foreignId('consent_recorded_by')->nullable()->after('consent_confirmed_at')->constrained('users')->nullOnDelete();
        });

        Schema::table('members', function (Blueprint $table) {
            $table->string('status', 30)->default('active')->change();
        });
    }

    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropForeign(['consent_recorded_by']);
            $table->dropColumn([
                'member_type',
                'middle_name',
                'date_of_birth',
                'gender',
                'grade_school_level',
                'emergency_notes',
                'special_notes',
                'consent_confirmed',
                'consent_confirmed_at',
                'consent_recorded_by',
            ]);
            $table->enum('status', ['active', 'inactive', 'suspended', 'former'])->default('active')->change();
        });
    }
};
