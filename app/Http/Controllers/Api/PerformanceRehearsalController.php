<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Performance\StorePerformanceRehearsalRequest;
use App\Http\Requests\Api\Performance\UpdatePerformanceRehearsalRequest;
use App\Http\Resources\Api\RehearsalResource;
use App\Models\Choir;
use App\Models\Performance;
use App\Models\PerformanceRehearsal;
use Illuminate\Http\Request;

class PerformanceRehearsalController extends ApiController
{
    private function map(PerformanceRehearsal $pr): array
    {
        return [
            'id' => $pr->id,
            'rehearsal' => new RehearsalResource($pr->rehearsal),
        ];
    }

    public function index(Request $request, Choir $choir, Performance $performance): \Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $performance);

        $items = $performance->performanceRehearsals()->with('rehearsal')->get();

        return $this->ok($items->map(fn(PerformanceRehearsal $pr) => $this->map($pr)));
    }

    public function store(StorePerformanceRehearsalRequest $request, Choir $choir, Performance $performance): \Illuminate\Http\JsonResponse
    {
        $this->authorize('update', $performance);

        $data = $request->validated();
        $data['choir_id'] = $choir->id;
        $data['performance_id'] = $performance->id;

        $pr = PerformanceRehearsal::create($data);
        $pr->load('rehearsal');

        return $this->ok($this->map($pr), 'Added', 201);
    }

    public function show(Request $request, Choir $choir, Performance $performance, PerformanceRehearsal $performanceRehearsal): \Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $performance);

        $performanceRehearsal->load('rehearsal');

        return $this->ok($this->map($performanceRehearsal));
    }

    public function update(UpdatePerformanceRehearsalRequest $request, Choir $choir, Performance $performance, PerformanceRehearsal $performanceRehearsal): \Illuminate\Http\JsonResponse
    {
        $this->authorize('update', $performance);

        $performanceRehearsal->update($request->validated());
        $performanceRehearsal->load('rehearsal');

        return $this->ok($this->map($performanceRehearsal));
    }

    public function destroy(Choir $choir, Performance $performance, PerformanceRehearsal $performanceRehearsal): \Illuminate\Http\JsonResponse
    {
        $this->authorize('update', $performance);

        $performanceRehearsal->delete();

        return $this->ok(null, 'Removed');
    }
}
