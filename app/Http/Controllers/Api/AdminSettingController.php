<?php

namespace App\Http\Controllers\Api;

use App\Models\AuditLog;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

class AdminSettingController extends ApiController
{
    /**
     * Get all system settings and server diagnostic information.
     */
    public function index(Request $request): JsonResponse
    {
        $settings = Setting::all();
        $grouped = [];
        $flat = [];

        foreach ($settings as $setting) {
            $grouped[$setting->group][$setting->key] = $setting->value;
            $flat[$setting->key] = $setting->value;
        }

        // System Diagnostic Information
        $dbName = config('database.connections.' . config('database.default') . '.database');
        $systemInfo = [
            'app_name' => config('app.name'),
            'app_env' => config('app.env'),
            'app_debug' => config('app.debug'),
            'app_url' => config('app.url'),
            'laravel_version' => app()->version(),
            'php_version' => PHP_VERSION,
            'database_connection' => config('database.default'),
            'database_name' => $dbName,
            'cache_driver' => config('cache.default'),
            'session_driver' => config('session.driver'),
            'queue_driver' => config('queue.default'),
            'mail_driver' => config('mail.default'),
            'storage_driver' => config('filesystems.default'),
            'server_time' => now()->toIso8601String(),
            'timezone' => config('app.timezone'),
        ];

        return $this->ok([
            'settings' => $flat,
            'grouped' => $grouped,
            'system_info' => $systemInfo,
        ]);
    }

    /**
     * Update system settings.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.ministry_name' => 'nullable|string|max:255',
            'settings.ministry_tagline' => 'nullable|string|max:500',
            'settings.church_name' => 'nullable|string|max:255',
            'settings.church_address' => 'nullable|string|max:255',
            'settings.contact_email' => 'nullable|email|max:255',
            'settings.contact_phone' => ['nullable', 'string', 'regex:/^(09|07)[0-9]{8}$/'],
            'settings.default_language' => 'nullable|string|in:en,am,om,ti',
            'settings.default_timezone' => 'nullable|string|max:100',
            'settings.default_rehearsal_duration_minutes' => 'nullable|numeric|min:15|max:480',
            'settings.attendance_grace_period_minutes' => 'nullable|numeric|min:0|max:120',
            'settings.attendance_quorum_percentage' => 'nullable|numeric|min:0|max:100',
            'settings.allow_member_file_downloads' => 'nullable|in:0,1,true,false',
            'settings.public_registration_enabled' => 'nullable|in:0,1,true,false',
            'settings.require_admin_approval' => 'nullable|in:0,1,true,false',
            'settings.default_registration_role' => 'nullable|string|in:member,team_leader',
            'settings.email_notifications_enabled' => 'nullable|in:0,1,true,false',
            'settings.sms_alerts_enabled' => 'nullable|in:0,1,true,false',
            'settings.rehearsal_reminder_lead_hours' => 'nullable|numeric|min:1|max:168',
            'settings.performance_reminder_lead_hours' => 'nullable|numeric|min:1|max:168',
        ], [
            'settings.contact_phone.regex' => 'Contact phone number must be exactly 10 Ethiopian digits starting with 09 or 07 (e.g., 0911223344 or 0711223344).',
            'settings.contact_email.email' => 'Please provide a valid contact email address.',
            'settings.contact_email.max' => 'Contact email cannot exceed 255 characters.',
            'settings.ministry_tagline.max' => 'Ministry tagline cannot exceed 500 characters.',
            'settings.church_address.max' => 'Church address cannot exceed 255 characters.',
        ]);

        $groups = [
            'ministry_name' => 'general',
            'ministry_tagline' => 'general',
            'church_name' => 'general',
            'church_address' => 'general',
            'contact_email' => 'general',
            'contact_phone' => 'general',
            'default_language' => 'general',
            'default_timezone' => 'general',
            'default_rehearsal_duration_minutes' => 'rehearsals',
            'attendance_grace_period_minutes' => 'rehearsals',
            'attendance_quorum_percentage' => 'rehearsals',
            'allow_member_file_downloads' => 'rehearsals',
            'public_registration_enabled' => 'registration',
            'require_admin_approval' => 'registration',
            'default_registration_role' => 'registration',
            'email_notifications_enabled' => 'notifications',
            'sms_alerts_enabled' => 'notifications',
            'rehearsal_reminder_lead_hours' => 'notifications',
            'performance_reminder_lead_hours' => 'notifications',
        ];

        $user = $request->user();

        DB::transaction(function () use ($validated, $groups) {
            foreach ($validated['settings'] as $key => $value) {
                // Convert boolean strings to 1/0
                if (is_bool($value)) {
                    $value = $value ? '1' : '0';
                }
                $group = $groups[$key] ?? 'general';
                Setting::set($key, (string) ($value ?? ''), $group);
            }
        });

        // Audit Log
        if (class_exists(AuditLog::class) && $user) {
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'updated_settings',
                'description' => 'Updated system settings configuration.',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        Setting::clearCache();

        return $this->ok(Setting::getAllGrouped(), 'System settings updated successfully.');
    }

    /**
     * Clear application configuration, route, and general caches.
     */
    public function clearCache(Request $request): JsonResponse
    {
        try {
            Artisan::call('cache:clear');
            Artisan::call('config:clear');
            Artisan::call('route:clear');
            Setting::clearCache();

            return $this->ok(null, 'System cache, configuration cache, and route cache cleared successfully.');
        } catch (\Throwable $e) {
            return $this->error('Failed to clear cache: ' . $e->getMessage(), null, 500);
        }
    }
}
