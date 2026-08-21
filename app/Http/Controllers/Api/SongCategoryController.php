<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\SongCategory\StoreSongCategoryRequest;
use App\Http\Requests\Api\SongCategory\UpdateSongCategoryRequest;
use App\Http\Resources\Api\SongCategoryResource;
use App\Models\Choir;
use App\Models\SongCategory;
use Illuminate\Http\Request;

class SongCategoryController extends ApiController
{
    public function index(Request $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        $this->authorize('viewAny', SongCategory::class);

        $q = $choir->songCategories();

        if ($request->filled('search')) {
            $q->where('name', 'like', '%' . $request->input('search') . '%');
        }

        return $this->paginate($q, SongCategoryResource::class);
    }

    public function show(Request $request, Choir $choir, SongCategory $songCategory): \Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $songCategory);

        return $this->ok(new SongCategoryResource($songCategory));
    }

    public function store(StoreSongCategoryRequest $request, Choir $choir): \Illuminate\Http\JsonResponse
    {
        $this->authorize('update', $choir);

        $data = $request->validated();
        $data['choir_id'] = $choir->id;

        $songCategory = SongCategory::create($data);

        return $this->ok(new SongCategoryResource($songCategory), 'Song category created', 201);
    }

    public function update(UpdateSongCategoryRequest $request, Choir $choir, SongCategory $songCategory): \Illuminate\Http\JsonResponse
    {
        $this->authorize('update', $choir);

        $songCategory->update($request->validated());

        return $this->ok(new SongCategoryResource($songCategory), 'Song category updated');
    }

    public function destroy(Choir $choir, SongCategory $songCategory): \Illuminate\Http\JsonResponse
    {
        $this->authorize('update', $choir);

        $songCategory->delete();

        return $this->ok(null, 'Song category deleted');
    }
}
