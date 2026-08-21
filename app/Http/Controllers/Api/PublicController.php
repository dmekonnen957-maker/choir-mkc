<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\Api\AnnouncementResource;
use App\Http\Resources\Api\ChoirResource;
use App\Http\Resources\Api\GalleryResource;
use App\Http\Resources\Api\MemberResource;
use App\Http\Resources\Api\PerformanceResource;
use App\Http\Resources\Api\SongResource;
use App\Models\Choir;
use App\Models\Song;
use Illuminate\Http\Request;

class PublicController extends ApiController
{
    public function choirs(Request $request): \Illuminate\Http\JsonResponse
    {
        return $this->paginate(Choir::where('is_public', true), ChoirResource::class);
    }

    public function choir(Request $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        if (!$choir->is_public) {
            abort(404);
        }

        return $this->ok(new ChoirResource($choir->load('voiceSections')));
    }

    public function members(Request $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        return $this->paginate(
            $choir->members()->where('is_public', true),
            MemberResource::class
        );
    }

    public function performances(Request $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        return $this->paginate(
            $choir->performances()->where('is_public', true),
            PerformanceResource::class
        );
    }

    public function gallery(Request $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        return $this->paginate(
            $choir->galleryItems()->where('is_public', true),
            GalleryResource::class
        );
    }

    public function announcements(Request $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        return $this->paginate(
            $choir->announcements()->where('is_published', true),
            AnnouncementResource::class
        );
    }

    public function songs(Request $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        return $this->paginate(
            $choir->songs()->where('is_published', true)->with('songCategory'),
            SongResource::class
        );
    }

    public function song(Request $request, Choir $choir, Song $song): \Illuminate\Http\JsonResponse
    {
        if (!$song->is_published || $song->choir_id !== $choir->id) {
            abort(404);
        }

        return $this->ok(new SongResource($song->load([
            'songCategory',
            'lyrics' => fn ($q) => $q->where('is_published', true),
        ])));
    }
}
