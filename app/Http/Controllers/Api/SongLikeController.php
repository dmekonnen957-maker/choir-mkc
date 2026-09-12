<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\Api\SongResource;
use App\Models\Song;
use App\Models\SongLike;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SongLikeController extends ApiController
{
    public function like(Request $request, Song $song): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->error('Unauthenticated', null, 401);
        }

        SongLike::firstOrCreate([
            'song_id' => $song->id,
            'user_id' => $user->id,
        ]);

        $likesCount = $song->likes()->count();

        return $this->ok([
            'song_id' => $song->id,
            'likes_count' => $likesCount,
            'is_liked' => true,
        ], 'Song liked successfully.');
    }

    public function unlike(Request $request, Song $song): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->error('Unauthenticated', null, 401);
        }

        SongLike::where('song_id', $song->id)
            ->where('user_id', $user->id)
            ->delete();

        $likesCount = $song->likes()->count();

        return $this->ok([
            'song_id' => $song->id,
            'likes_count' => $likesCount,
            'is_liked' => false,
        ], 'Song unliked successfully.');
    }

    public function status(Request $request, Song $song): JsonResponse
    {
        $userId = $request->user('sanctum')?->id;
        $isLiked = $userId ? $song->likes()->where('user_id', $userId)->exists() : false;
        $likesCount = $song->likes()->count();

        return $this->ok([
            'song_id' => $song->id,
            'likes_count' => $likesCount,
            'is_liked' => $isLiked,
        ]);
    }

    public function myLikedSongs(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->error('Unauthenticated', null, 401);
        }

        $userId = $user->id;

        $q = $user->likedSongs()
            ->where('songs.is_published', true)
            ->where('songs.status', 'approved')
            ->with(['choir:id,name', 'songCategory'])
            ->withCount('likes')
            ->withExists(['likes as is_liked' => function ($sub) use ($userId) {
                $sub->where('user_id', $userId);
            }])
            ->orderBy('song_likes.created_at', 'desc');

        return $this->paginate($q, SongResource::class, 16);
    }
}

