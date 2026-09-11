<?php

namespace App\Http\Resources\Api;

use App\Services\TransposeService;
use Illuminate\Http\Resources\Json\JsonResource;

class SongResource extends JsonResource
{
    public function toArray($request): array
    {
        $transpose = (int) ($request?->input('transpose', 0) ?? 0);

        $key = $this->original_key;
        $displayLyrics = $this->lyrics;

        if ($transpose !== 0) {
            if ($this->original_key) {
                $key = TransposeService::transposeKey($this->original_key, $transpose);
            }
            if ($this->lyrics !== null) {
                $displayLyrics = TransposeService::transposeLyrics($this->lyrics, $transpose);
            }
        }

        // Determine whether the caller is authenticated.
        // Public (unauthenticated) users must not see lyrics when
        // lyrics_visible_to_public is false, and must never see
        // internal admin-only fields.
        $isAuthenticated = $request && $request->user() !== null;
        $lyricsAllowed   = $isAuthenticated
            || ($this->lyrics_visible_to_public ?? true);

        $data = [
            'id'             => $this->id,
            'choir_id'       => $this->choir_id,
            'choir'          => $this->whenLoaded('choir', function () {
                return $this->choir
                    ? ['id' => $this->choir->id, 'name' => $this->choir->name]
                    : null;
            }),
            'song_category_id' => $this->song_category_id,
            'song_category'    => $this->whenLoaded('songCategory', function () {
                return $this->songCategory
                    ? ['id' => $this->songCategory->id, 'name' => $this->songCategory->name]
                    : null;
            }),
            'title'          => $this->title,
            'composer'       => $this->composer,
            'artist'         => $this->artist,
            'arranger'       => $this->arranger,
            'language'       => $this->language,
            'description'    => $this->description,
            'cover_image_path' => $isAuthenticated ? $this->cover_image_path : null,
            'cover_url'      => $this->cover_image_path
                ? (str_starts_with($this->cover_image_path, 'http')
                    ? $this->cover_image_path
                    : '/storage/' . ltrim($this->cover_image_path, '/'))
                : null,
            // audio_path is an internal storage path; only expose to authenticated users
            'audio_path'     => $isAuthenticated ? $this->audio_path : null,
            'audio_url'      => $this->audio_url,
            'original_key'   => $this->original_key,
            'key'            => $key,
            'scale'          => $this->scale,
            'scale_mode'     => $this->scale_mode,
            // Lyrics: return null for public when not allowed
            'lyrics'         => $lyricsAllowed ? $this->lyrics : null,
            'display_lyrics' => $lyricsAllowed ? $displayLyrics : null,
            'has_lyrics'     => (bool) $this->lyrics,
            'lyrics_visible_to_public' => $this->lyrics_visible_to_public ?? true,
            'is_published'   => $this->is_published,
            'status'         => $this->status ?? ($this->is_published ? 'approved' : 'pending'),
            'created_at'     => $this->created_at,
            'updated_at'     => $this->updated_at,
        ];

        // Admin-only fields — only expose to authenticated users
        if ($isAuthenticated) {
            $data['rejection_reason'] = $this->rejection_reason;
            $data['approved_by']      = $this->approved_by;
            $data['approved_at']      = $this->approved_at;
            $data['created_by']       = $this->created_by;
            $data['approver']         = $this->whenLoaded('approver', function () {
                return $this->approver
                    ? ['id' => $this->approver->id, 'name' => $this->approver->name]
                    : null;
            });
            $data['creator']          = $this->whenLoaded('creator', function () {
                return $this->creator
                    ? ['id' => $this->creator->id, 'name' => $this->creator->name]
                    : null;
            });
            $data['year_written']     = $this->year_written;
            // Structured lyric records (Lyric model rows) — authenticated only
            $data['lyric_records']    = $this->whenLoaded('lyrics', function () {
                return LyricResource::collection($this->lyrics);
            });
        }

        return $data;
    }
}
