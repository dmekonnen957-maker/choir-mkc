<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Song extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'choir_id',
        'song_category_id',
        'title',
        'composer',
        'artist',
        'arranger',
        'language',
        'year_written',
        'description',
        'cover_image_path',
        'audio_path',
        'is_published',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'year_written' => 'integer',
            'is_published' => 'boolean',
        ];
    }

    public function choir(): BelongsTo
    {
        return $this->belongsTo(Choir::class);
    }

    public function songCategory(): BelongsTo
    {
        return $this->belongsTo(SongCategory::class);
    }

    public function lyrics(): HasMany
    {
        return $this->hasMany(Lyric::class);
    }

    public function histories(): HasMany
    {
        return $this->hasMany(SongHistory::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(SongFile::class);
    }

    public function rehearsals(): BelongsToMany
    {
        return $this->belongsToMany(Rehearsal::class, 'rehearsal_songs')
            ->withPivot(['choir_id', 'notes'])
            ->withTimestamps();
    }

    public function performances(): BelongsToMany
    {
        return $this->belongsToMany(Performance::class, 'performance_songs')
            ->withPivot(['choir_id', 'sequence_number', 'notes'])
            ->withTimestamps();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    public function scopeForChoir($query, $choirId)
    {
        return $query->where('choir_id', $choirId);
    }

    public function audioUrl(): Attribute
    {
        return Attribute::get(function () {
            return $this->audio_path ? Storage::disk('public')->url($this->audio_path) : null;
        });
    }
}
