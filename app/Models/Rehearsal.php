<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Rehearsal extends Model
{
    use HasFactory;

    protected $fillable = [
        'choir_id',
        'title',
        'date',
        'start_time',
        'end_time',
        'location',
        'description',
        'status',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    public function choir(): BelongsTo
    {
        return $this->belongsTo(Choir::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function songs(): BelongsToMany
    {
        return $this->belongsToMany(Song::class, 'rehearsal_songs')
            ->withPivot(['choir_id', 'status', 'notes'])
            ->withTimestamps();
    }

    public function performances(): BelongsToMany
    {
        return $this->belongsToMany(Performance::class, 'performance_rehearsals')
            ->withPivot('choir_id')
            ->withTimestamps();
    }

    public function attendanceSession(): HasOne
    {
        return $this->hasOne(AttendanceSession::class);
    }

    public function scopeForChoir($query, $choirId)
    {
        return $query->where('choir_id', $choirId);
    }
}
