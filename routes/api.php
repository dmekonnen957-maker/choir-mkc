<?php

use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChoirController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\GalleryController;
use App\Http\Controllers\Api\LyricController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PerformanceController;
use App\Http\Controllers\Api\PerformanceMemberController;
use App\Http\Controllers\Api\PerformanceRehearsalController;
use App\Http\Controllers\Api\PerformanceSongController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\RehearsalController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\SongCategoryController;
use App\Http\Controllers\Api\SongController;
use App\Http\Controllers\Api\SongFileController;
use App\Http\Controllers\Api\SongHistoryController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VoiceSectionController;
use Illuminate\Support\Facades\Route;

/*
| Multi-choir, token-authenticated API.
| Security: auth:sanctum required, choir.access enforces choir assignment,
| controllers call $this->authorize() (policies) for fine-grained access.
*/

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
});

Route::prefix('public')->group(function () {
    Route::get('/choirs', [PublicController::class, 'choirs']);
    Route::get('/choirs/{choir}', [PublicController::class, 'choir']);
    Route::get('/choirs/{choir}/members', [PublicController::class, 'members']);
    Route::get('/choirs/{choir}/performances', [PublicController::class, 'performances']);
    Route::get('/choirs/{choir}/gallery', [PublicController::class, 'gallery']);
    Route::get('/choirs/{choir}/announcements', [PublicController::class, 'announcements']);
    Route::get('/choirs/{choir}/songs', [PublicController::class, 'songs']);
    Route::get('/choirs/{choir}/songs/{song}', [PublicController::class, 'song']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('choirs')->scopeBindings()->group(function () {
        Route::get('/', [ChoirController::class, 'index']);
        Route::post('/', [ChoirController::class, 'store']);
        Route::get('/{choir}', [ChoirController::class, 'show']);
        Route::match(['PUT', 'PATCH'], '/{choir}', [ChoirController::class, 'update']);
        Route::delete('/{choir}', [ChoirController::class, 'destroy']);

        Route::middleware('choir.access')->group(function () {
            Route::get('/{choir}/dashboard', [DashboardController::class, 'summary']);

            Route::apiResource('/{choir}/members', MemberController::class);
            Route::apiResource('/{choir}/voice-sections', VoiceSectionController::class);
            Route::apiResource('/{choir}/song-categories', SongCategoryController::class);
            Route::apiResource('/{choir}/songs', SongController::class);
            Route::apiResource('/{choir}/songs/{song}/lyrics', LyricController::class);
            Route::apiResource('/{choir}/songs/{song}/histories', SongHistoryController::class);
            Route::apiResource('/{choir}/songs/{song}/files', SongFileController::class);

            Route::apiResource('/{choir}/rehearsals', RehearsalController::class);
            Route::get('/{choir}/rehearsals/{rehearsal}/songs', [RehearsalController::class, 'songs']);
            Route::post('/{choir}/rehearsals/{rehearsal}/songs', [RehearsalController::class, 'attachSong']);
            Route::delete('/{choir}/rehearsals/{rehearsal}/songs/{song}', [RehearsalController::class, 'detachSong']);

            Route::apiResource('/{choir}/attendance-sessions', AttendanceController::class);
            Route::get('/{choir}/attendance-sessions/{attendanceSession}/records', [AttendanceController::class, 'recordsIndex']);
            Route::post('/{choir}/attendance-sessions/{attendanceSession}/records', [AttendanceController::class, 'recordsStore']);
            Route::get('/{choir}/attendance-sessions/{attendanceSession}/records/{record}', [AttendanceController::class, 'recordsShow']);
            Route::match(['PUT', 'PATCH'], '/{choir}/attendance-sessions/{attendanceSession}/records/{record}', [AttendanceController::class, 'recordsUpdate']);
            Route::delete('/{choir}/attendance-sessions/{attendanceSession}/records/{record}', [AttendanceController::class, 'recordsDestroy']);

            Route::apiResource('/{choir}/performances', PerformanceController::class);
            Route::apiResource('/{choir}/performances/{performance}/members', PerformanceMemberController::class);
            Route::apiResource('/{choir}/performances/{performance}/songs', PerformanceSongController::class);
            Route::apiResource('/{choir}/performances/{performance}/rehearsals', PerformanceRehearsalController::class);
            Route::apiResource('/{choir}/announcements', AnnouncementController::class);
            Route::apiResource('/{choir}/gallery', GalleryController::class);
            Route::apiResource('/{choir}/contacts', ContactController::class);
        });
    });

    Route::middleware(['role:super-admin,admin'])->prefix('admin')->scopeBindings()->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'overview']);
        Route::apiResource('users', UserController::class);
        Route::apiResource('roles', RoleController::class);
        Route::apiResource('permissions', PermissionController::class);
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
        Route::get('/audit-logs/{auditLog}', [AuditLogController::class, 'show']);
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications', [NotificationController::class, 'store']);
        Route::get('/reports', [ReportController::class, 'index']);
        Route::get('/reports/{report}', [ReportController::class, 'show']);
    });

    // Member-only area. Choir context is derived from the authenticated user,
    // never from request input, so a member cannot reach another choir.
    Route::middleware(['auth:sanctum', 'member'])->prefix('member')->group(function () {
        Route::get('/dashboard', [MemberController::class, 'dashboard']);
        Route::get('/choir', [MemberController::class, 'choir']);
        Route::get('/profile', [MemberController::class, 'profile']);
        Route::match(['PUT', 'PATCH'], '/profile', [MemberController::class, 'updateProfile']);
        Route::get('/notifications', [MemberController::class, 'notifications']);
    });
});
