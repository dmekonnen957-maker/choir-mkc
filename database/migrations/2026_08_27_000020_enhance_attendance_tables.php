<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_sessions', function (Blueprint $table) {
            $table->foreignId('rehearsal_id')->nullable()->change();
            $table->foreignId('performance_id')->nullable()->after('rehearsal_id')->constrained()->cascadeOnDelete();
            $table->string('event_type', 30)->default('rehearsal')->after('performance_id');
            $table->string('title')->nullable()->after('event_type');
            $table->time('start_time')->nullable()->after('session_date');
            $table->time('end_time')->nullable()->after('start_time');
            $table->string('status', 20)->default('open')->after('notes'); // not_started, open, closed
            $table->unsignedSmallInteger('late_threshold_minutes')->default(15)->after('status');
        });

        Schema::table('attendance_records', function (Blueprint $table) {
            $table->timestamp('check_in_at')->nullable()->after('status');
            $table->timestamp('check_out_at')->nullable()->after('check_in_at');
        });
    }

    public function down(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropColumn(['check_in_at', 'check_out_at']);
        });

        Schema::table('attendance_sessions', function (Blueprint $table) {
            $table->dropForeign(['performance_id']);
            $table->dropColumn([
                'performance_id',
                'event_type',
                'title',
                'start_time',
                'end_time',
                'status',
                'late_threshold_minutes',
            ]);
            $table->foreignId('rehearsal_id')->nullable(false)->change();
        });
    }
};
