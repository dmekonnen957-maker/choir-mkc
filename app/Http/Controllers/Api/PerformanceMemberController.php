<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Performance\StorePerformanceMemberRequest;
use App\Http\Requests\Api\Performance\UpdatePerformanceMemberRequest;
use App\Http\Resources\Api\MemberResource;
use App\Models\Choir;
use App\Models\Performance;
use App\Models\PerformanceMember;
use Illuminate\Http\Request;

class PerformanceMemberController extends ApiController
{
    private function map(PerformanceMember $pm): array
    {
        return [
            'id' => $pm->id,
            'member' => new MemberResource($pm->member),
            'expected' => $pm->expected,
            'participation_status' => $pm->participation_status,
            'notes' => $pm->notes,
        ];
    }

    public function index(Request $request, Choir $choir, Performance $performance): \Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $performance);

        $items = $performance->performanceMembers()->with('member')->get();

        return $this->ok($items->map(fn(PerformanceMember $pm) => $this->map($pm)));
    }

    public function store(StorePerformanceMemberRequest $request, Choir $choir, Performance $performance): \Illuminate\Http\JsonResponse
    {
        $this->authorize('update', $performance);

        $data = $request->validated();
        $data['choir_id'] = $choir->id;
        $data['performance_id'] = $performance->id;

        $pm = PerformanceMember::create($data);
        $pm->load('member');

        return $this->ok($this->map($pm), 'Added', 201);
    }

    public function show(Request $request, Choir $choir, Performance $performance, PerformanceMember $performanceMember): \Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $performance);

        $performanceMember->load('member');

        return $this->ok($this->map($performanceMember));
    }

    public function update(UpdatePerformanceMemberRequest $request, Choir $choir, Performance $performance, PerformanceMember $performanceMember): \Illuminate\Http\JsonResponse
    {
        $this->authorize('update', $performance);

        $performanceMember->update($request->validated());
        $performanceMember->load('member');

        return $this->ok($this->map($performanceMember));
    }

    public function destroy(Choir $choir, Performance $performance, PerformanceMember $performanceMember): \Illuminate\Http\JsonResponse
    {
        $this->authorize('update', $performance);

        $performanceMember->delete();

        return $this->ok(null, 'Removed');
    }
}
