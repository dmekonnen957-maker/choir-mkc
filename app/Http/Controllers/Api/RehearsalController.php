<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Rehearsal\AttachRehearsalSongRequest;
use App\Http\Requests\Api\Rehearsal\StoreRehearsalRequest;
use App\Http\Requests\Api\Rehearsal\UpdateRehearsalRequest;
use App\Http\Resources\Api\RehearsalResource;
use App\Http\Resources\Api\SongResource;
use App\Models\Choir;
use App\Models\Rehearsal;
use App\Models\Song;
use Illuminate\Http\Request;

class RehearsalController extends ApiController
{
    public function index(Request $request, Choir $choir)
    {
        $this->authorize('viewAny', Rehearsal::class);

        return $this->paginate($choir->rehearsals(), RehearsalResource::class);
    }

    public function store(StoreRehearsalRequest $request, Choir $choir)
    {
        $this->authorize('create', Rehearsal::class);

        $rehearsal = $choir->rehearsals()->create([
            'choir_id' => $choir->id,
            'created_by' => $request->user()->id,
            ...$request->validated(),
        ]);

        return $this->ok(new RehearsalResource($rehearsal), 'Created', 201);
    }

    public function show(Request $request, Choir $choir, Rehearsal $rehearsal)
    {
        $this->authorize('view', $rehearsal);

        return $this->ok(new RehearsalResource($rehearsal->load('songs')));
    }

    public function update(UpdateRehearsalRequest $request, Choir $choir, Rehearsal $rehearsal)
    {
        $this->authorize('update', $rehearsal);

        $rehearsal->update($request->validated());

        return $this->ok(new RehearsalResource($rehearsal));
    }

    public function destroy(Choir $choir, Rehearsal $rehearsal)
    {
        $this->authorize('delete', $rehearsal);

        $rehearsal->delete();

        return $this->ok(null, 'Rehearsal deleted');
    }

    public function songs(Request $request, Choir $choir, Rehearsal $rehearsal)
    {
        $this->authorize('view', $rehearsal);

        return $this->ok(
            SongResource::collection($rehearsal->songs()->withPivot('status', 'notes')->get())
        );
    }

    public function attachSong(AttachRehearsalSongRequest $request, Choir $choir, Rehearsal $rehearsal)
    {
        $this->authorize('update', $rehearsal);

        $rehearsal->songs()->syncWithoutDetaching([
            $request->input('song_id') => [
                'choir_id' => $choir->id,
                'status' => $request->input('status'),
                'notes' => $request->input('notes'),
            ],
        ]);

        return $this->ok(null, 'Song attached', 201);
    }

    public function detachSong(Request $request, Choir $choir, Rehearsal $rehearsal, Song $song)
    {
        $this->authorize('update', $rehearsal);

        $rehearsal->songs()->detach($song->id);

        return $this->ok(null, 'Song detached');
    }
}
