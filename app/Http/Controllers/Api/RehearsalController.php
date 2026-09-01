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

        $query = $choir->rehearsals()
            ->with(['choir.teamLeader', 'creator'])
            ->orderByDesc('date')
            ->orderByDesc('start_time');

        return $this->paginate($query, RehearsalResource::class);
    }

    public function store(StoreRehearsalRequest $request, Choir $choir)
    {
        $this->authorize('create', Rehearsal::class);

        $data = $request->validated();
        if (isset($data['notes']) && !isset($data['description'])) {
            $data['description'] = $data['notes'];
        }
        unset($data['notes']);

        if (isset($data['status']) && in_array($data['status'], ['upcoming', 'ongoing'], true)) {
            $data['status'] = 'scheduled';
        }

        $rehearsal = $choir->rehearsals()->create([
            'choir_id' => $choir->id,
            'created_by' => $request->user()->id,
            ...$data,
        ]);

        return $this->ok(new RehearsalResource($rehearsal->load(['choir.teamLeader', 'creator'])), 'Created', 201);
    }

    public function show(Request $request, Choir $choir, Rehearsal $rehearsal)
    {
        $this->authorize('view', $rehearsal);

        return $this->ok(new RehearsalResource($rehearsal->load(['songs', 'choir.teamLeader', 'creator'])));
    }

    public function update(UpdateRehearsalRequest $request, Choir $choir, Rehearsal $rehearsal)
    {
        $this->authorize('update', $rehearsal);

        $data = $request->validated();
        if (isset($data['notes']) && !isset($data['description'])) {
            $data['description'] = $data['notes'];
        }
        unset($data['notes']);

        if (isset($data['status']) && in_array($data['status'], ['upcoming', 'ongoing'], true)) {
            $data['status'] = 'scheduled';
        }

        $rehearsal->update($data);

        return $this->ok(new RehearsalResource($rehearsal->load(['choir.teamLeader', 'creator'])));
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
