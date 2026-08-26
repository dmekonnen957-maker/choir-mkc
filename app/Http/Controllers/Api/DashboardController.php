<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\Api\PerformanceResource;
use App\Models\Announcement;
use App\Models\AuditLog;
use App\Models\Choir;
use App\Models\GalleryItem;
use App\Models\Lyric;
use App\Models\Performance;
use App\Models\Rehearsal;
use App\Models\Song;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends ApiController
{
    public function summary(Request $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        return $this->ok([
                'counts' => [
                    'members' => $choir->users()->count(),
                    'songs' => $choir->songs()->count(),
                    'rehearsals' => $choir->rehearsals()->count(),
                    'performances' => $choir->performances()->count(),
                    'announcements' => $choir->announcements()->count(),
                    'gallery' => $choir->galleryItems()->count(),
                ],
                'recent_members' => $choir->users()->latest()->take(5)->get()->map(function ($u) {
                    return ['id' => $u->id, 'name' => $u->name, 'email' => $u->email];
                }),
            'upcoming_performances' => PerformanceResource::collection(
                $choir->performances()
                    ->where('date', '>=', now())
                    ->orderBy('date')
                    ->take(5)
                    ->get()
            ),
        ]);
    }

    public function overview(Request $request): \Illuminate\Http\JsonResponse
    {
        $choirs = Choir::query()
            ->withCount(['users', 'songs', 'performances'])
            ->where('status', 'active')
            ->orderBy('name')
            ->get()
            ->map(function (Choir $choir) {
                return [
                    'id' => $choir->id,
                    'name' => $choir->name,
                    'slug' => $choir->slug,
                    'status' => $choir->status,
                    'member_count' => $choir->users_count,
                    'songs_count' => $choir->songs_count,
                    'performances_count' => $choir->performances_count,
                ];
            });

        $upcoming = Performance::query()
            ->with('choir:id,name')
            ->where('date', '>=', now())
            ->orderBy('date')
            ->take(5)
            ->get();

        $recentActivity = AuditLog::query()
            ->with('user:id,name')
            ->latest()
            ->take(8)
            ->get()
            ->map(function (AuditLog $log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'user_name' => $log->user?->name,
                    'created_at' => $log->created_at,
                ];
            });

        return $this->ok([
            'counts' => [
                'choirs' => Choir::count(),
                'members' => User::where('role', 'member')->count(),
                'songs' => Song::count(),
                'lyrics' => Lyric::count(),
                'rehearsals' => Rehearsal::count(),
                'performances' => Performance::count(),
                'users' => User::count(),
            ],
            'choirs_overview' => $choirs,
            'upcoming_performances' => PerformanceResource::collection($upcoming),
            'recent_activity' => $recentActivity,
        ]);
    }
}
