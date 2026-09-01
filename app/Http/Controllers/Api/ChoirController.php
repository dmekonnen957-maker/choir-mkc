<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Choir\ChoirRequest;
use App\Http\Resources\Api\ChoirResource;
use App\Models\Choir;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ChoirController extends ApiController
{
    public function index(Request $request): \Illuminate\Http\JsonResponse
    {
        $this->authorize('viewAny', Choir::class);

        if ($request->user()->can('choirs.view.all')) {
            $q = Choir::query();
        } else {
            $q = $request->user()->choirs();
        }

        if ($request->filled('search')) {
            $q->where('name', 'like', '%' . $request->input('search') . '%');
        }

        $q->with(['teamLeader:id,name,email'])
            ->withCount(['users', 'songs', 'performances']);

        return $this->paginate($q, ChoirResource::class);
    }

    public function store(ChoirRequest $request): \Illuminate\Http\JsonResponse
    {
        $this->authorize('create', Choir::class);

        $data = $request->validated();
        $data['created_by'] = $request->user()->id;
        $data['slug'] = $this->uniqueSlug($data['name'] ?? null, $data['slug'] ?? null);

        $choir = Choir::create($data);

        if (!empty($data['team_leader_id'])) {
            $choir->setTeamLeader($data['team_leader_id']);
        }

        $choir->load('teamLeader:id,name,email')->loadCount(['users', 'songs', 'performances']);

        return $this->ok(new ChoirResource($choir), 'Choir created successfully', 201);
    }

    public function show(Request $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $choir);

        $choir->load([
            'teamLeader:id,name,email,phone',
            'voiceSections',
            'songCategories',
            'users' => function ($q) {
                $q->withPivot('status')->latest()->take(20);
            },
            'upcoming',
            'history',
        ])->loadCount(['users', 'songs', 'performances']);

        return $this->ok(new ChoirResource($choir));
    }

    public function update(ChoirRequest $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        $this->authorize('update', $choir);

        $data = $request->validated();

        if (!empty($data['name']) && empty($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($data['name'], null, $choir->id);
        }

        $choir->update($data);

        if (array_key_exists('team_leader_id', $data)) {
            $choir->setTeamLeader($data['team_leader_id']);
        }

        $choir->load('teamLeader:id,name,email')->loadCount(['users', 'songs', 'performances']);

        return $this->ok(new ChoirResource($choir), 'Choir updated successfully');
    }

    public function destroy(Request $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        $this->authorize('delete', $choir);

        $request->validate([
            'deletion_reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $reason = $request->input('deletion_reason') ?: $request->input('reason');

        try {
            if ($reason) {
                $choir->deletion_reason = $reason;
                $choir->save();
            }

            // Log deletion in AuditLog
            \App\Models\AuditLog::create([
                'user_id' => $request->user()?->id,
                'choir_id' => $choir->id,
                'action' => 'deleted_choir',
                'description' => "Deleted choir '{$choir->name}'." . ($reason ? " Reason: {$reason}" : ''),
            ]);

            $choir->delete();
        } catch (\Illuminate\Database\QueryException $e) {
            return $this->error(
                'This choir could not be deleted because it still has related records. '
                    . 'Deactivate it instead to preserve its history.',
                null,
                422
            );
        }

        return $this->ok(null, 'Choir deleted successfully');
    }

    protected function uniqueSlug(?string $name, ?string $slug, ?int $ignoreId = null): string
    {
        $base = $slug ?: Str::slug($name ?: 'choir');
        $base = $base ?: 'choir';
        $unique = $base;
        $i = 1;

        while (Choir::where('slug', $unique)
            ->when($ignoreId, fn ($q) => $q->where('id', '<>', $ignoreId))
            ->exists()) {
            $unique = $base . '-' . $i++;
        }

        return $unique;
    }
}
