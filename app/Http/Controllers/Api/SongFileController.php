<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\SongFile\StoreSongFileRequest;
use App\Http\Requests\Api\SongFile\UpdateSongFileRequest;
use App\Http\Resources\Api\SongFileResource;
use App\Models\Choir;
use App\Models\Song;
use App\Models\SongFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SongFileController extends ApiController
{
    public function index(Request $request, Choir $choir, Song $song)
    {
        $this->authorize('view', $song);

        $query = $song->files();

        return $this->paginate($query, SongFileResource::class);
    }

    public function store(StoreSongFileRequest $request, Choir $choir, Song $song)
    {
        $this->authorize('update', $song);

        $uploaded = $request->file('file');
        $path = $uploaded->store("song_files/{$choir->id}/{$song->id}", 'local');

        $file = SongFile::create([
            'choir_id' => $choir->id,
            'song_id' => $song->id,
            'file_name' => $request->input('file_name', $uploaded->getClientOriginalName()),
            'file_type' => strtolower($uploaded->getClientOriginalExtension()),
            'mime_type' => $uploaded->getClientMimeType(),
            'file_size' => $uploaded->getSize(),
            'file_path' => $path,
            'description' => $request->input('description'),
            'is_public' => $request->boolean('is_public'),
            'is_downloadable' => $request->boolean('is_downloadable', true),
        ]);

        return $this->ok(new SongFileResource($file), 'File uploaded', 201);
    }

    public function show(Request $request, Choir $choir, Song $song, SongFile $file)
    {
        $this->authorize('view', $song);

        return $this->ok(new SongFileResource($file));
    }

    public function update(UpdateSongFileRequest $request, Choir $choir, Song $song, SongFile $file)
    {
        $this->authorize('update', $song);

        $file->update($request->validated());

        return $this->ok(new SongFileResource($file), 'File updated');
    }

    public function destroy(Choir $choir, Song $song, SongFile $file)
    {
        $this->authorize('update', $song);

        Storage::disk('local')->delete($file->file_path);

        $file->delete();

        return $this->ok(null, 'File deleted');
    }
}
