<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Song\StoreSongRequest;
use App\Http\Requests\Api\Song\UpdateSongRequest;
use App\Http\Resources\Api\SongResource;
use App\Models\Choir;
use App\Models\Song;
use Illuminate\Http\Request;

class SongController extends ApiController
{
    public function index(Request $request, Choir $choir)
    {
        $this->authorize('viewAny', Song::class);

        $query = $choir->songs()->with('songCategory')->withCount('lyrics');

        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->input('search') . '%');
        }

        if ($request->filled('category')) {
            $query->where('song_category_id', $request->input('category'));
        }

        return $this->paginate($query, SongResource::class);
    }

    public function store(StoreSongRequest $request, Choir $choir)
    {
        $this->authorize('create', Song::class);

        $data = $request->validated();
        $data['choir_id'] = $choir->id;
        $data['created_by'] = $request->user()->id;

        $song = Song::create($data);

        return $this->ok(new SongResource($song), 'Song created', 201);
    }

    public function show(Request $request, Choir $choir, Song $song)
    {
        $this->authorize('view', $song);

        $song->load([
            'songCategory',
            'lyrics' => fn ($q) => $q->where('is_published', true),
        ]);

        return $this->ok(new SongResource($song));
    }

    public function update(UpdateSongRequest $request, Choir $choir, Song $song)
    {
        $this->authorize('update', $song);

        $data = $request->validated();
        $data['updated_by'] = $request->user()->id;

        $song->update($data);

        return $this->ok(new SongResource($song), 'Song updated');
    }

    public function destroy(Choir $choir, Song $song)
    {
        $this->authorize('delete', $song);

        $song->delete();

        return $this->ok(null, 'Song deleted');
    }
}
