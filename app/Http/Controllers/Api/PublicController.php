<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\Api\AnnouncementResource;
use App\Http\Resources\Api\ChoirResource;
use App\Http\Resources\Api\GalleryResource;
use App\Http\Resources\Api\MemberResource;
use App\Http\Resources\Api\PerformanceResource;
use App\Http\Resources\Api\SongResource;
use App\Models\Choir;
use App\Models\GalleryItem;
use App\Models\Performance;
use App\Models\Song;
use Illuminate\Http\Request;

class PublicController extends ApiController
{
    public function choirs(Request $request): \Illuminate\Http\JsonResponse
    {
        return $this->paginate(Choir::where('status', 'active'), ChoirResource::class);
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
        $today = now()->toDateString();
        return $this->paginate(
            $choir->performances()
                ->where('is_public', true)
                ->where('date', '>=', $today)
                ->whereNotIn('status', ['cancelled'])
                ->orderBy('date', 'asc')
                ->orderBy('start_time', 'asc'),
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
            $choir->songs()
                ->where('is_published', true)
                ->where('status', 'approved')
                ->with('songCategory'),
            SongResource::class
        );
    }

    public function song(Request $request, Choir $choir, Song $song): \Illuminate\Http\JsonResponse
    {
        if (!$song->is_published || $song->status !== 'approved' || $song->choir_id !== $choir->id) {
            abort(404);
        }

        // Only load published lyric records when lyrics are publicly allowed
        $lyricsRelation = $song->lyrics_visible_to_public
            ? ['lyrics' => fn ($q) => $q->where('is_published', true)]
            : [];

        return $this->ok(new SongResource($song->load(
            array_merge(['songCategory'], $lyricsRelation)
        )));
    }

    public function allSongs(Request $request): \Illuminate\Http\JsonResponse
    {
        $userId = $request->user('sanctum')?->id ?? $request->user()?->id;

        $q = Song::query()
            ->where('is_published', true)
            ->where('status', 'approved')
            ->with(['choir:id,name', 'songCategory'])
            ->withCount('likes');

        if ($userId) {
            $q->withExists(['likes as is_liked' => function ($sub) use ($userId) {
                $sub->where('user_id', $userId);
            }]);
        }

        if ($request->filled('choir_id')) {
            $q->where('choir_id', $request->integer('choir_id'));
        }

        if ($request->filled('scale') && $request->input('scale') !== 'all') {
            $scale = $request->input('scale');
            $q->where(function ($sub) use ($scale) {
                $sub->where('scale', 'like', '%' . $scale . '%')
                    ->orWhere('scale_mode', 'like', '%' . $scale . '%');
            });
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $q->where(function ($sub) use ($search) {
                $sub->where('title', 'like', '%' . $search . '%')
                    ->orWhere('artist', 'like', '%' . $search . '%')
                    ->orWhere('composer', 'like', '%' . $search . '%')
                    ->orWhereHas('choir', function ($c) use ($search) {
                        $c->where('name', 'like', '%' . $search . '%');
                    });
            });
        }

        if ($request->filled('has_lyrics')) {
            $val = $request->input('has_lyrics');
            if ($val === 'yes' || $val === '1' || $val === 'true') {
                $q->whereNotNull('lyrics')->where('lyrics', '!=', '');
            } elseif ($val === 'no' || $val === '0' || $val === 'false') {
                $q->where(function ($sub) {
                    $sub->whereNull('lyrics')->orWhere('lyrics', '=', '');
                });
            }
        }

        $sort = $request->input('sort');
        if ($sort === 'most_liked' || $sort === 'likes' || $sort === 'popular') {
            $q->orderBy('likes_count', 'desc')->latest();
        } elseif ($sort === 'title') {
            $q->orderBy('title', 'asc');
        } elseif ($sort === 'oldest') {
            $q->oldest();
        } else {
            $q->latest();
        }

        return $this->paginate($q, SongResource::class, 12);
    }

    public function publicSongDetail(Request $request, Song $song): \Illuminate\Http\JsonResponse
    {
        if (!$song->is_published || $song->status !== 'approved') {
            abort(404);
        }

        $userId = $request->user('sanctum')?->id ?? $request->user()?->id;
        $song->loadCount('likes');

        if ($userId) {
            $song->setAttribute(
                'is_liked',
                $song->likes()->where('user_id', $userId)->exists()
            );
        }

        // Only load published lyric records when lyrics are publicly allowed
        $lyricsRelation = $song->lyrics_visible_to_public
            ? ['lyrics' => fn ($q) => $q->where('is_published', true)]
            : [];

        return $this->ok(new SongResource($song->load(
            array_merge(['choir:id,name', 'songCategory'], $lyricsRelation)
        )));
    }

    public function allPerformances(Request $request): \Illuminate\Http\JsonResponse
    {
        $today = now()->toDateString();
        $timeframe = $request->input('timeframe', 'upcoming');

        $q = Performance::query()
            ->where('is_public', true)
            ->whereNotIn('status', ['cancelled'])
            ->with([
                'choir:id,name,description,logo_path',
                // Select only public-safe columns from songs — deliberately excludes 'lyrics'
                'songs' => function ($sq) {
                    $sq->select(
                        'songs.id', 'songs.title', 'songs.composer', 'songs.artist',
                        'songs.original_key', 'songs.scale', 'songs.cover_image_path'
                    )->withCount('likes');
                },
            ]);

        if ($timeframe === 'past') {
            $q->where('date', '<', $today)
              ->orderBy('date', 'desc')
              ->orderBy('start_time', 'desc');
        } elseif ($timeframe === 'all') {
            $q->orderBy('date', 'desc')
              ->orderBy('start_time', 'desc');
        } else {
            // Default: upcoming
            $q->where('date', '>=', $today)
              ->orderBy('date', 'asc')
              ->orderBy('start_time', 'asc');
        }

        if ($request->filled('choir_id')) {
            $q->where('choir_id', $request->integer('choir_id'));
        }

        if ($request->filled('type') && $request->input('type') !== 'all') {
            $q->where('type', $request->input('type'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $q->where(function ($sub) use ($search) {
                $sub->where('title', 'like', '%' . $search . '%')
                    ->orWhere('venue', 'like', '%' . $search . '%')
                    ->orWhere('location', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%')
                    ->orWhere('type', 'like', '%' . $search . '%')
                    ->orWhereHas('choir', function ($c) use ($search) {
                        $c->where('name', 'like', '%' . $search . '%');
                    });
            });
        }

        return $this->paginate($q, PerformanceResource::class, 12);
    }

    public function publicPerformanceDetail(Request $request, Performance $performance): \Illuminate\Http\JsonResponse
    {
        if (!$performance->is_public) {
            abort(404);
        }

        return $this->ok(new PerformanceResource($performance->load([
            'choir:id,name,description,logo_path',
            // Only load published songs; do NOT include raw lyrics field
            'songs' => function ($q) {
                $q->where('is_published', true)
                  ->select(
                      'songs.id', 'songs.title', 'songs.composer', 'songs.artist',
                      'songs.original_key', 'songs.scale', 'songs.cover_image_path'
                  )
                  ->withCount('likes');
            },
        ])));
    }

    public function allGallery(Request $request): \Illuminate\Http\JsonResponse
    {
        $q = GalleryItem::query()
            ->where('is_public', true)
            ->with(['choir:id,name', 'performance:id,title']);

        if ($request->filled('choir_id')) {
            $q->where('choir_id', $request->integer('choir_id'));
        }

        $q->latest('event_date')->latest('id');

        return $this->paginate($q, GalleryResource::class);
    }
}
