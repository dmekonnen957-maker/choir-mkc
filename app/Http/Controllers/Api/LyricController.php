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
    public function index(Request $request, Choir $choir, Song $song)
    {
        $this->authorize('view', $song);

        $query = $song->lyrics();

        return $this->paginate($query, LyricResource::class);
    }

    public function store(StoreLyricRequest $request, Choir $choir, Song $song)
    {
        $this->authorize('update', $song);

        $data = $request->validated();
        $data['choir_id'] = $choir->id;
        $data['song_id'] = $song->id;

        $lyric = Lyric::create($data);

        return $this->ok(new LyricResource($lyric), 'Lyric created', 201);
    }

    public function show(Request $request, Choir $choir, Song $song, Lyric $lyric)
    {
        $this->authorize('view', $song);

        return $this->ok(new LyricResource($lyric));
    }

    public function update(UpdateLyricRequest $request, Choir $choir, Song $song, Lyric $lyric)
    {
        $this->authorize('update', $song);

        $lyric->update($request->validated());

        return $this->ok(new LyricResource($lyric), 'Lyric updated');
    }

    public function destroy(Choir $choir, Song $song, Lyric $lyric)
    {
        $this->authorize('update', $song);

        $lyric->delete();

        return $this->ok(null, 'Lyric deleted');
    }
}
