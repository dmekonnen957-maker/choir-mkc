<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Choir\ChoirRequest;
use App\Http\Resources\Api\ChoirResource;
use App\Models\Choir;
use Illuminate\Http\Request;

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

        return $this->paginate($q->withCount('members'), ChoirResource::class);
    }

    public function store(ChoirRequest $request): \Illuminate\Http\JsonResponse
    {
        $this->authorize('create', Choir::class);

        $data = $request->validated();
        $data['created_by'] = $request->user()->id;

        $choir = Choir::create($data);

        return $this->ok(new ChoirResource($choir), 'Choir created', 201);
    }

    public function show(Request $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $choir);

        $choir->load('voiceSections', 'songCategories')->loadCount('members');

        return $this->ok(new ChoirResource($choir));
    }

    public function update(ChoirRequest $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        $this->authorize('update', $choir);

        $choir->update($request->validated());

        return $this->ok(new ChoirResource($choir), 'Choir updated');
    }

    public function destroy(Choir $choir): \Illuminate\Http\JsonResponse
    {
        $this->authorize('delete', $choir);

        $choir->delete();

        return $this->ok(null, 'Choir deleted');
    }
}
