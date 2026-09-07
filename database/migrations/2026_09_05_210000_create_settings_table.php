<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->longText('value')->nullable();
            $table->string('group')->default('general');
            $table->timestamps();
        });

        // Insert default initial settings
        $now = now();
        $defaults = [
            // General & Ministry
            ['key' => 'ministry_name', 'value' => 'EKA MKC Choirs & Worship Ministry', 'group' => 'general'],
            ['key' => 'ministry_tagline', 'value' => 'Serving the Lord with passion, unity, and choral excellence.', 'group' => 'general'],
            ['key' => 'church_name', 'value' => 'Ethiopian Kale Heywet Church (EKA MKC)', 'group' => 'general'],
            ['key' => 'church_address', 'value' => 'Addis Ababa, Ethiopia', 'group' => 'general'],
            ['key' => 'contact_email', 'value' => 'contact@ekamkc-choir.org', 'group' => 'general'],
            ['key' => 'contact_phone', 'value' => '+251 911 000 000', 'group' => 'general'],
            ['key' => 'default_language', 'value' => 'en', 'group' => 'general'],
            ['key' => 'default_timezone', 'value' => 'Africa/Addis_Ababa', 'group' => 'general'],

            // Rehearsals & Attendance policies
            ['key' => 'default_rehearsal_duration_minutes', 'value' => '120', 'group' => 'rehearsals'],
            ['key' => 'attendance_grace_period_minutes', 'value' => '15', 'group' => 'rehearsals'],
            ['key' => 'attendance_quorum_percentage', 'value' => '75', 'group' => 'rehearsals'],
            ['key' => 'allow_member_file_downloads', 'value' => '1', 'group' => 'rehearsals'],

            // Registration & Access
            ['key' => 'public_registration_enabled', 'value' => '1', 'group' => 'registration'],
            ['key' => 'require_admin_approval', 'value' => '1', 'group' => 'registration'],
            ['key' => 'default_registration_role', 'value' => 'member', 'group' => 'registration'],

            // Notification defaults
            ['key' => 'email_notifications_enabled', 'value' => '1', 'group' => 'notifications'],
            ['key' => 'sms_alerts_enabled', 'value' => '0', 'group' => 'notifications'],
            ['key' => 'rehearsal_reminder_lead_hours', 'value' => '24', 'group' => 'notifications'],
            ['key' => 'performance_reminder_lead_hours', 'value' => '48', 'group' => 'notifications'],
        ];

        foreach ($defaults as &$d) {
            $d['created_at'] = $now;
            $d['updated_at'] = $now;
        }

        DB::table('settings')->insert($defaults);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
