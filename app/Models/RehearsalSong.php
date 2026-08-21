<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RehearsalSong extends Model
{
    use HasFactory;

    protected $fillable = [
        'choir_id',
        'rehearsal_id',
        'song_id',
        'notes',
    ];

    public function choir(): BelongsTo
    {
        return $this->belongsTo(Choir::class);
    }

    public function rehearsal(): BelongsTo
    {
        return $this->belongsTo(Rehearsal::class);
    }

    public function song(): BelongsTo
    {
        return $this->belongsTo(Song::class);
    }
}
