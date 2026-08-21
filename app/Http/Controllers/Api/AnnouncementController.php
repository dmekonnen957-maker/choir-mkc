<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Announcement\StoreAnnouncementRequest;
use App\Http\Requests\Api\Announcement\UpdateAnnouncementRequest;
use App\Http\Resources\Api\AnnouncementResource;
use App\Models\Announcement;
use App\Models\Choir;
use Illuminate\Http\Request;

class AnnouncementController extends ApiController
{
    public function index(Request $request, Choir $choir)
    {
        $this->authorize('viewAny', Announcement::class);

        return $this->paginate($choir->announcements(), AnnouncementResource::class);
    }

    public function store(StoreAnnouncementRequest $request, Choir $choir)
    {
        $this->authorize('create', Announcement::class);

        $announcement = $choir->announcements()->create([
            'choir_id' => $choir->id,
            'created_by' => $request->user()->id,
            ...$request->validated(),
        ]);

        return $this->ok(new AnnouncementResource($announcement), 'Created', 201);
    }

    public function show(Request $request, Choir $choir, Announcement $announcement)
    {
        $this->authorize('view', $announcement);

        return $this->ok(new AnnouncementResource($announcement));
    }

    public function update(UpdateAnnouncementRequest $request, Choir $choir, Announcement $announcement)
    {
        $this->authorize('update', $announcement);

        $announcement->update($request->validated());

        return $this->ok(new AnnouncementResource($announcement));
    }

    public function destroy(Choir $choir, Announcement $announcement)
    {
        $this->authorize('delete', $announcement);

        $announcement->delete();

        return $this->ok(null, 'Deleted');
    }
}
