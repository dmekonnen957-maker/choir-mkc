<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SongFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'choir_id',
        'song_id',
        'file_name',
        'file_path',
        'file_type',
        'mime_type',
        'file_size',
        'description',
        'is_public',
        'is_downloadable',
        'uploaded_by',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'is_public' => 'boolean',
            'is_downloadable' => 'boolean',
        ];
    }

    public function choir(): BelongsTo
    {
        return $this->belongsTo(Choir::class);
    }

    public function song(): BelongsTo
    {
        return $this->belongsTo(Song::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function isAudio(): bool
    {
        return in_array(strtolower($this->file_type ?: pathinfo($this->file_name, PATHINFO_EXTENSION)), [
            'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac',
        ]);
    }

    public function isVideo(): bool
    {
        return in_array(strtolower($this->file_type ?: pathinfo($this->file_name, PATHINFO_EXTENSION)), [
            'mp4', 'mov', 'avi', 'mkv', 'webm',
        ]);
    }

    public function isPdf(): bool
    {
        return strtolower($this->file_type ?: pathinfo($this->file_name, PATHINFO_EXTENSION)) === 'pdf';
    }

    public function scopeForChoir($query, $choirId)
    {
        return $query->where('choir_id', $choirId);
    }
}
