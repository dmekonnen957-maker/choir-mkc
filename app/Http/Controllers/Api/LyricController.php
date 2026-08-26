<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Lyric\StoreLyricRequest;
use App\Http\Requests\Api\Lyric\UpdateLyricRequest;
use App\Http\Resources\Api\LyricResource;
use App\Models\Choir;
use App\Models\Lyric;
use App\Models\Song;
use Illuminate\Http\Request;

class LyricController extends ApiController
{
    public function index(Request $request, ?Choir $choir = null)
    {
        $this->authorize('viewAny', Lyric::class);

        $q = Lyric::query()->with(['choir:id,name', 'song:id,title', 'creator:id,name']);

        if ($choir) {
            $q->where('choir_id', $choir->id);
        } elseif ($request->filled('choir_id')) {
            $q->where('choir_id', $request->integer('choir_id'));
        }

        if ($request->filled('song_id')) {
            $q->where('song_id', $request->integer('song_id'));
        }

        $q->latest();

        return $this->paginate($q, LyricResource::class);
    }

    public function store(StoreLyricRequest $request, ?Choir $choir = null, ?Song $song = null)
    {
        $this->authorize('create', Lyric::class);

        $data = $request->validated();
        $choirId = $choir?->id ?? $data['choir_id'];
        $songId = $song?->id ?? $data['song_id'];

        $choirModel = Choir::findOrFail($choirId);
        $songModel = Song::findOrFail($songId);

        // Multi-choir security: the song must belong to the chosen choir.
        if ($songModel->choir_id !== $choirModel->id) {
            return $this->error('The selected song does not belong to the chosen choir.', null, 422);
        }

        $lyric = Lyric::create([
            'choir_id' => $choirModel->id,
            'song_id' => $songModel->id,
            'language' => $data['language'] ?? null,
            'content' => $data['content'],
            'version_label' => $data['version_label'] ?? null,
            'created_by' => $request->user()->id,
        ]);

        return $this->ok(LyricResource::make($lyric->load('choir', 'song', 'creator')), 'Lyrics created successfully', 201);
    }

    public function show(Request $request, Lyric $lyric)
    {
        $this->authorize('view', $lyric);
        $lyric->load(['choir', 'song', 'creator']);
        return $this->ok(LyricResource::make($lyric));
    }

    public function update(UpdateLyricRequest $request, Lyric $lyric)
    {
        $this->authorize('update', $lyric);

        $data = $request->validated();
        $choirId = $data['choir_id'] ?? $lyric->choir_id;
        $choirModel = Choir::findOrFail($choirId);

        if (array_key_exists('song_id', $data) && !empty($data['song_id'])) {
            $songModel = Song::findOrFail($data['song_id']);
            if ($songModel->choir_id !== $choirModel->id) {
                return $this->error('The selected song does not belong to the chosen choir.', null, 422);
            }
            $lyric->song_id = $songModel->id;
        }

        $lyric->choir_id = $choirModel->id;

        if (array_key_exists('language', $data)) {
            $lyric->language = $data['language'];
        }
        if (array_key_exists('content', $data)) {
            $lyric->content = $data['content'];
        }
        if (array_key_exists('version_label', $data)) {
            $lyric->version_label = $data['version_label'];
        }

        $lyric->save();

        return $this->ok(LyricResource::make($lyric->load('choir', 'song', 'creator')), 'Lyrics updated successfully');
    }

    public function destroy(Request $request, Lyric $lyric)
    {
        $this->authorize('delete', $lyric);

        // Delete only the lyric record; never the song or its audio.
        $lyric->delete();
        return $this->ok(null, 'Lyrics deleted successfully');
    }
}
