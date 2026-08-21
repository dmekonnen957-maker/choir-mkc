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

        return $this->paginate($choir->performances(), PerformanceResource::class);
    }

    public function store(StorePerformanceRequest $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        $this->authorize('create', Performance::class);

        $data = $request->validated();
        $data['choir_id'] = $choir->id;
        $data['created_by'] = $request->user()->id;

        $performance = Performance::create($data);

        return $this->ok(new PerformanceResource($performance), 'Created', 201);
    }

    public function show(Request $request, Choir $choir, Performance $performance): \Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $performance);

        $performance->load([
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

        $performance->update($data);

        return $this->ok(new PerformanceResource($performance));
    }

    public function destroy(Choir $choir, Performance $performance): \Illuminate\Http\JsonResponse
    {
        $this->authorize('delete', $performance);

        $performance->delete();

        return $this->ok(null, 'Deleted');
    }
}
