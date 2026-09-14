<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Member extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'choir_id',
        'member_code',
        'user_id',
        'member_type',
        'voice_section_id',
        'first_name',
        'middle_name',
        'last_name',
        'date_of_birth',
        'gender',
        'photo_path',
        'phone',
        'email',
        'join_date',
        'role_title',
        'grade_school_level',
        'status',
        'bio',
        'notes',
        'emergency_notes',
        'special_notes',
        'consent_confirmed',
        'consent_confirmed_at',
        'consent_recorded_by',
        'is_public',
    ];

    protected function casts(): array
    {
        return [
            'join_date' => 'date',
            'date_of_birth' => 'date',
            'consent_confirmed' => 'boolean',
            'consent_confirmed_at' => 'datetime',
            'is_public' => 'boolean',
        ];
    }

    public function choir(): BelongsTo
    {
        return $this->belongsTo(Choir::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function voiceSection(): BelongsTo
    {
        return $this->belongsTo(VoiceSection::class);
    }

    public function consentRecorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'consent_recorded_by');
    }

    public function guardians(): BelongsToMany
    {
        return $this->belongsToMany(Guardian::class, 'guardian_child')
            ->withPivot(['relationship', 'is_primary'])
            ->withTimestamps();
    }

    public function primaryGuardian(): ?Guardian
    {
        return $this->guardians()->wherePivot('is_primary', true)->first()
            ?? $this->guardians()->first();
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function performances(): BelongsToMany
    {
        return $this->belongsToMany(Performance::class, 'performance_members')
            ->withPivot(['choir_id', 'expected', 'participation_status', 'notes'])
            ->withTimestamps();
    }

    public function songs(): BelongsToMany
    {
        return $this->belongsToMany(Song::class, 'song_participants')
            ->withPivot(['choir_id', 'role', 'notes'])
            ->withTimestamps();
    }

    public function getFullNameAttribute(): string
    {
        $parts = array_filter([$this->first_name, $this->middle_name, $this->last_name]);
        return implode(' ', $parts);
    }

    public function getAgeAttribute(): ?int
    {
        if (!$this->date_of_birth) {
            return null;
        }

        return (int) $this->date_of_birth->diffInYears(now());
    }

    public function getCalculatedMemberTypeAttribute(): string
    {
        if ($this->date_of_birth) {
            return $this->age < 18 ? 'child' : 'adult';
        }

        return $this->member_type ?: ($this->user_id ? 'adult' : 'child');
    }

    public function getIsChildAttribute(): bool
    {
        return $this->calculated_member_type === 'child';
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeChildren($query)
    {
        return $query->where('member_type', 'child')
            ->orWhere(function ($q) {
                $q->whereNotNull('date_of_birth')
                  ->where('date_of_birth', '>', now()->subYears(18)->toDateString());
            });
    }

    public function scopeAdults($query)
    {
        return $query->where('member_type', 'adult')
            ->where(function ($q) {
                $q->whereNull('date_of_birth')
                  ->orWhere('date_of_birth', '<=', now()->subYears(18)->toDateString());
            });
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    public function scopeForChoir($query, $choirId)
    {
        return $query->where('choir_id', $choirId);
    }
}
