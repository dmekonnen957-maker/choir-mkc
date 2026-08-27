<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AttendanceSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'choir_id',
        'rehearsal_id',
        'performance_id',
        'event_type',
        'title',
        'session_date',
        'start_time',
        'end_time',
        'status',
        'late_threshold_minutes',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'session_date' => 'date',
            'late_threshold_minutes' => 'integer',
        ];
    }

    public function choir(): BelongsTo
    {
        return $this->belongsTo(Choir::class);
    }

    public function rehearsal(): BelongsTo
    {
        return $this->belongsTo(Rehearsal::class);
    }

    public function performance(): BelongsTo
    {
        return $this->belongsTo(Performance::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function records(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function isOpen(): bool
    {
        return $this->status === 'open';
    }

    public function isClosed(): bool
    {
        return $this->status === 'closed';
    }

    public function isNotStarted(): bool
    {
        return $this->status === 'not_started';
    }

    public function scopeForChoir($query, $choirId)
    {
        return $query->where('choir_id', $choirId);
    }

    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }
}
