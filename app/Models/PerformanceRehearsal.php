<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerformanceRehearsal extends Model
{
    use HasFactory;

    protected $fillable = [
        'choir_id',
        'performance_id',
        'rehearsal_id',
    ];

    public function choir(): BelongsTo
    {
        return $this->belongsTo(Choir::class);
    }

    public function performance(): BelongsTo
    {
        return $this->belongsTo(Performance::class);
    }

    public function rehearsal(): BelongsTo
    {
        return $this->belongsTo(Rehearsal::class);
    }
}
