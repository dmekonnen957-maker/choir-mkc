<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\Api\MemberResource;
use App\Http\Resources\Api\PerformanceResource;
use App\Models\Announcement;
use App\Models\Choir;
use App\Models\GalleryItem;
use App\Models\Member;
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
                'members' => $choir->members()->count(),
                'songs' => $choir->songs()->count(),
                'rehearsals' => $choir->rehearsals()->count(),
                'performances' => $choir->performances()->count(),
                'announcements' => $choir->announcements()->count(),
                'gallery' => $choir->galleryItems()->count(),
            ],
            'recent_members' => MemberResource::collection(
                $choir->members()->latest()->take(5)->get()
            ),
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
        return $this->ok([
            'choirs' => Choir::count(),
            'members' => Member::count(),
            'songs' => Song::count(),
            'rehearsals' => Rehearsal::count(),
            'performances' => Performance::count(),
            'users' => User::count(),
        ]);
    }
}
