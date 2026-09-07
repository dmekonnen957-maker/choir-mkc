<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Performance\StorePerformanceRequest;
use App\Http\Requests\Api\Performance\UpdatePerformanceRequest;
use App\Http\Resources\Api\PerformanceResource;
use App\Models\Choir;
use App\Models\Performance;
use Illuminate\Http\Request;

class PerformanceController extends ApiController
{
    public function index(Request $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        $this->authorize('viewAny', Performance::class);

        $query = $choir->performances()
            ->with(['choir', 'creator', 'songs'])
            ->orderByDesc('date')
            ->orderByDesc('start_time');

        return $this->paginate($query, PerformanceResource::class);
    }

    public function store(StorePerformanceRequest $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        $this->authorize('create', Performance::class);

        $data = $request->validated();
        $data['choir_id'] = $choir->id;
        $data['created_by'] = $request->user()->id;
        $data['venue'] = $data['venue'] ?? $data['location'] ?? 'Main Sanctuary';
        $data['location'] = $data['location'] ?? $data['venue'] ?? 'Main Sanctuary';
        $data['status'] = $data['status'] ?? 'scheduled';
        $data['type'] = $data['type'] ?? 'Worship';
        if (!array_key_exists('is_public', $data) || $data['is_public'] === null) {
            $data['is_public'] = true;
        }

        $performance = Performance::create($data);

        return $this->ok(new PerformanceResource($performance->load(['choir', 'creator'])), 'Performance created successfully', 201);
    }

    public function show(Request $request, Choir $choir, Performance $performance): \Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $performance);

        $performance->load([
            'choir.teamLeader',
            'creator',
            'performanceMembers.member',
            'performanceSongs.song',
            'performanceRehearsals.rehearsal',
        ]);

        return $this->ok(new PerformanceResource($performance));
    }

    public function update(UpdatePerformanceRequest $request, Choir $choir, Performance $performance): \Illuminate\Http\JsonResponse
    {
        $this->authorize('update', $performance);

        $data = $request->validated();
        $data['updated_by'] = $request->user()->id;
        if (isset($data['location']) && !isset($data['venue'])) {
            $data['venue'] = $data['location'];
        }

        $performance->update($data);

        return $this->ok(new PerformanceResource($performance->load(['choir', 'creator'])), 'Performance updated successfully');
    }

    public function destroy(Choir $choir, Performance $performance): \Illuminate\Http\JsonResponse
    {
        $this->authorize('delete', $performance);

        $performance->delete();

        return $this->ok(null, 'Performance deleted successfully');
    }
}
