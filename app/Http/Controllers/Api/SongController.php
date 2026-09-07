<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\Song\StoreSongRequest;
use App\Http\Requests\Api\Song\UpdateSongRequest;
use App\Http\Resources\Api\SongResource;
use App\Models\Choir;
use App\Models\Notification;
use App\Models\Song;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SongController extends ApiController
{
    public function index(Request $request, ?Choir $choir = null)
    {
        $this->authorize('viewAny', Song::class);

        $q = Song::query()->with(['choir:id,name', 'creator:id,name', 'approver:id,name']);

        if ($choir) {
            $q->where('choir_id', $choir->id);
        } elseif ($request->filled('choir_id')) {
            $q->where('choir_id', $request->integer('choir_id'));
        }

        if ($request->filled('status')) {
            $q->where('status', $request->input('status'));
        }

        if ($request->filled('created_by')) {
            $q->where('created_by', $request->integer('created_by'));
        }

        if ($request->filled('search')) {
            $q->where('title', 'like', '%' . $request->input('search') . '%');
        }

        $q->latest();

        return $this->paginate($q, SongResource::class);
    }

    public function store(StoreSongRequest $request, ?Choir $choir = null)
    {
        $this->authorize('create', Song::class);

        $data = $request->validated();
        $choirId = $choir?->id ?? $data['choir_id'];
        $choirModel = Choir::findOrFail($choirId);
        $user = $request->user();

        $isAdmin = $user->hasRole(['admin', 'super-admin'], 'api')
            || $user->hasAnyRole(['admin', 'super-admin'])
            || in_array($user->role, ['admin', 'super-admin']);

        $song = new Song();
        $song->choir_id = $choirModel->id;
        $song->title = $data['title'];
        $song->composer = $data['composer'] ?? null;
        $song->artist = $data['artist'] ?? null;
        $song->description = $data['description'] ?? null;
        $song->original_key = $data['original_key'] ?? null;
        $song->scale = $data['scale'] ?? null;
        $song->scale_mode = $data['scale_mode'] ?? null;
        $song->lyrics = $data['lyrics'] ?? null;
        $song->created_by = $user->id;

        if ($isAdmin) {
            $song->status = $request->input('status', 'approved');
            $song->is_published = $request->boolean('is_published', true);
            $song->approved_by = $user->id;
            $song->approved_at = now();
        } else {
            // Member or Team Leader submission: always Pending and not published
            $song->status = 'pending';
            $song->is_published = false;
            $song->approved_by = null;
            $song->approved_at = null;
        }

        if ($request->hasFile('audio')) {
            $song->audio_path = $this->storeAudio($request->file('audio'));
        }

        if ($request->hasFile('cover_image')) {
            $song->cover_image_path = $this->storeCoverImage($request->file('cover_image'));
        }

        $song->save();

        // If submitted by non-admin, notify all administrators
        if (!$isAdmin) {
            $admins = User::whereHas('roles', fn ($q) => $q->whereIn('name', ['admin', 'super-admin']))
                ->orWhereIn('role', ['admin', 'super-admin'])
                ->get();

            foreach ($admins as $admin) {
                Notification::create([
                    'id' => (string) Str::uuid(),
                    'type' => 'song_submitted',
                    'notifiable_type' => User::class,
                    'notifiable_id' => $admin->id,
                    'data' => [
                        'title' => 'New Song Submitted',
                        'message' => "{$user->name} submitted a new song: \"{$song->title}\" ({$choirModel->name})",
                        'song_id' => $song->id,
                        'song_title' => $song->title,
                        'choir_name' => $choirModel->name,
                        'submitted_by' => $user->name,
                        'action_url' => '/admin/songs',
                    ],
                    'read_at' => null,
                ]);
            }
        }

        $message = $isAdmin
            ? 'Song created successfully.'
            : 'Song submitted successfully! It is now pending administrator review.';

        return $this->ok(
            SongResource::make($song->load('choir', 'creator', 'approver')),
            $message,
            201
        );
    }

    public function show(Request $request, Song $song)
    {
        $this->authorize('view', $song);
        $song->load(['choir', 'creator', 'approver', 'lyrics' => fn ($q) => $q->latest()]);
        return $this->ok(SongResource::make($song));
    }

    public function approve(Request $request, Song $song)
    {
        $this->authorize('approve', $song);

        $song->status = 'approved';
        $song->is_published = true;
        $song->approved_by = $request->user()->id;
        $song->approved_at = now();
        $song->rejection_reason = null;
        $song->save();

        // Notify submitter if they exist and are not the approving admin
        if ($song->created_by && $song->created_by !== $request->user()->id) {
            Notification::create([
                'id' => (string) Str::uuid(),
                'type' => 'song_approved',
                'notifiable_type' => User::class,
                'notifiable_id' => $song->created_by,
                'data' => [
                    'title' => 'Song Approved',
                    'message' => "Your submitted song \"{$song->title}\" has been approved and published to the library.",
                    'song_id' => $song->id,
                    'song_title' => $song->title,
                    'action_url' => '/member/songs',
                ],
                'read_at' => null,
            ]);
        }

        return $this->ok(
            SongResource::make($song->load('choir', 'creator', 'approver')),
            'Song approved successfully.'
        );
    }

    public function reject(Request $request, Song $song)
    {
        $this->authorize('reject', $song);

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ], [
            'rejection_reason.required' => 'Please provide a reason for rejecting this song.',
            'rejection_reason.max' => 'Rejection reason cannot exceed 1000 characters.',
        ]);

        $song->status = 'rejected';
        $song->is_published = false;
        $song->rejection_reason = $validated['rejection_reason'];
        $song->save();

        // Notify submitter
        if ($song->created_by && $song->created_by !== $request->user()->id) {
            Notification::create([
                'id' => (string) Str::uuid(),
                'type' => 'song_rejected',
                'notifiable_type' => User::class,
                'notifiable_id' => $song->created_by,
                'data' => [
                    'title' => 'Song Submission Rejected',
                    'message' => "Your submitted song \"{$song->title}\" was rejected: {$song->rejection_reason}",
                    'song_id' => $song->id,
                    'song_title' => $song->title,
                    'rejection_reason' => $song->rejection_reason,
                    'action_url' => '/member/songs',
                ],
                'read_at' => null,
            ]);
        }

        return $this->ok(
            SongResource::make($song->load('choir', 'creator', 'approver')),
            'Song rejected.'
        );
    }

    public function update(UpdateSongRequest $request, Song $song)
    {
        $this->authorize('update', $song);

        $data = $request->validated();

        if (array_key_exists('choir_id', $data) && !empty($data['choir_id'])) {
            Choir::findOrFail($data['choir_id']);
            $song->choir_id = $data['choir_id'];
        }
        if (array_key_exists('title', $data)) {
            $song->title = $data['title'];
        }
        if (array_key_exists('composer', $data)) {
            $song->composer = $data['composer'];
        }
        if (array_key_exists('artist', $data)) {
            $song->artist = $data['artist'];
        }
        if (array_key_exists('description', $data)) {
            $song->description = $data['description'];
        }
        if (array_key_exists('original_key', $data)) {
            $song->original_key = $data['original_key'];
        }
        if (array_key_exists('scale', $data)) {
            $song->scale = $data['scale'];
        }
        if (array_key_exists('scale_mode', $data)) {
            $song->scale_mode = $data['scale_mode'];
        }
        if (array_key_exists('lyrics', $data)) {
            $song->lyrics = $data['lyrics'];
        }
        if ($request->has('is_published')) {
            $song->is_published = $request->boolean('is_published');
        }

        if ($request->hasFile('audio')) {
            $this->deleteAudio($song->audio_path);
            $song->audio_path = $this->storeAudio($request->file('audio'));
        } elseif ($request->boolean('remove_audio')) {
            $this->deleteAudio($song->audio_path);
            $song->audio_path = null;
        }

        if ($request->hasFile('cover_image')) {
            $this->deleteCoverImage($song->cover_image_path);
            $song->cover_image_path = $this->storeCoverImage($request->file('cover_image'));
        } elseif ($request->boolean('remove_cover_image')) {
            $this->deleteCoverImage($song->cover_image_path);
            $song->cover_image_path = null;
        }

        $song->save();

        return $this->ok(SongResource::make($song->load('choir', 'creator')), 'Song updated successfully');
    }

    public function destroy(Request $request, Song $song)
    {
        $this->authorize('delete', $song);
        $this->deleteAudio($song->audio_path);
        $this->deleteCoverImage($song->cover_image_path);
        $song->delete();
        return $this->ok(null, 'Song deleted successfully');
    }

    public function audio(Request $request, Song $song)
    {
        $this->authorize('view', $song);

        if (!$song->audio_path) {
            return $this->error('No audio file for this song.', null, 404);
        }

        $path = Storage::disk('public')->path($song->audio_path);
        if (!is_file($path)) {
            return $this->error('Audio file not found.', null, 404);
        }

        return response()->file($path, ['Content-Type' => 'audio/mpeg']);
    }

    protected function storeAudio($file): string
    {
        $filename = uniqid('song_', true) . '.mp3';
        return Storage::disk('public')->putFileAs('songs', $file, $filename);
    }

    protected function deleteAudio(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    protected function storeCoverImage($file): string
    {
        $ext = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = uniqid('cover_', true) . '.' . $ext;
        return Storage::disk('public')->putFileAs('covers', $file, $filename);
    }

    protected function deleteCoverImage(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
