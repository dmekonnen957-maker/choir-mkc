<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Song\StoreSongRequest;
use App\Http\Requests\Api\Song\UpdateSongRequest;
use App\Http\Resources\Api\SongResource;
use App\Models\Choir;
use App\Models\Song;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SongController extends ApiController
{
    public function index(Request $request, ?Choir $choir = null)
    {
        $this->authorize('viewAny', Song::class);

        $q = Song::query()->with(['choir:id,name', 'creator:id,name']);

        if ($choir) {
            $q->where('choir_id', $choir->id);
        } elseif ($request->filled('choir_id')) {
            $q->where('choir_id', $request->integer('choir_id'));
        }

        if ($request->filled('search')) {
            $q->where('title', 'like', '%' . $request->input('search') . '%');
        }

        $q->latest();

        return $this->paginate($q, SongResource::class);
    }

    public function store(StoreSongRequest $request, ?Choir $choir = null)
    {
        $this->authorize('create', Song::class);

        $data = $request->validated();
        $choirId = $choir?->id ?? $data['choir_id'];
        $choirModel = Choir::findOrFail($choirId);

        $song = new Song();
        $song->choir_id = $choirModel->id;
        $song->title = $data['title'];
        $song->composer = $data['composer'] ?? null;
        $song->artist = $data['artist'] ?? null;
        $song->description = $data['description'] ?? null;
        $song->original_key = $data['original_key'] ?? null;
        $song->scale = $data['scale'] ?? null;
        $song->scale_mode = $data['scale_mode'] ?? null;
        $song->lyrics = $data['lyrics'] ?? null;
        $song->is_published = $request->boolean('is_published', true);
        $song->created_by = $request->user()->id;

        if ($request->hasFile('audio')) {
            $song->audio_path = $this->storeAudio($request->file('audio'));
        }

        $song->save();

        return $this->ok(SongResource::make($song->load('choir', 'creator')), 'Song created successfully', 201);
    }

    public function show(Request $request, Song $song)
    {
        $this->authorize('view', $song);
        $song->load(['choir', 'creator', 'lyrics' => fn ($q) => $q->latest()]);
        return $this->ok(SongResource::make($song));
    }

    public function update(UpdateSongRequest $request, Song $song)
    {
        $this->authorize('update', $song);

        $data = $request->validated();

        if (array_key_exists('choir_id', $data) && !empty($data['choir_id'])) {
            Choir::findOrFail($data['choir_id']);
            $song->choir_id = $data['choir_id'];
        }
        if (array_key_exists('title', $data)) {
            $song->title = $data['title'];
        }
        if (array_key_exists('composer', $data)) {
            $song->composer = $data['composer'];
        }
        if (array_key_exists('artist', $data)) {
            $song->artist = $data['artist'];
        }
        if (array_key_exists('description', $data)) {
            $song->description = $data['description'];
        }
        if (array_key_exists('original_key', $data)) {
            $song->original_key = $data['original_key'];
        }
        if (array_key_exists('scale', $data)) {
            $song->scale = $data['scale'];
        }
        if (array_key_exists('scale_mode', $data)) {
            $song->scale_mode = $data['scale_mode'];
        }
        if (array_key_exists('lyrics', $data)) {
            $song->lyrics = $data['lyrics'];
        }
        if ($request->has('is_published')) {
            $song->is_published = $request->boolean('is_published');
        }

        if ($request->hasFile('audio')) {
            $this->deleteAudio($song->audio_path);
            $song->audio_path = $this->storeAudio($request->file('audio'));
        } elseif ($request->boolean('remove_audio')) {
            $this->deleteAudio($song->audio_path);
            $song->audio_path = null;
        }

        $song->save();

        return $this->ok(SongResource::make($song->load('choir', 'creator')), 'Song updated successfully');
    }

    public function destroy(Request $request, Song $song)
    {
        $this->authorize('delete', $song);
        $this->deleteAudio($song->audio_path);
        $song->delete();
        return $this->ok(null, 'Song deleted successfully');
    }

    public function audio(Request $request, Song $song)
    {
        $this->authorize('view', $song);

        if (!$song->audio_path) {
            return $this->error('No audio file for this song.', null, 404);
        }

        $path = Storage::disk('public')->path($song->audio_path);
        if (!is_file($path)) {
            return $this->error('Audio file not found.', null, 404);
        }

        return response()->file($path, ['Content-Type' => 'audio/mpeg']);
    }

    protected function storeAudio($file): string
    {
        $filename = uniqid('song_', true) . '.mp3';
        return Storage::disk('public')->putFileAs('songs', $file, $filename);
    }

    protected function deleteAudio(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
