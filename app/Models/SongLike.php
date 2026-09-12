<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SongLike extends Model
{
    protected $fillable = [
        'song_id',
        'user_id',
    ];

    public function song(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Song::class);
    }

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
