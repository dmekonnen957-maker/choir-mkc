<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Performance\StorePerformanceSongRequest;
use App\Http\Requests\Api\Performance\UpdatePerformanceSongRequest;
use App\Http\Resources\Api\SongResource;
use App\Models\Choir;
use App\Models\Performance;
use App\Models\PerformanceSong;
use Illuminate\Http\Request;

class PerformanceSongController extends ApiController
{
    private function map(PerformanceSong $ps): array
    {
        return [
            'id' => $ps->id,
            'song' => new SongResource($ps->song),
            'sequence_number' => $ps->sequence_number,
            'notes' => $ps->notes,
        ];
    }

    public function index(Request $request, Choir $choir, Performance $performance): \Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $performance);

        $items = $performance->performanceSongs()->with('song')->get();

        return $this->ok($items->map(fn(PerformanceSong $ps) => $this->map($ps)));
    }

    public function store(StorePerformanceSongRequest $request, Choir $choir, Performance $performance): \Illuminate\Http\JsonResponse
    {
        $this->authorize('update', $performance);

        $data = $request->validated();
        $data['choir_id'] = $choir->id;
        $data['performance_id'] = $performance->id;

        $ps = PerformanceSong::create($data);
        $ps->load('song');

        return $this->ok($this->map($ps), 'Added', 201);
    }

    public function show(Request $request, Choir $choir, Performance $performance, PerformanceSong $performanceSong): \Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $performance);

        $performanceSong->load('song');

        return $this->ok($this->map($performanceSong));
    }

    public function update(UpdatePerformanceSongRequest $request, Choir $choir, Performance $performance, PerformanceSong $performanceSong): \Illuminate\Http\JsonResponse
    {
        $this->authorize('update', $performance);

        $performanceSong->update($request->validated());
        $performanceSong->load('song');

        return $this->ok($this->map($performanceSong));
    }

    public function destroy(Choir $choir, Performance $performance, PerformanceSong $performanceSong): \Illuminate\Http\JsonResponse
    {
        $this->authorize('update', $performance);

        $performanceSong->delete();

        return $this->ok(null, 'Removed');
    }
}
