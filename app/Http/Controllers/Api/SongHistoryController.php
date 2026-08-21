<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\SongHistory\StoreSongHistoryRequest;
use App\Http\Requests\Api\SongHistory\UpdateSongHistoryRequest;
use App\Http\Resources\Api\SongHistoryResource;
use App\Models\Choir;
use App\Models\Song;
use App\Models\SongHistory;
use Illuminate\Http\Request;

class SongHistoryController extends ApiController
{
    public function index(Request $request, Choir $choir, Song $song)
    {
        $this->authorize('view', $song);

        $query = $song->histories();

        return $this->paginate($query, SongHistoryResource::class);
    }

    public function store(StoreSongHistoryRequest $request, Choir $choir, Song $song)
    {
        $this->authorize('update', $song);

        $data = $request->validated();
        $data['choir_id'] = $choir->id;
        $data['song_id'] = $song->id;
        $data['created_by'] = $request->user()->id;

        $history = SongHistory::create($data);

        return $this->ok(new SongHistoryResource($history), 'Song history created', 201);
    }

    public function show(Request $request, Choir $choir, Song $song, SongHistory $history)
    {
        $this->authorize('view', $song);

        return $this->ok(new SongHistoryResource($history));
    }

    public function update(UpdateSongHistoryRequest $request, Choir $choir, Song $song, SongHistory $history)
    {
        $this->authorize('update', $song);

        $history->update($request->validated());

        return $this->ok(new SongHistoryResource($history), 'Song history updated');
    }

    public function destroy(Choir $choir, Song $song, SongHistory $history)
    {
        $this->authorize('update', $song);

        $history->delete();

        return $this->ok(null, 'Song history deleted');
    }
}
