<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Gallery\StoreGalleryRequest;
use App\Http\Requests\Api\Gallery\UpdateGalleryRequest;
use App\Http\Resources\Api\GalleryResource;
use App\Models\Choir;
use App\Models\GalleryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GalleryController extends ApiController
{
    public function index(Request $request, Choir $choir)
    {
        $this->authorize('viewAny', GalleryItem::class);

        return $this->paginate($choir->galleryItems(), GalleryResource::class);
    }

    public function store(StoreGalleryRequest $request, Choir $choir)
    {
        $this->authorize('create', GalleryItem::class);

        $data = $request->validated();
        $data['choir_id'] = $choir->id;

        if ($request->hasFile('media')) {
            $uploaded = $request->file('media');
            $path = Storage::disk('local')->put("gallery/{$choir->id}", $uploaded);
            $mime = $uploaded->getClientMimeType();
            $data['media_path'] = $path;
            $data['media_type'] = str_starts_with($mime, 'video/') ? 'video' : 'image';
            $data['file_name'] = $uploaded->getClientOriginalName();
        } elseif (!empty($data['media_path'])) {
            $data['media_type'] = str_starts_with($data['media_path'], 'video') ? 'video' : 'image';
        }

        $item = $choir->galleryItems()->create($data);

        return $this->ok(new GalleryResource($item), 'Created', 201);
    }

    public function show(Request $request, Choir $choir, GalleryItem $galleryItem)
    {
        $this->authorize('view', $galleryItem);

        return $this->ok(new GalleryResource($galleryItem));
    }

    public function update(UpdateGalleryRequest $request, Choir $choir, GalleryItem $galleryItem)
    {
        $this->authorize('update', $galleryItem);

        $data = $request->validated();

        if ($request->hasFile('media')) {
            $uploaded = $request->file('media');
            $path = Storage::disk('local')->put("gallery/{$choir->id}", $uploaded);
            $mime = $uploaded->getClientMimeType();
            $data['media_path'] = $path;
            $data['media_type'] = str_starts_with($mime, 'video/') ? 'video' : 'image';
            $data['file_name'] = $uploaded->getClientOriginalName();
        } elseif (array_key_exists('media_path', $data) && !empty($data['media_path'])) {
            $data['media_type'] = str_starts_with($data['media_path'], 'video') ? 'video' : 'image';
        }

        $galleryItem->update($data);

        return $this->ok(new GalleryResource($galleryItem));
    }

    public function destroy(Choir $choir, GalleryItem $galleryItem)
    {
        $this->authorize('delete', $galleryItem);

        $galleryItem->delete();

        return $this->ok(null, 'Deleted');
    }
}
