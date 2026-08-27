<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Performance extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'choir_id',
        'title',
        'date',
        'start_time',
        'end_time',
        'venue',
        'location',
        'description',
        'organizer',
        'dress_code',
        'special_instructions',
        'status',
        'is_public',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'is_public' => 'boolean',
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

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(Member::class, 'performance_members')
            ->withPivot(['choir_id', 'expected', 'participation_status', 'notes'])
            ->withTimestamps();
    }

    public function songs(): BelongsToMany
    {
        return $this->belongsToMany(Song::class, 'performance_songs')
            ->withPivot(['choir_id', 'sequence_number', 'notes'])
            ->withTimestamps()
            ->orderBy('sequence_number');
    }

    public function rehearsals(): BelongsToMany
    {
        return $this->belongsToMany(Rehearsal::class, 'performance_rehearsals')
            ->withPivot('choir_id')
            ->withTimestamps();
    }

    public function performanceMembers(): HasMany
    {
        return $this->hasMany(PerformanceMember::class, 'performance_id');
    }

    public function performanceSongs(): HasMany
    {
        return $this->hasMany(PerformanceSong::class, 'performance_id');
    }

    public function performanceRehearsals(): HasMany
    {
        return $this->hasMany(PerformanceRehearsal::class, 'performance_id');
    }

    public function galleryItems(): HasMany
    {
        return $this->hasMany(GalleryItem::class);
    }

    public function attendanceSessions(): HasMany
    {
        return $this->hasMany(AttendanceSession::class);
    }

    public function attendanceSession(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(AttendanceSession::class);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('date', '>=', now()->toDateString())
            ->whereIn('status', ['scheduled', 'confirmed']);
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

                public function scopeForChoir($query, $choirId)
    {
        // Always qualify the column. This scope is also used on belongsToMany
        // queries (e.g. Member::performances()) where the pivot table
        // (performance_members) also exposes a choir_id column, which would
        // otherwise raise a "Column 'choir_id' is ambiguous" SQL error.
        return $query->where('performances.choir_id', $choirId);
    }
}
