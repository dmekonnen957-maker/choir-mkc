<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerformanceSong extends Model
{
    use HasFactory;

    protected $fillable = [
        'choir_id',
        'performance_id',
        'song_id',
        'sequence_number',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'sequence_number' => 'integer',
        ];
    }

    public function choir(): BelongsTo
    {
        return $this->belongsTo(Choir::class);
    }

    public function performance(): BelongsTo
    {
        return $this->belongsTo(Performance::class);
    }

    public function song(): BelongsTo
    {
        return $this->belongsTo(Song::class);
    }
}
